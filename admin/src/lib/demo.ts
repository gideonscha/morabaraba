/**
 * Demo mode — a canned-data stand-in for the Supabase client, active
 * ONLY when the build sets VITE_DEMO_MODE=1. Used for screenshots,
 * client demos, and the PDF guide. Production builds never include it
 * in the active path.
 */

type Result = { data: unknown; error: null; count?: number };

const NOW = '2026-08-20T09:30:00+02:00';

const PROFILES = [
  { id: 'p01', username: 'ThaboM',      avatar_id: 2, region: 'ZA', coins: 412, tier: 'gold',   wins: 84, losses: 31, streak: 6, lifetime_points: 1264, best_monthly_score: 402, highest_rank: 1 },
  { id: 'p02', username: 'Lerato_K',    avatar_id: 5, region: 'ZA', coins: 366, tier: 'free',   wins: 71, losses: 40, streak: 2, lifetime_points: 1101, best_monthly_score: 350, highest_rank: 2 },
  { id: 'p03', username: 'Sipho88',     avatar_id: 1, region: 'ZA', coins: 298, tier: 'silver', wins: 66, losses: 29, streak: 0, lifetime_points: 987,  best_monthly_score: 311, highest_rank: 3 },
  { id: 'p04', username: 'NalediZulu',  avatar_id: 4, region: 'ZA', coins: 275, tier: 'free',   wins: 58, losses: 44, streak: 4, lifetime_points: 876,  best_monthly_score: 275, highest_rank: 5 },
  { id: 'p05', username: 'KagisoP',     avatar_id: 3, region: 'ZA', coins: 240, tier: 'free',   wins: 52, losses: 38, streak: 1, lifetime_points: 803,  best_monthly_score: 240, highest_rank: 7 },
  { id: 'p06', username: 'Ayanda_M',    avatar_id: 6, region: 'ZA', coins: 221, tier: 'gold',   wins: 49, losses: 27, streak: 3, lifetime_points: 745,  best_monthly_score: 232, highest_rank: 4 },
  { id: 'p07', username: 'BonganiX',    avatar_id: 2, region: 'ZA', coins: 187, tier: 'free',   wins: 41, losses: 35, streak: 0, lifetime_points: 640,  best_monthly_score: 198, highest_rank: 9 },
  { id: 'p08', username: 'Zanele_R',    avatar_id: 5, region: 'ZA', coins: 154, tier: 'free',   wins: 33, losses: 30, streak: 2, lifetime_points: 512,  best_monthly_score: 176, highest_rank: 11 },
  { id: 'p09', username: 'TumeloS',     avatar_id: 1, region: 'ZA', coins: 121, tier: 'free',   wins: 27, losses: 26, streak: 1, lifetime_points: 433,  best_monthly_score: 140, highest_rank: 14 },
  { id: 'p10', username: 'Precious_N',  avatar_id: 4, region: 'ZA', coins: 95,  tier: 'free',   wins: 20, losses: 22, streak: 0, lifetime_points: 322,  best_monthly_score: 118, highest_rank: 18 },
];

