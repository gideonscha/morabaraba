import { describe, test, expect } from 'vitest';
import {
  detectNewMills,
  getRemovableNodes,
  getValidMoves,
  hasLegalMoves,
  getMovablePieces,
  checkWinConditions,
  applyPlace,
  applyRemove,
  applySelect,
  initialState,
  type Cell,
  type GameState,
} from './gameEngine';

describe('detectNewMills', () => {
  test('detects a single mill on outer square', () => {
    const board: Cell[] = Array(24).fill(null);
    board[0] = 'p1'; board[1] = 'p1';
    expect(detectNewMills(board, 2, 'p1')).toBe(0);
    board[2] = 'p1';
    expect(detectNewMills(board, 2, 'p1')).toBe(1);
  });

  test('detects double mill (two mills from one placement)', () => {
    const board: Cell[] = Array(24).fill(null);
    board[0] = 'p1'; board[2] = 'p1';
    board[9] = 'p1'; board[17] = 'p1';
    board[1] = 'p1';
    expect(detectNewMills(board, 1, 'p1')).toBe(2);
  });

  test('does not detect mill for opponent pieces', () => {
    const board: Cell[] = Array(24).fill(null);
    board[0] = 'p2'; board[1] = 'p2'; board[2] = 'p2';
    expect(detectNewMills(board, 2, 'p1')).toBe(0);
  });

  test('does not detect incomplete mill', () => {
    const board: Cell[] = Array(24).fill(null);
    board[0] = 'p1'; board[2] = 'p1';
    expect(detectNewMills(board, 0, 'p1')).toBe(0);
  });
});

describe('getRemovableNodes', () => {
  test('returns all opponent nodes when none are in mills', () => {
    const board: Cell[] = Array(24).fill(null);
    board[5] = 'p2'; board[10] = 'p2'; board[20] = 'p2';
    const removable = getRemovableNodes(board, 'p2');
    expect(removable).toEqual(expect.arrayContaining([5, 10, 20]));
    expect(removable.length).toBe(3);
  });

  test('excludes mill-protected pieces when unprotected exist', () => {
    const board: Cell[] = Array(24).fill(null);
    board[0] = 'p2'; board[1] = 'p2'; board[2] = 'p2';
    board[10] = 'p2';
    const removable = getRemovableNodes(board, 'p2');
    expect(removable).toEqual([10]);
    expect(removable).not.toContain(0);
  });

  test('allows removing mill pieces when ALL pieces are in mills', () => {
    const board: Cell[] = Array(24).fill(null);
    board[0] = 'p2'; board[1] = 'p2'; board[2] = 'p2';
    board[8] = 'p2'; board[9] = 'p2'; board[10] = 'p2';
    const removable = getRemovableNodes(board, 'p2');
    expect(removable.length).toBe(6);
  });
});

describe('checkWinConditions', () => {
  test('p2 wins when p1 has 2 pieces', () => {
    const board: Cell[] = Array(24).fill(null);
    const result = checkWinConditions(board, { p1: 2, p2: 9 }, 'moving');
    expect(result.winner).toBe('p2');
  });

  test('returns draw on mutual blockade', () => {
    const board = Array(24).fill('p1').map((_, i) => (i % 2 === 0 ? 'p1' : 'p2')) as Cell[];
    const result = checkWinConditions(board, { p1: 12, p2: 12 }, 'moving');
    expect(result.isDraw).toBe(true);
    expect(result.winner).toBeNull();
  });

  test('no win during placing phase regardless of move availability', () => {
    const board: Cell[] = Array(24).fill(null);
    const result = checkWinConditions(board, { p1: 10, p2: 10 }, 'placing');
    expect(result.winner).toBeNull();
    expect(result.isDraw).toBe(false);
  });
});

describe('getValidMoves', () => {
  test('returns adjacent empty nodes in moving phase', () => {
    const board: Cell[] = Array(24).fill(null);
    board[1] = 'p1';
    const moves = getValidMoves(board, 1, 'p1', 'moving');
    expect(moves).toEqual(expect.arrayContaining([0, 2, 9]));
  });

  test('excludes occupied adjacent nodes', () => {
    const board: Cell[] = Array(24).fill(null);
    board[1] = 'p1';
    board[0] = 'p2';
    const moves = getValidMoves(board, 1, 'p1', 'moving');
    expect(moves).not.toContain(0);
  });

  test('returns all empty nodes in flying phase', () => {
    const board: Cell[] = Array(24).fill('p2') as Cell[];
    board[5] = null; board[15] = null;
    const moves = getValidMoves(board, 1, 'p1', 'flying');
    expect(moves).toEqual(expect.arrayContaining([5, 15]));
    expect(moves.length).toBe(2);
  });
});

