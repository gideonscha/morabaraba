import { create } from 'zustand';
import {
  loadLocalProfile,
  saveLocalProfile,
  applyPointsEarn,
  awardCoinsRemote,
  type LocalProfile,
} from '../lib/profile';

/** Ledger reasons accepted by the award_coins RPC. */
export type CoinReason =
  | 'win_ai_easy' | 'win_ai_medium' | 'win_ai_hard' | 'win_local' | 'win_online'
  | 'draw_match' | 'herd_care' | 'daily_login' | 'streak_bonus'
  | 'promotional' | 'refund' | 'adjustment' | 'prize' | 'performance_reward';

export interface ProfileStore {
  profile: LocalProfile | null;
  hydrated: boolean;

  init: () => void;
  setProfile: (p: LocalProfile) => void;
  updateProfile: (patch: Partial<LocalProfile>) => void;
  addCoins: (amount: number, reason?: CoinReason) => void;
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

  addCoins: (amount, reason = 'adjustment') => {
    const cur = get().profile;
    if (!cur) return;
    const next: LocalProfile = {
      ...cur,
      coins: cur.coins + amount,
      ...(amount > 0 ? applyPointsEarn(cur, amount) : {}),
    };
    saveLocalProfile(next);
    set({ profile: next });
    // Fire-and-forget to the server ledger (feeds the monthly
    // leaderboard). No-op when offline / not signed in.
    if (cur.id && amount > 0) {
      awardCoinsRemote(cur.id, amount, reason).catch(() => {});
    }
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
