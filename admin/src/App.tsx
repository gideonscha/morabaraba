import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase, CONFIGURED } from './lib/supabase';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Players } from './pages/Players';
import { Draws } from './pages/Draws';
import { Payouts } from './pages/Payouts';
import { Config } from './pages/Config';
import { Audit } from './pages/Audit';

type Page = 'dashboard' | 'players' | 'draws' | 'payouts' | 'config' | 'audit';

const PAGES: { id: Page; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'players', label: 'Players' },
  { id: 'draws', label: 'Draws' },
  { id: 'payouts', label: 'Payouts' },
  { id: 'config', label: 'Game Config' },
  { id: 'audit', label: 'Audit Log' },
];

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [page, setPage] = useState<Page>('dashboard');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  // Verify admin membership after sign-in. RLS enforces this server-side
  // regardless; the check just gives non-admins a clear message.
  useEffect(() => {
    if (!session) { setIsAdmin(null); return; }
    let cancelled = false;
    supabase.from('admin_users').select('id').eq('id', session.user.id).maybeSingle()
      .then(({ data }) => { if (!cancelled) setIsAdmin(Boolean(data)); });
    return () => { cancelled = true; };
  }, [session]);

  if (!CONFIGURED) {
    return <div className="login-wrap"><div className="login-box">
      <strong>Not configured</strong>
      <span className="muted">Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.</span>
    </div></div>;
  }

  if (!session) return <Login />;

  if (isAdmin === false) {
    return (
      <div className="login-wrap"><div className="login-box">
        <strong>Not an admin account</strong>
        <span className="muted">
          {session.user.email} is signed in but not registered in admin_users.
        </span>
        <button className="btn ghost" onClick={() => supabase.auth.signOut()}>Sign out</button>
      </div></div>
    );
  }

  if (isAdmin === null) {
    return <div className="login-wrap"><span className="muted">Checking access…</span></div>;
  }

  return (
    <div className="layout">
      <nav className="sidebar">
        <div className="brand">🐄 Morabaraba Admin</div>
        {PAGES.map((p) => (
          <button key={p.id} className={page === p.id ? 'active' : ''} onClick={() => setPage(p.id)}>
            {p.label}
          </button>
        ))}
        <div className="foot">
          {session.user.email}
          <br />
          <a href="#" onClick={(e) => { e.preventDefault(); supabase.auth.signOut(); }}>Sign out</a>
        </div>
      </nav>
      <main className="main">
        {page === 'dashboard' && <Dashboard />}
        {page === 'players' && <Players />}
        {page === 'draws' && <Draws />}
        {page === 'payouts' && <Payouts />}
        {page === 'config' && <Config />}
        {page === 'audit' && <Audit />}
      </main>
    </div>
  );
}
