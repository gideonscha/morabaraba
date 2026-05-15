import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { chooseAction, type Difficulty } from '../lib/ai';

// Randomized "thinking" delays so the AI feels deliberate, not metronomic.
// If the minimax compute itself runs longer than the assigned delay (rare on
// Hard in dense late-game positions), the effect still won't dispatch until
// the timer fires — and the compute runs inside the timer callback, so the
// indicator naturally stays up for the full compute-plus-delay window.
const RANGES: Record<Difficulty, [number, number]> = {
  easy:   [600, 1200],
  medium: [900, 1800],
  hard:   [1200, 2400],
};
const MILL_RANGE: [number, number] = [400, 700];

const randomIn = ([lo, hi]: [number, number]) => lo + Math.random() * (hi - lo);

export function useAiOpponent() {
  const inFlight = useRef(false);

  const state = useGameStore();
  const place = useGameStore((s) => s.place);
  const remove = useGameStore((s) => s.remove);
  const select = useGameStore((s) => s.select);
  const move = useGameStore((s) => s.move);
  const setAiThinking = useGameStore((s) => s.setAiThinking);

  useEffect(() => {
    if (!state.mode.startsWith('ai_')) return;
    if (state.winner || state.isDraw) return;
    if (state.showHandoff) return;
    // AI plays whichever side is NOT humanPlayer. In `removing` phase the
    // current player is the side that just formed the mill — if that's the
    // AI, we still dispatch.
    if (state.currentPlayer === state.humanPlayer) return;
    if (inFlight.current) return;

    const difficulty: Difficulty =
      state.mode === 'ai_easy' ? 'easy' :
      state.mode === 'ai_medium' ? 'medium' : 'hard';

    const isMillRemoval = state.phase === 'removing';
    const delay = randomIn(isMillRemoval ? MILL_RANGE : RANGES[difficulty]);

    inFlight.current = true;
    setAiThinking(true);

    const timer = setTimeout(() => {
      try {
        const action = chooseAction(state, difficulty);
        if (!action) return;
        if (action.type === 'place') place(action.index);
        else if (action.type === 'remove') remove(action.index);
        else {
          select(action.from);
          // run move in microtask so selectedNode/validMoves are committed
          queueMicrotask(() => move(action.to));
        }
      } finally {
        setAiThinking(false);
        inFlight.current = false;
      }
    }, delay);

    return () => {
      clearTimeout(timer);
      inFlight.current = false;
      // Clear the flag if the effect re-runs mid-think (e.g. game reset).
      setAiThinking(false);
    };
  }, [
    state.mode,
    state.humanPlayer,
    state.currentPlayer,
    state.phase,
    state.winner,
    state.isDraw,
    state.showHandoff,
    state.board,
    state.removalsPending,
    place,
    remove,
    select,
    move,
    setAiThinking,
    state,
  ]);
}
