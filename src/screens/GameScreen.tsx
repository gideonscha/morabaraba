import { useEffect, useMemo, useState } from 'react';
import { audio } from '../lib/audio';
import { Board } from '../components/Board';
import { useGameStore } from '../store/gameStore';
import { useProfileStore } from '../store/profileStore';
import {
  PhoneFrame, TokenP1, TokenP2, TierBadge,
  PrimaryButton, SecondaryButton, CoinIcon,
} from '../components/ui/Primitives';
import { useAiOpponent } from '../hooks/useAiOpponent';
import { useGameAudio } from '../hooks/useGameAudio';
import { coinReward } from '../lib/profile';
import { tweenNumber } from '../lib/animations';

interface GameScreenProps { onExit: () => void; }

export function GameScreen({ onExit }: GameScreenProps) {
  const state = useGameStore();
  const profile = useProfileStore((s) => s.profile);
  const addCoins = useProfileStore((s) => s.addCoins);
  const recordWin = useProfileStore((s) => s.recordWin);
  const recordLoss = useProfileStore((s) => s.recordLoss);
  const dismissHandoff = useGameStore((s) => s.dismissHandoff);
  const newGame = useGameStore((s) => s.newGame);

  useAiOpponent();
  useGameAudio();

  const [phaseToast, setPhaseToast] = useState<string | null>(null);
  const lastPhaseRef = useMemo(() => ({ current: state.phase }), []); // never resets across re-renders

  // Show a 1.5s phase-transition overlay on placing→moving and moving→flying
  useEffect(() => {
    const prev = lastPhaseRef.current;
    if (prev !== state.phase) {
      if ((prev === 'placing' && state.phase === 'moving') ||
          (prev === 'moving' && state.phase === 'flying')) {
        setPhaseToast(state.phase === 'flying' ? 'Flying' : 'Moving');
        const t = setTimeout(() => setPhaseToast(null), 1500);
        lastPhaseRef.current = state.phase;
        return () => clearTimeout(t);
      }
      lastPhaseRef.current = state.phase;
    }
  }, [state.phase, lastPhaseRef]);

  // Award coins once at game completion
  const [awarded, setAwarded] = useState(false);
  useEffect(() => {
    if (!state.winner && !state.isDraw) return;
    if (awarded) return;
    if (!profile) { setAwarded(true); return; }

    const humanWon = state.winner === state.humanPlayer;
    const isLocalOrAi = state.mode === 'local' || state.mode.startsWith('ai_');

    if (humanWon && isLocalOrAi) {
      let reward = coinReward(state.mode);
      if (profile.streak + 1 >= 3) reward += 5;
      addCoins(reward);
      recordWin();
    } else if (!state.isDraw && state.mode.startsWith('ai_')) {
      recordLoss();
    }
    setAwarded(true);
  }, [state.winner, state.isDraw, awarded, profile, addCoins, recordWin, recordLoss, state.mode, state.humanPlayer]);

  const phaseLabel = state.phase === 'removing' ? 'Remove 1 Piece'
    : state.phase === 'placing' ? 'Placing'
    : state.phase === 'flying'  ? 'Flying'
    : 'Moving';

  const isMill = state.phase === 'removing';

  const opponentName = state.mode === 'local' ? 'Player 2' : state.mode.startsWith('ai_') ? 'AI' : '@opponent';

  const prompt = useMemo(() => {
    if (state.winner || state.isDraw) return '';
    if (state.phase === 'removing') return ['MILL', 'Remove an opponent piece'];
    if (state.phase === 'placing') {
      return state.mode === 'local'
        ? `${state.currentPlayer === 'p1' ? 'Player 1' : 'Player 2'} — tap to place`
        : state.currentPlayer === state.humanPlayer ? 'Place your piece' : 'Opponent is thinking…';
    }
    if (state.selectedNode === null) {
      return state.currentPlayer === state.humanPlayer || state.mode === 'local'
        ? 'Select a piece to move'
        : 'Opponent is thinking…';
    }
    return state.phase === 'flying'
      ? 'Choose any empty point to fly to'
      : 'Tap a highlighted spot to move';
  }, [state.phase, state.selectedNode, state.currentPlayer, state.humanPlayer, state.mode, state.winner, state.isDraw]);

  return (
    <PhoneFrame>
      <div className="screen game" style={{ flex: 1, padding: 0, position: 'relative' }}>
        {/* Player strip */}
        {(() => {
          // Compute the "thinking" side. AI mode: the AI is thinking whenever
          // aiThinking is true. Online: the opponent is thinking whenever we're
          // waiting for their turn to land. Local 2P: never (handoff handles it).
          const aiOpp: 'p1' | 'p2' = state.humanPlayer === 'p1' ? 'p2' : 'p1';
          const isAi = state.mode.startsWith('ai_');
          const isOnline = state.mode === 'online';
          const isLocal = state.mode === 'local';
          const gameLive = !state.winner && !state.isDraw && !state.showHandoff;
          const thinkingSide: 'p1' | 'p2' | null =
            isAi && state.aiThinking && gameLive ? aiOpp
            : isOnline && gameLive && state.currentPlayer !== state.humanPlayer ? state.currentPlayer
            : null;
          const showActive = (side: 'p1' | 'p2') =>
            !isLocal && state.currentPlayer === side && thinkingSide !== side;
          const showThinking = (side: 'p1' | 'p2') => thinkingSide === side;

          return (
            <div className="game-strip">
              <div className={`game-side left ${state.currentPlayer === 'p1' ? '' : 'inactive'}`}>
                {showActive('p1') && <span className="active-arrow" />}
                {showThinking('p1') && <ThinkingDots />}
                <TokenP1 size={36} />
                <PlayerMeta
                  name={profile?.username ?? '@you'}
                  tier={profile?.tier ?? 'free'}
                  phase={state.phase}
                  piecesOnBoard={state.piecesOnBoard.p1}
                  piecesToPlace={state.piecesToPlace.p1}
                  captured={state.capturedBy.p1}
                  isFlying={state.piecesOnBoard.p1 === 3 && state.phase !== 'placing'}
                  who="p1"
                  thinking={showThinking('p1')}
                />
              </div>
              <div className="vsep" aria-hidden />
              <div className={`game-side right ${state.currentPlayer === 'p2' ? '' : 'inactive'}`}>
                {showActive('p2') && <span className="active-arrow" />}
                {showThinking('p2') && <ThinkingDots />}
                <TokenP2 size={36} />
                <PlayerMeta
                  name={opponentName}
                  tier="bronze"
                  phase={state.phase}
                  piecesOnBoard={state.piecesOnBoard.p2}
                  piecesToPlace={state.piecesToPlace.p2}
                  captured={state.capturedBy.p2}
                  isFlying={state.piecesOnBoard.p2 === 3 && state.phase !== 'placing'}
                  who="p2"
                  thinking={showThinking('p2')}
                />
              </div>
            </div>
          );
        })()}

        {/* Phase pill */}
        <div style={{ display: 'flex', justifyContent: 'center', margin: '12px 0 10px' }}>
          <span className={`game-phase ${isMill ? 'removing' : state.phase}`}>{phaseLabel}</span>
        </div>

        {/* Board */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '0 24px', flex: 1, alignItems: 'center' }}>
          <Board interactive={!state.winner && !state.isDraw} />
        </div>

        {/* Action prompt */}
        <div className={`action-prompt ${isMill ? 'mill' : ''}`}>
          {Array.isArray(prompt) ? (
            <span><span className="em">{prompt[0]}</span>— {prompt[1]}</span>
          ) : prompt}
        </div>

        {/* Top-left back button (over phone frame chrome) */}
        <button
          onClick={onExit}
          aria-label="Exit"
          style={{
            position: 'absolute', top: 50, left: 12, zIndex: 30,
            background: 'rgba(0,0,0,.35)', border: '1px solid var(--gold-dark)',
            borderRadius: 10, width: 36, height: 36,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--gold)', cursor: 'pointer', padding: 0,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 5 L8 12 L15 19" />
          </svg>
        </button>

        {/* Pass-and-play handoff overlay */}
        {state.showHandoff && (
          <div
            onClick={dismissHandoff}
            style={{
              position: 'absolute', inset: 0, zIndex: 60,
              background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(4px)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              padding: 32, textAlign: 'center', cursor: 'pointer',
            }}
          >
            <div style={{ fontWeight: 900, letterSpacing: '0.12em', fontSize: 18, color: 'var(--gold)', textTransform: 'uppercase' }}>
              Hand the phone to
            </div>
            <div style={{ fontWeight: 900, fontSize: 48, color: 'var(--cream)', margin: '8px 0 18px', letterSpacing: '0.08em' }}>
              {state.currentPlayer === 'p1' ? 'Player 1' : 'Player 2'}
            </div>
            {state.currentPlayer === 'p1' ? <TokenP1 size={80} /> : <TokenP2 size={80} />}
            <p style={{ color: 'var(--sand)', marginTop: 16, fontSize: 14 }}>Tap anywhere to continue</p>
          </div>
        )}

        {/* Phase transition overlay */}
        {phaseToast && (
          <div className="phase-transition">
            <span className="pt-label">Phase change</span>
            <span className="pt-name">{phaseToast}</span>
          </div>
        )}

        {/* Game over */}
        {(state.winner || state.isDraw) && (
          <GameOverOverlay
            winner={state.winner}
            isDraw={state.isDraw}
            humanPlayer={state.humanPlayer}
            mode={state.mode}
            coins={profile?.coins ?? 0}
            onReplay={() => { setAwarded(false); newGame(state.mode, state.humanPlayer); }}
            onHome={onExit}
          />
        )}
      </div>
    </PhoneFrame>
  );
}

