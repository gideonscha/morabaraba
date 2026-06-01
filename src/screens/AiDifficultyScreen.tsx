import { useState } from 'react';
import {
  PhoneFrame, PrimaryButton, PatternStrip, IconButton, CoinIcon,
} from '../components/ui/Primitives';
import { useGameStore } from '../store/gameStore';

interface Props { onBack: () => void; onStart: () => void; }

type Diff = 'easy' | 'medium' | 'hard';

const DIFFICULTIES: { id: Diff; label: string; sub: string; reward: number }[] = [
  { id: 'easy',   label: 'Easy',   sub: 'A young elder, still learning the lines', reward: 5 },
  { id: 'medium', label: 'Medium', sub: 'A seasoned voice of the kraal',           reward: 10 },
  { id: 'hard',   label: 'Hard',   sub: 'The ancients themselves',                 reward: 20 },
];

export function AiDifficultyScreen({ onBack, onStart }: Props) {
  const newGame = useGameStore((s) => s.newGame);
  const [chosen, setChosen] = useState<Diff | null>(null);

  const start = () => {
    if (!chosen) return;
    newGame(`ai_${chosen}` as 'ai_easy' | 'ai_medium' | 'ai_hard', 'p1');
    onStart();
  };

  return (
    <PhoneFrame>
      <div className="screen difficulty"
           style={{ padding: '60px 24px 32px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 40px', alignItems: 'center', marginBottom: 28 }}>
          <IconButton onClick={onBack} aria-label="Back">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 5 L8 12 L15 19" />
            </svg>
          </IconButton>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <h1 style={{
              textAlign: 'center', margin: 0,
              fontWeight: 900, textTransform: 'uppercase',
              color: 'var(--gold)', fontSize: 22, letterSpacing: '0.16em',
              lineHeight: 1.1,
              textShadow: '0 2px 6px rgba(0,0,0,.5)',
            }}>
              Play the Ancestors
            </h1>
            <p style={{
              margin: 0,
              fontFamily: "'Poppins', sans-serif",
              fontStyle: 'italic',
              fontSize: 12,
              color: 'var(--sand)',
              letterSpacing: '0.02em',
              textAlign: 'center',
            }}>
              Challenge the wisdom of generations.
            </p>
          </div>
          <span />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {DIFFICULTIES.map((d) => {
            const selected = chosen === d.id;
            return (
              <button
                key={d.id}
                onClick={() => setChosen(d.id)}
                style={{
                  background: 'var(--card)',
                  border: `1.5px solid ${selected ? 'var(--gold-bright)' : 'var(--gold)'}`,
                  borderRadius: 'var(--radius-card)',
                  padding: 18,
                  color: 'var(--cream)',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  boxShadow: selected
                    ? 'inset 0 0 0 1px rgba(244,181,58,.4), inset 0 0 22px rgba(232,160,32,.25), 0 0 0 2px rgba(232,160,32,.18), 0 0 22px rgba(232,160,32,.4), 0 6px 14px rgba(0,0,0,.35)'
                    : '0 2px 0 rgba(0,0,0,.2), 0 6px 14px rgba(0,0,0,.3)',
                  transition: 'border-color .18s, box-shadow .18s, transform .18s',
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  gridTemplateRows: 'auto auto',
                  columnGap: 16,
                  rowGap: 6,
                  alignItems: 'center',
                }}
              >
                <span style={{
                  fontWeight: 900, textTransform: 'uppercase',
                  letterSpacing: '0.18em', fontSize: 22,
                  color: selected ? 'var(--gold-bright)' : 'var(--gold)',
                  lineHeight: 1,
                  textShadow: selected ? '0 0 12px rgba(232,160,32,.5)' : undefined,
                }}>
                  {d.label}
                </span>
                <span style={{
                  gridColumn: '1 / 2', fontSize: 13,
                  color: 'var(--sand)', fontStyle: 'italic', letterSpacing: '0.01em',
                }}>
                  {d.sub}
                </span>
                <span style={{
                  gridRow: '1 / 3', gridColumn: '2 / 3',
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: 'rgba(0,0,0,.22)',
                  border: '1px solid var(--gold-dark)',
                  borderRadius: 999,
                  padding: '6px 10px',
                  color: 'var(--gold)',
                  fontWeight: 700, fontSize: 13,
                  whiteSpace: 'nowrap',
                }}>
                  <CoinIcon size={16} />
                  {d.reward} per win
                </span>
              </button>
            );
          })}
        </div>

        <div style={{ marginTop: 'auto', paddingTop: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <PatternStrip opacity={0.18} />
          <PrimaryButton onClick={start} disabled={!chosen}>Start Match</PrimaryButton>
        </div>
      </div>
    </PhoneFrame>
  );
}