const LEDGER = [
  { id: 't01', profile_id: 'p01', amount: 3,  reason: 'win_ai_hard',  balance_after: 412, metadata: null, created_at: '2026-08-20T08:55:00+02:00' },
  { id: 't0a', profile_id: 'p02', amount: 3,  reason: 'win_online',   balance_after: 366, metadata: null, created_at: '2026-08-20T08:31:00+02:00' },
  { id: 't0b', profile_id: 'p04', amount: 12, reason: 'herd_care',    balance_after: 275, metadata: null, created_at: '2026-08-20T07:44:00+02:00' },
  { id: 't0c', profile_id: 'p05', amount: 3,  reason: 'win_ai_easy',  balance_after: 240, metadata: null, created_at: '2026-08-20T07:18:00+02:00' },
  { id: 't0d', profile_id: 'p07', amount: 1,  reason: 'draw_match',   balance_after: 187, metadata: null, created_at: '2026-08-20T06:58:00+02:00' },
  { id: 't02', profile_id: 'p01', amount: 12, reason: 'herd_care',    balance_after: 409, metadata: null, created_at: '2026-08-20T07:02:00+02:00' },
  { id: 't03', profile_id: 'p01', amount: 3,  reason: 'win_online',   balance_after: 397, metadata: null, created_at: '2026-08-19T21:14:00+02:00' },
  { id: 't04', profile_id: 'p01', amount: 1,  reason: 'draw_match',   balance_after: 394, metadata: null, created_at: '2026-08-19T20:41:00+02:00' },
  { id: 't05', profile_id: 'p01', amount: 3,  reason: 'win_ai_medium',balance_after: 393, metadata: null, created_at: '2026-08-19T19:03:00+02:00' },
  { id: 't06', profile_id: 'p01', amount: 25, reason: 'adjustment',   balance_after: 390, metadata: { note: 'Goodwill credit — reported sync issue' }, created_at: '2026-08-18T11:20:00+02:00' },
  { id: 't07', profile_id: 'p01', amount: 3,  reason: 'win_online',   balance_after: 365, metadata: null, created_at: '2026-08-18T09:12:00+02:00' },
];

const LEADERBOARD = [
  { id: 'p01', username: 'ThaboM',     avatar_id: 2, tier: 'gold',   region: 'ZA', monthly_points: 214, rank: 1 },
  { id: 'p02', username: 'Lerato_K',   avatar_id: 5, tier: 'free',   region: 'ZA', monthly_points: 187, rank: 2 },
  { id: 'p06', username: 'Ayanda_M',   avatar_id: 6, tier: 'gold',   region: 'ZA', monthly_points: 165, rank: 3 },
  { id: 'p03', username: 'Sipho88',    avatar_id: 1, tier: 'silver', region: 'ZA', monthly_points: 149, rank: 4 },
  { id: 'p04', username: 'NalediZulu', avatar_id: 4, tier: 'free',   region: 'ZA', monthly_points: 121, rank: 5 },
];

const DRAWS = [
  { id: 'd01', kind: 'daily',  period_key: '2026-08-19', prize_rand: 50,   status: 'drawn', seed: '3f2c9a1e-77b2-4c1d-9e6a-2b8f4d0c5a11', total_entries: 143, total_participants: 38, winner_entries: 9,  drawn_at: '2026-08-20T08:05:00+02:00', profiles: { username: 'NalediZulu' } },
  { id: 'd02', kind: 'daily',  period_key: '2026-08-18', prize_rand: 50,   status: 'drawn', seed: '9a41d6b0-1f3e-4f77-8c2d-6e0b9a3f7c22', total_entries: 129, total_participants: 35, winner_entries: 4,  drawn_at: '2026-08-19T08:02:00+02:00', profiles: { username: 'Sipho88' } },
  { id: 'd03', kind: 'weekly', period_key: '2026-W33',   prize_rand: 300,  status: 'drawn', seed: 'c7e2f8d4-5a19-4b3c-a1d8-0f6e2c9b4d33', total_entries: 812, total_participants: 74, winner_entries: 31, drawn_at: '2026-08-17T09:00:00+02:00', profiles: { username: 'Ayanda_M' } },
  { id: 'd04', kind: 'daily',  period_key: '2026-08-17', prize_rand: 50,   status: 'drawn', seed: '5b0d3e9f-8c24-4a6b-b7e1-4d2a8f0c6e44', total_entries: 118, total_participants: 33, winner_entries: 12, drawn_at: '2026-08-18T08:01:00+02:00', profiles: { username: 'ThaboM' } },
  { id: 'd05', kind: 'grand',  period_key: '2026-07',    prize_rand: 1000, status: 'drawn', seed: 'e1f4a7c2-3d58-4e9b-8a0c-7b5d1e3f9a55', total_entries: 3184, total_participants: 96, winner_entries: 122, drawn_at: '2026-08-01T09:15:00+02:00', profiles: { username: 'Lerato_K' } },
];

