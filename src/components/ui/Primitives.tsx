import type { ReactNode, ButtonHTMLAttributes } from 'react';

export function TokenP1({ size = 32, animated = false }: { size?: number; animated?: boolean }) {
  return (
    <span
      className={`inline-block rounded-full token-p1 ${animated ? 'animate-token-place' : ''}`}
      style={{ width: size, height: size }}
      aria-label="Player 1 token"
    />
  );
}

export function TokenP2({ size = 32, animated = false }: { size?: number; animated?: boolean }) {
  return (
    <span
      className={`inline-block rounded-full token-p2 ${animated ? 'animate-token-place' : ''}`}
      style={{ width: size, height: size }}
      aria-label="Player 2 token"
    />
  );
}

export function PhasePill({ children, tone = 'gold' }: { children: ReactNode; tone?: 'gold' | 'red' | 'silver' }) {
  const toneClass =
    tone === 'red' ? 'border-red-400 text-red-200' :
    tone === 'silver' ? 'border-silver text-silver-light' :
    'border-gold text-gold';
  return <span className={`phase-pill ${toneClass}`}>{children}</span>;
}

export function CoinBar({ coins }: { coins: number }) {
  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/35 border border-gold/50">
      <span className="w-4 h-4 rounded-full bg-gradient-to-br from-yellow-200 to-amber-600 inline-block shadow-inner" />
      <span className="text-cream font-semibold text-sm tabular-nums">{coins.toLocaleString()}</span>
    </div>
  );
}

export function TierBadge({ tier }: { tier: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    free: { label: 'Free', cls: 'border-cream/40 text-cream/80' },
    silver: { label: 'Silver', cls: 'border-silver text-silver-light' },
    gold: { label: 'Gold', cls: 'border-gold text-gold' },
    platinum: { label: 'Platinum', cls: 'border-platinum text-platinum' },
  };
  const t = map[tier] ?? map.free;
  return (
    <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${t.cls}`}>
      {t.label}
    </span>
  );
}

export function PrimaryButton({ children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return (
    <button className="btn-primary w-full text-base" {...rest}>
      {children}
    </button>
  );
}

export function SecondaryButton({ children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return (
    <button className="btn-secondary w-full text-base" {...rest}>
      {children}
    </button>
  );
}

export function ActionPrompt({ children }: { children: ReactNode }) {
  return (
    <div className="text-center text-cream/95 text-sm font-medium px-4 py-2">
      {children}
    </div>
  );
}

export function Avatar({ id, size = 56 }: { id: number; size?: number }) {
  const palettes = [
    'from-amber-400 to-orange-700',
    'from-rose-400 to-rose-800',
    'from-emerald-400 to-emerald-800',
    'from-sky-400 to-sky-800',
    'from-fuchsia-400 to-fuchsia-800',
    'from-yellow-300 to-amber-700',
    'from-cyan-400 to-cyan-800',
    'from-violet-400 to-violet-800',
  ];
  const idx = Math.max(0, Math.min(7, id - 1));
  return (
    <div
      className={`bg-gradient-to-br ${palettes[idx]} rounded-full border-2 border-gold/70 flex items-center justify-center text-cream font-bold display-font`}
      style={{ width: size, height: size, fontSize: size * 0.45 }}
      aria-label={`Avatar ${id}`}
    >
      {String.fromCharCode(64 + id)}
    </div>
  );
}

export function AvatarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (id: number) => void;
}) {
  return (
    <div className="grid grid-cols-4 gap-3">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((id) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={`p-1 rounded-full transition ${value === id ? 'ring-2 ring-gold scale-105' : 'opacity-80'}`}
          aria-pressed={value === id}
        >
          <Avatar id={id} size={56} />
        </button>
      ))}
    </div>
  );
}

export function ScreenHeader({ title, onBack }: { title: string; onBack?: () => void }) {
  return (
    <header className="flex items-center justify-between px-4 py-3">
      {onBack ? (
        <button onClick={onBack} className="text-cream/90 text-2xl px-2 py-1" aria-label="Back">
          ‹
        </button>
      ) : <span className="w-8" />}
      <h1 className="display-font text-xl text-gold">{title}</h1>
      <span className="w-8" />
    </header>
  );
}
