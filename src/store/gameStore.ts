import { create } from 'zustand';
import {
  initialState,
  applyPlace,
  applyRemove,
  applySelect,
  applyMove,
  type GameState,
  type Player,
} from '../lib/gameEngine';

export type GameMode = 'ai_easy' | 'ai_medium' | 'ai_hard' | 'local' | 'online';

export interface GameStore extends GameState {
  mode: GameMode;
  humanPlayer: Player;
  showHandoff: boolean;

  setMode: (mode: GameMode, humanPlayer?: Player) => void;
  newGame: (mode: GameMode, humanPlayer?: Player) => void;
  hydrate: (state: GameState) => void;

  place: (nodeIndex: number) => void;
  remove: (nodeIndex: number) => void;
  select: (nodeIndex: number) => void;
  move: (toIndex: number) => void;
  tapNode: (nodeIndex: number) => void;
  dismissHandoff: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState(),
  mode: 'ai_easy',
  humanPlayer: 'p1',
  showHandoff: false,

  setMode: (mode, humanPlayer = 'p1') => set({ mode, humanPlayer }),

  newGame: (mode, humanPlayer = 'p1') =>
    set({ ...initialState(), mode, humanPlayer, showHandoff: false }),

  hydrate: (state) => set({ ...state }),

  place: (nodeIndex) => set((s) => applyPlace(s, nodeIndex) as GameStore),

  remove: (nodeIndex) => set((s) => applyRemove(s, nodeIndex) as GameStore),

  select: (nodeIndex) => set((s) => applySelect(s, nodeIndex) as GameStore),

  move: (toIndex) => {
    const s = get();
    const next = applyMove(s, toIndex);
    const requiresHandoff =
      s.mode === 'local' &&
      next.currentPlayer !== s.currentPlayer &&
      !next.winner &&
      !next.isDraw;
    set({ ...(next as GameStore), showHandoff: requiresHandoff });
  },

  tapNode: (nodeIndex) => {
    const s = get();
    if (s.winner || s.isDraw) return;

    if (s.phase === 'placing') {
      const before = s;
      const next = applyPlace(before, nodeIndex);
      const requiresHandoff =
        s.mode === 'local' &&
        next.currentPlayer !== before.currentPlayer &&
        next.phase !== 'removing' &&
        !next.winner;
      set({ ...(next as GameStore), showHandoff: requiresHandoff });
      return;
    }

    if (s.phase === 'removing') {
      get().remove(nodeIndex);
      return;
    }

    if (s.phase === 'moving' || s.phase === 'flying') {
      if (s.board[nodeIndex] === s.currentPlayer) {
        get().select(nodeIndex);
        return;
      }
      if (s.selectedNode !== null && s.validMoves.includes(nodeIndex)) {
        get().move(nodeIndex);
        return;
      }
    }
  },

  dismissHandoff: () => set({ showHandoff: false }),
}));