const PAYOUTS = [
  { id: 'y01', draw_id: 'd01', amount_rand: 50,   method: 'airtime', status: 'pending', note: null, created_at: '2026-08-20T08:05:00+02:00', updated_at: '2026-08-20T08:05:00+02:00', profiles: { username: 'NalediZulu' }, draws: { kind: 'daily', period_key: '2026-08-19' } },
  { id: 'y02', draw_id: 'd02', amount_rand: 50,   method: 'airtime', status: 'paid',    note: 'Airtime sent via portal, ref WP-88213', created_at: '2026-08-19T08:02:00+02:00', updated_at: '2026-08-19T10:12:00+02:00', profiles: { username: 'Sipho88' }, draws: { kind: 'daily', period_key: '2026-08-18' } },
  { id: 'y03', draw_id: 'd03', amount_rand: 300,  method: 'airtime', status: 'paid',    note: 'Airtime sent, ref WP-88104', created_at: '2026-08-17T09:00:00+02:00', updated_at: '2026-08-17T11:40:00+02:00', profiles: { username: 'Ayanda_M' }, draws: { kind: 'weekly', period_key: '2026-W33' } },
  { id: 'y04', draw_id: 'd05', amount_rand: 1000, method: 'airtime', status: 'paid',    note: 'Grand prize — paid + winner congratulated by SMS', created_at: '2026-08-01T09:15:00+02:00', updated_at: '2026-08-01T12:05:00+02:00', profiles: { username: 'Lerato_K' }, draws: { kind: 'grand', period_key: '2026-07' } },
];

const CONFIG = [
  { key: 'entries',      value: { coins_per_entry: 10, daily_entry_cap: 20 }, description: 'Draw entry conversion rate and daily cap', updated_at: '2026-08-03T12:00:00+02:00' },
  { key: 'podium',       value: { first: 300, second: 200, third: 50 },       description: 'Monthly leaderboard performance rewards in Rand (airtime)', updated_at: '2026-08-03T12:00:00+02:00' },
  { key: 'prize_values', value: { daily: 50, weekly: 300, grand: 1000 },      description: 'Prize draw values in Rand', updated_at: '2026-08-12T10:22:00+02:00' },
  { key: 'scoring',      value: { win: 3, draw: 1, loss: 0 },                 description: 'Coins per match result (flat across modes)', updated_at: '2026-08-03T12:00:00+02:00' },
];

const AUDIT = [
  { id: 'a01', admin_id: 'demo', action: 'draw_executed',   target: 'daily 2026-08-19', detail: { winner: 'NalediZulu', prize_rand: 50, seed: '3f2c9a1e-77b2-4c1d-9e6a-2b8f4d0c5a11', total_entries: 143, participants: 38 }, created_at: '2026-08-20T08:05:00+02:00' },
  { id: 'a02', admin_id: 'demo', action: 'payout_paid',     target: 'y02', detail: { note: 'Airtime sent via portal, ref WP-88213' }, created_at: '2026-08-19T10:12:00+02:00' },
  { id: 'a03', admin_id: 'demo', action: 'config_update',   target: 'prize_values', detail: { old: { daily: 50, weekly: 300, grand: 1000 }, new: { daily: 50, weekly: 300, grand: 1000 } }, created_at: '2026-08-12T10:22:00+02:00' },
  { id: 'a04', admin_id: 'demo', action: 'coin_adjustment', target: 'p01', detail: { amount: 25, note: 'Goodwill credit — reported sync issue', balance_after: 390 }, created_at: '2026-08-18T11:20:00+02:00' },
  { id: 'a05', admin_id: 'demo', action: 'draw_executed',   target: 'weekly 2026-W33', detail: { winner: 'Ayanda_M', prize_rand: 300, seed: 'c7e2f8d4-5a19-4b3c-a1d8-0f6e2c9b4d33', total_entries: 812, participants: 74 }, created_at: '2026-08-17T09:00:00+02:00' },
];

