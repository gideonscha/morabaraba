import { useEffect, useState } from 'react';
import { PhoneFrame, TopBar, PrimaryButton, PatternStrip } from '../components/ui/Primitives';
import { useProfileStore } from '../store/profileStore';
import { useHerdStore } from '../store/herdStore';
import {
  herdHealth, HEALTH_LABEL, guardianAdornments, careCompletedToday, todayString,
  type HerdHealth, type Chore, type CareEvent,
} from '../lib/herd';
import { audio } from '../lib/audio';

const HEALTH_COLOR: Record<HerdHealth, string> = {
  thriving:  '#4CAF50',
  healthy:   '#CDDC39',
  hungry:    '#FF9800',
  neglected: '#F44336',
};

const CHORES: { id: Chore; icon: string; label: string }[] = [
  { id: 'feed',   icon: '🌾', label: 'Feed' },
  { id: 'water',  icon: '💧', label: 'Water' },
  { id: 'health', icon: '❤️', label: 'Check Health' },
];

const MILESTONES = [
  { days: 3,  label: 'New calf' },
  { days: 7,  label: 'Kraal expands' },
  { days: 14, label: 'Rare Nguni' },
  { days: 30, label: 'Champion bull' },
];

const NAME_SUGGESTIONS = ['The Elder Cow', 'Guardian Bull', 'Inkosi', 'Mama Nguni'];

