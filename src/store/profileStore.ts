import { create } from 'zustand';
import {
  loadLocalProfile,
  saveLocalProfile,
  type LocalProfile,
} from '../lib/profile';

export interface ProfileStore {
  profile: LocalProfile | null;
  hydrated: boolean;

  init: () => void;
  setProfile: (p: LocalProfile) => void;
  updateProfile: (patch: Partial<LocalProfile>) => void;
  addCoins: (amount: number) => void;
  recordWin: () => void;
  recordLoss: () => void;
}

export const useProfileStore = create<ProfileStore>((set, get) => ({
  profile: null,
  hydrated: false,

  init: () => {
    const local = loadLocalProfile();
    set({ profile: local, hydrated: true });
  },

  setProfile: (p) => {
    saveLocalProfile(p);
    set({ profile: p });
  },

  updateProfile: (patch) => {
    const cur = get().profile;
    if (!cur) return;
    const next = { ...cur, ...patch };
    saveLocalProfile(next);
    set({ profile: next });
  },

  addCoins: (amount) => {
    const cur = get().profile;
    if (!cur) return;
    const next = { ...cur, coins: cur.coins + amount };
    saveLocalProfile(next);
    set({ profile: next });
  },

  recordWin: () => {
    const cur = get().profile;
    if (!cur) return;
    const next = { ...cur, wins: cur.wins + 1, streak: cur.streak + 1 };
    saveLocalProfile(next);
    set({ profile: next });
  },

  recordLoss: () => {
    const cur = get().profile;
    if (!cur) return;
    const next = { ...cur, losses: cur.losses + 1, streak: 0 };
    saveLocalProfile(next);
    set({ profile: next });
  },
}));