/** Chainable, awaitable stand-in for the supabase-js query builder. */
class DemoQuery {
  private single = false;
  private headCount = false;
  private eqCol: string | null = null;
  private eqVal: unknown = null;

  constructor(private table: string) {}

  private gteAt: string | null = null;

  select(_cols?: string, opts?: { count?: string; head?: boolean }) {
    if (opts?.head) this.headCount = true;
    return this;
  }
  order() { return this; }
  limit() { return this; }
  gte(col: string, val: unknown) {
    if (col === 'created_at') this.gteAt = String(val);
    return this;
  }
  ilike() { return this; }
  update() { return this; }
  eq(col: string, val: unknown) { this.eqCol = col; this.eqVal = val; return this; }
  maybeSingle() { this.single = true; return this; }

  private resolve(): Result {
    if (this.headCount) return { data: null, error: null, count: this.table === 'profiles' ? 128 : 0 };
    let rows: unknown[] = [];
    switch (this.table) {
      case 'profiles': rows = PROFILES; break;
      case 'coin_transactions':
        rows = this.gteAt
          ? LEDGER.filter((r) => new Date(r.created_at).getTime() >= new Date(this.gteAt!).getTime())
          : LEDGER;
        break;
      case 'monthly_leaderboard': rows = LEADERBOARD; break;
      case 'draws': rows = DRAWS; break;
      case 'payouts':
        rows = this.eqCol === 'status' ? PAYOUTS.filter((r) => r.status === this.eqVal) : PAYOUTS;
        break;
      case 'app_config': rows = CONFIG; break;
      case 'audit_log': rows = AUDIT; break;
      case 'admin_users': rows = [{ id: 'demo' }]; break;
    }
    if (this.single) return { data: rows[0] ?? null, error: null };
    return { data: rows, error: null };
  }

  then<T>(onFulfilled: (r: Result) => T): Promise<T> {
    return Promise.resolve(onFulfilled(this.resolve()));
  }
}

const demoSession = {
  user: { id: 'demo', email: 'jacquij@worldplay.co.za' },
  access_token: 'demo', refresh_token: 'demo',
};

function rpcResult(fn: string, args: Record<string, unknown> | undefined): Result {
  switch (fn) {
    case 'admin_pool_stats': {
      const kind = args?.p_kind;
      const stats = kind === 'daily' ? { total_entries: 96, participants: 29 }
        : kind === 'weekly' ? { total_entries: 411, participants: 63 }
        : { total_entries: 1876, participants: 88 };
      return { data: [stats], error: null };
    }
    case 'admin_adjust_coins': return { data: 437, error: null };
    case 'execute_draw': return {
      data: {
        status: 'drawn', winner_username: 'KagisoP', winner_entries: 7,
        total_entries: 96, participants: 29, prize_rand: 50,
        seed: 'demo-seed', draw_id: 'demo',
      }, error: null,
    };
    case 'admin_mark_payout': return { data: null, error: null };
    default: return { data: null, error: null };
  }
}

/** Login page can be forced with ?login in the URL. */
const wantsLogin = typeof location !== 'undefined' && location.search.includes('login');

export const demoClient = {
  auth: {
    getSession: () => Promise.resolve({ data: { session: wantsLogin ? null : demoSession } }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signInWithPassword: () => Promise.resolve({ error: null }),
    signOut: () => Promise.resolve({ error: null }),
  },
  from: (table: string) => new DemoQuery(table),
  rpc: (fn: string, args?: Record<string, unknown>) => {
    const q = {
      then<T>(onFulfilled: (r: Result) => T): Promise<T> {
        return Promise.resolve(onFulfilled(rpcResult(fn, args)));
      },
    };
    return q;
  },
};

export const DEMO_NOW = NOW;
