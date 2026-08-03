import { useEffect, useState } from 'react';
import {
  PhoneFrame, TopBar, PatternStrip, TierBadge,
} from '../components/ui/Primitives';
import { SUPABASE_ENABLED, supabase } from '../lib/supabase';
import { useProfileStore } from '../store/profileStore';
import { KraalPrizeBanner } from '../components/KraalPrizeBanner';
import { performancePodium, formatRand } from '../lib/prizes';

interface Row {
  id: string;
  username: string;
  avatar_id: number;
  tier: string;
  region: string;
  monthly_points: number;
  rank: number;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function LeaderboardScreen({ onBack, onPrizes }: { onBack: () => void; onPrizes: () => void }) {
  const profile = useProfileStore((s) => s.profile);
  const [rows, setRows] = useState<Row[]>([]);
  const [myRank, setMyRank] = useState<{ monthly_points: number; rank: number } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!SUPABASE_ENABLED || !supabase) return;
    let cancelled = false;
    setLoading(true);
    supabase
      .from('monthly_leaderboard')
      .select('*')
      .order('rank', { ascending: true })
      .limit(50)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) console.warn(error.message);
        setRows((data ?? []) as Row[]);
        setLoading(false);
      });
    supabase.rpc('my_monthly_rank').then(({ data, error }) => {
      if (cancelled || error) return;
      const r = Array.isArray(data) ? data[0] : data;
      if (r) setMyRank(r as { monthly_points: number; rank: number });
    });
    return () => { cancelled = true; };
  }, []);

  const now = new Date();
  const monthLabel = `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`;
  const inList = profile?.id ? rows.find((r) => r.id === profile.id) : null;

  // Own standing: server rank when available, else local monthly points
  // with an unknown rank (offline / not yet signed in).
  const ownPoints = myRank?.monthly_points ?? profile?.monthly_points ?? 0;
  const ownRank: number | null = myRank?.rank ?? (inList ? inList.rank : null);

  return (
    <PhoneFrame>
      <div className="screen leaderboard" style={{ flex: 1 }}>
        <TopBar back={onBack} username={profile?.username ?? '@you'} tier={profile?.tier ?? 'free'} coins={profile?.coins ?? 0} />

        <div style={{ padding: '12px 24px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <KraalPrizeBanner onOpen={onPrizes} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <h2 style={{
              fontWeight: 900, fontSize: 28, color: 'var(--gold)',
              letterSpacing: '0.06em', textTransform: 'uppercase',
              margin: '4px 0 0',
              textShadow: '0 0 14px rgba(232,160,32,.4)',
            }}>
              Leaderboard
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: 12.5, color: 'var(--sand)', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700 }}>
              {monthLabel}
            </p>
            <p style={{ margin: '6px 0 0', fontSize: 11.5, fontStyle: 'italic', color: 'var(--cream)' }}>
              Top 3 this month win {performancePodium().map((p) => formatRand(p.valueRand)).join(' / ')} airtime
            </p>
          </div>

          {/* Own standing — always visible, per spec */}
          {profile && (
            <div style={{
              width: 327, alignSelf: 'center', boxSizing: 'border-box',
              background: 'rgba(232,160,32,.1)', border: '1.5px solid var(--gold)',
              borderRadius: 12, padding: '10px 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              boxShadow: '0 0 16px rgba(232,160,32,.2)',
            }}>
              <span style={{ fontSize: 12.5, color: 'var(--cream)', fontWeight: 700, letterSpacing: '0.04em' }}>
                Your Rank: <strong style={{ color: 'var(--gold-bright)', fontSize: 16 }}>{ownRank ? `#${ownRank}` : '—'}</strong>
              </span>
              <span style={{ fontSize: 12.5, color: 'var(--cream)', fontWeight: 700 }}>
                <strong style={{ color: 'var(--gold-bright)', fontSize: 16 }}>{ownPoints.toLocaleString()}</strong>
                <span style={{ fontSize: 10, color: 'var(--sand)', fontWeight: 600 }}> pts this month</span>
              </span>
            </div>
          )}

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
              <p style={{ color: 'var(--sand)', fontSize: 12 }}>No points yet this month — be the first on the board!</p>
            )}
            {rows.map((row) => (
              <LeaderRow key={row.id} row={row} self={row.id === profile?.id} />
            ))}
          </div>

          <p style={{ fontSize: 10.5, color: 'var(--sand)', textAlign: 'center', margin: '4px 0 0', opacity: 0.8 }}>
            Resets at 00:00 on the 1st of every month. Lifetime points and best
            finishes are saved to your profile forever.
          </p>
        </div>
      </div>
    </PhoneFrame>
  );
}

function LeaderRow({ row, self }: { row: Row; self?: boolean }) {
  const rank = row.rank;
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
        fontWeight: 900, fontSize: rank > 99 ? 14 : 20,
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
        {row.monthly_points.toLocaleString()}<span style={{ fontSize: 10, color: 'var(--sand)', fontWeight: 600 }}> pts</span>
      </span>
    </div>
  );
}
