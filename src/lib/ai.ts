import {
  applyPlace,
  applyMove,
  applySelect,
  applyRemove,
  getRemovableNodes,
  getValidMoves,
  detectNewMills,
  MILLS,
  ADJACENCY,
  opponentOf,
  type GameState,
  type Player,
  type Cell,
} from './gameEngine';

export type Difficulty = 'easy' | 'medium' | 'hard';

const MIDPOINT_NODES = new Set([1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23]);

interface PlaceAction { type: 'place'; index: number }
interface MoveAction { type: 'move'; from: number; to: number }
interface RemoveAction { type: 'remove'; index: number }
type Action = PlaceAction | MoveAction | RemoveAction;

function listEmpty(board: Cell[]): number[] {
  return board.map((c, i) => (c === null ? i : -1)).filter(i => i !== -1);
}

function listPlayerNodes(board: Cell[], player: Player): number[] {
  return board.map((c, i) => (c === player ? i : -1)).filter(i => i !== -1);
}

function enumerateActions(state: GameState): Action[] {
  if (state.phase === 'removing') {
    return getRemovableNodes(state.board, opponentOf(state.currentPlayer)).map(
      (index) => ({ type: 'remove', index } as RemoveAction)
    );
  }
  if (state.phase === 'placing') {
    return listEmpty(state.board).map((index) => ({ type: 'place', index } as PlaceAction));
  }
  // moving / flying
  const actions: MoveAction[] = [];
  for (const from of listPlayerNodes(state.board, state.currentPlayer)) {
    const moves = getValidMoves(state.board, from, state.currentPlayer, state.phase);
    for (const to of moves) {
      actions.push({ type: 'move', from, to });
    }
  }
  return actions;
}

function applyAction(state: GameState, action: Action): GameState {
  if (action.type === 'place') return applyPlace(state, action.index);
  if (action.type === 'remove') return applyRemove(state, action.index);
  const selected = applySelect(state, action.from);
  return applyMove(selected, action.to);
}

function wouldFormMill(board: Cell[], index: number, player: Player): boolean {
  const test = [...board];
  test[index] = player;
  return detectNewMills(test, index, player) > 0;
}

function countMills(board: Cell[], player: Player): number {
  let n = 0;
  for (const mill of MILLS) {
    if (mill.every(i => board[i] === player)) n++;
  }
  return n;
}

function score(state: GameState, perspective: Player): number {
  if (state.winner === perspective) return 100000;
  if (state.winner && state.winner !== perspective) return -100000;
  if (state.isDraw) return -500;

  const opp = opponentOf(perspective);
  const myMills = countMills(state.board, perspective);
  const oppMills = countMills(state.board, opp);
  const myPieces = state.piecesOnBoard[perspective];
  const oppPieces = state.piecesOnBoard[opp];

  let positional = 0;
  for (const i of listPlayerNodes(state.board, perspective)) {
    if (MIDPOINT_NODES.has(i)) positional += 1;
    positional += ADJACENCY[i].length * 0.2;
  }
  for (const i of listPlayerNodes(state.board, opp)) {
    if (MIDPOINT_NODES.has(i)) positional -= 1;
    positional -= ADJACENCY[i].length * 0.2;
  }

  return (myMills * 3) + myPieces - (oppMills * 3) - oppPieces + positional;
}

function pickEasy(state: GameState): Action | null {
  const actions = enumerateActions(state);
  if (actions.length === 0) return null;
  return actions[Math.floor(Math.random() * actions.length)];
}

