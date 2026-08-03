import { useEffect, useState } from 'react';
import { supabase, type AdminProfileRow, type CoinTxRow } from '../lib/supabase';

export function Players() {
  const [query, setQuery] = useState('');
  const [rows, setRows] = useState<AdminProfileRow[]>([]);
  const [selected, setSelected] = useState<AdminProfileRow | null>(null);
  const [loading, setLoading] = useState(false);

  const search = async (q: string) => {
    setLoading(true);
    let req = supabase.from('profiles')
      .select('id, username, avatar_id, region, coins, tier, wins, losses, streak, lifetime_points, best_monthly_score, highest_rank')
      .order('lifetime_points', { ascending: false, nullsFirst: false })
      .limit(50);
    if (q.trim()) req = req.ilike('username', `%${q.trim()}%`);
    const { data, error } = await req;
    if (error) console.warn(error.message);
    setRows((data ?? []) as AdminProfileRow[]);
    setLoading(false);
  };

  useEffect(() => { search(''); }, []);

  return (
    <div>
      <h1>Players</h1>
      <form className="row" style={{ marginBottom: 14 }} onSubmit={(e) => { e.preventDefault(); search(query); }}>
        <input placeholder="Search username…" value={query} onChange={(e) => setQuery(e.target.value)} style={{ width: 260 }} />
        <button className="btn" type="submit">Search</button>
        {loading && <span className="muted">Loading…</span>}
      </form>

      {selected && (
        <PlayerDetail
          player={selected}
          onClose={() => setSelected(null)}
          onChanged={() => { search(query); }}
        />
      )}

      <table>
        <thead>
          <tr>
            <th>Username</th><th>Tier</th><th className="num">Coins</th>
            <th className="num">W</th><th className="num">L</th>
            <th className="num">Lifetime pts</th><th className="num">Best month</th><th className="num">Best rank</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && !loading && (
            <tr><td colSpan={9} className="muted">No players found.</td></tr>
          )}
          {rows.map((r) => (
            <tr key={r.id}>
              <td>@{r.username}</td>
              <td><span className="badge">{r.tier}</span></td>
              <td className="num">{r.coins.toLocaleString()}</td>
              <td className="num">{r.wins}</td>
              <td className="num">{r.losses}</td>
              <td className="num">{(r.lifetime_points ?? 0).toLocaleString()}</td>
              <td className="num">{(r.best_monthly_score ?? 0).toLocaleString()}</td>
              <td className="num">{r.highest_rank ? `#${r.highest_rank}` : '—'}</td>
              <td><button className="btn ghost" onClick={() => setSelected(r)}>View</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PlayerDetail({ player, onClose, onChanged }: {
  player: AdminProfileRow; onClose: () => void; onChanged: () => void;
}) {
  const [ledger, setLedger] = useState<CoinTxRow[]>([]);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    supabase.from('coin_transactions')
      .select('*')
      .eq('profile_id', player.id)
      .order('created_at', { ascending: false })
      .limit(25)
      .then(({ data }) => { if (!cancelled) setLedger((data ?? []) as CoinTxRow[]); });
    return () => { cancelled = true; };
  }, [player.id]);

  const adjust = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseInt(amount, 10);
    if (!amt || !note.trim()) return;
    setBusy(true); setMsg(null);
    const { data, error } = await supabase.rpc('admin_adjust_coins', {
      p_target: player.id, p_amount: amt, p_note: note.trim(),
    });
    if (error) setMsg({ ok: false, text: error.message });
    else {
      setMsg({ ok: true, text: `Done — new balance ${data}` });
      setAmount(''); setNote('');
      onChanged();
    }
    setBusy(false);
  };

  return (
    <div className="drawer">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <strong style={{ color: 'var(--gold-bright)', fontSize: 16 }}>@{player.username}</strong>
        <button className="btn ghost" onClick={onClose}>Close</button>
      </div>
      <p className="muted" style={{ margin: '6px 0 12px' }}>
        {player.id} · {player.region} · {player.wins}W / {player.losses}L ·
        {' '}{player.coins.toLocaleString()} coins
      </p>

      <h2 style={{ marginTop: 0 }}>Adjust coins</h2>
      <form className="row" onSubmit={adjust}>
        <input
          type="number" placeholder="± amount" value={amount}
          onChange={(e) => setAmount(e.target.value)} style={{ width: 110 }} required
        />
        <input
          placeholder="Reason (required, audited)" value={note}
          onChange={(e) => setNote(e.target.value)} style={{ width: 320 }} required
        />
        <button className="btn" disabled={busy}>Apply</button>
        {msg && <span className={msg.ok ? 'ok' : 'err'}>{msg.text}</span>}
      </form>

      <h2>Recent ledger</h2>
      <table>
        <thead><tr><th>When</th><th>Reason</th><th className="num">Amount</th><th className="num">Balance</th></tr></thead>
        <tbody>
          {ledger.length === 0 && (
            <tr><td colSpan={4} className="muted">No server-side transactions. (Player may be playing offline only.)</td></tr>
          )}
          {ledger.map((t) => (
            <tr key={t.id}>
              <td>{new Date(t.created_at).toLocaleString()}</td>
              <td>{t.reason}</td>
              <td className={`num ${t.amount >= 0 ? 'amount-pos' : 'amount-neg'}`}>
                {t.amount >= 0 ? '+' : ''}{t.amount}
              </td>
              <td className="num">{t.balance_after.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