function ThinkingDots() {
  return (
    <span
      aria-label="Thinking"
      style={{
        position: 'absolute',
        top: 4,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'inline-flex',
        gap: 4,
        pointerEvents: 'none',
        filter: 'drop-shadow(0 0 6px rgba(232,160,32,.5))',
      }}
    >
      <i className="think-dot think-d1" />
      <i className="think-dot think-d2" />
      <i className="think-dot think-d3" />
      <style>{`
        .think-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #E8A020;
          display: inline-block;
          opacity: 0;
          animation-duration: 1800ms;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
        }
        .think-d1 { animation-name: think-d1; }
        .think-d2 { animation-name: think-d2; }
        .think-d3 { animation-name: think-d3; }
        /* Each dot fades in 200ms after the previous one; all three fade
           out together at 1200–1400ms, then a 400ms rest before the next
           cycle. (200/1800 ≈ 11%, 400/1800 ≈ 22%, etc.) */
        @keyframes think-d1 {
          0%, 100% { opacity: 0; }
          11%, 67% { opacity: 1; }
          78%      { opacity: 0; }
        }
        @keyframes think-d2 {
          0%, 11%, 100% { opacity: 0; }
          22%, 67%      { opacity: 1; }
          78%           { opacity: 0; }
        }
        @keyframes think-d3 {
          0%, 22%, 100% { opacity: 0; }
          33%, 67%      { opacity: 1; }
          78%           { opacity: 0; }
        }
      `}</style>
    </span>
  );
}

