/**
 * Audio manager — singleton, lazy-init on first user gesture.
 *
 * - SFX: HTMLAudioElement pools. Each cue gets 3 cloned elements so the
 *   same sound can overlap (e.g. mill chime ringing while capture plays).
 *   We use HTMLAudio instead of Web Audio for iOS Safari reliability —
 *   AudioContext silently dies in too many edge cases (suspended,
 *   interrupted, autoplay restrictions) and the latency benefit doesn't
 *   matter for a turn-based board game.
 * - Music: HTMLAudioElement with native looping, faded via element.volume.
 * - Settings read live from useAudioSettings — toggling mutes immediately.
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

const SFX_VOLUME: Record<SfxName, number> = {
  place:   0.9,
  move:    0.7,
  mill:    1.0,
  capture: 0.9,
  select:  0.7,
  invalid: 0.5,
  phase:   0.95,
  victory: 1.0,
  defeat:  0.9,
  draw:    0.85,
  button:  0.5,
  coin:    0.9,
};

const POOL_SIZE = 3;

class AudioManager {
  private pools: Map<SfxName, HTMLAudioElement[]> = new Map();
  private poolCursor: Map<SfxName, number> = new Map();
  private music: HTMLAudioElement | null = null;
  private musicLoadFailed = false;
  private initialized = false;
  private wantsMusic = false;

  /** Called on first user gesture — required by browser autoplay rules.
   *  Creates the SFX element pools so the first playback isn't delayed. */
  init(): void {
    if (this.initialized) return;
    try {
      for (const name of Object.keys(SFX_VOLUME) as SfxName[]) {
        const pool: HTMLAudioElement[] = [];
        for (let i = 0; i < POOL_SIZE; i++) {
          const el = new Audio(`/audio/sfx/${name}.mp3`);
          el.preload = 'auto';
          el.volume = SFX_VOLUME[name];
          pool.push(el);
        }
        this.pools.set(name, pool);
        this.poolCursor.set(name, 0);
      }
      this.initialized = true;
      if (this.wantsMusic) this.playMusic();
    } catch (e) {
      console.warn('[audio] init failed:', e);
    }
  }

  /** Public SFX playback. No-op if sound disabled, audio not initialised,
   *  or the underlying play() rejects (autoplay race, missing file). */
  playSound(name: SfxName): void {
    try {
      const { soundEnabled } = useAudioSettings.getState();
      if (!soundEnabled) return;
      if (!this.initialized) return;

      const pool = this.pools.get(name);
      if (!pool || pool.length === 0) return;

      const idx = this.poolCursor.get(name) ?? 0;
      const el = pool[idx];
      this.poolCursor.set(name, (idx + 1) % pool.length);

      el.currentTime = 0;
      el.volume = SFX_VOLUME[name];
      const p = el.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    } catch (e) {
      console.warn('[audio] playSound failed:', name, e);
    }
  }

  /** Music playback — fades in over 800ms. */
  playMusic(): void {
    this.wantsMusic = true;
    const { musicEnabled } = useAudioSettings.getState();
    if (!musicEnabled) return;
    if (!this.initialized) return;
    if (this.musicLoadFailed) return;

    if (!this.music) {
      this.music = new Audio('/audio/music/morabaraba_theme.mp3');
      this.music.loop = true;
      this.music.preload = 'auto';
      this.music.volume = 0;
      this.music.addEventListener('error', () => { this.musicLoadFailed = true; });
    }
    const p = this.music.play();
    if (p && typeof p.catch === 'function') p.catch(() => {});
    this.fadeMusic(0.35, 800);
  }

  stopMusic(): void {
    this.wantsMusic = false;
    if (!this.music) return;
    this.fadeMusic(0, 600, () => { if (this.music) this.music.pause(); });
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
      const eased = t * t * (3 - 2 * t);
      el.volume = start + (target - start) * eased;
      if (t < 1) requestAnimationFrame(tick);
      else done?.();
    };
    requestAnimationFrame(tick);
  }
}

export const audio = new AudioManager();
