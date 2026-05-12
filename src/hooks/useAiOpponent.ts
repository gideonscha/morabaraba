import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { chooseAction, type Difficulty } from '../lib/ai';

export function useAiOpponent() {
  const inFlight = useRef(false);

  const state = useGameStore();
  const place = useGameStore((s) => s.place);
  const remove = useGameStore((s) => s.remove);
  const select = useGameStore((s) => s.select);
  const move = useGameStore((s) => s.move);

  useEffect(() => {
    if (!state.mode.startsWith('ai_')) return;
    if (state.winner || state.isDraw) return;
    if (state.showHandoff) return;
    if (state.currentPlayer === state.humanPlayer && state.phase !== 'removing') return;
    if (state.phase === 'removing' && state.currentPlayer === state.humanPlayer) return;
    if (inFlight.current) return;

    const difficulty: Difficulty = state.mode === 'ai_easy' ? 'easy' : state.mode === 'ai_medium' ? 'medium' : 'hard';

    inFlight.current = true;
    const delay = difficulty === 'hard' ? 350 : difficulty === 'medium' ? 280 : 220;
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
        inFlight.current = false;
      }
    }, delay);

    return () => {
      clearTimeout(timer);
      inFlight.current = false;
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
    state,
  ]);
}