function pickMedium(state: GameState): Action | null {
  const actions = enumerateActions(state);
  if (actions.length === 0) return null;
  const ai = state.currentPlayer;
  const opp = opponentOf(ai);

  // 1. Action that forms a mill
  if (state.phase === 'placing') {
    const millMaker = actions.find(
      (a) => a.type === 'place' && wouldFormMill(state.board, a.index, ai)
    );
    if (millMaker) return millMaker;

    // 2. Block opponent about to complete a mill
    const blockers = actions.filter(
      (a) => a.type === 'place' && wouldFormMill(state.board, a.index, opp)
    );
    if (blockers.length > 0) return blockers[0];
  } else if (state.phase === 'moving' || state.phase === 'flying') {
    for (const action of actions) {
      if (action.type !== 'move') continue;
      const testBoard = [...state.board];
      testBoard[action.from] = null;
      testBoard[action.to] = ai;
      if (detectNewMills(testBoard, action.to, ai) > 0) return action;
    }
    // Blockers: prevent opponent mill on next turn (best-effort)
    for (const empty of listEmpty(state.board)) {
      if (wouldFormMill(state.board, empty, opp)) {
        const blocker = actions.find(
          (a) => a.type === 'move' && a.to === empty
        );
        if (blocker) return blocker;
      }
    }
  } else if (state.phase === 'removing') {
    // Prefer removing pieces that can complete an opponent mill
    const removeActions = actions as RemoveAction[];
    let best: RemoveAction = removeActions[0];
    let bestScore = -Infinity;
    for (const action of removeActions) {
      let s = 0;
      for (const mill of MILLS) {
        if (mill.includes(action.index)) {
          const others = mill.filter((i) => i !== action.index);
          const oppCount = others.filter((i) => state.board[i] === opp).length;
          s += oppCount * 5;
          const myCount = others.filter((i) => state.board[i] === ai).length;
          s -= myCount * 2;
        }
      }
      if (MIDPOINT_NODES.has(action.index)) s += 2;
      if (s > bestScore) { bestScore = s; best = action; }
    }
    return best;
  }

  return actions[Math.floor(Math.random() * actions.length)];
}

function minimax(
  state: GameState,
  depth: number,
  alpha: number,
  beta: number,
  perspective: Player
): number {
  if (depth === 0 || state.winner || state.isDraw) {
    return score(state, perspective);
  }

  const actions = enumerateActions(state);
  if (actions.length === 0) return score(state, perspective);

  const isMaximizing = state.currentPlayer === perspective;
  let best = isMaximizing ? -Infinity : Infinity;

  // Cap branching for placing phase
  const capped = actions.length > 14
    ? actions.slice().sort(() => Math.random() - 0.5).slice(0, 14)
    : actions;

  for (const action of capped) {
    const next = applyAction(state, action);
    const v = minimax(next, depth - 1, alpha, beta, perspective);
    if (isMaximizing) {
      best = Math.max(best, v);
      alpha = Math.max(alpha, v);
    } else {
      best = Math.min(best, v);
      beta = Math.min(beta, v);
    }
    if (beta <= alpha) break;
  }
  return best;
}

function pickHard(state: GameState): Action | null {
  const actions = enumerateActions(state);
  if (actions.length === 0) return null;

  // Shortcut: capture immediate win/mill
  const ai = state.currentPlayer;
  if (state.phase === 'placing') {
    const millMaker = actions.find(
      (a) => a.type === 'place' && wouldFormMill(state.board, a.index, ai)
    );
    if (millMaker) return millMaker;
  }

  const depth = state.phase === 'placing' ? 3 : 5;
  let bestAction = actions[0];
  let bestScore = -Infinity;

  for (const action of actions) {
    const next = applyAction(state, action);
    const v = minimax(next, depth - 1, -Infinity, Infinity, ai);
    if (v > bestScore) {
      bestScore = v;
      bestAction = action;
    }
  }
  return bestAction;
}

export function chooseAction(state: GameState, difficulty: Difficulty): Action | null {
  if (difficulty === 'easy') return pickEasy(state);
  if (difficulty === 'medium') return pickMedium(state);
  return pickHard(state);
}

export function applyAiAction(state: GameState, action: Action): GameState {
  return applyAction(state, action);
}

export type { Action };
