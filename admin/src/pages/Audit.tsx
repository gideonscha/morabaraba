import { useEffect, useState } from 'react';
import { supabase, type AuditRow } from '../lib/supabase';

export function Audit() {
  const [rows, setRows] = useState<AuditRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    supabase.from('audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)
      .then(({ data, error }) => {
        if (error) console.warn(error.message);
        if (!cancelled) setRows((data ?? []) as AuditRow[]);
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <div>
      <h1>Audit Log</h1>
      <table>
        <thead><tr><th>When</th><th>Action</th><th>Target</th><th>Detail</th></tr></thead>
        <tbody>
          {rows.length === 0 && (
            <tr><td colSpan={4} className="muted">No admin actions recorded yet.</td></tr>
          )}
          {rows.map((r) => (
            <tr key={r.id}>
              <td style={{ whiteSpace: 'nowrap' }}>{new Date(r.created_at).toLocaleString()}</td>
              <td><span className="badge">{r.action}</span></td>
              <td className="muted">{r.target ?? ''}</td>
              <td style={{ fontSize: 12, fontFamily: 'ui-monospace, monospace' }}>
                {r.detail ? JSON.stringify(r.detail) : ''}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
