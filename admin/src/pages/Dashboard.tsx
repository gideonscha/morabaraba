import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface Stats {
  players: number;
  playersToday: number;
  coinsIssuedToday: number;
  coinsIssuedMonth: number;
  txToday: number;
  topMonthly: { username: string; monthly_points: number; rank: number }[];
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

        const [profilesAll, txToday, txMonth, board] = await Promise.all([
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
        ]);

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
