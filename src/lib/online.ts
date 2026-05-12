import { supabase, SUPABASE_ENABLED, type DBRoom, type DBGameState } from './supabase';
import { initialState, type GameState, type Player } from './gameEngine';

export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

export async function createRoom(userId: string, pin?: string): Promise<DBRoom | null> {
  if (!SUPABASE_ENABLED || !supabase) return null;
  const code = generateRoomCode();
  const { data: room, error } = await supabase
    .from('rooms')
    .insert({ code, pin: pin ?? null, player1_id: userId, status: 'waiting' })
    .select()
    .single();
  if (error) { console.warn('createRoom:', error.message); return null; }
  const init = initialState();
  await supabase.from('game_states').insert({
    room_id: room.id,
    board: init.board,
    phase: init.phase,
    current_player: init.currentPlayer,
    pieces_to_place: init.piecesToPlace,
    pieces_on_board: init.piecesOnBoard,
    captured_by: init.capturedBy,
    removals_pending: init.removalsPending,
  });
  return room as DBRoom;
}

export async function joinRoomByCode(userId: string, code: string, pin?: string): Promise<DBRoom | null> {
  if (!SUPABASE_ENABLED || !supabase) return null;
  let q = supabase.from('rooms').select('*').eq('code', code.toUpperCase()).eq('status', 'waiting').is('player2_id', null);
  if (pin) q = q.eq('pin', pin);
  const { data: room, error } = await q.maybeSingle();
  if (error || !room) { console.warn('joinRoomByCode:', error?.message); return null; }
  const { data: updated, error: e2 } = await supabase
    .from('rooms')
    .update({ player2_id: userId, status: 'active', updated_at: new Date().toISOString() })
    .eq('id', room.id)
    .select()
    .single();
  if (e2) { console.warn('join update:', e2.message); return null; }
  return updated as DBRoom;
}

export async function quickMatch(userId: string): Promise<DBRoom | null> {
  if (!SUPABASE_ENABLED || !supabase) return null;
  const { data: open } = await supabase
    .from('rooms')
    .select('*')
    .eq('status', 'waiting')
    .is('pin', null)
    .is('player2_id', null)
    .neq('player1_id', userId)
    .order('created_at', { ascending: true })
    .limit(1);
  if (open && open.length > 0) {
    const room = open[0] as DBRoom;
    const { data: joined, error } = await supabase
      .from('rooms')
      .update({ player2_id: userId, status: 'active', updated_at: new Date().toISOString() })
      .eq('id', room.id)
      .is('player2_id', null)
      .select()
      .single();
    if (!error && joined) return joined as DBRoom;
  }
  return createRoom(userId);
}

export async function pushGameState(roomId: string, state: GameState): Promise<void> {
  if (!SUPABASE_ENABLED || !supabase) return;
  await supabase.from('game_states').update({
    board: state.board,
    phase: state.phase,
    current_player: state.currentPlayer,
    pieces_to_place: state.piecesToPlace,
    pieces_on_board: state.piecesOnBoard,
    captured_by: state.capturedBy,
    removals_pending: state.removalsPending,
    updated_at: new Date().toISOString(),
  }).eq('room_id', roomId);
}

export async function markRoomComplete(roomId: string, winner: 'p1' | 'p2' | 'draw'): Promise<void> {
  if (!SUPABASE_ENABLED || !supabase) return;
  await supabase.from('rooms').update({ status: 'complete', winner, updated_at: new Date().toISOString() }).eq('id', roomId);
}

export function dbToGameState(db: DBGameState): GameState {
  return {
    ...initialState(),
    board: db.board as (Player | null)[],
    phase: db.phase as GameState['phase'],
    previousPhase: db.phase as GameState['phase'],
    currentPlayer: db.current_player,
    piecesToPlace: db.pieces_to_place,
    piecesOnBoard: db.pieces_on_board,
    capturedBy: db.captured_by,
    removalsPending: db.removals_pending,
  };
}