describe('getMovablePieces', () => {
  test('lists only pieces with an empty adjacent point when moving', () => {
    const board: Cell[] = Array(24).fill('p2');
    board[0] = 'p1'; // neighbours 1 and 7
    board[2] = 'p1'; // neighbours 1 and 3
    board[1] = null;
    board[12] = 'p1'; // fully boxed in
    expect(getMovablePieces(board, 'p1', 'moving').sort()).toEqual([0, 2]);
  });

  test('every piece is movable when flying and any point is empty', () => {
    const board: Cell[] = Array(24).fill(null);
    board[0] = 'p1'; board[5] = 'p1'; board[20] = 'p1';
    expect(getMovablePieces(board, 'p1', 'flying').sort((a, b) => a - b)).toEqual([0, 5, 20]);
  });

  test('nothing is movable on a full board', () => {
    const board: Cell[] = Array(24).fill('p1');
    expect(getMovablePieces(board, 'p1', 'moving')).toEqual([]);
    expect(getMovablePieces(board, 'p1', 'flying')).toEqual([]);
  });
});

describe('hasLegalMoves', () => {
  test('returns false when all adjacent nodes are occupied', () => {
    const board: Cell[] = Array(24).fill('p2');
    board[0] = 'p1';
    expect(hasLegalMoves(board, 'p1', 'moving')).toBe(false);
  });

  test('returns true when at least one adjacent node is empty', () => {
    const board: Cell[] = Array(24).fill('p2');
    board[0] = 'p1';
    board[1] = null;
    expect(hasLegalMoves(board, 'p1', 'moving')).toBe(true);
  });
});


// ---------------------------------------------------------------------
// Blockade wins (bug reported by Jacqui, 22 Sep 2026: last placement
// left her with no legal move and the game just sat in "Moving").
// ---------------------------------------------------------------------
function boardFrom(p1: number[], p2: number[]): Cell[] {
  const b: Cell[] = Array(24).fill(null);
  for (const i of p1) b[i] = 'p1';
  for (const i of p2) b[i] = 'p2';
  return b;
}

describe('blockade at the end of placing', () => {
  // Node 16's only neighbours are 17 and 23. If both are p2 and 16 is the
  // only empty point, p1 cannot move anywhere.
  const P1 = [0, 1, 2, 4, 5, 6, 7, 8, 10, 11, 12];
  const P2 = [9, 13, 14, 15, 17, 18, 19, 20, 21, 22, 23];

  test('applyPlace: the last placement can hand the mover a lost position', () => {
    const state: GameState = {
      ...initialState(),
      board: boardFrom(P1, P2),
      phase: 'placing',
      currentPlayer: 'p2',
      piecesToPlace: { p1: 0, p2: 1 },
      piecesOnBoard: { p1: 11, p2: 11 },
    };
    const next = applyPlace(state, 3); // no mill at 3: 2 and 11 are p1
    expect(next.phase).toBe('moving');
    expect(next.winner).toBe('p2');
    expect(next.isDraw).toBe(false);
  });

  test('applyRemove: a capture that ends placing is checked against the incoming mover', () => {
    // Full board; p1 holds 16, whose neighbours are p2. Removing 16 leaves
    // p1 with pieces everywhere but nowhere to go.
    const board = boardFrom([...P1, 16, 3], P2);
    const state: GameState = {
      ...initialState(),
      board,
      phase: 'removing',
      previousPhase: 'placing',
      currentPlayer: 'p2',
      removalsPending: 1,
      piecesToPlace: { p1: 0, p2: 0 },
      piecesOnBoard: { p1: 13, p2: 11 },
    };
    const next = applyRemove(state, 16);
    expect(next.winner).toBe('p2');
    expect(next.phase).toBe('moving');
  });

  test('only the player to move matters', () => {
    const board = boardFrom([...P1, 3], P2); // 16 empty, p1 blocked, p2 can move 17→16
    expect(checkWinConditions(board, { p1: 12, p2: 11 }, 'moving', 'p1').winner).toBe('p2');
    expect(checkWinConditions(board, { p1: 12, p2: 11 }, 'moving', 'p2').winner).toBeNull();
  });

  test('applySelect refuses a piece that has no legal move', () => {
    const board = boardFrom([...P1, 3], P2);
    board[16] = null; board[9] = null; // p1 at 8 or 10 could move into 9
    const state: GameState = {
      ...initialState(), board, phase: 'moving', previousPhase: 'moving', currentPlayer: 'p1',
      piecesToPlace: { p1: 0, p2: 0 }, piecesOnBoard: { p1: 12, p2: 10 },
    };
    expect(applySelect(state, 0).selectedNode).toBeNull();   // 0's neighbours 1 and 7 are p1
    expect(applySelect(state, 8).selectedNode).toBe(8);       // 8 → 9 is open
  });
});
