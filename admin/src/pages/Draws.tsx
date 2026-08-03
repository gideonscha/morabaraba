import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { periods } from '../lib/periods';

type Kind = 'daily' | 'weekly' | 'grand';

interface DrawRow {
  id: string;
  kind: Kind;
  period_key: string;
  prize_rand: number;
  status: string;
  seed: string;
  total_entries: number;
  total_participants: number;
  winner_entries: number | null;
  drawn_at: string;
  profiles: { username: string } | null;
}

const KINDS: { kind: Kind; icon: string; label: string }[] = [
  { kind: 'daily',  icon: '🏆', label: 'Daily' },
  { kind: 'weekly', icon: '🏅', label: 'Weekly' },
  { kind: 'grand',  icon: '🐂', label: 'Grand (monthly)' },
];

export function Draws() {
  const p = periods();
  const [pools, setPools] = useState<Record<Kind, { total: number; players: number } | null>>({
    daily: null, weekly: null, grand: null,
  });
  const [history, setHistory] = useState<DrawRow[]>([]);
  const [busy, setBusy] = useState<Kind | null>(null);
  const [msg, setMsg] = useState<Record<Kind, { ok: boolean; text: string } | undefined>>({} as never);
  const [periodDraft, setPeriodDraft] = useState<Record<Kind, string>>({
    daily: p.daily.closed, weekly: p.weekly.closed, grand: p.grand.closed,
  });

  const loadPools = () => {
    (['daily', 'weekly', 'grand'] as Kind[]).forEach((k) => {
      supabase.rpc('admin_pool_stats', { p_kind: k, p_period: p[k].open }).then(({ data }) => {
        const row = Array.isArray(data) ? data[0] : data;
        if (row) setPools((prev) => ({ ...prev, [k]: { total: Number(row.total_entries), players: row.participants } }));
      });
    });
  };

  const loadHistory = () => {
    supabase.from('draws')
      .select('*, profiles:winner_profile_id (username)')
      .order('drawn_at', { ascending: false })
      .limit(30)
      .then(({ data, error }) => {
        if (error) console.warn(error.message);
        setHistory((data ?? []) as unknown as DrawRow[]);
      });
  };

  useEffect(() => { loadPools(); loadHistory(); }, []);

  const run = async (k: Kind) => {
    const period = periodDraft[k];
    if (!period) return;
    if (!window.confirm(`Run the ${k.toUpperCase()} draw for period ${period}? This selects a winner and cannot be re-run.`)) return;
    setBusy(k); setMsg((m) => ({ ...m, [k]: undefined }));
    const { data, error } = await supabase.rpc('execute_draw', { p_kind: k, p_period: period });
    if (error) {
      setMsg((m) => ({ ...m, [k]: { ok: false, text: error.message } }));
    } else {
      const d = data as { status: string; winner_username?: string; prize_rand?: number; total_entries?: number };
      setMsg((m) => ({
        ...m,
        [k]: d.status === 'void'
          ? { ok: true, text: 'Period had no entries — recorded as void.' }
          : { ok: true, text: `Winner: @${d.winner_username} (R${d.prize_rand}, pool ${d.total_entries} entries). Payout queued.` },
      }));
      loadHistory();
    }
    setBusy(null);
  };

  return (
    <div>
      <h1>Draws</h1>

      <h2>Open pools (live entries)</h2>
      <div className="cards">
        {KINDS.map(({ kind, icon, label }) => (
          <div className="card" key={kind}>
            <div className="num">{pools[kind] ? pools[kind]!.total.toLocaleString() : '…'}</div>
            <div className="lbl">{icon} {label} · {p[kind].open}</div>
            <div className="muted">{pools[kind] ? `${pools[kind]!.players} players` : ''}</div>
          </div>
        ))}
      </div>

      <h2>Run a draw</h2>
      <p className="muted" style={{ marginTop: -4 }}>
        A draw can only run for a <strong>closed</strong> period. The most recently
        closed period is pre-filled. Winner selection is random, weighted by
        entries; the seed is recorded for audit.
      </p>
      {KINDS.map(({ kind, icon, label }) => (
        <div className="row" key={kind} style={{ marginBottom: 10 }}>
          <span style={{ width: 150 }}>{icon} {label}</span>
          <input
            value={periodDraft[kind]}
            onChange={(e) => setPeriodDraft((d) => ({ ...d, [kind]: e.target.value }))}
            style={{ width: 140 }}
          />
          <button className="btn" disabled={busy === kind} onClick={() => run(kind)}>
            {busy === kind ? 'Drawing…' : 'Run draw'}
          </button>
          {msg[kind] && <span className={msg[kind]!.ok ? 'ok' : 'err'}>{msg[kind]!.text}</span>}
        </div>
      ))}

      <h2>History</h2>
      <table>
        <thead>
          <tr>
            <th>Drawn</th><th>Draw</th><th>Period</th><th>Winner</th>
            <th className="num">Prize</th><th className="num">Entries</th>
            <th className="num">Players</th><th>Status</th>
          </tr>
        </thead>
        <tbody>
          {history.length === 0 && (
            <tr><td colSpan={8} className="muted">No draws executed yet.</td></tr>
          )}
          {history.map((d) => (
            <tr key={d.id}>
              <td style={{ whiteSpace: 'nowrap' }}>{new Date(d.drawn_at).toLocaleString()}</td>
              <td>{d.kind}</td>
              <td>{d.period_key}</td>
              <td>{d.profiles ? `@${d.profiles.username}` : '—'}</td>
              <td className="num">R{d.prize_rand}</td>
              <td className="num">{d.total_entries.toLocaleString()}</td>
              <td className="num">{d.total_participants}</td>
              <td><span className="badge">{d.status}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
