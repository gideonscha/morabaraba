import { useId } from 'react';

// The decorative brand logo — three nested squares with midpoint connectors
// AND ornamental diagonals. This is logo art only; the game board has no
// diagonals (see Board.tsx).
export function MorabarabaLogoMark({ size = 168 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 168 168" fill="none"
         stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <rect x="14" y="14" width="140" height="140"/>
      <rect x="42" y="42" width="84" height="84"/>
      <rect x="70" y="70" width="28" height="28"/>
      <line x1="84" y1="14" x2="84" y2="70"/>
      <line x1="84" y1="98" x2="84" y2="154"/>
      <line x1="14" y1="84" x2="70" y2="84"/>
      <line x1="98" y1="84" x2="154" y2="84"/>
      {/* decorative diagonals */}
      <line x1="14" y1="14" x2="70" y2="70"/>
      <line x1="154" y1="14" x2="98" y2="70"/>
      <line x1="14" y1="154" x2="70" y2="98"/>
      <line x1="154" y1="154" x2="98" y2="98"/>
      <g fill="currentColor" stroke="none">
        <circle cx="14" cy="14" r="4"/><circle cx="84" cy="14" r="4"/><circle cx="154" cy="14" r="4"/>
        <circle cx="42" cy="42" r="4"/><circle cx="84" cy="42" r="4"/><circle cx="126" cy="42" r="4"/>
        <circle cx="70" cy="70" r="4"/><circle cx="84" cy="70" r="4"/><circle cx="98" cy="70" r="4"/>
        <circle cx="14" cy="84" r="4"/><circle cx="42" cy="84" r="4"/><circle cx="70" cy="84" r="4"/>
        <circle cx="98" cy="84" r="4"/><circle cx="126" cy="84" r="4"/><circle cx="154" cy="84" r="4"/>
        <circle cx="70" cy="98" r="4"/><circle cx="84" cy="98" r="4"/><circle cx="98" cy="98" r="4"/>
        <circle cx="42" cy="126" r="4"/><circle cx="84" cy="126" r="4"/><circle cx="126" cy="126" r="4"/>
        <circle cx="14" cy="154" r="4"/><circle cx="84" cy="154" r="4"/><circle cx="154" cy="154" r="4"/>
      </g>
    </svg>
  );
}

// Circular wood disc with the logo mark on it. Used for splash + home.
export function MorabarabaDisc({
  size = 280,
  markSize,
  pulse = false,
}: { size?: number; markSize?: number; pulse?: boolean }) {
  const id = useId();
  const inner = markSize ?? Math.round(size * 0.6);
  return (
    <div
      className={pulse ? 'logo-disc-pulse' : ''}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background:
          'radial-gradient(circle at 50% 45%, rgba(232,160,32,.18) 0%, transparent 60%),' +
          'radial-gradient(circle at 50% 50%, var(--wood-1) 0%, var(--wood-2) 100%)',
        border: `${size >= 200 ? 2.5 : 2}px solid var(--gold)`,
        boxShadow:
          `inset 0 0 0 ${size >= 200 ? 6 : 4}px rgba(0,0,0,.18),` +
          `inset 0 0 0 ${size >= 200 ? 8 : 6}px rgba(232,160,32,.5),` +
          `0 0 ${size >= 200 ? 60 : 32}px rgba(232,160,32,${size >= 200 ? .35 : .25}),` +
          `0 ${size >= 200 ? 20 : 10}px ${size >= 200 ? 40 : 20}px rgba(0,0,0,${size >= 200 ? .5 : .4})`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        color: 'var(--gold)',
      }}
      aria-hidden
      data-logo={id}
    >
      <MorabarabaLogoMark size={inner} />
    </div>
  );
}
