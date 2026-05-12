import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { dbToGameState, pushGameState, markRoomComplete } from '../lib/online';
import { supabase, SUPABASE_ENABLED, type DBGameState } from '../lib/supabase';

interface Options {
  roomId: string | null;
  asPlayer: 'p1' | 'p2' | null;
  enabled: boolean;
}

export function useOnlineSync({ roomId, asPlayer, enabled }: Options) {
  const lastSentRef = useRef<string>('');
  const state = useGameStore();
  const hydrate = useGameStore((s) => s.hydrate);

  // Subscribe to remote updates
  useEffect(() => {
    if (!enabled || !roomId || !SUPABASE_ENABLED || !supabase) return;
    let cancelled = false;

    const channel = supabase
      .channel(`gs-${roomId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'game_states',
        filter: `room_id=eq.${roomId}`,
      }, (payload) => {
        if (cancelled) return;
        const db = (payload.new ?? payload.old) as DBGameState;
        if (!db) return;
        const next = dbToGameState(db);
        const sig = JSON.stringify({ board: next.board, phase: next.phase, cur: next.currentPlayer, rp: next.removalsPending });
        if (sig === lastSentRef.current) return;
        lastSentRef.current = sig;
        hydrate(next);
      })
      .subscribe();

    supabase.from('game_states').select('*').eq('room_id', roomId).maybeSingle().then(({ data }) => {
      if (cancelled || !data) return;
      hydrate(dbToGameState(data as DBGameState));
    });

    return () => { cancelled = true; supabase!.removeChannel(channel); };
  }, [enabled, roomId, hydrate]);

  // Push local changes when it's our turn-side that made them
  useEffect(() => {
    if (!enabled || !roomId || !asPlayer) return;
    // Only push when the state we're seeing came from us locally —
    // detect by checking that lastSentRef differs from current state's signature.
    const sig = JSON.stringify({ board: state.board, phase: state.phase, cur: state.currentPlayer, rp: state.removalsPending });
    if (sig === lastSentRef.current) return;

    lastSentRef.current = sig;
    pushGameState(roomId, state).catch((e) => console.warn('pushGameState', e));

    if ((state.winner || state.isDraw) && state.mode === 'online') {
      markRoomComplete(roomId, state.winner ?? 'draw');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.board, state.phase, state.currentPlayer, state.removalsPending, state.winner, state.isDraw, enabled, roomId, asPlayer]);
}
