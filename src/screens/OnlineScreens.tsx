import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  PhoneFrame, IconButton, SecondaryButton, PrimaryButton,
} from '../components/ui/Primitives';
import { SUPABASE_ENABLED, supabase } from '../lib/supabase';
import { ensureAuthAndProfile } from '../lib/profile';
import { createRoom, joinRoomByCode, quickMatch } from '../lib/online';
import { useGameStore } from '../store/gameStore';

interface OnlineProps {
  onBack: () => void;
  onMatched: (roomId: string, asPlayer: 'p1' | 'p2', code: string) => void;
}

function ScreenHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '40px 1fr 40px',
      alignItems: 'center', marginBottom: 28,
    }}>
      <IconButton onClick={onBack} aria-label="Back">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 5 L8 12 L15 19" />
        </svg>
      </IconButton>
      <h1 style={{
        textAlign: 'center', margin: 0,
        fontWeight: 900, textTransform: 'uppercase',
        color: 'var(--gold)', fontSize: 22, letterSpacing: '0.16em',
        textShadow: '0 2px 6px rgba(0,0,0,.5)',
      }}>{title}</h1>
      <span />
    </div>
  );
}

function ModeCard({
  icon, name, sub, onClick, selected,
}: { icon: ReactNode; name: string; sub: string; onClick: () => void; selected?: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'var(--card)',
        border: `1.5px solid ${selected ? 'var(--gold-bright)' : 'var(--gold)'}`,
        borderRadius: 'var(--radius-card)',
        padding: '16px 18px',
        color: 'var(--cream)',
        textAlign: 'left',
        cursor: 'pointer',
        fontFamily: 'inherit',
        boxShadow: selected
          ? 'inset 0 0 0 1px rgba(244,181,58,.4), inset 0 0 22px rgba(232,160,32,.25), 0 0 0 2px rgba(232,160,32,.18), 0 0 22px rgba(232,160,32,.4), 0 6px 14px rgba(0,0,0,.35)'
          : '0 2px 0 rgba(0,0,0,.2), 0 6px 14px rgba(0,0,0,.3)',
        display: 'grid', gridTemplateColumns: '48px 1fr', columnGap: 14, alignItems: 'center',
      }}
    >
      <span style={{
        width: 48, height: 48, borderRadius: 12,
        background: 'rgba(0,0,0,.28)', border: '1px solid var(--gold-dark)',
        color: 'var(--gold)',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      }} aria-hidden>{icon}</span>
      <span style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
        <span style={{
          fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.16em',
          fontSize: 18, color: 'var(--gold)', lineHeight: 1,
        }}>{name}</span>
        <span style={{ fontSize: 13, color: 'var(--sand)', fontStyle: 'italic' }}>{sub}</span>
      </span>
    </button>
  );
}

