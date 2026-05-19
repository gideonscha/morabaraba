import { create } from 'zustand';

const SOUND_KEY = 'morabaraba.sound';
const MUSIC_KEY = 'morabaraba.music';

function loadBool(key: string, fallback: boolean): boolean {
  try {
    const v = localStorage.getItem(key);
    if (v === null) return fallback;
    return v !== 'off';
  } catch { return fallback; }
}

export interface AudioSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  setSound: (on: boolean) => void;
  setMusic: (on: boolean) => void;
  hydrateFromProfile: (p: { sound_enabled?: boolean; music_enabled?: boolean }) => void;
}

export const useAudioSettings = create<AudioSettings>((set) => ({
  soundEnabled: loadBool(SOUND_KEY, true),
  musicEnabled: loadBool(MUSIC_KEY, true),
  setSound: (on) => {
    localStorage.setItem(SOUND_KEY, on ? 'on' : 'off');
    set({ soundEnabled: on });
  },
  setMusic: (on) => {
    localStorage.setItem(MUSIC_KEY, on ? 'on' : 'off');
    set({ musicEnabled: on });
  },
  hydrateFromProfile: (p) => {
    if (typeof p.sound_enabled === 'boolean') {
      localStorage.setItem(SOUND_KEY, p.sound_enabled ? 'on' : 'off');
      set({ soundEnabled: p.sound_enabled });
    }
    if (typeof p.music_enabled === 'boolean') {
      localStorage.setItem(MUSIC_KEY, p.music_enabled ? 'on' : 'off');
      set({ musicEnabled: p.music_enabled });
    }
  },
}));
