import { useEffect, useState } from 'react';
import { supabase, type ConfigRow } from '../lib/supabase';

/** Friendly labels for known config keys/fields. Unknown keys still render. */
const FIELD_LABELS: Record<string, Record<string, string>> = {
  prize_values: { daily: 'Daily draw (R)', weekly: 'Weekly draw (R)', grand: 'Monthly grand draw (R)' },
  scoring: { win: 'Coins per win', draw: 'Coins per draw', loss: 'Coins per loss' },
  entries: { coins_per_entry: 'Coins per draw entry', daily_entry_cap: 'Max entries per day' },
  podium: { first: '1st place (R airtime)', second: '2nd place (R airtime)', third: '3rd place (R airtime)' },
};

export function Config() {
  const [rows, setRows] = useState<ConfigRow[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Record<string, number>>>({});
  const [msg, setMsg] = useState<Record<string, { ok: boolean; text: string }>>({});

  const load = async () => {
    const { data, error } = await supabase.from('app_config').select('*').order('key');
    if (error) console.warn(error.message);
    const list = (data ?? []) as ConfigRow[];
    setRows(list);
    setDrafts(Object.fromEntries(list.map((r) => [r.key, { ...r.value }])));
  };

  useEffect(() => { load(); }, []);

  const save = async (key: string) => {
    const { error } = await supabase.from('app_config')
      .update({ value: drafts[key] })
      .eq('key', key);
    setMsg((m) => ({
      ...m,
      [key]: error
        ? { ok: false, text: error.message }
        : { ok: true, text: 'Saved — live in the game within a minute.' },
    }));
    if (!error) load();
  };

  return (
    <div>
      <h1>Game Config</h1>
      <p className="muted" style={{ marginTop: -8 }}>
        Values are read by the game at launch. Changes are audited automatically.
      </p>
      {rows.map((r) => (
        <div key={r.key} className="drawer">
          <strong style={{ color: 'var(--gold-bright)' }}>{r.key}</strong>
          <p className="muted" style={{ margin: '2px 0 12px' }}>
            {r.description ?? ''} · last updated {new Date(r.updated_at).toLocaleString()}
          </p>
          <div className="row">
            {Object.entries(drafts[r.key] ?? {}).map(([field, val]) => (
              <label key={field} style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: 'var(--sand)' }}>
                {FIELD_LABELS[r.key]?.[field] ?? field}
                <input
                  type="number"
                  value={val}
                  style={{ width: 140 }}
                  onChange={(e) => setDrafts((d) => ({
                    ...d,
                    [r.key]: { ...d[r.key], [field]: Number(e.target.value) },
                  }))}
                />
              </label>
            ))}
          </div>
          <div className="row" style={{ marginTop: 12 }}>
            <button className="btn" onClick={() => save(r.key)}>Save {r.key}</button>
            {msg[r.key] && <span className={msg[r.key].ok ? 'ok' : 'err'}>{msg[r.key].text}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
