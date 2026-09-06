export type Player = 'p1' | 'p2';
export type Phase = 'placing' | 'moving' | 'flying' | 'removing';
export type Cell = Player | null;

export interface GameState {
  board: Cell[];
  phase: Phase;
  previousPhase: Phase;
  currentPlayer: Player;
  piecesToPlace: Record<Player, number>;
  piecesOnBoard: Record<Player, number>;
  capturedBy: Record<Player, number>;
  removalsPending: number;
  selectedNode: number | null;
  validMoves: number[];
  winner: Player | null;
  isDraw: boolean;
  lastMillNodes: number[];
}

export const MILLS: number[][] = [
  [0, 1, 2], [2, 3, 4], [4, 5, 6], [6, 7, 0],
  [8, 9, 10], [10, 11, 12], [12, 13, 14], [14, 15, 8],
  [16, 17, 18], [18, 19, 20], [20, 21, 22], [22, 23, 16],
  [1, 9, 17], [3, 11, 19], [5, 13, 21], [7, 15, 23],
];

export const ADJACENCY: Record<number, number[]> = {
  0: [1, 7], 1: [0, 2, 9], 2: [1, 3], 3: [2, 4, 11],
  4: [3, 5], 5: [4, 6, 13], 6: [5, 7], 7: [6, 0, 15],
  8: [9, 15], 9: [8, 10, 1, 17], 10: [9, 11], 11: [10, 12, 3, 19],
  12: [11, 13], 13: [12, 14, 5, 21], 14: [13, 15], 15: [14, 8, 7, 23],
  16: [17, 23], 17: [16, 18, 9], 18: [17, 19], 19: [18, 20, 11],
  20: [19, 21], 21: [20, 22, 13], 22: [21, 23], 23: [22, 16, 15],
};

export function opponentOf(player: Player): Player {
  return player === 'p1' ? 'p2' : 'p1';
}

export function detectNewMills(
  board: Cell[],
  placedIndex: number,
  player: Player
): number {
  let count = 0;
  for (const mill of MILLS) {
    if (mill.includes(placedIndex)) {
      if (mill.every(i => board[i] === player)) {
        count++;
      }
    }
  }
  return count;
}

export function millsContainingNode(
  board: Cell[],
  placedIndex: number,
  player: Player
): number[][] {
  const result: number[][] = [];
  for (const mill of MILLS) {
    if (mill.includes(placedIndex) && mill.every(i => board[i] === player)) {
      result.push([...mill]);
    }
  }
  return result;
}

export function getValidMoves(
  board: Cell[],
  nodeIndex: number,
  _player: Player,
  phase: Phase
): number[] {
  if (phase === 'flying') {
    return board
      .map((cell, i) => (cell === null ? i : -1))
      .filter(i => i !== -1);
  }
  return ADJACENCY[nodeIndex].filter(i => board[i] === null);
}

export function getRemovableNodes(
  board: Cell[],
  opponent: Player
): number[] {
  const opponentNodes = board
    .map((cell, i) => (cell === opponent ? i : -1))
    .filter(i => i !== -1);

  const unprotected = opponentNodes.filter(
    i => !MILLS.some(mill => mill.includes(i) && mill.every(j => board[j] === opponent))
  );

  return unprotected.length > 0 ? unprotected : opponentNodes;
}

export function hasLegalMoves(
  board: Cell[],
  player: Player,
  phase: Phase
): boolean {
  return getMovablePieces(board, player, phase).length > 0;
}

/**
 * Indices of `player`'s pieces that have at least one legal move. Used
 * to highlight actionable pieces during the moving/flying phases.
 */
export function getMovablePieces(
  board: Cell[],
  player: Player,
  phase: Phase
): number[] {
  const playerNodes = board
    .map((cell, i) => (cell === player ? i : -1))
    .filter(i => i !== -1);

  if (phase === 'flying') {
    return board.some(c => c === null) ? playerNodes : [];
  }
  return playerNodes.filter(
    node => ADJACENCY[node].some(adj => board[adj] === null)
  );
}

export function checkWinConditions(
  board: Cell[],
  piecesOnBoard: Record<Player, number>,
  phase: Phase
): { winner: Player | null; isDraw: boolean } {
  if (piecesOnBoard.p1 <= 2 && phase !== 'placing') {
    return { winner: 'p2', isDraw: false };
  }
  if (piecesOnBoard.p2 <= 2 && phase !== 'placing') {
    return { winner: 'p1', isDraw: false };
  }

  if (phase === 'placing') return { winner: null, isDraw: false };

  const p1CanMove = hasLegalMoves(board, 'p1', phase === 'flying' && piecesOnBoard.p1 === 3 ? 'flying' : phase);
  const p2CanMove = hasLegalMoves(board, 'p2', phase === 'flying' && piecesOnBoard.p2 === 3 ? 'flying' : phase);

  if (!p1CanMove && !p2CanMove) return { winner: null, isDraw: true };
  if (!p1CanMove) return { winner: 'p2', isDraw: false };
  if (!p2CanMove) return { winner: 'p1', isDraw: false };

  return { winner: null, isDraw: false };
}

export function initialState(): GameState {
  return {
    board: Array(24).fill(null),
    phase: 'placing',
    previousPhase: 'placing',
    currentPlayer: 'p1',
    piecesToPlace: { p1: 12, p2: 12 },
    piecesOnBoard: { p1: 0, p2: 0 },
    capturedBy: { p1: 0, p2: 0 },
    removalsPending: 0,
    selectedNode: null,
    validMoves: [],
    winner: null,
    isDraw: false,
    lastMillNodes: [],
  };
}

export function phaseForPlayer(
  state: GameState,
  player: Player
): Phase {
  if (state.piecesToPlace[player] > 0) return 'placing';
  if (state.piecesOnBoard[player] === 3) return 'flying';
  return 'moving';
}

