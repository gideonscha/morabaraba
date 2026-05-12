import { describe, test, expect } from 'vitest';
import {
  detectNewMills,
  getRemovableNodes,
  getValidMoves,
  hasLegalMoves,
  checkWinConditions,
  type Cell,
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