interface PlayerMetaProps {
  name: string;
  tier: string;
  phase: string;
  piecesOnBoard: number;
  piecesToPlace: number;
  captured: number;
  isFlying: boolean;
  who: 'p1' | 'p2';
  thinking?: boolean;
}
function PlayerMeta({ name, tier, phase, piecesOnBoard, piecesToPlace, captured, isFlying, who, thinking }: PlayerMetaProps) {
  const handle = name.startsWith('@') || name.includes(' ') ? name : `@${name.toLowerCase().replace(/\s+/g, '_')}`;
  return (
    <div className="player-meta">
      <div className="name-row">
        <span className="username">{handle}</span>
        <TierBadge tier={tier} />
        {isFlying && <span className="flying-badge">Flying</span>}
      </div>
      {thinking ? (
        <span style={{
          fontFamily: 'Poppins, sans-serif',
          fontStyle: 'italic',
          fontSize: 11,
          color: '#D4A96A',
          letterSpacing: '0.02em',
        }}>
          thinking…
        </span>
      ) : (
        <span className={`onboard ${isFlying ? 'flying-red' : ''}`}>
          {phase === 'placing' ? `To place: ${piecesToPlace}` : `On board: ${piecesOnBoard}`}
        </span>
      )}
      {phase === 'placing' && piecesToPlace > 0 && (
        <div className="hand-pips" aria-hidden>
          {Array.from({ length: Math.min(piecesToPlace, 12) }).map((_, i) => (
            <span key={i} className={`hand-pip ${who === 'p1' ? 'dark' : 'light'}`} />
          ))}
        </div>
      )}
      {phase !== 'placing' && captured > 0 && (
        <div className="captured" aria-hidden>
          {Array.from({ length: captured }).map((_, i) => (
            <span key={i} className={`pip ${who === 'p1' ? 'light' : 'dark'}`} />
          ))}
        </div>
      )}
    </div>
  );
}

