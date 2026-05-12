import type { ReactNode, ButtonHTMLAttributes } from 'react';
import { AvatarIcon, AVATAR_DEFS } from './AvatarIcons';

/* ============================================================
   Phone frame — wraps every screen, gives the iOS-style chrome
   on desktop and goes full-bleed on mobile.
   ============================================================ */
export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="phone">
      <div className="notch" />
      <StatusBar />
      {children}
    </div>
  );
}

function StatusBar() {
  return (
    <div className="status-bar">
      <span>9:41</span>
      <span className="right">
        <svg width="17" height="11" viewBox="0 0 17 11" fill="currentColor">
          <rect x="0" y="7" width="3" height="4" rx="1"/>
          <rect x="4.5" y="5" width="3" height="6" rx="1"/>
          <rect x="9" y="2.5" width="3" height="8.5" rx="1"/>
          <rect x="13.5" y="0" width="3" height="11" rx="1"/>
        </svg>
        <svg width="15" height="11" viewBox="0 0 15 11" fill="currentColor">
          <path d="M7.5 1C4.5 1 1.9 2.1 0 3.8l1.4 1.4C2.9 3.9 5.1 3 7.5 3s4.6.9 6.1 2.2L15 3.8C13.1 2.1 10.5 1 7.5 1zm0 3.5c-1.9 0-3.6.7-4.9 1.8L4 7.7c1-.8 2.2-1.2 3.5-1.2s2.5.5 3.5 1.2l1.4-1.4c-1.3-1.1-3-1.8-4.9-1.8zm0 3.5c-.9 0-1.7.4-2.3 1l2.3 2 2.3-2c-.6-.6-1.4-1-2.3-1z"/>
        </svg>
        <svg width="27" height="11" viewBox="0 0 27 11" fill="none">
          <rect x="0.5" y="0.5" width="22" height="10" rx="2.5" stroke="currentColor"/>
          <rect x="2" y="2" width="19" height="7" rx="1" fill="currentColor"/>
          <rect x="23.5" y="3.5" width="2" height="4" rx="1" fill="currentColor"/>
        </svg>
      </span>
    </div>
  );
}

/* ============================================================
   Tokens (board piece visuals — small, for UI surfaces)
   ============================================================ */
export function TokenP1({ size = 36 }: { size?: number }) {
  return <span className="player-token dark" style={{ width: size, height: size }} aria-hidden />;
}
export function TokenP2({ size = 36 }: { size?: number }) {
  return <span className="player-token light" style={{ width: size, height: size }} aria-hidden />;
}

/* ============================================================
   Coin icon
   ============================================================ */
export function CoinIcon({ size }: { size?: number }) {
  const style = size ? { width: size, height: size } : undefined;
  return <span className="coin-icon" style={style} aria-hidden />;
}

/* ============================================================
   Tier badge — Free / Bronze / Silver / Gold / Platinum
   ============================================================ */
export function TierBadge({ tier }: { tier: string }) {
  const cls = {
    free: 'tier-free',
    bronze: 'tier-bronze',
    silver: 'tier-silver',
    gold: 'tier-gold',
    platinum: 'tier-platinum',
  }[tier] ?? 'tier-free';
  const label = (tier[0]?.toUpperCase() ?? '') + tier.slice(1);
  return <span className={`tier-badge ${cls}`}>{label}</span>;
}

/* ============================================================
   Buttons
   ============================================================ */
type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode };
export function PrimaryButton({ children, className = '', ...rest }: BtnProps) {
  return <button className={`btn btn-primary ${className}`} {...rest}>{children}</button>;
}
export function SecondaryButton({ children, className = '', ...rest }: BtnProps) {
  return <button className={`btn btn-secondary ${className}`} {...rest}>{children}</button>;
}
export function IconButton({ children, ...rest }: BtnProps) {
  return <button className="icon-btn" {...rest}>{children}</button>;
}
export function BackArrow(props: { onClick?: () => void; label?: string }) {
  return (
    <button className="back-arrow" onClick={props.onClick} aria-label={props.label ?? 'Back'}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
           strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 18 9 12 15 6"/>
      </svg>
    </button>
  );
}

/* ============================================================
   Coin bar (large)
   ============================================================ */
