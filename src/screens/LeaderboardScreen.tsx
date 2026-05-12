import { useEffect, useState } from 'react';
import { ScreenHeader, Avatar, TierBadge } from '../components/ui/Primitives';
import { SUPABASE_ENABLED, supabase } from '../lib/supabase';
import { useProfileStore } from '../store/profileStore';

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

export function LeaderboardScreen({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = useState<Tab>('all');
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const profile = useProfileStore((s) => s.profile);

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

  const tabs: { id: Tab; label: string }[] = [
    { id: 'today', label: 'Daily' },
    { id: 'week', label: 'Weekly' },
    { id: 'all', label: 'All-time' },
  ];

  const winsKey = tab === 'today' ? 'wins_today' : tab === 'week' ? 'wins_week' : 'wins_all_time';
  const inList = profile?.id ? rows.find((r) => r.id === profile.id) : null;

  return (
    <div className="min-h-screen flex flex-col">
      <ScreenHeader title="Leaderboard" onBack={onBack} />
      <div className="px-4">
        <div className="flex bg-black/30 rounded-full p-1 border border-gold/40">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 py-2 rounded-full text-sm transition ${tab === t.id ? 'bg-gold text-charcoal font-bold' : 'text-cream/80'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 px-4 mt-4 space-y-2 overflow-y-auto pb-6">
        {!SUPABASE_ENABLED && (
          <div className="card p-4 text-center text-cream/80 text-sm">
            Connect Supabase to view live leaderboards.
          </div>
        )}
        {loading && <div className="text-cream/60 text-center text-sm">Loading…</div>}
        {!loading && rows.length === 0 && SUPABASE_ENABLED && (
          <div className="text-cream/60 text-center text-sm">No results yet — be the first!</div>
        )}
        {rows.map((row, i) => (
          <LeaderboardRow key={row.id} rank={i + 1} row={row} winsKey={winsKey as keyof Row} highlight={row.id === profile?.id} />
        ))}
        {profile?.id && !inList && rows.length > 0 && (
          <div className="pt-2 mt-2 border-t border-gold/30">
            <p className="text-cream/60 text-xs text-center mb-1">Your standing</p>
            <LeaderboardRow rank={51} row={{
              id: profile.id ?? '',
              username: profile.username,
              avatar_id: profile.avatar_id,
              tier: profile.tier,
              region: profile.region,
              wins_today: 0,
              wins_week: 0,
              wins_all_time: profile.wins,
              streak: profile.streak,
            }} winsKey={winsKey as keyof Row} highlight />
          </div>
        )}
      </div>
    </div>
  );
}

function LeaderboardRow({
  rank, row, winsKey, highlight,
}: { rank: number; row: Row; winsKey: keyof Row; highlight?: boolean }) {
  return (
    <div className={`card px-3 py-2 flex items-center gap-3 ${highlight ? 'ring-2 ring-gold' : ''}`}>
      <span className="display-font text-xl text-gold w-7 text-center">{rank}</span>
      <Avatar id={row.avatar_id} size={36} />
      <div className="flex-1 min-w-0">
        <div className="text-cream font-medium truncate">{row.username}</div>
        <div className="flex items-center gap-2 text-[10px] text-cream/60">
          <TierBadge tier={row.tier} />
          <span>{row.region}</span>
          <span>· streak {row.streak}</span>
        </div>
      </div>
      <span className="text-cream font-bold tabular-nums">{row[winsKey] as number}</span>
    </div>
  );
}