export function applyPlace(state: GameState, nodeIndex: number): GameState {
  if (state.winner || state.isDraw) return state;
  if (state.phase !== 'placing') return state;
  if (state.board[nodeIndex] !== null) return state;
  if (state.piecesToPlace[state.currentPlayer] <= 0) return state;

  const board = [...state.board];
  board[nodeIndex] = state.currentPlayer;

  const piecesToPlace = { ...state.piecesToPlace };
  piecesToPlace[state.currentPlayer] -= 1;
  const piecesOnBoard = { ...state.piecesOnBoard };
  piecesOnBoard[state.currentPlayer] += 1;

  const mills = millsContainingNode(board, nodeIndex, state.currentPlayer);
  const newMillCount = mills.length;
  const lastMillNodes = newMillCount > 0
    ? Array.from(new Set(mills.flat()))
    : [];

  if (newMillCount > 0) {
    return {
      ...state,
      board,
      piecesToPlace,
      piecesOnBoard,
      previousPhase: 'placing',
      phase: 'removing',
      removalsPending: newMillCount,
      lastMillNodes,
      selectedNode: null,
      validMoves: [],
    };
  }

  const next = opponentOf(state.currentPlayer);
  const bothDonePlacing = piecesToPlace.p1 === 0 && piecesToPlace.p2 === 0;
  const nextPhase: Phase = bothDonePlacing
    ? (piecesOnBoard[next] === 3 ? 'flying' : 'moving')
    : 'placing';

  return {
    ...state,
    board,
    piecesToPlace,
    piecesOnBoard,
    phase: nextPhase,
    previousPhase: nextPhase,
    currentPlayer: next,
    selectedNode: null,
    validMoves: [],
    lastMillNodes: [],
  };
}

export function applyRemove(state: GameState, nodeIndex: number): GameState {
  if (state.phase !== 'removing') return state;
  const opponent = opponentOf(state.currentPlayer);
  if (state.board[nodeIndex] !== opponent) return state;
  const removable = getRemovableNodes(state.board, opponent);
  if (!removable.includes(nodeIndex)) return state;

  const board = [...state.board];
  board[nodeIndex] = null;

  const piecesOnBoard = { ...state.piecesOnBoard };
  piecesOnBoard[opponent] -= 1;
  const capturedBy = { ...state.capturedBy };
  capturedBy[state.currentPlayer] += 1;
  const removalsPending = state.removalsPending - 1;

  if (removalsPending > 0) {
    return {
      ...state,
      board,
      piecesOnBoard,
      capturedBy,
      removalsPending,
    };
  }

  // Determine what phase to return to & next player
  const next = opponentOf(state.currentPlayer);
  const previousPhase = state.previousPhase;

  // Check win after removal
  const win = checkWinConditions(board, piecesOnBoard, previousPhase);
  if (win.winner || win.isDraw) {
    return {
      ...state,
      board,
      piecesOnBoard,
      capturedBy,
      removalsPending: 0,
      winner: win.winner,
      isDraw: win.isDraw,
      phase: previousPhase,
      lastMillNodes: state.lastMillNodes,
    };
  }

  // After placing-phase mill, may need to transition to moving if both done
  const bothDonePlacing =
    state.piecesToPlace.p1 === 0 && state.piecesToPlace.p2 === 0;

  let nextPhase: Phase = previousPhase;
  if (previousPhase === 'placing' && bothDonePlacing) {
    nextPhase = piecesOnBoard[next] === 3 ? 'flying' : 'moving';
  } else if (previousPhase === 'moving' || previousPhase === 'flying') {
    nextPhase = piecesOnBoard[next] === 3 ? 'flying' : 'moving';
  }

  return {
    ...state,
    board,
    piecesOnBoard,
    capturedBy,
    removalsPending: 0,
    phase: nextPhase,
    previousPhase: nextPhase,
    currentPlayer: next,
    selectedNode: null,
    validMoves: [],
    lastMillNodes: [],
  };
}

export function applySelect(state: GameState, nodeIndex: number): GameState {
  if (state.phase !== 'moving' && state.phase !== 'flying') return state;
  if (state.board[nodeIndex] !== state.currentPlayer) return state;
  const moves = getValidMoves(state.board, nodeIndex, state.currentPlayer, state.phase);
  return {
    ...state,
    selectedNode: nodeIndex,
    validMoves: moves,
  };
}

export function applyMove(state: GameState, toIndex: number): GameState {
  if (state.phase !== 'moving' && state.phase !== 'flying') return state;
  if (state.selectedNode === null) return state;
  if (!state.validMoves.includes(toIndex)) return state;

  const from = state.selectedNode;
  const board = [...state.board];
  board[toIndex] = state.currentPlayer;
  board[from] = null;

  const mills = millsContainingNode(board, toIndex, state.currentPlayer);
  const newMillCount = mills.length;

  if (newMillCount > 0) {
    return {
      ...state,
      board,
      previousPhase: state.phase,
      phase: 'removing',
      removalsPending: newMillCount,
      lastMillNodes: Array.from(new Set(mills.flat())),
      selectedNode: null,
      validMoves: [],
    };
  }

  const next = opponentOf(state.currentPlayer);
  const nextPhase: Phase = state.piecesOnBoard[next] === 3 ? 'flying' : 'moving';

  const win = checkWinConditions(board, state.piecesOnBoard, nextPhase);
  return {
    ...state,
    board,
    phase: nextPhase,
    previousPhase: nextPhase,
    currentPlayer: next,
    selectedNode: null,
    validMoves: [],
    lastMillNodes: [],
    winner: win.winner,
    isDraw: win.isDraw,
  };
}
