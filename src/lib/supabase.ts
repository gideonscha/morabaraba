import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const SUPABASE_ENABLED = Boolean(url && anonKey);

export const supabase: SupabaseClient | null = SUPABASE_ENABLED
  ? createClient(url!, anonKey!, {
      auth: { persistSession: true, autoRefreshToken: true },
      realtime: { params: { eventsPerSecond: 10 } },
    })
  : null;

export interface DBProfile {
  id: string;
  username: string;
  avatar_id: number;
  region: string;
  coins: number;
  tier: string;
  wins: number;
  losses: number;
  streak: number;
}

export interface DBRoom {
  id: string;
  code: string;
  pin: string | null;
  player1_id: string | null;
  player2_id: string | null;
  status: 'waiting' | 'active' | 'complete';
  winner: string | null;
  created_at: string;
  updated_at: string;
}

export interface DBGameState {
  room_id: string;
  board: (string | null)[];
  phase: 'placing' | 'moving' | 'flying' | 'removing';
  current_player: 'p1' | 'p2';
  pieces_to_place: { p1: number; p2: number };
  pieces_on_board: { p1: number; p2: number };
  captured_by: { p1: number; p2: number };
  removals_pending: number;
  updated_at: string;
}
