import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { BRANDS, brandOperator, type BrandId } from '../lib/brands';

interface PayoutRow {
  id: string;
  amount_rand: number;
  method: string;
  status: 'pending' | 'paid' | 'failed' | 'cancelled';
  note: string | null;
  created_at: string;
  updated_at: string;
  brand: BrandId;
  profiles: { username: string } | null;
  draws: { kind: string; period_key: string } | null;
}

const STATUS_COLOR: Record<string, string> = {
  pending: 'var(--gold)', paid: 'var(--green)', failed: 'var(--red)', cancelled: 'var(--sand)',
};

interface SummaryRow { brand: string; status: string; month: string; payouts: number; rand: number }

export function Payouts() {
  const [rows, setRows] = useState<PayoutRow[]>([]);
  const [filter, setFilter] = useState<string>('pending');
  const [brand, setBrand] = useState<BrandId | 'all'>('all');
  const [summary, setSummary] = useState<SummaryRow[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const load = () => {
    let req = supabase.from('payouts')
      .select('*, profiles (username), draws (kind, period_key)')
      .order('created_at', { ascending: false })
      .limit(100);
    if (filter !== 'all') req = req.eq('status', filter);
    if (brand !== 'all') req = req.eq('brand', brand);
    req.then(({ data, error }) => {
      if (error) console.warn(error.message);
      setRows((data ?? []) as unknown as PayoutRow[]);
    });
    supabase.rpc('admin_airtime_summary').then(({ data }) => setSummary((data ?? []) as SummaryRow[]));
  };

  useEffect(() => { load(); }, [filter, brand]);

  // Airtime tally per operator: paid total, paid this month, pending.
  const thisMonth = new Date().toISOString().slice(0, 7);
  const tally = BRANDS.map((b) => {
    const mine = summary.filter((r) => r.brand === b.id);
    const sum = (f: (r: SummaryRow) => boolean) => mine.filter(f).reduce((s, r) => s + Number(r.rand), 0);
    return {
      ...b,
      paidAll: sum((r) => r.status === 'paid'),
      paidMonth: sum((r) => r.status === 'paid' && r.month === thisMonth),
      pending: sum((r) => r.status === 'pending'),
    };
  });

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

      <h2>Airtime spend by operator</h2>
      <div className="cards">
        {tally.map((t) => (
          <div className="card" key={t.id} style={{ borderTop: `3px solid ${t.color}` }}>
            <div className="num">R{t.paidAll.toLocaleString()}</div>
            <div className="lbl">{t.operator} · {t.label} — paid, all time</div>
            <div className="muted">R{t.paidMonth.toLocaleString()} paid this month · R{t.pending.toLocaleString()} pending</div>
          </div>
        ))}
      </div>

      <div className="row" style={{ marginBottom: 10 }}>
        <button className={`btn ${brand === 'all' ? '' : 'ghost'}`} onClick={() => setBrand('all')}>Both operators</button>
        {BRANDS.map((b) => (
          <button key={b.id} className={`btn ${brand === b.id ? '' : 'ghost'}`} onClick={() => setBrand(b.id)}>{b.operator}</button>
        ))}
      </div>
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
            <th>Created</th><th>Operator</th><th>Winner</th><th>Draw</th>
            <th className="num">Amount</th><th>Status</th><th>Note</th><th></th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr><td colSpan={8} className="muted">No payouts{filter !== 'all' ? ` with status "${filter}"` : ''}.</td></tr>
          )}
          {rows.map((r) => (
            <tr key={r.id}>
              <td style={{ whiteSpace: 'nowrap' }}>{new Date(r.created_at).toLocaleDateString()}</td>
              <td><span className="badge">{brandOperator(r.brand)}</span></td>
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
