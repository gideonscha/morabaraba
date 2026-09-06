import { useEffect, useId, useRef, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { NODE_POSITIONS, VIEW_SIZE } from '../lib/boardLayout';
import { getRemovableNodes, getMovablePieces, MILLS, type Player } from '../lib/gameEngine';

interface Ghost { key: string; index: number; cell: Player; ts: number }

interface BoardProps {
  interactive?: boolean;
}

export function Board({ interactive = true }: BoardProps) {
  const state = useGameStore();
  const tapNode = useGameStore((s) => s.tapNode);
  const id = useId().replace(/[:]/g, '');

  // Track recently-captured tokens so we can render a fading "ghost" at
  // their position for ~250ms after they've been cleared from the board.
  // A capture is a filled→empty transition with NO matching empty→filled
  // elsewhere in the same tick — that disambiguates captures from slides,
  // which also clear the source cell (but fill the destination).
  const prevBoardRef = useRef(state.board);
  const [ghosts, setGhosts] = useState<Ghost[]>([]);
  useEffect(() => {
    const prev = prevBoardRef.current;
    const next = state.board;
    let placed = 0;
    let cleared = 0;
    const clearedAt: { index: number; cell: Player }[] = [];
    for (let i = 0; i < next.length; i++) {
      if (!prev[i] && next[i]) placed++;
      else if (prev[i] && !next[i]) {
        cleared++;
        clearedAt.push({ index: i, cell: prev[i]! });
      }
    }
    prevBoardRef.current = next;

    // Slide: one cell emptied, one cell filled → not a capture, no ghost.
    // Capture: cells emptied without compensating placements.
    const isSlide = placed === cleared && placed > 0;
    if (isSlide || clearedAt.length === 0) return;

    const fresh: Ghost[] = clearedAt.map(({ index, cell }) => ({
      key: `${index}-${Date.now()}-${Math.random()}`,
      index,
      cell,
      ts: Date.now(),
    }));
    setGhosts((g) => [...g, ...fresh]);
    const ids = new Set(fresh.map((g) => g.key));
    setTimeout(() => setGhosts((g) => g.filter((x) => !ids.has(x.key))), 280);
  }, [state.board]);

  const removable =
    state.phase === 'removing'
      ? getRemovableNodes(state.board, state.currentPlayer === 'p1' ? 'p2' : 'p1')
      : [];

  // Find the mill line currently glowing (lastMillNodes contains all nodes; pick a
  // 3-node line from MILLS that matches).
  const activeMill = MILLS.find(
    (m) => state.lastMillNodes.length > 0 && m.every((i) => state.lastMillNodes.includes(i))
  );

  const handleTap = (i: number) => {
    if (!interactive) return;
    if (state.showHandoff) return;
    tapNode(i);
  };

  // Which pieces to halo: only on a human's turn in the moving/flying
  // phases, before a piece has been selected.
  const humansTurn = state.mode === 'local' || state.currentPlayer === state.humanPlayer;
  const showMovable =
    interactive && humansTurn && !state.showHandoff && !state.aiThinking &&
    state.selectedNode === null && (state.phase === 'moving' || state.phase === 'flying');
  const movable = showMovable ? getMovablePieces(state.board, state.currentPlayer, state.phase) : [];

  return (
    <div className="w-full flex justify-center">
      <svg
        className="game-board"
        viewBox={`0 0 ${VIEW_SIZE} ${VIEW_SIZE}`}
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Morabaraba board"
      >
        <defs>
          <radialGradient id={`wood-${id}`} cx="50%" cy="45%" r="70%">
            <stop offset="0%" stopColor="#C9913A" />
            <stop offset="100%" stopColor="#A0722A" />
          </radialGradient>
          <pattern id={`chev-${id}`} width="16" height="8" patternUnits="userSpaceOnUse">
            <path d="M0 6.4 L4 1.6 L8 6.4 L12 1.6 L16 6.4"
                  stroke="#5C3A1E" strokeWidth="1.4" fill="none" strokeLinejoin="miter" />
          </pattern>

          {/* Onyx (P1) sphere — full opacity stops so wood never bleeds through */}
          <radialGradient id={`tok-p1-${id}`} cx="35%" cy="30%" r="75%">
            <stop offset="0%"   stopColor="#3a3a3a" stopOpacity="1"/>
            <stop offset="60%"  stopColor="#1a1a1a" stopOpacity="1"/>
            <stop offset="100%" stopColor="#000000" stopOpacity="1"/>
          </radialGradient>

          {/* Bone/cream (P2) sphere — full opacity, no warm tones */}
          <radialGradient id={`tok-p2-${id}`} cx="35%" cy="30%" r="75%">
            <stop offset="0%"   stopColor="#ffffff" stopOpacity="1"/>
            <stop offset="60%"  stopColor="#f5f0e8" stopOpacity="1"/>
            <stop offset="100%" stopColor="#d8d0c0" stopOpacity="1"/>
          </radialGradient>

          {/* Specular highlight (same gradient for both — white at 30% opacity at the
              top-left, fading out by 25% of the radius) */}
          <radialGradient id={`tok-spec-${id}`} cx="35%" cy="28%" r="22%">
            <stop offset="0%"   stopColor="#ffffff" stopOpacity="0.30"/>
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0"/>
          </radialGradient>

          {/* Soft drop shadow for tokens */}
          <filter id={`tok-shadow-${id}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="1.5"/>
          </filter>
        </defs>

        {/* Wood fill */}
        <rect x="0" y="0" width={VIEW_SIZE} height={VIEW_SIZE} rx="6" fill={`url(#wood-${id})`} />

        {/* Decorative chevron border ring */}
        <path
          d={`M0 0 H${VIEW_SIZE} V${VIEW_SIZE} H0 Z M16 16 V${VIEW_SIZE - 16} H${VIEW_SIZE - 16} V16 Z`}
          fill={`url(#chev-${id})`}
          fillOpacity="0.2"
          fillRule="evenodd"
        />
        <rect x="0.75" y="0.75" width={VIEW_SIZE - 1.5} height={VIEW_SIZE - 1.5} rx="5.5"
              fill="none" stroke="#5C3A1E" strokeOpacity="0.5" strokeWidth="1.5" />
        <rect x="15.5" y="15.5" width={VIEW_SIZE - 31} height={VIEW_SIZE - 31} rx="3"
              fill="none" stroke="#5C3A1E" strokeOpacity="0.5" strokeWidth="1" />

        {/* Three concentric squares + midpoint connectors. NO diagonals. */}
        <g stroke="#5C3A1E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none">
          <rect x="32" y="32" width="263" height="263" />
          <rect x="76" y="76" width="175" height="175" />
          <rect x="120" y="120" width="87" height="87" />
          <line x1="163.5" y1="32"  x2="163.5" y2="120" />
          <line x1="163.5" y1="207" x2="163.5" y2="295" />
          <line x1="32"    y1="163.5" x2="120"  y2="163.5" />
          <line x1="207"   y1="163.5" x2="295"  y2="163.5" />
        </g>

        {/* Node sockets */}
        <g fill="#5C3A1E">
          {NODE_POSITIONS.map((p, i) => (
            <circle key={`hole-${i}`} cx={p.x} cy={p.y} r="6" />
          ))}
        </g>

        {/* Active mill line */}
        {activeMill && (() => {
          const a = NODE_POSITIONS[activeMill[0]];
          const b = NODE_POSITIONS[activeMill[2]];
          return (
            <g>
              <line className="mill-line" x1={a.x} y1={a.y} x2={b.x} y2={b.y} />
              <circle className="mill-endcap" cx={a.x} cy={a.y} r="3.5" />
              <circle className="mill-endcap" cx={b.x} cy={b.y} r="3.5" />
            </g>
          );
        })()}

        {/* Live tokens — 3D spheres. Each fresh token gets a drop-in
            animation; tokens that are part of an active mill pulse. */}
        <g>
          {state.board.map((cell, i) => {
            if (!cell) return null;
            const p = NODE_POSITIONS[i];
            const isP1 = cell === 'p1';
            const inMill = state.lastMillNodes.includes(i);
            return (
              <g
                key={`tok-${i}-${cell}`}
                className="token-drop"
                style={{ transformBox: 'fill-box', transformOrigin: `${p.x}px ${p.y}px` }}
              >
                <ellipse
                  cx={p.x} cy={p.y + 12}
                  rx="11" ry="3"
                  fill="#000"
                  opacity="0.7"
                  filter={`url(#tok-shadow-${id})`}
                />
                <circle
                  cx={p.x} cy={p.y} r="14"
                  fill={`url(#tok-${isP1 ? 'p1' : 'p2'}-${id})`}
                  stroke={isP1 ? '#000000' : '#9a8f78'}
                  strokeWidth="0.6"
                  className={inMill ? 'token-mill' : undefined}
                />
                <circle
                  cx={p.x} cy={p.y} r="14"
                  fill={`url(#tok-spec-${id})`}
                  pointerEvents="none"
                />
              </g>
            );
          })}
        </g>

        {/* Capture-out ghosts — fade and shrink at the position they just
            vacated. Auto-cleared after the animation finishes. */}
        <g>
          {ghosts.map((g) => {
            const p = NODE_POSITIONS[g.index];
            const isP1 = g.cell === 'p1';
            return (
              <g
                key={g.key}
                className="token-capture"
                style={{ transformBox: 'fill-box', transformOrigin: `${p.x}px ${p.y}px` }}
              >
                <circle
                  cx={p.x} cy={p.y} r="14"
                  fill={`url(#tok-${isP1 ? 'p1' : 'p2'}-${id})`}
                  stroke={isP1 ? '#000000' : '#9a8f78'}
                  strokeWidth="0.6"
                  pointerEvents="none"
                />
                <circle
                  cx={p.x} cy={p.y} r="14"
                  fill={`url(#tok-spec-${id})`}
                  pointerEvents="none"
                />
              </g>
            );
          })}
        </g>

        {/* Movable-piece halos — every piece the player can legally move,
            shown until they pick one. */}
        <g>
          {movable.map((i) => {
            const p = NODE_POSITIONS[i];
            return <circle key={`mv-${i}`} className="movable-ring" cx={p.x} cy={p.y} r="18" />;
          })}
        </g>

        {/* Selection ring */}
        {state.selectedNode !== null && (() => {
          const p = NODE_POSITIONS[state.selectedNode];
          return <circle className="selection-ring" cx={p.x} cy={p.y} r="18" />;
        })()}

        {/* Valid-move pulses */}
        <g>
          {state.validMoves.map((i, idx) => {
            const p = NODE_POSITIONS[i];
            return (
              <circle
                key={`vm-${i}`}
                className="pulse"
                cx={p.x} cy={p.y} r="6"
                fill="#E8A020"
                fillOpacity="0.5"
                style={{ animationDelay: `-${(idx * 0.15).toFixed(2)}s` }}
              />
            );
          })}
        </g>

        {/* Removable opponent pieces (mill state) */}
        <g>
          {removable.map((i) => {
            const p = NODE_POSITIONS[i];
            return <circle key={`rm-${i}`} className="removable-ring" cx={p.x} cy={p.y} r="18" />;
          })}
        </g>

        {/* Tap targets — last so they receive clicks */}
        <g>
          {NODE_POSITIONS.map((p, i) => (
            <circle
              key={`tap-${i}`}
              className="node-tap"
              cx={p.x} cy={p.y} r="22"
              onClick={() => handleTap(i)}
              role="button"
              aria-label={`Node ${i}`}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}
