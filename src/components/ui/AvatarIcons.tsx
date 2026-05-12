import type { ReactNode } from 'react';

export const AVATAR_DEFS: { id: number; key: string; label: string }[] = [
  { id: 1, key: 'warrior',  label: 'Warrior' },
  { id: 2, key: 'elder',    label: 'Elder' },
  { id: 3, key: 'huntress', label: 'Huntress' },
  { id: 4, key: 'chief',    label: 'Chief' },
  { id: 5, key: 'scout',    label: 'Scout' },
  { id: 6, key: 'healer',   label: 'Healer' },
  { id: 7, key: 'merchant', label: 'Merchant' },
  { id: 8, key: 'nomad',    label: 'Nomad' },
];

interface IconProps { size?: number }

function S({ children, size = 30 }: { children: ReactNode; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

export function WarriorIcon(p: IconProps) {
  return (
    <S size={p.size}>
      <path d="M16 5 L24 8 V16 C24 21 20 25 16 27 C12 25 8 21 8 16 V8 Z"/>
      <line x1="6" y1="6" x2="26" y2="26"/>
      <line x1="26" y1="6" x2="6" y2="26"/>
    </S>
  );
}
export function ElderIcon(p: IconProps) {
  return (
    <S size={p.size}>
      <circle cx="22" cy="9" r="4"/>
      <path d="M22 3 V5 M22 13 V15 M28 9 H26 M18 9 H16" strokeWidth="1.4"/>
      <line x1="12" y1="6" x2="12" y2="28"/>
      <path d="M9 28 H15"/>
    </S>
  );
}
export function HuntressIcon(p: IconProps) {
  return (
    <S size={p.size}>
      <path d="M9 6 C18 10 18 22 9 26"/>
      <line x1="9" y1="6" x2="9" y2="26" strokeDasharray="2 2"/>
      <line x1="6" y1="16" x2="26" y2="16"/>
      <path d="M22 13 L26 16 L22 19"/>
    </S>
  );
}
export function ChiefIcon(p: IconProps) {
  return (
    <S size={p.size}>
      <path d="M5 22 L9 8 L13 18 L16 6 L19 18 L23 8 L27 22 Z"/>
      <line x1="5" y1="26" x2="27" y2="26"/>
    </S>
  );
}
export function ScoutIcon(p: IconProps) {
  return (
    <S size={p.size}>
      <path d="M3 16 C8 9 14 6 16 6 C18 6 24 9 29 16 C24 23 18 26 16 26 C14 26 8 23 3 16 Z"/>
      <circle cx="16" cy="16" r="4" fill="currentColor" stroke="none"/>
    </S>
  );
}
export function HealerIcon(p: IconProps) {
  return (
    <S size={p.size}>
      <path d="M7 25 C7 14 14 7 25 7 C25 18 18 25 7 25 Z"/>
      <line x1="7" y1="25" x2="22" y2="10"/>
    </S>
  );
}
export function MerchantIcon(p: IconProps) {
  return (
    <S size={p.size}>
      <ellipse cx="16" cy="10" rx="9" ry="3"/>
      <path d="M7 10 V14 C7 16 11 17 16 17 C21 17 25 16 25 14 V10"/>
      <path d="M7 16 V20 C7 22 11 23 16 23 C21 23 25 22 25 20 V16"/>
      <path d="M7 22 V26 C7 28 11 29 16 29 C21 29 25 28 25 26 V22"/>
    </S>
  );
}
export function NomadIcon(p: IconProps) {
  return (
    <S size={p.size}>
      <circle cx="22" cy="10" r="3.5"/>
      <path d="M3 22 C7 18 10 22 14 20 C18 18 22 22 29 19"/>
      <path d="M3 27 C8 23 14 27 19 24 C23 22 26 25 29 24"/>
    </S>
  );
}

export function AvatarIcon({ id, size = 30 }: { id: number; size?: number }) {
  const map: Record<number, (p: IconProps) => ReactNode> = {
    1: WarriorIcon, 2: ElderIcon, 3: HuntressIcon, 4: ChiefIcon,
    5: ScoutIcon, 6: HealerIcon, 7: MerchantIcon, 8: NomadIcon,
  };
  const Cmp = map[id] ?? WarriorIcon;
  return <>{Cmp({ size })}</>;
}