export function KraalScreen({ onBack }: { onBack: () => void }) {
  const profile = useProfileStore((s) => s.profile);
  const addCoins = useProfileStore((s) => s.addCoins);

  const herd = useHerdStore((s) => s.herd);
  const refresh = useHerdStore((s) => s.refresh);
  const nameGuardian = useHerdStore((s) => s.nameGuardian);
  const performChore = useHerdStore((s) => s.performChore);

  const [toasts, setToasts] = useState<CareEvent[]>([]);
  const [nameDraft, setNameDraft] = useState('');

  useEffect(() => { refresh(); }, [refresh]);

  if (!profile) return null;

  const today = todayString();
  const health = herdHealth(herd, today);
  const doneToday = careCompletedToday(herd, today);
  const adornments = guardianAdornments(herd.bestStreak);

  const onChore = (chore: Chore) => {
    audio.init();
    const events = performChore(chore);
    if (events.length === 0) {
      audio.playSound('select');
      return;
    }
    // Care day completed — award coins, celebrate.
    const coins = events.reduce((sum, e) => sum + e.coins, 0);
    if (coins > 0) addCoins(coins);
    const milestone = events.some((e) => e.type === 'kraal' || e.type === 'rare' || e.type === 'bull');
    audio.playSound(milestone ? 'mill' : 'coin');
    setToasts(events);
  };

  return (
    <PhoneFrame>
      <div className="screen kraal" style={{ flex: 1 }}>
        <TopBar back={onBack} username={profile.username} tier={profile.tier} coins={profile.coins} />

        <div style={{
          padding: '16px 24px 28px', flex: 1, overflowY: 'auto',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
        }}>
          <div style={{ textAlign: 'center' }}>
            <h2 style={{
              fontWeight: 900, fontSize: 26, color: 'var(--gold)',
              letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0,
              textShadow: '0 0 14px rgba(232,160,32,.4)',
            }}>
              Tend Your Herd
            </h2>
            <p style={{
              margin: '4px 0 0', fontStyle: 'italic', fontSize: 12.5,
              color: 'var(--sand)', letterSpacing: '0.02em',
            }}>
              A cared-for kraal is a respected kraal.
            </p>
          </div>

          {/* Health + streak strip */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              background: 'rgba(0,0,0,.28)', border: `1.5px solid ${HEALTH_COLOR[health]}`,
              borderRadius: 999, padding: '6px 14px',
              color: 'var(--cream)', fontWeight: 700, fontSize: 13,
            }}>
              <span style={{
                width: 10, height: 10, borderRadius: '50%',
                background: HEALTH_COLOR[health],
                boxShadow: `0 0 8px ${HEALTH_COLOR[health]}`,
              }} />
              {HEALTH_LABEL[health]}
            </span>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(0,0,0,.28)', border: '1.5px solid var(--gold-dark)',
              borderRadius: 999, padding: '6px 14px',
              color: 'var(--gold)', fontWeight: 700, fontSize: 13,
            }}>
              🔥 {herd.careStreak} day{herd.careStreak === 1 ? '' : 's'}
            </span>
          </div>

          {/* Guardian naming (first visit) */}
          {!herd.guardianName && (
            <div style={cardStyle}>
              <div style={{ fontSize: 34, lineHeight: 1 }}>🐄</div>
              <h3 style={cardTitleStyle}>Name Your Guardian</h3>
              <p style={{ fontSize: 12.5, color: 'var(--cream)', margin: 0, textAlign: 'center', lineHeight: 1.4 }}>
                Every kraal begins with one. This cow will never leave your side —
                it grows in honour as you care for the herd.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
                {NAME_SUGGESTIONS.map((n) => (
                  <button key={n} onClick={() => setNameDraft(n)} style={{
                    background: nameDraft === n ? 'var(--gold)' : 'rgba(0,0,0,.25)',
                    color: nameDraft === n ? 'var(--char-dark)' : 'var(--sand)',
                    border: '1px solid var(--gold-dark)', borderRadius: 999,
                    padding: '5px 12px', fontSize: 12, fontWeight: 700,
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}>
                    {n}
                  </button>
                ))}
              </div>
              <input
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                placeholder="…or choose your own name"
                maxLength={24}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: 'rgba(0,0,0,.3)', border: '1.5px solid var(--gold-dark)',
                  borderRadius: 10, padding: '10px 12px',
                  color: 'var(--cream)', fontSize: 14, fontFamily: 'inherit',
                  textAlign: 'center', outline: 'none',
                }}
              />
              <PrimaryButton onClick={() => nameGuardian(nameDraft)} disabled={!nameDraft.trim()}>
                Welcome to the Kraal
              </PrimaryButton>
            </div>
          )}

          {/* Guardian card */}
          {herd.guardianName && (
            <div style={{ ...cardStyle, gap: 6 }}>
              <div style={{ fontSize: 40, lineHeight: 1 }}>{herd.hasChampionBull ? '🐂' : '🐄'}</div>
              <h3 style={{ ...cardTitleStyle, margin: 0 }}>{herd.guardianName}</h3>
              {adornments.length > 0 ? (
                <p style={{ fontSize: 11.5, color: 'var(--gold)', margin: 0, textAlign: 'center', letterSpacing: '0.04em' }}>
                  ✨ {adornments.join(' · ')}
                </p>
              ) : (
                <p style={{ fontSize: 11.5, color: 'var(--sand)', margin: 0, fontStyle: 'italic' }}>
                  Care for the herd to earn adornments
                </p>
              )}
              <div style={{ display: 'flex', gap: 14, marginTop: 6, fontSize: 12, color: 'var(--cream)' }}>
                <span>🐄 Herd: <strong style={{ color: 'var(--gold)' }}>{herd.cattle}</strong></span>
                <span>🏡 Kraal lv. <strong style={{ color: 'var(--gold)' }}>{herd.kraalLevel}</strong></span>
                {herd.rareNguni > 0 && <span>✨ Nguni: <strong style={{ color: 'var(--gold)' }}>{herd.rareNguni}</strong></span>}
              </div>
            </div>
          )}

          {/* Daily chores */}
          <div style={{ ...cardStyle, gap: 10 }}>
            <h3 style={{ ...cardTitleStyle, fontSize: 15 }}>
              {doneToday ? 'The Morning Chores — Done ✓' : 'The Morning Chores'}
            </h3>
            <div style={{ display: 'flex', gap: 10, width: '100%', justifyContent: 'center' }}>
              {CHORES.map((c) => {
                const done = doneToday || herd.choresDone[c.id];
                return (
                  <button
                    key={c.id}
                    onClick={() => onChore(c.id)}
                    disabled={done}
                    className="btn-press"
                    style={{
                      flex: 1, maxWidth: 100, padding: '12px 4px 10px',
                      background: done ? 'rgba(76,175,80,.12)' : 'var(--card)',
                      border: `1.5px solid ${done ? '#4CAF50' : 'var(--gold)'}`,
                      borderRadius: 14, cursor: done ? 'default' : 'pointer',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                      color: 'var(--cream)', fontFamily: 'inherit',
                      opacity: done ? 0.75 : 1,
                      boxShadow: done ? 'none' : '0 2px 0 rgba(0,0,0,.25), 0 4px 10px rgba(0,0,0,.25)',
                    }}
                  >
                    <span style={{ fontSize: 24, lineHeight: 1 }}>{done ? '✓' : c.icon}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                      {c.label}
                    </span>
                  </button>
                );
              })}
            </div>
            {doneToday && (
              <p style={{ fontSize: 12, color: 'var(--sand)', margin: 0, fontStyle: 'italic', textAlign: 'center' }}>
                The herd rests easy. Return tomorrow morning.
              </p>
            )}
          </div>

          {/* Milestones */}
          <div style={{ ...cardStyle, gap: 8 }}>
            <h3 style={{ ...cardTitleStyle, fontSize: 15 }}>Days of Care</h3>
            <div style={{ display: 'flex', gap: 8, width: '100%', justifyContent: 'center' }}>
              {MILESTONES.map((m) => {
                const reached = herd.bestStreak >= m.days;
                const current = herd.careStreak >= m.days;
                return (
                  <div key={m.days} style={{
                    flex: 1, maxWidth: 76, textAlign: 'center',
                    padding: '8px 2px',
                    background: current ? 'rgba(232,160,32,.14)' : 'rgba(0,0,0,.2)',
                    border: `1px solid ${reached ? 'var(--gold)' : 'rgba(167,165,156,.3)'}`,
                    borderRadius: 10,
                    opacity: reached ? 1 : 0.65,
                  }}>
                    <div style={{ fontWeight: 900, fontSize: 17, color: reached ? 'var(--gold)' : 'var(--sand)' }}>
                      {m.days}
                    </div>
                    <div style={{ fontSize: 9.5, color: 'var(--cream)', letterSpacing: '0.03em', lineHeight: 1.2 }}>
                      {m.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <PatternStrip opacity={0.18} />
        </div>

        {/* Event toasts */}
        {toasts.length > 0 && (
          <div
            onClick={() => setToasts([])}
            style={{
              position: 'absolute', inset: 0, zIndex: 40,
              background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(2px)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 12, padding: 24, cursor: 'pointer',
            }}
          >
            {toasts.map((e, i) => (
              <div key={i} className="go-title-anim" style={{
                width: 300, background: 'var(--card)',
                border: '1.5px solid var(--gold)', borderRadius: 14,
                padding: '14px 18px', textAlign: 'center',
                boxShadow: '0 0 24px rgba(232,160,32,.25)',
              }}>
                <div style={{ fontSize: 26, lineHeight: 1.1 }}>
                  {e.type === 'calf' ? '🐄' : e.type === 'kraal' ? '🏡' : e.type === 'rare' ? '✨' : e.type === 'bull' ? '🐂' : e.type === 'moment' ? '🌙' : '🌾'}
                </div>
                <p style={{ margin: '6px 0 0', fontSize: 13.5, color: 'var(--cream)', lineHeight: 1.35 }}>{e.text}</p>
                {e.coins > 0 && (
                  <p style={{ margin: '5px 0 0', fontWeight: 900, fontSize: 15, color: 'var(--gold-bright)' }}>
                    +{e.coins} coins
                  </p>
                )}
              </div>
            ))}
            <span style={{ fontSize: 11, color: 'var(--sand)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
              Tap to continue
            </span>
          </div>
        )}
      </div>
    </PhoneFrame>
  );
}

const cardStyle: React.CSSProperties = {
  width: 327, boxSizing: 'border-box',
  background: 'var(--card)', border: '1.5px solid var(--gold)',
  borderRadius: 16, padding: '14px 18px',
  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
  boxShadow: '0 0 18px rgba(232,160,32,.14)',
};

const cardTitleStyle: React.CSSProperties = {
  fontWeight: 900, fontSize: 17, color: 'var(--gold)',
  letterSpacing: '0.08em', textTransform: 'uppercase',
  margin: 0, lineHeight: 1.1, textAlign: 'center',
};
