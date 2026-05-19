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

  const mode = useGameStore((s) => s.mode);
  const humanPlayer = useGameStore((s) => s.humanPlayer);
  const currentPlayer = useGameStore((s) => s.currentPlayer);
  const phase = useGameStore((s) => s.phase);
  const winner = useGameStore((s) => s.winner);
  const isDraw = useGameStore((s) => s.isDraw);
  const showHandoff = useGameStore((s) => s.showHandoff);
  const board = useGameStore((s) => s.board);
  const removalsPending = useGameStore((s) => s.removalsPending);
  const place = useGameStore((s) => s.place);
  const remove = useGameStore((s) => s.remove);
  const select = useGameStore((s) => s.select);
  const move = useGameStore((s) => s.move);
  const setAiThinking = useGameStore((s) => s.setAiThinking);

  useEffect(() => {
    if (!mode.startsWith('ai_')) return;
    if (winner || isDraw) return;
    if (showHandoff) return;
    if (currentPlayer === humanPlayer) return;
    if (inFlight.current) return;

    const difficulty: Difficulty =
      mode === 'ai_easy' ? 'easy' :
      mode === 'ai_medium' ? 'medium' : 'hard';

    const isMillRemoval = phase === 'removing';
    const delay = randomIn(isMillRemoval ? MILL_RANGE : RANGES[difficulty]);

    inFlight.current = true;
    setAiThinking(true);

    const timer = setTimeout(() => {
      try {
        // Re-read state imperatively so the timer always acts on the
        // freshest snapshot, not the closure captured at scheduling time.
        const fresh = useGameStore.getState();
        const action = chooseAction(fresh, difficulty);
        if (!action) return;
        if (action.type === 'place') place(action.index);
        else if (action.type === 'remove') remove(action.index);
        else {
          select(action.from);
          queueMicrotask(() => move(action.to));
        }
      } finally {
        setAiThinking(false);
        inFlight.current = false;
      }
    }, delay);

    return () => {
      // Cancel the pending think but do NOT touch aiThinking here — the
      // timer's finally block owns that flag. Calling set() in cleanup
      // would mutate the store, change subscribed slices, re-run this
      // effect, and the cycle would never converge.
      clearTimeout(timer);
      inFlight.current = false;
    };
  }, [
    mode,
    humanPlayer,
    currentPlayer,
    phase,
    winner,
    isDraw,
    showHandoff,
    board,
    removalsPending,
    place,
    remove,
    select,
    move,
    setAiThinking,
  ]);
}
