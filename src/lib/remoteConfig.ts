/**
 * Runtime game configuration, editable from the admin site (app_config
 * table). Local defaults mirror the client-confirmed values, so the game
 * behaves identically offline or before the first fetch completes.
 *
 * Load flow: synchronous defaults → localStorage cache (instant, last
 * known values) → background fetch on boot (fresh values, re-cached).
 */
import { supabase, SUPABASE_ENABLED } from './supabase';

export interface GameConfig {
  prize_values: { daily: number; weekly: number; grand: number };
  scoring: { win: number; draw: number; loss: number };
  entries: { coins_per_entry: number; daily_entry_cap: number };
  podium: { first: number; second: number; third: number };
}

const DEFAULTS: GameConfig = {
  prize_values: { daily: 50, weekly: 300, grand: 1000 },
  scoring: { win: 3, draw: 1, loss: 0 },
  entries: { coins_per_entry: 10, daily_entry_cap: 20 },
  podium: { first: 300, second: 200, third: 50 },
};

const CACHE_KEY = 'morabaraba.appConfig';

function readCache(): Partial<GameConfig> {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as Partial<GameConfig>) : {};
  } catch { return {}; }
}

let cfg: GameConfig = { ...DEFAULTS, ...readCache() };

export function getConfig(): GameConfig { return cfg; }

/** Fetch fresh config from Supabase; silent no-op offline. */
export async function loadRemoteConfig(): Promise<void> {
  if (!SUPABASE_ENABLED || !supabase) return;
  try {
    const { data, error } = await supabase.from('app_config').select('key, value');
    if (error || !data) return;
    const defaults = DEFAULTS as unknown as Record<string, Record<string, number>>;
    const next: Record<string, Record<string, number>> = { ...defaults };
    for (const row of data as { key: string; value: Record<string, number> }[]) {
      if (row.key in defaults) next[row.key] = { ...defaults[row.key], ...row.value };
    }
    cfg = next as unknown as GameConfig;
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(cfg)); } catch { /* ignore */ }
  } catch { /* offline — keep defaults/cache */ }
}