export function CoinBarLarge({
  coins, progressPct = 62, onClick,
}: { coins: number; progressPct?: number; onClick?: () => void }) {
  return (
    <div
      className="coin-bar-large"
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      style={onClick ? { cursor: 'pointer' } : undefined}
    >
      <CoinIcon size={26} />
      <span className="num">{coins.toLocaleString()}</span>
      <span className="progress"><span style={{ width: `${progressPct}%` }} /></span>
    </div>
  );
}

/* ============================================================
   Top bar (used on home / leaderboard / profile / rewards / settings)
   ============================================================ */
export function TopBar({
  back,
  username,
  tier = 'free',
  coins = 0,
}: { back?: () => void; username: string; tier?: string; coins?: number }) {
  return (
    <div className="home-topbar">
      {back ? <BackArrow onClick={back} /> : null}
      <span className="username">{username.startsWith('@') ? username : `@${username}`}</span>
      <TierBadge tier={tier} />
      <span className="topbar-coins">
        <CoinIcon />
        <span>{coins.toLocaleString()}</span>
      </span>
    </div>
  );
}

/* ============================================================
   Pattern strip
   ============================================================ */
export function PatternStrip({ opacity, className = '' }: { opacity?: number; className?: string }) {
  return (
    <div
      className={`pattern-strip ${className}`}
      style={opacity !== undefined ? { opacity } : undefined}
      aria-hidden
    />
  );
}

/* ============================================================
   Avatar picker
   ============================================================ */
export function AvatarPicker({
  value, onChange,
}: { value: number; onChange: (id: number) => void }) {
  return (
    <div className="grid grid-cols-4 gap-x-[6px] gap-y-[10px]" role="radiogroup" aria-label="Avatar">
      {AVATAR_DEFS.map((a) => {
        const selected = value === a.id;
        return (
          <button
            key={a.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(a.id)}
            className="flex flex-col items-center gap-1.5 bg-transparent border-0 p-0 cursor-pointer focus:outline-none"
          >
            <span
              className="avatar-circle"
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'radial-gradient(circle at 35% 30%, #c08049 0%, var(--bronze) 60%, #5e3b22 100%)',
                border: `1.5px solid ${selected ? 'var(--gold)' : 'var(--gold-dark)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: selected ? 'var(--gold-bright)' : 'var(--gold)',
                boxShadow: selected
                  ? 'inset 0 1px 0 rgba(255,255,255,.18), 0 0 0 3px rgba(232,160,32,.95), 0 0 18px 4px rgba(232,160,32,.55), 0 4px 8px rgba(0,0,0,.45)'
                  : 'inset 0 1px 0 rgba(255,255,255,.18), 0 4px 8px rgba(0,0,0,.45)',
                transition: 'box-shadow .15s ease, border-color .15s ease, transform .15s ease',
                position: 'relative',
              }}
            >
              <AvatarIcon id={a.id} size={30} />
              <span
                aria-hidden
                style={{
                  position: 'absolute',
                  top: 8, left: 12,
                  width: 14, height: 8,
                  borderRadius: '50%',
                  background: 'radial-gradient(ellipse at center, rgba(255,255,255,.35) 0%, rgba(255,255,255,0) 70%)',
                  pointerEvents: 'none',
                }}
              />
            </span>
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: selected ? 'var(--gold)' : 'var(--sand)',
                transition: 'color .15s ease',
              }}
            >
              {a.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ============================================================
   Single avatar display (used in profile / leaderboard / game strip)
   ============================================================ */
export function AvatarDisplay({
  id, size = 64,
  initial,
}: { id?: number; size?: number; initial?: string }) {
  const showInitial = !id;
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'radial-gradient(circle at 35% 30%, #6B3E18 0%, #2A1A0E 80%)',
        border: '2px solid var(--gold)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--gold-bright)',
        fontFamily: 'Poppins, sans-serif',
        fontWeight: 900,
        fontSize: size * 0.45,
        boxShadow: size >= 80
          ? '0 0 24px rgba(232,160,32,.3), inset 0 -4px 12px rgba(0,0,0,.4)'
          : 'inset 0 -2px 6px rgba(0,0,0,.4)',
      }}
      aria-hidden
    >
      {showInitial ? (initial ?? '?') : <AvatarIcon id={id!} size={Math.round(size * 0.55)} />}
    </span>
  );
}
