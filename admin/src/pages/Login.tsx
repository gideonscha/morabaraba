import { useState } from 'react';
import { supabase } from '../lib/supabase';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setErr(error.message);
    setBusy(false);
  };

  return (
    <div className="login-wrap">
      <form className="login-box" onSubmit={submit}>
        <strong style={{ fontSize: 16, color: 'var(--gold)' }}>🐄 Morabaraba Admin</strong>
        <input
          type="email" placeholder="Email" value={email}
          onChange={(e) => setEmail(e.target.value)} autoComplete="username" required
        />
        <input
          type="password" placeholder="Password" value={password}
          onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required
        />
        {err && <span className="err">{err}</span>}
        <button className="btn" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        <span className="muted">Admin accounts are provisioned manually. No self-registration.</span>
      </form>
    </div>
  );
}
