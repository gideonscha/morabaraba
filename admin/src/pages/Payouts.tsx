import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface PayoutRow {
  id: string;
  amount_rand: number;
  method: string;
  status: 'pending' | 'paid' | 'failed' | 'cancelled';
  note: string | null;
  created_at: string;
  updated_at: string;
  profiles: { username: string } | null;
  draws: { kind: string; period_key: string } | null;
}

const STATUS_COLOR: Record<string, string> = {
  pending: 'var(--gold)', paid: 'var(--green)', failed: 'var(--red)', cancelled: 'var(--sand)',
};

export function Payouts() {
  const [rows, setRows] = useState<PayoutRow[]>([]);
  const [filter, setFilter] = useState<string>('pending');
  const [busy, setBusy] = useState<string | null>(null);

  const load = () => {
    let req = supabase.from('payouts')
      .select('*, profiles (username), draws (kind, period_key)')
      .order('created_at', { ascending: false })
      .limit(100);
    if (filter !== 'all') req = req.eq('status', filter);
    req.then(({ data, error }) => {
      if (error) console.warn(error.message);
      setRows((data ?? []) as unknown as PayoutRow[]);
    });
  };

  useEffect(() => { load(); }, [filter]);

  const mark = async (id: string, status: string) => {
    let note: string | null = null;
    if (status === 'paid') {
      note = window.prompt('Reference / note for this payment (e.g. "airtime sent manually, ref 12345"):');
      if (note === null) return; // cancelled prompt
    } else if (status === 'failed' || status === 'cancelled') {
      note = window.prompt(`Reason for marking ${status}:`);
      if (note === null) return;
    }
    setBusy(id);
    const { error } = await supabase.rpc('admin_mark_payout', { p_id: id, p_status: status, p_note: note });
    if (error) alert(error.message);
    setBusy(null);
    load();
  };

  return (
    <div>
      <h1>Payouts</h1>
      <div className="row" style={{ marginBottom: 14 }}>
        {['pending', 'paid', 'failed', 'cancelled', 'all'].map((f) => (
          <button
            key={f}
            className={`btn ${filter === f ? '' : 'ghost'}`}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      <table>
        <thead>
          <tr>
            <th>Created</th><th>Winner</th><th>Draw</th>
            <th className="num">Amount</th><th>Status</th><th>Note</th><th></th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr><td colSpan={7} className="muted">No payouts{filter !== 'all' ? ` with status "${filter}"` : ''}.</td></tr>
          )}
          {rows.map((r) => (
            <tr key={r.id}>
              <td style={{ whiteSpace: 'nowrap' }}>{new Date(r.created_at).toLocaleDateString()}</td>
              <td>{r.profiles ? `@${r.profiles.username}` : '—'}</td>
              <td>{r.draws ? `${r.draws.kind} ${r.draws.period_key}` : '—'}</td>
              <td className="num">R{r.amount_rand} <span className="muted">({r.method})</span></td>
              <td><span className="badge" style={{ color: STATUS_COLOR[r.status] }}>{r.status}</span></td>
              <td className="muted" style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.note ?? ''}</td>
              <td style={{ whiteSpace: 'nowrap' }}>
                {r.status === 'pending' && (
                  <span className="row">
                    <button className="btn" disabled={busy === r.id} onClick={() => mark(r.id, 'paid')}>Mark paid</button>
                    <button className="btn danger" disabled={busy === r.id} onClick={() => mark(r.id, 'failed')}>Failed</button>
                  </span>
                )}
                {r.status === 'failed' && (
                  <button className="btn ghost" disabled={busy === r.id} onClick={() => mark(r.id, 'pending')}>Re-queue</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="muted" style={{ marginTop: 10 }}>
        Manual fulfilment mode: send the airtime via your channel, then Mark paid
        with a reference. Automatic Worldplay payouts arrive in Phase C.
      </p>
    </div>
  );
}
