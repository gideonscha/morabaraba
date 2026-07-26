import { useEffect, useState } from 'react';
import { useProfileStore } from '../store/profileStore';
import { getDraws, demoEntries, formatRand, countdownLabel } from '../lib/prizes';
import { audio } from '../lib/audio';

/**
 * Compact live-status banner for the Grand Kraal Prize, shown at the top
 * of primary screens. Tapping opens the Kraal Prize Centre.
 */
export function KraalPrizeBanner({ onOpen }: { onOpen: () => void }) {
  const profile = useProfileStore((s) => s.profile);
  // Re-render each minute so the countdown label stays fresh.
  const [, tick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 60_000);
    return () => clearInterval(t);
  }, []);

  const grand = getDraws().find((d) => d.kind === 'grand')!;
  const entries = demoEntries(profile, 'grand');

  return (
    <button
      onClick={() => { audio.init(); audio.playSound('button'); onOpen(); }}
      className="btn-press"
      style={{
        width: 327, maxWidth: '100%', boxSizing: 'border-box',
        display: 'flex', alignItems: 'center', gap: 10,
        background: 'linear-gradient(90deg, rgba(232,160,32,.16) 0%, rgba(0,0,0,.3) 60%)',
        border: '1.5px solid var(--gold)',
        borderRadius: 14, padding: '8px 12px',
        cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
        boxShadow: '0 0 16px rgba(232,160,32,.18), 0 3px 8px rgba(0,0,0,.3)',
      }}
    >
      <span style={{ fontSize: 26, lineHeight: 1, filter: 'drop-shadow(0 0 6px rgba(232,160,32,.6))' }}>
        {grand.icon}
      </span>
      <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <span style={{
          fontSize: 9.5, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase',
          color: 'var(--sand)',
        }}>
          Grand Kraal Prize
        </span>
        <span style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 900, fontSize: 19, color: 'var(--gold-bright)', lineHeight: 1 }}>
            {formatRand(grand.valueRand)}
          </span>
          <span style={{ fontSize: 11, color: 'var(--cream)', whiteSpace: 'nowrap' }}>
            🎟️ {entries} entries
          </span>
          <span style={{ fontSize: 11, color: 'var(--cream)', whiteSpace: 'nowrap' }}>
            ⏰ {countdownLabel(grand.closesAt)}
          </span>
        </span>
        <span style={{
          fontSize: 10, fontStyle: 'italic', color: 'var(--gold)', letterSpacing: '0.03em',
        }}>
          Collect gold coins. Stand to win.
        </span>
      </span>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gold)"
           strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 5 L16 12 L9 19" />
      </svg>
    </button>
  );
}
