// Board geometry: 24 node positions on a 600x600 viewBox.
// Three concentric squares. NO diagonals.

export const VIEW_SIZE = 600;
const CENTER = VIEW_SIZE / 2;

// Square half-sizes for outer, middle, inner
const HALVES = [260, 175, 90];

function squareNodes(half: number): { x: number; y: number }[] {
  // Order: tl, tm, tr, rm, br, bm, bl, lm
  return [
    { x: CENTER - half, y: CENTER - half }, // 0 / 8 / 16 - top-left
    { x: CENTER,        y: CENTER - half }, // 1 / 9 / 17 - top-mid
    { x: CENTER + half, y: CENTER - half }, // 2 / 10 / 18 - top-right
    { x: CENTER + half, y: CENTER        }, // 3 / 11 / 19 - right-mid
    { x: CENTER + half, y: CENTER + half }, // 4 / 12 / 20 - bottom-right
    { x: CENTER,        y: CENTER + half }, // 5 / 13 / 21 - bottom-mid
    { x: CENTER - half, y: CENTER + half }, // 6 / 14 / 22 - bottom-left
    { x: CENTER - half, y: CENTER        }, // 7 / 15 / 23 - left-mid
  ];
}

export const NODE_POSITIONS: { x: number; y: number }[] = [
  ...squareNodes(HALVES[0]),
  ...squareNodes(HALVES[1]),
  ...squareNodes(HALVES[2]),
];

// Edges (lines) to render on the board — pairs of node indices
export const EDGES: [number, number][] = [
  // Outer square
  [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 0],
  // Middle square
  [8, 9], [9, 10], [10, 11], [11, 12], [12, 13], [13, 14], [14, 15], [15, 8],
  // Inner square
  [16, 17], [17, 18], [18, 19], [19, 20], [20, 21], [21, 22], [22, 23], [23, 16],
  // Midpoint connectors (only between squares — NO diagonals)
  [1, 9], [9, 17],
  [3, 11], [11, 19],
  [5, 13], [13, 21],
  [7, 15], [15, 23],
];