interface GameOverProps {
  winner: 'p1' | 'p2' | null;
  isDraw: boolean;
  humanPlayer: 'p1' | 'p2';
  mode: string;
  coins: number;
  onReplay: () => void;
  onHome: () => void;
}
function GameOverOverlay({ winner, isDraw, humanPlayer, mode, coins, onReplay, onHome }: GameOverProps) {
  const isWin = !isDraw && winner === humanPlayer;
  const isLose = !isDraw && winner && winner !== humanPlayer;

  const variant = isDraw ? 'draw' : isWin ? 'win' : 'lose';
  const reward = isWin && (mode === 'local' || mode.startsWith('ai_')) ? coinReward(mode as 'ai_easy' | 'ai_medium' | 'ai_hard' | 'local' | 'online') : 0;

  const title = isDraw ? 'Honourable Draw' : isWin ? 'Victory' : 'Defeat';
  const tagline = isDraw ? 'A balanced battle'
    : isWin ? 'Well played, warrior' : 'Better luck next time, warrior';

  const titleStyle: React.CSSProperties = isWin
    ? { fontSize: 48, color: 'var(--gold)', textShadow: '0 0 22px rgba(232,160,32,.65), 0 4px 8px rgba(0,0,0,.5)' }
    : isLose
    ? { fontSize: 48, color: '#C8C8C8', textShadow: '0 0 16px rgba(220,220,220,.3), 0 4px 8px rgba(0,0,0,.5)' }
    : { fontSize: 36, color: 'var(--sand)', textShadow: '0 4px 8px rgba(0,0,0,.5)' };

  return (
    <div
      className="screen gameover"
      data-state={variant}
      style={{
        position: 'absolute', inset: 0, zIndex: 70,
        background: 'linear-gradient(180deg, var(--bg-top) 0%, var(--bg-bot) 100%)',
      }}
    >
      {isWin && <ConfettiLayer />}
      <div style={{
        position: 'relative', zIndex: 2,
        width: '100%', height: '100%',
        padding: '88px 24px 24px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14,
      }}>
        <h1 className="h-display go-title-anim" style={{ ...titleStyle, margin: 0 }}>{title}</h1>
        <p
          className="fade-up-tag"
          style={{ fontStyle: 'italic', fontSize: 16, color: 'var(--cream)', margin: '12px 0 0', textAlign: 'center' }}
        >
          {tagline}
        </p>

        {reward > 0 && <CoinAward reward={reward} balance={coins + reward} />}

        <div
          className="fade-up-cta"
          style={{ width: 327, display: 'flex', flexDirection: 'column', gap: 12, marginTop: 24 }}
        >
          <PrimaryButton onClick={onReplay}>Play Again</PrimaryButton>
          <SecondaryButton onClick={onHome}>Home</SecondaryButton>
        </div>
      </div>
    </div>
  );
}

function ConfettiLayer() {
  const palette = ['#E8A020', '#F4B53A', '#FFD466', '#F5EFE4'];
  const pieces = Array.from({ length: 70 }, (_, i) => ({
    left: `${Math.random() * 100}%`,
    bg: palette[i % palette.length],
    dur: (2.0 + Math.random() * 1.8).toFixed(2),
    delay: (-Math.random() * 3).toFixed(2),
    w: (5 + Math.random() * 5).toFixed(1),
    h: (8 + Math.random() * 8).toFixed(1),
    opacity: (0.65 + Math.random() * 0.35).toFixed(2),
  }));
  return (
    <div className="confetti" aria-hidden>
      {pieces.map((p, i) => (
        <i
          key={i}
          style={{
            left: p.left, background: p.bg,
            animationDuration: `${p.dur}s`,
            animationDelay: `${p.delay}s`,
            width: `${p.w}px`, height: `${p.h}px`,
            opacity: Number(p.opacity),
          }}
        />
      ))}
    </div>
  );
}

function CoinAward({ reward, balance }: { reward: number; balance: number }) {
  const [count, setCount] = useState(0);
  const [bal, setBal] = useState(balance - reward);
  const [spin, setSpin] = useState(false);

  useEffect(() => {
    // Slide-in delay before counting (matches the motion.div delay below)
    const startDelay = setTimeout(() => {
      audio.playSound('coin');
      setSpin(true);
      const cleanupCount = tweenNumber(0, reward, 1000, setCount);
      const cleanupBal   = tweenNumber(balance - reward, balance, 1000, setBal);
      const stopSpin = setTimeout(() => setSpin(false), 420);
      return () => { cleanupCount(); cleanupBal(); clearTimeout(stopSpin); };
    }, 600);
    return () => clearTimeout(startDelay);
  }, [reward, balance]);

  return (
    <div
      className="fade-up-award"
      style={{
        width: 327, marginTop: 28,
        background: 'var(--card)', border: '1.5px solid var(--gold)',
        borderRadius: 16, padding: '12px 18px',
        display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4,
        boxShadow: '0 0 24px rgba(232,160,32,.18), 0 8px 16px rgba(0,0,0,.3)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontWeight: 900, fontSize: 22, color: 'var(--gold-bright)', letterSpacing: '0.04em' }}>
        <span className={`coin-icon-md ${spin ? 'coin-spin' : ''}`} />
        <span>+{count} coins</span>
      </div>
      <div style={{ fontSize: 14, color: 'var(--sand)' }}>
        New balance: <span>{bal.toLocaleString()}</span>
      </div>
    </div>
  );
}
