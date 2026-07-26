import { useEffect, useState } from 'react';
import {
  PhoneFrame, TopBar, PatternStrip, TierBadge,
} from '../components/ui/Primitives';
import { SUPABASE_ENABLED, supabase } from '../lib/supabase';
import { useProfileStore } from '../store/profileStore';
import { KraalPrizeBanner } from '../components/KraalPrizeBanner';

type Tab = 'today' | 'week' | 'all';

interface Row {
  id: string;
  username: string;
  avatar_id: number;
  tier: string;
  region: string;
  wins_today: number;
  wins_week: number;
  wins_all_time: number;
  streak: number;
}

export function LeaderboardScreen({ onBack, onPrizes }: { onBack: () => void; onPrizes: () => void }) {
  const profile = useProfileStore((s) => s.profile);
  const [tab, setTab] = useState<Tab>('week');
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!SUPABASE_ENABLED || !supabase) return;
    let cancelled = false;
    setLoading(true);
    const col = tab === 'today' ? 'wins_today' : tab === 'week' ? 'wins_week' : 'wins_all_time';
    supabase
      .from('leaderboard')
      .select('*')
      .order(col, { ascending: false })
      .limit(50)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) console.warn(error.message);
        setRows((data ?? []) as Row[]);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [tab]);

  const winsKey = tab === 'today' ? 'wins_today' : tab === 'week' ? 'wins_week' : 'wins_all_time';
  const inList = profile?.id ? rows.find((r) => r.id === profile.id) : null;

  return (
    <PhoneFrame>
      <div className="screen leaderboard" style={{ flex: 1 }}>
        <TopBar back={onBack} username={profile?.username ?? '@you'} tier={profile?.tier ?? 'free'} coins={profile?.coins ?? 0} />

        <div style={{ padding: '12px 24px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <KraalPrizeBanner onOpen={onPrizes} />
          </div>
          <h2 style={{
            fontWeight: 900, fontSize: 28, color: 'var(--gold)',
            letterSpacing: '0.06em', textTransform: 'uppercase',
            textAlign: 'center', margin: '4px 0 0',
            textShadow: '0 0 14px rgba(232,160,32,.4)',
          }}>
            Leaderboard
          </h2>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            {([
              { id: 'today', label: 'Today' },
              { id: 'week',  label: 'This Week' },
              { id: 'all',   label: 'All Time' },
            ] as { id: Tab; label: string }[]).map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                  padding: '8px 14px', borderRadius: 999,
                  background: tab === t.id ? 'var(--gold)' : 'var(--card)',
                  color: tab === t.id ? '#1A0E08' : 'var(--cream)',
                  border: `1px solid ${tab === t.id ? 'var(--gold-bright)' : 'rgba(232,160,32,.35)'}`,
                  flex: 1, maxWidth: 100,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          <PatternStrip />

          {!SUPABASE_ENABLED && (
            <div style={{
              background: 'var(--card)', border: '1.5px solid var(--gold)',
              borderRadius: 'var(--radius-card)', padding: 16, textAlign: 'center',
              color: 'var(--cream)', fontSize: 13,
            }}>
              Online leaderboards need Supabase.
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
            {loading && <p style={{ color: 'var(--sand)', fontSize: 12 }}>Loading…</p>}
            {!loading && rows.length === 0 && SUPABASE_ENABLED && (
              <p style={{ color: 'var(--sand)', fontSize: 12 }}>No matches yet — be the first to win!</p>
            )}
            {rows.map((row, i) => (
              <LeaderRow key={row.id} rank={i + 1} row={row} winsKey={winsKey} self={row.id === profile?.id} />
            ))}
            {profile?.id && !inList && rows.length > 0 && (
              <>
                <div style={{
                  height: 1, width: 327, alignSelf: 'center',
                  margin: '6px auto 2px',
                  background: 'linear-gradient(90deg, transparent 0%, rgba(232,160,32,.55) 50%, transparent 100%)',
                }} aria-hidden />
                <div style={{
                  fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase',
                  color: 'var(--gold)', textAlign: 'center', marginTop: -2,
                }}>Your standing</div>
                <LeaderRow rank={51} row={{
                  id: profile.id, username: profile.username, avatar_id: profile.avatar_id,
                  tier: profile.tier, region: profile.region,
                  wins_today: 0, wins_week: 0, wins_all_time: profile.wins, streak: profile.streak,
                }} winsKey={winsKey} self />
              </>
            )}
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}

function LeaderRow({
  rank, row, winsKey, self,
}: { rank: number; row: Row; winsKey: keyof Row; self?: boolean }) {
  const rankClass: Record<number, string> = { 1: 'top1', 2: 'top2', 3: 'top3' };
  const isTop = rank <= 3;
  const ribbon = rank === 1
    ? 'linear-gradient(180deg, #FFD466, #C8881C)'
    : rank === 2
    ? 'linear-gradient(180deg, #E8E8E8, #888)'
    : rank === 3
    ? 'linear-gradient(180deg, #D08644, #6B3E18)'
    : 'transparent';
  return (
    <div style={{
      width: 327, height: 56,
      background: 'var(--card)', borderRadius: 12,
      display: 'grid', gridTemplateColumns: '36px 36px 1fr auto auto',
      alignItems: 'center', gap: 10, padding: '0 14px 0 8px',
      position: 'relative', overflow: 'hidden',
      border: self ? '1.5px solid var(--gold)' : '1px solid transparent',
      boxShadow: self ? '0 0 18px rgba(232,160,32,.3)' : undefined,
    }}>
      <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: ribbon, boxShadow: rank === 1 ? '2px 0 8px rgba(232,160,32,.4)' : undefined }} />
      <span style={{
        fontWeight: 900, fontSize: 20,
        color: isTop ? 'var(--gold)' : 'var(--sand)',
        textAlign: 'center',
      }}>
        {rank}
      </span>
      <span style={{
        width: 36, height: 36, borderRadius: '50%',
        background: 'radial-gradient(circle at 35% 30%, #6B3E18 0%, #2A1A0E 80%)',
        border: '1.5px solid var(--gold)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--gold-bright)', fontWeight: 900, fontSize: 13,
      }}>
        {row.username[0]?.toUpperCase() ?? '?'}
      </span>
      <span style={{ fontSize: 14, color: 'var(--cream)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        @{row.username}
      </span>
      <TierBadge tier={row.tier} />
      <span style={{ fontWeight: 900, fontSize: 16, color: 'var(--gold)', letterSpacing: '0.04em' }}>
        {row[winsKey] as number}<span style={{ fontSize: 10, color: 'var(--sand)', fontWeight: 600 }}> W</span>
      </span>
    </div>
  );
}
