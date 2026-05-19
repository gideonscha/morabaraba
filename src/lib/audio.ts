/**
 * Audio manager — singleton, lazy-init on first user gesture.
 *
 * - SFX: Web Audio API for low latency. Tries to load <name>.mp3 from
 *   /audio/sfx/, decodes once, caches the AudioBuffer. If the file is
 *   missing (404), falls back to a tiny synthesized waveform built from
 *   primitives in this file — gameplay still has sound out of the box,
 *   and dropping in real MP3s later transparently upgrades the audio.
 * - Music: HTMLAudioElement with native looping, cross-faded via gain.
 * - Settings read live from useAudioSettings — toggling off in Settings
 *   immediately mutes/stops without page reload.
 *
 * Never throws — every failure path returns silently.
 */
import { useAudioSettings } from '../store/audioStore';

export type SfxName =
  | 'place'
  | 'move'
  | 'mill'
  | 'capture'
  | 'select'
  | 'invalid'
  | 'phase'
  | 'victory'
  | 'defeat'
  | 'draw'
  | 'button'
  | 'coin';

interface SfxConfig {
  volume: number;        // 0..1, applied to whichever source plays
  synth: () => AudioBuffer; // procedural fallback
}

class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private buffers: Map<SfxName, AudioBuffer> = new Map();
  private inFlight: Map<SfxName, Promise<AudioBuffer | null>> = new Map();
  private music: HTMLAudioElement | null = null;
  private musicLoadFailed = false;
  private initialized = false;
  private wantsMusic = false;

  /** Called on first user gesture — required by browser autoplay rules. */
  init(): void {
    if (this.initialized) return;
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      this.ctx = new Ctx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 1;
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.85;
      this.sfxGain.connect(this.masterGain);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0; // music starts faded out
      this.musicGain.connect(this.masterGain);

      this.initialized = true;

      // If music was requested before init, start it now.
      if (this.wantsMusic) this.playMusic();
    } catch (e) {
      console.warn('[audio] init failed:', e);
    }
  }

  /** Resume on tab focus / after suspension. */
  resumeIfNeeded(): void {
    if (this.ctx?.state === 'suspended') this.ctx.resume().catch(() => {});
  }

  /** Public SFX playback. No-op if sound disabled or audio not initialised.
   *  Wrapped in try/catch as the LAST line of defence — audio failures
   *  (iOS Safari quirks, decode errors, OOM during synth) must never bubble
   *  into React's render tree and blank the screen. */
  playSound(name: SfxName): void {
    try {
      const { soundEnabled } = useAudioSettings.getState();
      if (!soundEnabled) return;
      if (!this.ctx || !this.sfxGain) return;
      this.resumeIfNeeded();

      const cached = this.buffers.get(name);
      if (cached) {
        this.playBuffer(cached, SFX_CFG[name].volume);
        return;
      }
      // Kick off async load; play synth fallback immediately so the
      // first invocation isn't silent while the MP3 is fetching.
      this.loadSfx(name);
      const synth = SFX_CFG[name].synth();
      this.playBuffer(synth, SFX_CFG[name].volume);
    } catch (e) {
      console.warn('[audio] playSound failed:', name, e);
    }
  }

  private playBuffer(buf: AudioBuffer, vol: number): void {
    if (!this.ctx || !this.sfxGain) return;
    try {
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const gain = this.ctx.createGain();
      gain.gain.value = vol;
      src.connect(gain).connect(this.sfxGain);
      src.start();
    } catch {
      // ignore
    }
  }

  private loadSfx(name: SfxName): Promise<AudioBuffer | null> {
    const existing = this.inFlight.get(name);
    if (existing) return existing;
    if (!this.ctx) return Promise.resolve(null);

    const ctx = this.ctx;
    const promise = (async () => {
      try {
        const res = await fetch(`/audio/sfx/${name}.mp3`);
        if (!res.ok) throw new Error(`${res.status}`);
        const arr = await res.arrayBuffer();
        const buf = await ctx.decodeAudioData(arr);
        this.buffers.set(name, buf);
        return buf;
      } catch {
        // Cache the synth fallback under the same key so subsequent plays
        // are zero-cost — no further fetches will be attempted.
        const synth = SFX_CFG[name].synth();
        this.buffers.set(name, synth);
        return synth;
      } finally {
        this.inFlight.delete(name);
      }
    })();
    this.inFlight.set(name, promise);
    return promise;
  }

  /** Music playback — cross-fades in over 800ms. */
  playMusic(): void {
    this.wantsMusic = true;
    const { musicEnabled } = useAudioSettings.getState();
    if (!musicEnabled) return;
    if (!this.initialized) return; // will be retried after init()

    if (this.musicLoadFailed) return; // no file, don't keep retrying

    if (!this.music) {
      this.music = new Audio('/audio/music/morabaraba_theme.mp3');
      this.music.loop = true;
      this.music.preload = 'auto';
      this.music.volume = 0;
      this.music.addEventListener('error', () => {
        this.musicLoadFailed = true;
      });
    }
    this.music.play().catch(() => { /* user-gesture race; ignore */ });
    this.fadeMusic(0.35, 800);
  }

  stopMusic(): void {
    this.wantsMusic = false;
    if (!this.music) return;
    this.fadeMusic(0, 600, () => {
      if (this.music) this.music.pause();
    });
  }

  setMusicEnabled(on: boolean): void {
    if (on) this.playMusic();
    else this.stopMusic();
  }

  private fadeMusic(target: number, durationMs: number, done?: () => void): void {
    const el = this.music;
    if (!el) return;
    const start = el.volume;
    const startTime = performance.now();
    const tick = () => {
      const t = Math.min(1, (performance.now() - startTime) / durationMs);
      const eased = t * t * (3 - 2 * t); // smoothstep
      el.volume = start + (target - start) * eased;
      if (t < 1) requestAnimationFrame(tick);
      else done?.();
    };
    requestAnimationFrame(tick);
  }
}