export function OnlineMenuScreen({ onBack, onMatched }: OnlineProps) {
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const newGame = useGameStore((s) => s.newGame);

  const ensureUser = async (): Promise<string | null> => {
    const { id } = await ensureAuthAndProfile();
    if (!id) setErr('Could not sign in. Check Supabase configuration.');
    return id;
  };

  if (!SUPABASE_ENABLED) {
    return (
      <PhoneFrame>
        <div className="screen" style={{ padding: '60px 24px 32px', flex: 1 }}>
          <ScreenHeader title="Online Play" onBack={onBack} />
          <div style={{
            background: 'var(--card)', border: '1.5px solid var(--gold)',
            borderRadius: 'var(--radius-card)', padding: 24, textAlign: 'center',
          }}>
            <p style={{ color: 'var(--cream)', margin: 0 }}>Online play needs Supabase.</p>
            <p style={{ color: 'var(--sand)', fontSize: 13, marginTop: 8 }}>
              Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable online matches.
            </p>
          </div>
        </div>
      </PhoneFrame>
    );
  }

  const doQuick = async () => {
    setBusy('quick'); setErr(null);
    const uid = await ensureUser();
    if (!uid) { setBusy(null); return; }
    const room = await quickMatch(uid);
    setBusy(null);
    if (!room) { setErr('Could not start a match.'); return; }
    const isP1 = room.player1_id === uid;
    newGame('online', isP1 ? 'p1' : 'p2');
    onMatched(room.id, isP1 ? 'p1' : 'p2', room.code);
  };

  const doInvite = async () => {
    setBusy('invite'); setErr(null);
    const uid = await ensureUser();
    if (!uid) { setBusy(null); return; }
    const room = await createRoom(uid);
    setBusy(null);
    if (!room) { setErr('Could not create room.'); return; }
    newGame('online', 'p1');
    onMatched(room.id, 'p1', room.code);
  };

  const doPrivate = async () => {
    setBusy('private'); setErr(null);
    const uid = await ensureUser();
    if (!uid) { setBusy(null); return; }
    const pin = String(Math.floor(1000 + Math.random() * 9000));
    const room = await createRoom(uid, pin);
    setBusy(null);
    if (!room) { setErr('Could not create room.'); return; }
    newGame('online', 'p1');
    onMatched(room.id, 'p1', `${room.code}|${pin}`);
  };

  return (
    <PhoneFrame>
      <div className="screen" style={{ padding: '60px 24px 32px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <ScreenHeader title="Online Play" onBack={onBack} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 18 }}>
          <ModeCard
            name="Quick Match"
            sub={busy === 'quick' ? 'Finding match…' : 'Find an opponent instantly'}
            onClick={doQuick}
            icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                       strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="13" r="7.5"/><path d="M12 9 V13 L15 15"/><path d="M9 3 H15"/>
            </svg>}
          />
          <ModeCard
            name="Invite Friend"
            sub="Share a 6-digit code"
            onClick={doInvite}
            icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                       strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9.5 14.5 L14.5 9.5"/>
              <path d="M11 6.5 L13 4.5 a4 4 0 0 1 5.7 5.7 L16.7 12.2"/>
              <path d="M13 17.5 L11 19.5 a4 4 0 0 1 -5.7 -5.7 L7.3 11.8"/>
            </svg>}
          />
          <ModeCard
            name="Private Room"
            sub="PIN-protected match"
            onClick={doPrivate}
            icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                       strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="5.5" y="11" width="13" height="9" rx="1.6"/>
              <path d="M8.5 11 V8 a3.5 3.5 0 0 1 7 0 V11"/>
              <circle cx="12" cy="15.5" r="1.2" fill="currentColor" stroke="none"/>
            </svg>}
          />
        </div>

        <JoinByCode onMatched={onMatched} />

        <div style={{ textAlign: 'center', color: 'var(--sand)', fontSize: 13, letterSpacing: '0.04em', marginTop: 12 }}>
          <span style={{
            display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
            background: '#6BBF7B', boxShadow: '0 0 8px rgba(107,191,123,.7)',
            marginRight: 6, verticalAlign: 'middle',
          }} />
          Players online now: <strong>247</strong>
        </div>

        {err && <p style={{ color: '#FF6450', fontSize: 13, textAlign: 'center', marginTop: 12 }}>{err}</p>}
      </div>
    </PhoneFrame>
  );
}

