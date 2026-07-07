import { create } from 'zustand';
import {
  initialHerd, startDay, doChore, todayString,
  type HerdState, type Chore, type CareEvent,
} from '../lib/herd';

const HERD_KEY = 'morabaraba.herd';

function loadHerd(): HerdState {
  try {
    const raw = localStorage.getItem(HERD_KEY);
    if (!raw) return initialHerd();
    return { ...initialHerd(), ...(JSON.parse(raw) as HerdState) };
  } catch { return initialHerd(); }
}

function saveHerd(h: HerdState): void {
  try { localStorage.setItem(HERD_KEY, JSON.stringify(h)); } catch { /* ignore */ }
}

export interface HerdStore {
  herd: HerdState;
  /** Events produced by the most recent completed care day (for toasts). */
  lastEvents: CareEvent[];

  /** Roll chore flags/streak forward to today. Call on screen mount. */
  refresh: () => void;
  nameGuardian: (name: string) => void;
  /** Perform a chore; returns the events fired (empty until the day completes). */
  performChore: (chore: Chore) => CareEvent[];
  clearEvents: () => void;
}

export const useHerdStore = create<HerdStore>((set, get) => ({
  herd: loadHerd(),
  lastEvents: [],

  refresh: () => {
    const next = startDay(get().herd, todayString());
    if (next !== get().herd) {
      saveHerd(next);
      set({ herd: next });
    }
  },

  nameGuardian: (name) => {
    const trimmed = name.trim().slice(0, 24);
    if (!trimmed) return;
    const next = { ...get().herd, guardianName: trimmed };
    saveHerd(next);
    set({ herd: next });
  },

  performChore: (chore) => {
    const { state, events } = doChore(get().herd, chore, todayString());
    saveHerd(state);
    set({ herd: state, lastEvents: events.length > 0 ? events : get().lastEvents });
    return events;
  },

  clearEvents: () => set({ lastEvents: [] }),
}));
