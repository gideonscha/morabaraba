/**
 * Brand / white-label configuration.
 *
 * One codebase, several branded instances. The brand is fixed at BUILD
 * time via VITE_BRAND (set per Vercel project):
 *
 *   legends   — "Morabaraba: Legends of the Kraal" (Telkom / VS Gaming),
 *               the original heritage look. Default.
 *   kraalboss — "Morabaraba: Kraal Boss" (MTN), black + Kraal Yellow,
 *               urban/esports direction (Jacqui, 23 Oct 2026).
 *
 * Visual theming lives in CSS under `:root[data-brand="…"]` (index.css);
 * this module carries everything that is not a colour: names, copy,
 * logo, manifest values. Game rules, economy and backend are shared.
 */

export type BrandId = 'legends' | 'kraalboss';

export interface Brand {
  id: BrandId;
  /** Full product name, e.g. for <title> and the PWA manifest. */
  name: string;
  shortName: string;
  /** Operator / channel this instance is built for (informational). */
  operator: string;
  logo: string;
  logoWidthSplash: number;
  logoWidthHome: number;
  favicon: string;
  themeColor: string;
  backgroundColor: string;
  splashTagline: string;
  onboarding: { title: string; subtitle: string; placeholder: string; cta: string };
  modes: {
    ai: { name: string; tagline: string };
    local: { name: string; tagline: string };
    online: { name: string; tagline: string };
  };
  leaderboardTitle: string;
  /** Crown the #1 row and use "Boss" language for winners. */
  crownLanguage: boolean;
  gameOver: {
    winTitle: string; winTagline: string;
    loseTitle: string; loseTagline: string;
    drawTitle: string; drawTagline: string;
  };
  confetti: string[];
}

const LEGENDS: Brand = {
  id: 'legends',
  name: 'Morabaraba: Legends of the Kraal',
  shortName: 'Morabaraba',
  operator: 'Telkom',
  logo: '/logo-morabaraba.png',
  logoWidthSplash: 300,
  logoWidthHome: 230,
  favicon: '/favicon.svg',
  themeColor: '#7A2E0E',
  backgroundColor: '#5C1F08',
  splashTagline: 'The Ancient Game of Africa',
  onboarding: {
    title: 'Welcome Warrior',
    subtitle: 'Choose your name and avatar',
    placeholder: 'Enter your warrior name',
    cta: 'Begin Your Journey',
  },
  modes: {
    ai: { name: 'Play the Ancestors', tagline: 'Challenge the wisdom of generations.' },
    local: { name: 'Kasi Clash', tagline: 'Two players. One phone. One winner.' },
    online: { name: 'King of the Kraal', tagline: 'Take on players across Mzansi.' },
  },
  leaderboardTitle: 'Leaderboard',
  crownLanguage: false,
  gameOver: {
    winTitle: 'Victory', winTagline: 'Well played, warrior',
    loseTitle: 'Defeat', loseTagline: 'Better luck next time, warrior',
    drawTitle: 'Honourable Draw', drawTagline: 'A balanced battle',
  },
  confetti: ['#E8A020', '#F4B53A', '#FFD466', '#F5EFE4'],
};

const KRAALBOSS: Brand = {
  id: 'kraalboss',
  name: 'Morabaraba: Kraal Boss',
  shortName: 'Kraal Boss',
  operator: 'MTN',
  logo: '/logo-kraalboss.png',
  logoWidthSplash: 320,
  logoWidthHome: 250,
  favicon: '/favicon-kraalboss.svg',
  themeColor: '#080808',
  backgroundColor: '#080808',
  splashTagline: 'Own the board. Become the Boss.',
  onboarding: {
    title: 'Claim Your Name',
    subtitle: 'Pick a name and avatar — then own the board',
    placeholder: 'Enter your boss name',
    cta: 'Enter the Kraal',
  },
  modes: {
    ai: { name: 'Play the Ancestors', tagline: 'Take on the ancients. Prove yourself.' },
    local: { name: 'Kasi Clash', tagline: 'Two players. One phone. One winner.' },
    online: { name: 'King of the Kraal', tagline: 'Take on players across Mzansi.' },
  },
  leaderboardTitle: 'Boss Board',
  crownLanguage: true,
  gameOver: {
    winTitle: "You're the Boss", winTagline: 'You own the board.',
    loseTitle: 'Dethroned', loseTagline: 'The board belongs to someone else — for now.',
    drawTitle: 'Standoff', drawTagline: 'Nobody owns the board today.',
  },
  confetti: ['#FFD400', '#FFEA00', '#F5A800', '#FFFFFF'],
};

const BRANDS: Record<BrandId, Brand> = { legends: LEGENDS, kraalboss: KRAALBOSS };

function resolve(): Brand {
  const raw = (import.meta.env.VITE_BRAND as string | undefined)?.trim().toLowerCase();
  if (raw && raw in BRANDS) return BRANDS[raw as BrandId];
  return LEGENDS;
}

export const BRAND: Brand = resolve();

/** Apply the non-CSS parts of the brand to the document. Call once at boot. */
export function applyBrandToDocument(): void {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.brand = BRAND.id;
  document.title = BRAND.name;
  const theme = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (theme) theme.content = BRAND.themeColor;
  const icon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (icon) icon.href = BRAND.favicon;
}
