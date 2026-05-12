import { useId } from 'react';
import { useGameStore } from '../store/gameStore';
import { NODE_POSITIONS, VIEW_SIZE } from '../lib/boardLayout';
import { getRemovableNodes, MILLS } from '../lib/gameEngine';

interface BoardProps {
  interactive?: boolean;
}

export function Board({ interactive = true }: BoardProps) {
  const state = useGameStore();
  const tapNode = useGameStore((s) => s.tapNode);
  const id = useId().replace(/[:]/g, '');

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

        {/* Tokens */}
        <g>
          {state.board.map((cell, i) => {
            if (!cell) return null;
            const p = NODE_POSITIONS[i];
            const isP1 = cell === 'p1';
            return (
              <circle
                key={`tok-${i}`}
                cx={p.x} cy={p.y} r="14"
                fill={isP1 ? '#0F0F0F' : '#FAFAFA'}
                stroke={isP1 ? '#050505' : '#888888'}
                strokeWidth="0.8"
              />
            );
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
