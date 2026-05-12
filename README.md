# Morabaraba

A complete, playable Morabaraba (a.k.a. Nine Men's Morris, 12-piece edition) Progressive Web App.

- **Engine**: Pure TypeScript, framework-free, with full unit-test coverage (`src/lib/gameEngine.ts`)
- **AI**: Easy (random), Medium (greedy), Hard (minimax + alpha-beta)
- **Modes**: vs AI · Local pass-and-play · Online PvP (Supabase Realtime)
- **Auth**: Anonymous (Supabase Auth)
- **Stack**: Vite + React 18 + TypeScript + Zustand + Tailwind + Supabase + Vitest + vite-plugin-pwa

## Quick start

```bash
npm install
cp .env.local.example .env.local        # fill in Supabase keys (optional for AI/local play)
npm run test                            # 15 engine unit tests, must pass
npm run dev                             # http://localhost:5173
npm run build                           # production build
```

The app runs fully offline for AI and local 2-player modes. Online play needs Supabase credentials.

## Project layout

| Path | Purpose |
|---|---|
| `src/lib/gameEngine.ts` | Pure-TS rules engine (board, mills, phases, win conditions) |
| `src/lib/gameEngine.test.ts` | Unit tests — run before any UI work |
| `src/lib/ai.ts` | Easy / Medium / Hard AI opponents |
| `src/lib/boardLayout.ts` | 24-node geometry (no diagonals) |
| `src/lib/online.ts` | Supabase room + state-sync helpers |
| `src/lib/supabase.ts` | Supabase client (no-op when env vars missing) |
| `src/lib/profile.ts` | Profile + coin RPC helpers |
| `src/store/gameStore.ts` | Zustand store driving the engine |
| `src/store/profileStore.ts` | Local profile, persisted to `localStorage` |
| `src/hooks/useAiOpponent.ts` | Auto-plays AI when it's the AI's turn |
| `src/hooks/useOnlineSync.ts` | Subscribes to + pushes `game_states` rows |
| `src/components/Board.tsx` | The interactive SVG board |
| `src/components/ui/Primitives.tsx` | TokenP1, TokenP2, PhasePill, CoinBar, TierBadge, etc. |
| `src/screens/*.tsx` | 14 screens (splash, onboarding, home, AI, game, leaderboard, profile, rewards, settings, tutorial, online menu, matchmaking) |
| `supabase/migrations/0001_init.sql` | Phase 1 + Phase 2 schema, RLS, `award_coins` RPC |

## Supabase setup

Apply `supabase/migrations/0001_init.sql` to your project (via the Supabase MCP `apply_migration` tool or the CLI). Enable **anonymous sign-in** under Auth → Providers. Then add to `.env.local`:

```
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-publishable-key>
```

Coin awards happen via the `award_coins` security-definer RPC — never via direct client writes. Every earn writes to `coin_transactions` for audit.

## Rules implemented

- 24 nodes in 3 concentric squares, midpoint connectors only (no diagonals)
- 12 pieces per player to place, then move, then fly when reduced to 3
- Mills (3-in-a-row on a square edge or connector) award a capture
- Cannot capture from an opponent mill unless all their pieces are in mills
- Lose at 2 pieces, on blockade (no moves), or draw on mutual blockade

## Design source

The Claude Design handoff bundle for this project was unreachable at build time
(`https://api.anthropic.com/v1/design/h/ZYHbg899tigGnioxc0WPCQ` → 404). The UI in
this repo follows the fallback design tokens and screen specs documented in the
build brief: Sand, Gold, Charcoal, Cream palette; Hunters/Poppins typography;
three concentric squares with midpoint connectors only.

If the handoff bundle becomes available, drop its Tailwind config and component
library into `tailwind.config.ts` and `src/components/ui/` to replace the
fallback implementation.