function JoinByCode({ onMatched }: { onMatched: OnlineProps['onMatched'] }) {
  const [show, setShow] = useState(false);
  const [code, setCode] = useState('');
  const [pin, setPin] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const newGame = useGameStore((s) => s.newGame);

  const doJoin = async () => {
    setBusy(true); setErr(null);
    const { id } = await ensureAuthAndProfile();
    if (!id) { setErr('Sign-in failed.'); setBusy(false); return; }
    const room = await joinRoomByCode(id, code.trim().toUpperCase(), pin.trim() || undefined);
    setBusy(false);
    if (!room) { setErr('Room not found or full.'); return; }
    newGame('online', 'p2');
    onMatched(room.id, 'p2', room.code);
  };

  return (
    <div style={{ marginTop: 4 }}>
      <SecondaryButton onClick={() => setShow((v) => !v)}>
        {show ? 'Hide join box' : 'Enter code to join'}
      </SecondaryButton>
      {show && (
        <div style={{
          marginTop: 12,
          background: 'var(--card)',
          border: '1.5px solid var(--gold)',
          borderRadius: 'var(--radius-card)',
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}>
          <input
            className="text-input"
            placeholder="ABC123"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
            style={{ textAlign: 'center', letterSpacing: '0.32em', fontSize: 22 }}
          />
          <input
            className="text-input"
            placeholder="PIN (optional)"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            style={{ textAlign: 'center', letterSpacing: '0.32em', fontSize: 22 }}
          />
          <PrimaryButton onClick={doJoin} disabled={code.length !== 6 || busy}>Connect</PrimaryButton>
          {err && <p style={{ color: '#FF6450', fontSize: 13, margin: 0 }}>{err}</p>}
        </div>
      )}
    </div>
  );
}

interface MatchmakingProps {
  roomId: string;
  asPlayer: 'p1' | 'p2';
  code: string; // may include `|PIN` suffix for private rooms
  onCancel: () => void;
  onReady: () => void;
}

export function MatchmakingScreen({ roomId, asPlayer, code, onCancel, onReady }: MatchmakingProps) {
  const [seconds, setSeconds] = useState(0);
  const tickRef = useRef<number | null>(null);
  const [codeOnly, pin] = code.split('|');

  useEffect(() => {
    tickRef.current = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => { if (tickRef.current) window.clearInterval(tickRef.current); };
  }, []);

  useEffect(() => {
    if (asPlayer === 'p2') { onReady(); return; }
    if (!SUPABASE_ENABLED || !supabase) return;
    let cancelled = false;
    const channel = supabase
      .channel(`room-${roomId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` }, (payload) => {
        const r = payload.new as { status: string };
        if (r.status === 'active' && !cancelled) onReady();
      })
      .subscribe();
    supabase.from('rooms').select('status').eq('id', roomId).single().then(({ data }) => {
      if (cancelled) return;
      if (data?.status === 'active') onReady();
    });
    return () => { cancelled = true; supabase!.removeChannel(channel); };
  }, [roomId, asPlayer, onReady]);

  const m = Math.floor(seconds / 60);
  const s = String(seconds % 60).padStart(2, '0');

  return (
    <PhoneFrame>
      <div className="screen matchmaking" style={{
        padding: '60px 24px 32px', flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', textAlign: 'center',
      }}>
        <div style={{ width: '100%', display: 'grid', gridTemplateColumns: '40px 1fr 40px', alignItems: 'center', marginBottom: 36 }}>
          <IconButton onClick={onCancel} aria-label="Cancel">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 5 L8 12 L15 19" />
            </svg>
          </IconButton>
          <h1 style={{
            margin: 0,
            fontWeight: 900, textTransform: 'uppercase',
            color: 'var(--gold)', fontSize: 22, letterSpacing: '0.16em',
            textShadow: '0 2px 6px rgba(0,0,0,.5)',
          }}>
            {pin ? 'Private Match' : 'Finding Opponent'}
          </h1>
          <span />
        </div>

        {!pin ? (
          <>
            <PulseLogo />
            <div style={{ fontSize: 36, fontWeight: 600, letterSpacing: '0.04em', color: 'var(--cream)', marginTop: 4 }}>
              {m}:{s}
            </div>
            <div style={{ color: 'var(--sand)', fontSize: 14, fontStyle: 'italic', marginTop: 12 }}>
              Searching for a worthy warrior…
            </div>

            <div style={{
              marginTop: 16, width: '100%',
              background: 'var(--card)', border: '1.5px solid var(--gold)',
              borderRadius: 'var(--radius-card)', padding: '24px 20px', textAlign: 'center',
              boxShadow: '0 2px 0 rgba(0,0,0,.2), 0 8px 22px rgba(0,0,0,.35)',
            }}>
              <div style={{ color: 'var(--sand)', fontSize: 12, letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 14 }}>
                Your room code
              </div>
              <div style={{
                fontWeight: 900, fontSize: 40, letterSpacing: '0.32em',
                color: 'var(--gold)', lineHeight: 1, paddingLeft: '0.32em',
                textShadow: '0 0 14px rgba(232,160,32,.4), 0 2px 6px rgba(0,0,0,.4)',
              }}>{codeOnly}</div>
              <div style={{ color: 'var(--sand)', fontSize: 12, fontStyle: 'italic', marginTop: 18 }}>
                Share this code with a friend to play
              </div>
            </div>
          </>
        ) : (
          <div style={{
            background: 'var(--card)', border: '1.5px solid var(--gold)',
            borderRadius: 'var(--radius-card)', padding: '24px 20px', textAlign: 'center',
            width: '100%',
          }}>
            <div style={{ color: 'var(--sand)', fontSize: 12, letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 14 }}>
              Room code
            </div>
            <div style={{
              fontWeight: 900, fontSize: 36, letterSpacing: '0.32em',
              color: 'var(--gold)', lineHeight: 1, paddingLeft: '0.32em',
            }}>{codeOnly}</div>
            <div style={{
              marginTop: 18,
              color: 'var(--gold)', fontSize: 16, letterSpacing: '0.12em',
              textAlign: 'center',
            }}>
              PIN
            </div>
            <div style={{
              display: 'flex', gap: 12, justifyContent: 'center', marginTop: 12,
            }}>
              {pin.split('').map((c, i) => (
                <div key={i} style={{
                  width: 56, height: 56,
                  background: 'rgba(0,0,0,.35)',
                  border: '1.5px solid var(--gold)',
                  borderRadius: 12,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: 28, color: 'var(--gold)',
                  boxShadow: '0 2px 0 rgba(0,0,0,.2), 0 6px 14px rgba(0,0,0,.3)',
                }}>{c}</div>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginTop: 'auto', width: '100%', display: 'flex', justifyContent: 'center', paddingTop: 24 }}>
          <SecondaryButton onClick={onCancel}>Cancel</SecondaryButton>
        </div>
      </div>
    </PhoneFrame>
  );
}

function PulseLogo() {
  return (
    <div style={{
      width: 140, height: 140, margin: '8px auto 24px',
      color: 'var(--gold)', position: 'relative',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} aria-hidden>
      <svg viewBox="0 0 100 100" fill="none" stroke="currentColor"
           strokeWidth="2.4" strokeLinecap="round"
           style={{ width: '100%', height: '100%', animation: 'mm-glow 1.8s ease-in-out infinite' }}>
        <rect x="10" y="10" width="80" height="80"/>
        <rect x="26" y="26" width="48" height="48"/>
        <rect x="42" y="42" width="16" height="16"/>
        <line x1="50" y1="10" x2="50" y2="42"/>
        <line x1="50" y1="58" x2="50" y2="90"/>
        <line x1="10" y1="50" x2="42" y2="50"/>
        <line x1="58" y1="50" x2="90" y2="50"/>
      </svg>
      <span style={{
        position: 'absolute', inset: 0,
        border: '1.5px solid var(--gold)', borderRadius: 8,
        opacity: 0.6, animation: 'mm-ring 2.4s ease-out infinite',
      }} />
      <span style={{
        position: 'absolute', inset: 0,
        border: '1.5px solid var(--gold)', borderRadius: 8,
        opacity: 0.6, animation: 'mm-ring 2.4s ease-out infinite',
        animationDelay: '1.2s',
      }} />
      <style>{`
        @keyframes mm-glow {
          0%, 100% { filter: drop-shadow(0 0 4px rgba(232,160,32,.4)); transform: scale(1); }
          50%      { filter: drop-shadow(0 0 18px rgba(244,181,58,.8)); transform: scale(1.04); }
        }
        @keyframes mm-ring {
          0%   { transform: scale(0.85); opacity: 0.55; }
          80%  { transform: scale(1.35); opacity: 0; }
          100% { transform: scale(1.35); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
