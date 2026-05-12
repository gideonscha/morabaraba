import { useEffect } from 'react';
import { Board } from '../components/Board';
import { useGameStore } from '../store/gameStore';
import { useProfileStore } from '../store/profileStore';
import {
  PhasePill,
  TokenP1,
  TokenP2,
  Avatar,
  CoinBar,
  PrimaryButton,
  SecondaryButton,
} from '../components/ui/Primitives';
import { useAiOpponent } from '../hooks/useAiOpponent';
import { coinReward } from '../lib/profile';

interface GameScreenProps {
  onExit: () => void;
}

export function GameScreen({ onExit }: GameScreenProps) {
  const state = useGameStore();
  const profile = useProfileStore((s) => s.profile);
  const addCoins = useProfileStore((s) => s.addCoins);
  const recordWin = useProfileStore((s) => s.recordWin);
  const recordLoss = useProfileStore((s) => s.recordLoss);
  const dismissHandoff = useGameStore((s) => s.dismissHandoff);
  const newGame = useGameStore((s) => s.newGame);

  useAiOpponent();

  // Award coins exactly once when the game completes
  useEffect(() => {
    if (!state.winner && !state.isDraw) return;
    if (!profile) return;

    const gameOver = state.winner || state.isDraw;
    if (!gameOver) return;

    const humanWon = state.winner === state.humanPlayer;
    const isLocalOrAi = state.mode === 'local' || state.mode.startsWith('ai_');

    if (humanWon && isLocalOrAi) {
      let reward = coinReward(state.mode);
      if (state.mode.startsWith('ai_')) reward = Math.round(reward); // already correct
      if (profile.streak + 1 >= 3) reward += 5;
      addCoins(reward);
      recordWin();
    } else if (!state.isDraw && state.mode.startsWith('ai_')) {
      recordLoss();
    } else if (!state.isDraw && state.mode === 'local') {
      // No streak penalty for losing local pass-and-play
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.winner, state.isDraw]);

  const phaseLabel: Record<string, string> = {
    placing: 'Placing',
    moving: 'Moving',
    flying: 'Flying',
    removing: 'Capture!',
  };

  const prompt = state.winner
    ? state.winner === state.humanPlayer || state.mode === 'local'
      ? `${state.winner === 'p1' ? 'Player 1' : 'Player 2'} wins!`
      : 'You lost — better luck next time!'
    : state.isDraw
    ? "It's a draw!"
    : state.phase === 'removing'
    ? `Take an opponent's piece (${state.removalsPending} left)`
    : state.phase === 'placing'
    ? state.mode === 'local'
      ? `${state.currentPlayer === 'p1' ? 'Player 1' : 'Player 2'} — tap a node to place`
      : state.currentPlayer === state.humanPlayer
      ? 'Tap a node to place your token'
      : 'Opponent is thinking…'
    : state.selectedNode === null
    ? state.currentPlayer === state.humanPlayer || state.mode === 'local'
      ? 'Select a token to move'
      : 'Opponent is thinking…'
    : 'Tap a highlighted spot to move';

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 pt-4 pb-2">
        <button onClick={onExit} className="text-cream/90 text-2xl px-2 py-1" aria-label="Back">‹</button>
        <PhasePill>{phaseLabel[state.phase]}</PhasePill>
        {profile ? <CoinBar coins={profile.coins} /> : <span />}
      </header>

      {/* Player headers + capture trays */}
      <div className="px-4 mt-1 grid grid-cols-2 gap-3">
        <PlayerCard
          name={state.mode === 'local' ? 'Player 1' : profile?.username ?? 'You'}
          isActive={state.currentPlayer === 'p1'}
          token="p1"
          captured={state.capturedBy.p1}
          onBoard={state.piecesOnBoard.p1}
          inHand={state.piecesToPlace.p1}
        />
        <PlayerCard
          name={state.mode === 'local' ? 'Player 2' : state.mode.startsWith('ai_') ? 'AI' : 'Opponent'}
          isActive={state.currentPlayer === 'p2'}
          token="p2"
          captured={state.capturedBy.p2}
          onBoard={state.piecesOnBoard.p2}
          inHand={state.piecesToPlace.p2}
        />
      </div>

      <div className="flex-1 flex flex-col justify-center">
        <Board interactive={!state.winner && !state.isDraw} />
      </div>

      <div className="px-4 pb-6">
        <div className="card px-4 py-3 text-center">
          <p className="text-cream/95 text-sm font-medium">{prompt}</p>
        </div>
      </div>

      {/* Pass-and-play handoff */}
      {state.showHandoff && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center" onClick={dismissHandoff}>
          <div className="display-font text-3xl text-gold mb-3">Hand the phone to</div>
          <div className="display-font text-5xl text-cream mb-6">
            {state.currentPlayer === 'p1' ? 'Player 1' : 'Player 2'}
          </div>
          <div className="mb-6">
            {state.currentPlayer === 'p1' ? <TokenP1 size={80} /> : <TokenP2 size={80} />}
          </div>
          <p className="text-cream/80 mb-6">Tap anywhere to continue</p>
        </div>
      )}

      {/* Game over */}
      {(state.winner || state.isDraw) && (
        <div className="fixed inset-0 z-40 bg-black/85 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="card p-6 w-full max-w-sm text-center">
            <div className="display-font text-3xl text-gold mb-2">
              {state.isDraw ? 'Draw' : state.winner === state.humanPlayer || state.mode === 'local' ? 'Victory' : 'Defeat'}
            </div>
            <p className="text-cream/90 mb-4">
              {state.isDraw
                ? 'Mutual blockade — no winner.'
                : state.winner === 'p1' ? 'Player 1 wins!' : 'Player 2 wins!'}
            </p>
            {!state.isDraw && state.winner === state.humanPlayer && (state.mode === 'local' || state.mode.startsWith('ai_')) && (
              <p className="text-gold text-sm mb-4">+{coinReward(state.mode)}{profile && profile.streak >= 3 ? ' + 5 streak' : ''} coins awarded</p>
            )}
            <div className="space-y-2">
              <PrimaryButton onClick={() => newGame(state.mode, state.humanPlayer)}>Play again</PrimaryButton>
              <SecondaryButton onClick={onExit}>Home</SecondaryButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface PlayerCardProps {
  name: string;
  isActive: boolean;
  token: 'p1' | 'p2';
  captured: number;
  onBoard: number;
  inHand: number;
}
function PlayerCard({ name, isActive, token, captured, onBoard, inHand }: PlayerCardProps) {
  return (
    <div className={`card px-3 py-2 ${isActive ? 'ring-2 ring-gold' : 'opacity-80'}`}>
      <div className="flex items-center gap-2">
        <Avatar id={token === 'p1' ? 1 : 4} size={36} />
        <div className="flex-1 min-w-0">
          <div className="truncate text-cream text-sm font-semibold">{name}</div>
          <div className="flex items-center gap-2 text-[10px] text-cream/70">
            <span>{onBoard} on board</span>
            <span>{inHand} in hand</span>
          </div>
        </div>
        {token === 'p1' ? <TokenP1 size={20} /> : <TokenP2 size={20} />}
      </div>
      <div className="mt-1.5 flex items-center gap-1 min-h-[14px]">
        {Array.from({ length: captured }).map((_, i) => (
          <span
            key={i}
            className={`inline-block w-2.5 h-2.5 rounded-full ${token === 'p1' ? 'token-p2' : 'token-p1'}`}
            aria-hidden
          />
        ))}
      </div>
    </div>
  );
}
