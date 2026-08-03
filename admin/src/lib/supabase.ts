import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!url || !anonKey) {
  // Surfaced in the UI by App.tsx; keeps the module import side-effect free.
  console.error('Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(url ?? 'http://localhost', anonKey ?? 'missing', {
  auth: { persistSession: true, autoRefreshToken: true },
});

export const CONFIGURED = Boolean(url && anonKey);

export interface AdminProfileRow {
  id: string;
  username: string;
  avatar_id: number;
  region: string;
  coins: number;
  tier: string;
  wins: number;
  losses: number;
  streak: number;
  lifetime_points: number | null;
  best_monthly_score: number | null;
  highest_rank: number | null;
}

export interface CoinTxRow {
  id: string;
  profile_id: string;
  amount: number;
  reason: string;
  balance_after: number;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface ConfigRow {
  key: string;
  value: Record<string, number>;
  description: string | null;
  updated_at: string;
}

export interface AuditRow {
  id: string;
  admin_id: string | null;
  action: string;
  target: string | null;
  detail: Record<string, unknown> | null;
  created_at: string;
}
