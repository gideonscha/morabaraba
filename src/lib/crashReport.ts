/**
 * Crash telemetry. When the ErrorBoundary catches a render error we send
 * the message, React component stack, JS stack, URL, user agent, build
 * commit and a little game context to the client_errors table (insert-only
 * for players, readable by admins). Fire-and-forget; never throws.
 */
import { supabase, SUPABASE_ENABLED } from './supabase';
import { useGameStore } from '../store/gameStore';
import { useProfileStore } from '../store/profileStore';

declare const __APP_COMMIT__: string;

export function reportClientError(error: Error, componentStack: string | null): void {
  if (!SUPABASE_ENABLED || !supabase) return;
  try {
    const g = useGameStore.getState();
    const profile = useProfileStore.getState().profile;
    const context = {
      route_path: typeof location !== 'undefined' ? location.pathname : null,
      mode: g.mode,
      phase: g.phase,
      current_player: g.currentPlayer,
      human_player: g.humanPlayer,
      pieces_on_board: g.piecesOnBoard,
      pieces_to_place: g.piecesToPlace,
      selected_node: g.selectedNode,
      removals_pending: g.removalsPending,
      ai_thinking: g.aiThinking,
      winner: g.winner,
      is_draw: g.isDraw,
      board: g.board,
    };
    void supabase.from('client_errors').insert({
      message: String(error?.message ?? error).slice(0, 2000),
      component_stack: componentStack?.slice(0, 8000) ?? null,
      error_stack: (error?.stack ?? '').slice(0, 8000) || null,
      url: typeof location !== 'undefined' ? location.href.slice(0, 500) : null,
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 300) : null,
      profile_id: profile?.id ?? null,
      app_commit: typeof __APP_COMMIT__ === 'string' ? __APP_COMMIT__ : null,
      context,
    }).then(({ error: e }) => { if (e) console.warn('crash report failed:', e.message); });
  } catch { /* never let telemetry throw */ }
}
