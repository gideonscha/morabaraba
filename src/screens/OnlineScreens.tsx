import { useEffect, useState } from 'react';
import { ScreenHeader, PrimaryButton, SecondaryButton } from '../components/ui/Primitives';
import { SUPABASE_ENABLED, supabase } from '../lib/supabase';
import { ensureAuthAndProfile } from '../lib/profile';
import { createRoom, joinRoomByCode, quickMatch } from '../lib/online';
import { useGameStore } from '../store/gameStore';

interface OnlineProps {
  onBack: () => void;
  onMatched: (roomId: string, asPlayer: 'p1' | 'p2', code: string) => void;
}

export function OnlineMenuScreen({ onBack, onMatched }: OnlineProps) {
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [showInviteCode, setShowInviteCode] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const [joinPin, setJoinPin] = useState('');
  const [showJoin, setShowJoin] = useState(false);
  const newGame = useGameStore((s) => s.newGame);

  const ensureUser = async (): Promise<string | null> => {
    const { id } = await ensureAuthAndProfile();
    if (!id) setErr('Could not sign in. Check Supabase configuration.');
    return id;
  };

  if (!SUPABASE_ENABLED) {
    return (
      <div className="min-h-screen flex flex-col">
        <ScreenHeader title="Online Play" onBack={onBack} />
        <div className="px-6 mt-10 card p-6 text-center">
          <p className="text-cream/90">Online play needs Supabase.</p>
          <p className="text-cream/60 text-sm mt-2">Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable online matches.</p>
        </div>
      </div>
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
    setShowInviteCode(room.code);
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
    setShowInviteCode(`${room.code} · PIN ${pin}`);
    newGame('online', 'p1');
    onMatched(room.id, 'p1', room.code);
  };

  const doJoin = async () => {
    setBusy('join'); setErr(null);
    const uid = await ensureUser();
    if (!uid) { setBusy(null); return; }
    const room = await joinRoomByCode(uid, joinCode.trim().toUpperCase(), joinPin.trim() || undefined);
    setBusy(null);
    if (!room) { setErr('Room not found or full.'); return; }
    newGame('online', 'p2');
    onMatched(room.id, 'p2', room.code);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <ScreenHeader title="Online Play" onBack={onBack} />
      <div className="px-5 mt-3 space-y-3">
        <PrimaryButton onClick={doQuick} disabled={!!busy}>{busy === 'quick' ? 'Finding match…' : 'Quick Match'}</PrimaryButton>
        <SecondaryButton onClick={doInvite} disabled={!!busy}>{busy === 'invite' ? 'Creating…' : 'Create Invite Code'}</SecondaryButton>
        <SecondaryButton onClick={doPrivate} disabled={!!busy}>{busy === 'private' ? 'Creating…' : 'Private Room (PIN)'}</SecondaryButton>
        <SecondaryButton onClick={() => setShowJoin((v) => !v)}>Enter code to join</SecondaryButton>

        {showJoin && (
          <div className="card p-4 space-y-3">
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
              placeholder="ABC123"
              className="w-full bg-black/30 border border-gold/50 rounded-xl px-3 py-3 text-cream uppercase tracking-widest text-center"
            />
            <input
              value={joinPin}
              onChange={(e) => setJoinPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="PIN (optional)"
              className="w-full bg-black/30 border border-gold/50 rounded-xl px-3 py-3 text-cream tracking-widest text-center"
            />
            <PrimaryButton onClick={doJoin} disabled={joinCode.length !== 6 || !!busy}>Join</PrimaryButton>
          </div>
        )}

        {showInviteCode && (
          <div className="card p-4 text-center">
            <p className="text-cream/70 text-xs uppercase tracking-wider">Share this code</p>
            <div className="display-font text-3xl text-gold tracking-widest mt-1">{showInviteCode}</div>
          </div>
        )}

        {err && <p className="text-red-300 text-sm text-center">{err}</p>}
      </div>
    </div>
  );
}

interface MatchmakingProps {
  roomId: string;
  asPlayer: 'p1' | 'p2';
  code: string;
  onCancel: () => void;
  onReady: () => void;
}

export function MatchmakingScreen({ roomId, asPlayer, code, onCancel, onReady }: MatchmakingProps) {
  const [status, setStatus] = useState<'waiting' | 'active'>(asPlayer === 'p2' ? 'active' : 'waiting');

  useEffect(() => {
    if (asPlayer === 'p2') { onReady(); return; }
    if (!SUPABASE_ENABLED || !supabase) return;
    let cancelled = false;
    const channel = supabase
      .channel(`room-${roomId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` }, (payload) => {
        const r = payload.new as { status: string };
        if (r.status === 'active' && !cancelled) {
          setStatus('active');
          onReady();
        }
      })
      .subscribe();

    // Poll once in case event was missed
    supabase.from('rooms').select('status').eq('id', roomId).single().then(({ data }) => {
      if (cancelled) return;
      if (data?.status === 'active') { setStatus('active'); onReady(); }
    });

    return () => { cancelled = true; supabase!.removeChannel(channel); };
  }, [roomId, asPlayer, onReady]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <ScreenHeader title="Matchmaking" />
      <div className="card p-6 w-full max-w-sm text-center">
        <p className="text-cream/80">Room code</p>
        <div className="display-font text-4xl text-gold tracking-widest mt-1">{code}</div>
        <div className="mt-6 flex justify-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-gold animate-pulse" />
          <span className="w-2 h-2 rounded-full bg-gold animate-pulse [animation-delay:120ms]" />
          <span className="w-2 h-2 rounded-full bg-gold animate-pulse [animation-delay:240ms]" />
        </div>
        <p className="text-cream/70 mt-3 text-sm">{status === 'waiting' ? 'Waiting for opponent…' : 'Opponent joined!'}</p>
        <div className="mt-6"><SecondaryButton onClick={onCancel}>Cancel</SecondaryButton></div>
      </div>
    </div>
  );
}