export const audio = new AudioManager();

// ----------------------------------------------------------------------
// Synthesized fallbacks — generated once per call, cheap. All sounds
// are <500ms mono and shaped to read as the intended UI cue. They keep
// the game alive when MP3s are missing.
// ----------------------------------------------------------------------

function getCtx(): AudioContext | null {
  return (audio as unknown as { ctx: AudioContext | null }).ctx;
}

function makeBuffer(durationSec: number, fillSample: (i: number, sr: number) => number): AudioBuffer {
  const ctx = getCtx();
  // Use an OfflineAudioContext for rendering if no live ctx (can't happen post-init).
  if (!ctx) {
    const off = new OfflineAudioContext(1, 44100, 44100);
    const buf = off.createBuffer(1, Math.floor(off.sampleRate * durationSec), off.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = fillSample(i, off.sampleRate);
    return buf;
  }
  const sr = ctx.sampleRate;
  const buf = ctx.createBuffer(1, Math.floor(sr * durationSec), sr);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = fillSample(i, sr);
  return buf;
}

const PI2 = Math.PI * 2;

/** Simple ADSR-shaped sine. */
function tone(freq: number, dur: number, attack = 0.005, decay = dur) {
  return makeBuffer(dur, (i, sr) => {
    const t = i / sr;
    const env = t < attack ? t / attack : Math.max(0, 1 - (t - attack) / decay);
    return Math.sin(PI2 * freq * t) * env * 0.6;
  });
}

/** Short noise burst with envelope — for wood/thud effects. */
function noiseBurst(dur: number, lowpassMixDecay = 12) {
  return makeBuffer(dur, (i, sr) => {
    const t = i / sr;
    const env = Math.exp(-t * lowpassMixDecay);
    return (Math.random() * 2 - 1) * env * 0.5;
  });
}

/** Stacked sine notes — for chimes / win flourishes. */
function chime(freqs: number[], dur: number) {
  return makeBuffer(dur, (i, sr) => {
    const t = i / sr;
    let s = 0;
    for (let k = 0; k < freqs.length; k++) {
      const noteStart = (k * dur) / (freqs.length * 1.8);
      if (t < noteStart) continue;
      const lt = t - noteStart;
      const env = Math.exp(-lt * 3.5);
      s += Math.sin(PI2 * freqs[k] * lt) * env;
    }
    return (s / freqs.length) * 0.7;
  });
}

const SFX_CFG: Record<SfxName, SfxConfig> = {
  place:   { volume: 0.9, synth: () => combineBuffers(noiseBurst(0.08, 25), tone(180, 0.08, 0.002, 0.06)) },
  move:    { volume: 0.7, synth: () => noiseBurst(0.18, 6) },
  mill:    { volume: 1.0, synth: () => chime([523.25, 659.25, 783.99], 0.6) },
  capture: { volume: 0.9, synth: () => combineBuffers(noiseBurst(0.12, 20), tone(120, 0.1, 0.002, 0.08)) },
  select:  { volume: 0.7, synth: () => tone(880, 0.06, 0.005, 0.05) },
  invalid: { volume: 0.5, synth: () => tone(100, 0.18, 0.005, 0.15) },
  phase:   { volume: 0.95, synth: () => chime([392, 587.33], 0.5) },
  victory: { volume: 1.0, synth: () => chime([523.25, 659.25, 783.99, 1046.5], 1.1) },
  defeat:  { volume: 0.9, synth: () => chime([329.63, 261.63, 196], 1.1) },
  draw:    { volume: 0.85, synth: () => chime([440, 523.25], 0.8) },
  button:  { volume: 0.5, synth: () => tone(660, 0.04, 0.003, 0.035) },
  coin:    { volume: 0.9, synth: () => chime([1318.51, 1760], 0.35) },
};

/** Mix two equal-length-ish buffers into one. */
function combineBuffers(a: AudioBuffer, b: AudioBuffer): AudioBuffer {
  const ctx = getCtx();
  const sr = ctx?.sampleRate ?? 44100;
  const len = Math.max(a.length, b.length);
  const buf = (ctx ?? new OfflineAudioContext(1, len, sr)).createBuffer(1, len, sr);
  const out = buf.getChannelData(0);
  const da = a.getChannelData(0);
  const db = b.getChannelData(0);
  for (let i = 0; i < len; i++) {
    out[i] = (i < da.length ? da[i] : 0) + (i < db.length ? db[i] : 0);
  }
  return buf;
}
