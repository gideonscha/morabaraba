import { useEffect, useState } from 'react';
import { PhoneFrame, TopBar, PrimaryButton, PatternStrip, CoinIcon, TierBadge } from '../components/ui/Primitives';
import { useProfileStore } from '../store/profileStore';
import {
  getDraws, demoEntries, formatRand, countdownTo, PERFORMANCE_PODIUM,
  type DrawKind, type PrizeDraw,
} from '../lib/prizes';

const TABS: { kind: DrawKind; icon: string; label: string }[] = [
  { kind: 'daily',  icon: '🏆', label: 'Daily' },
  { kind: 'weekly', icon: '🏅', label: 'Weekly' },
  { kind: 'grand',  icon: '🐂', label: 'Grand' },
];

interface Props { onBack: () => void; onPlay: () => void; }

export function PrizeCentreScreen({ onBack, onPlay }: Props) {
  const profile = useProfileStore((s) => s.profile);
  const [tab, setTab] = useState<DrawKind>('grand');

  if (!profile) return null;
  const draw = getDraws().find((d) => d.kind === tab)!;

  return (
    <PhoneFrame>
      <div className="screen prize-centre" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <TopBar back={onBack} username={profile.username} tier={profile.tier} coins={profile.coins} />

        <div style={{
          padding: '14px 24px 28px', flex: 1, overflowY: 'auto',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
        }}>
          <h2 style={{
            fontWeight: 900, fontSize: 24, color: 'var(--gold)',
            letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0,
            textShadow: '0 0 14px rgba(232,160,32,.4)', textAlign: 'center',
          }}>
            Kraal Prize Centre
          </h2>

          {/* Tabs */}
          <div style={{
            display: 'flex', gap: 6, width: 327, maxWidth: '100%',
            background: 'rgba(0,0,0,.28)', border: '1px solid var(--gold-dark)',
            borderRadius: 999, padding: 4, boxSizing: 'border-box',
          }}>
            {TABS.map((t) => {
              const active = tab === t.kind;
              return (
                <button key={t.kind} onClick={() => setTab(t.kind)} style={{
                  flex: 1, border: 0, borderRadius: 999, padding: '8px 4px',
                  background: active ? 'linear-gradient(180deg, var(--gold-bright), var(--gold))' : 'transparent',
                  color: active ? 'var(--char-dark)' : 'var(--sand)',
                  fontWeight: 800, fontSize: 12.5, letterSpacing: '0.06em', textTransform: 'uppercase',
                  cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'background .15s, color .15s',
                }}>
                  {t.icon} {t.label}
                </button>
              );
            })}
          </div>

          <HeroCard
            draw={draw}
            entries={demoEntries(profile, tab)}
            coins={profile.coins}
            onPlay={onPlay}
          />

          {/* Monthly performance podium — separate from the random draw */}
          {tab === 'grand' && (
            <div style={{
              width: 327, boxSizing: 'border-box',
              background: 'var(--card)', border: '1.5px solid var(--gold)',
              borderRadius: 16, padding: '14px 18px',
              display: 'flex', flexDirection: 'column', gap: 10,
            }}>
              <h3 style={{
                fontWeight: 900, fontSize: 14, color: 'var(--gold)', margin: 0,
                letterSpacing: '0.08em', textTransform: 'uppercase',
              }}>
                Leaderboard Podium
              </h3>
              <div style={{ display: 'flex', gap: 8 }}>
                {PERFORMANCE_PODIUM.map((p, i) => (
                  <div key={p.place} style={{
                    flex: 1, textAlign: 'center', padding: '10px 4px',
                    background: i === 0 ? 'rgba(232,160,32,.16)' : 'rgba(0,0,0,.22)',
                    border: `1px solid ${i === 0 ? 'var(--gold-bright)' : 'var(--gold-dark)'}`,
                    borderRadius: 12,
                  }}>
                    <div style={{ fontSize: 18, lineHeight: 1 }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</div>
                    <div style={{ fontWeight: 900, fontSize: 16, color: 'var(--gold-bright)', marginTop: 3 }}>
                      {formatRand(p.valueRand)}
                    </div>
                    <div style={{ fontSize: 9.5, color: 'var(--sand)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      {p.place} · airtime
                    </div>
                  </div>
                ))}
              </div>
              <p style={{ margin: 0, fontSize: 11.5, color: 'var(--cream)', lineHeight: 1.35 }}>
                Top 3 on the monthly leaderboard win airtime — skill rewards,
                separate from the random draws.
              </p>
            </div>
          )}

          {/* How it works */}
          <div style={{
            width: 327, boxSizing: 'border-box',
            background: 'var(--card)', border: '1.5px solid var(--gold)',
            borderRadius: 16, padding: '14px 18px',
            display: 'flex', flexDirection: 'column', gap: 8,
          }}>
            <h3 style={{
              fontWeight: 900, fontSize: 14, color: 'var(--gold)', margin: 0,
              letterSpacing: '0.08em', textTransform: 'uppercase',
            }}>
              How it works
            </h3>
            {[
              ['🎮', 'Play matches to earn gold coins: 3 for a win, 1 for a draw.'],
              ['🎟️', 'Every 10 coins earned = 1 entry into each draw (max 20 entries a day).'],
              ['📅', 'Draws close at 11:59 PM — daily, Sunday night, and month-end.'],
              ['📲', 'Winners notified by 10:00 the next morning. Prizes paid as airtime.'],
            ].map(([icon, text]) => (
              <div key={text} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 15, lineHeight: 1.3 }}>{icon}</span>
                <span style={{ fontSize: 12.5, color: 'var(--cream)', lineHeight: 1.4 }}>{text}</span>
              </div>
            ))}
          </div>

          <div style={{
            width: 327, boxSizing: 'border-box',
            background: 'rgba(0,0,0,.22)', border: '1px dashed var(--gold-dark)',
            borderRadius: 12, padding: '10px 14px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
          }}>
            <span style={{ fontSize: 11.5, color: 'var(--sand)', lineHeight: 1.35 }}>
              <strong style={{ color: 'var(--gold)' }}>Preview</strong> — demo draw. Entries and prize
              values shown are placeholders until draws go live.
            </span>
            <TierBadge tier={profile.tier} />
          </div>

          <PatternStrip opacity={0.18} />
        </div>
      </div>
    </PhoneFrame>
  );
}

function HeroCard({ draw, entries, coins, onPlay }: {
  draw: PrizeDraw; entries: number; coins: number; onPlay: () => void;
}) {
  // Live ticking countdown (1s).
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const c = countdownTo(draw.closesAt, now);
  const pad = (n: number) => String(n).padStart(2, '0');
  const isGrand = draw.kind === 'grand';

  return (
    <div style={{
      width: 327, boxSizing: 'border-box',
      background: isGrand
        ? 'linear-gradient(180deg, rgba(232,160,32,.20) 0%, var(--card) 55%)'
        : 'var(--card)',
      border: `1.5px solid ${isGrand ? 'var(--gold-bright)' : 'var(--gold)'}`,
      borderRadius: 18, padding: '18px 18px 16px',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
      boxShadow: isGrand
        ? '0 0 28px rgba(232,160,32,.35), 0 8px 18px rgba(0,0,0,.35)'
        : '0 0 18px rgba(232,160,32,.15), 0 6px 14px rgba(0,0,0,.3)',
    }}>
      <div style={{
        fontSize: isGrand ? 52 : 40, lineHeight: 1,
        filter: isGrand ? 'drop-shadow(0 0 14px rgba(232,160,32,.75))' : 'drop-shadow(0 0 8px rgba(232,160,32,.4))',
      }}>
        {draw.icon}
      </div>
      {isGrand && (
        <div style={{
          fontSize: 9.5, fontWeight: 800, letterSpacing: '0.22em', textTransform: 'uppercase',
          color: 'var(--gold-bright)',
        }}>
          The Golden Bull
        </div>
      )}
      <h3 style={{
        fontWeight: 900, fontSize: 16, color: 'var(--cream)', margin: 0,
        letterSpacing: '0.1em', textTransform: 'uppercase', textAlign: 'center',
      }}>
        {draw.name}
      </h3>

      {/* Dominant prize value */}
      <div style={{
        fontWeight: 900, fontSize: 46, lineHeight: 1.05, color: 'var(--gold-bright)',
        textShadow: '0 0 22px rgba(232,160,32,.55), 0 3px 6px rgba(0,0,0,.4)',
        letterSpacing: '0.02em',
      }}>
        {formatRand(draw.valueRand)}
      </div>

      {/* Countdown */}
      <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
        {[[c.days, 'days'], [c.hours, 'hrs'], [c.minutes, 'min'], [c.seconds, 'sec']].map(([v, l]) => (
          <div key={l as string} style={{
            width: 54, padding: '6px 0 4px', textAlign: 'center',
            background: 'rgba(0,0,0,.35)', border: '1px solid var(--gold-dark)', borderRadius: 10,
          }}>
            <div style={{ fontWeight: 900, fontSize: 18, color: 'var(--cream)', fontVariantNumeric: 'tabular-nums' }}>
              {pad(v as number)}
            </div>
            <div style={{ fontSize: 8.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--sand)' }}>
              {l}
            </div>
          </div>
        ))}
      </div>

      {/* Entries + coins */}
      <div style={{ display: 'flex', gap: 10, marginTop: 10, width: '100%', justifyContent: 'center' }}>
        <span style={statChip}>🎟️ {entries.toLocaleString()} entries</span>
        <span style={{ ...statChip, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <CoinIcon size={14} /> {coins.toLocaleString()} coins
        </span>
      </div>

      <div style={{ marginTop: 12, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
        <PrimaryButton onClick={onPlay} style={{ width: '100%' }}>Play to Earn Entries</PrimaryButton>
        <span style={{ fontSize: 11, fontStyle: 'italic', color: 'var(--sand)' }}>{draw.cta}</span>
        <span style={{
          fontSize: 12, fontWeight: 700, fontStyle: 'italic', color: 'var(--gold)',
          letterSpacing: '0.03em',
        }}>
          Collect gold coins. Stand to win.
        </span>
      </div>
    </div>
  );
}

const statChip: React.CSSProperties = {
  background: 'rgba(0,0,0,.3)', border: '1px solid var(--gold-dark)',
  borderRadius: 999, padding: '6px 13px',
  color: 'var(--cream)', fontWeight: 700, fontSize: 12.5, whiteSpace: 'nowrap',
};
