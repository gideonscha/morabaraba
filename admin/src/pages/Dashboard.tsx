import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { BRANDS } from '../lib/brands';

interface Stats {
  players: number;
  playersToday: number;
  coinsIssuedToday: number;
  coinsIssuedMonth: number;
  txToday: number;
  topMonthly: { username: string; monthly_points: number; rank: number }[];
  byBrand: { brand: string; players: number; subscribers_active: number; paidRand: number }[];
}

export function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const monthStart = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1);

        const [profilesAll, txToday, txMonth, board, counts, airtime] = await Promise.all([
          supabase.from('profiles').select('id', { count: 'exact', head: true }),
          supabase.from('coin_transactions')
            .select('amount')
            .gte('created_at', todayStart.toISOString()),
          supabase.from('coin_transactions')
            .select('amount')
            .gte('created_at', monthStart.toISOString()),
          supabase.from('monthly_leaderboard')
            .select('username, monthly_points, rank')
            .order('rank', { ascending: true })
            .limit(5),
          supabase.rpc('admin_brand_counts'),
          supabase.rpc('admin_airtime_summary'),
        ]);
        type CountRow = { brand: string; players: number; subscribers_active: number };
        type SumRow = { brand: string; status: string; rand: number };
        const byBrand = BRANDS.map((b) => {
          const c = ((counts.data ?? []) as CountRow[]).find((r) => r.brand === b.id);
          const paid = ((airtime.data ?? []) as SumRow[]).filter((r) => r.brand === b.id && r.status === 'paid')
            .reduce((s, r) => s + Number(r.rand), 0);
          return { brand: b.id, players: c?.players ?? 0, subscribers_active: c?.subscribers_active ?? 0, paidRand: paid };
        });

        const sum = (rows: { amount: number }[] | null) =>
          (rows ?? []).filter((r) => r.amount > 0).reduce((s, r) => s + r.amount, 0);

        // Distinct active profiles today, from today's transactions.
        const activeToday = await supabase.from('coin_transactions')
          .select('profile_id')
          .gte('created_at', todayStart.toISOString());
        const distinctToday = new Set((activeToday.data ?? []).map((r) => r.profile_id)).size;

        if (cancelled) return;
        setStats({
          players: profilesAll.count ?? 0,
          playersToday: distinctToday,
          coinsIssuedToday: sum(txToday.data),
          coinsIssuedMonth: sum(txMonth.data),
          txToday: (txToday.data ?? []).length,
          topMonthly: (board.data ?? []) as Stats['topMonthly'],
          byBrand,
        });
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (err) return <div><h1>Dashboard</h1><p className="err">{err}</p></div>;
  if (!stats) return <div><h1>Dashboard</h1><p className="muted">Loading…</p></div>;

  return (
    <div>
      <h1>Dashboard</h1>
      <div className="cards">
        <div className="card"><div className="num">{stats.players.toLocaleString()}</div><div className="lbl">Registered players</div></div>
        <div className="card"><div className="num">{stats.playersToday.toLocaleString()}</div><div className="lbl">Active today (earned)</div></div>
        <div className="card"><div className="num">{stats.coinsIssuedToday.toLocaleString()}</div><div className="lbl">Coins issued today</div></div>
        <div className="card"><div className="num">{stats.coinsIssuedMonth.toLocaleString()}</div><div className="lbl">Coins issued this month</div></div>
        <div className="card"><div className="num">{stats.txToday.toLocaleString()}</div><div className="lbl">Ledger events today</div></div>
      </div>

      <h2>By operator</h2>
      <table>
        <thead><tr><th>Instance</th><th>Operator</th><th className="num">Players</th><th className="num">Active subscribers</th><th className="num">Airtime paid</th></tr></thead>
        <tbody>
          {stats.byBrand.map((b) => {
            const meta = BRANDS.find((x) => x.id === b.brand)!;
            return (
              <tr key={b.brand}>
                <td>{meta.label}</td>
                <td><span className="badge">{meta.operator}</span></td>
                <td className="num">{b.players.toLocaleString()}</td>
                <td className="num">{b.subscribers_active.toLocaleString()}</td>
                <td className="num">R{b.paidRand.toLocaleString()}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <h2>Monthly leaderboard — top 5</h2>
      <table>
        <thead><tr><th>#</th><th>Player</th><th className="num">Points</th></tr></thead>
        <tbody>
          {stats.topMonthly.length === 0 && (
            <tr><td colSpan={3} className="muted">No points recorded this month yet.</td></tr>
          )}
          {stats.topMonthly.map((r) => (
            <tr key={r.rank + r.username}>
              <td>{r.rank}</td>
              <td>@{r.username}</td>
              <td className="num">{r.monthly_points.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="muted" style={{ marginTop: 10 }}>
        Server data reflects signed-in players only. Offline/AI-only players sync
        once phone sign-in ships.
      </p>
    </div>
  );
}
