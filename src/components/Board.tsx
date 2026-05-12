import { useGameStore } from '../store/gameStore';
import { NODE_POSITIONS, EDGES, VIEW_SIZE } from '../lib/boardLayout';
import { getRemovableNodes } from '../lib/gameEngine';

interface BoardProps {
  interactive?: boolean;
}

export function Board({ interactive = true }: BoardProps) {
  const state = useGameStore();
  const tapNode = useGameStore((s) => s.tapNode);

  const removable =
    state.phase === 'removing'
      ? getRemovableNodes(state.board, state.currentPlayer === 'p1' ? 'p2' : 'p1')
      : [];

  const handleTap = (i: number) => {
    if (!interactive) return;
    if (state.showHandoff) return;
    tapNode(i);
  };

  return (
    <div className="w-full max-w-[420px] mx-auto aspect-square p-2">
      <svg viewBox={`0 0 ${VIEW_SIZE} ${VIEW_SIZE}`} className="w-full h-full">
        <defs>
          <radialGradient id="boardBg" cx="50%" cy="50%" r="65%">
            <stop offset="0%" stopColor="#9C4A1F" />
            <stop offset="100%" stopColor="#5C1F08" />
          </radialGradient>
          <radialGradient id="p1Token" cx="30%" cy="30%">
            <stop offset="0%" stopColor="#F5D89A" />
            <stop offset="45%" stopColor="#E8A020" />
            <stop offset="100%" stopColor="#8B5E12" />
          </radialGradient>
          <radialGradient id="p2Token" cx="30%" cy="30%">
            <stop offset="0%" stopColor="#6E6E6E" />
            <stop offset="50%" stopColor="#2C2C2A" />
            <stop offset="100%" stopColor="#0A0A09" />
          </radialGradient>
        </defs>

        <rect x="0" y="0" width={VIEW_SIZE} height={VIEW_SIZE} fill="url(#boardBg)" rx="24" />

        {/* Wood-tone inner board */}
        <rect x="20" y="20" width={VIEW_SIZE - 40} height={VIEW_SIZE - 40} fill="#8B3A14" stroke="#E8A020" strokeWidth="3" rx="16" opacity="0.9" />

        {/* Lines */}
        <g stroke="#E8A020" strokeWidth="3" strokeLinecap="round">
          {EDGES.map(([a, b], idx) => {
            const pa = NODE_POSITIONS[a];
            const pb = NODE_POSITIONS[b];
            return <line key={idx} x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y} />;
          })}
        </g>

        {/* Mill highlight */}
        {state.lastMillNodes.length > 0 && (
          <g>
            {state.lastMillNodes.map((i) => {
              const p = NODE_POSITIONS[i];
              return (
                <circle
                  key={`mill-${i}`}
                  cx={p.x}
                  cy={p.y}
                  r={30}
                  fill="none"
                  stroke="#E8A020"
                  strokeWidth="3"
                  opacity="0.85"
                  className="animate-mill-pulse"
                />
              );
            })}
          </g>
        )}

        {/* Nodes */}
        {NODE_POSITIONS.map((p, i) => {
          const cell = state.board[i];
          const isValidTarget = state.validMoves.includes(i);
          const isSelected = state.selectedNode === i;
          const isRemovable = removable.includes(i);
          return (
            <g
              key={`node-${i}`}
              onClick={() => handleTap(i)}
              style={{ cursor: interactive ? 'pointer' : 'default' }}
              role="button"
              aria-label={`Node ${i}`}
            >
              {/* hit target */}
              <circle cx={p.x} cy={p.y} r={36} fill="transparent" />
              {/* node ring */}
              <circle
                cx={p.x}
                cy={p.y}
                r={14}
                fill={cell === null ? '#2C2C2A' : 'transparent'}
                stroke="#E8A020"
                strokeWidth="2"
                opacity={cell === null ? 0.85 : 0}
              />
              {/* valid move highlight */}
              {isValidTarget && (
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={22}
                  fill="none"
                  stroke="#F5D89A"
                  strokeWidth="3"
                  opacity="0.9"
                >
                  <animate attributeName="r" values="18;26;18" dur="1.2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.9;0.3;0.9" dur="1.2s" repeatCount="indefinite" />
                </circle>
              )}
              {/* token */}
              {cell && (
                <g>
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={26}
                    fill={cell === 'p1' ? 'url(#p1Token)' : 'url(#p2Token)'}
                    stroke={isSelected ? '#F5D89A' : 'rgba(0,0,0,0.4)'}
                    strokeWidth={isSelected ? 4 : 1.5}
                  />
                  {isRemovable && state.phase === 'removing' && (
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={32}
                      fill="none"
                      stroke="#FF6B4A"
                      strokeWidth="3"
                      strokeDasharray="6 4"
                    >
                      <animateTransform attributeName="transform" type="rotate" from={`0 ${p.x} ${p.y}`} to={`360 ${p.x} ${p.y}`} dur="6s" repeatCount="indefinite" />
                    </circle>
                  )}
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
