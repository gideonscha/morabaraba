// Board geometry — node positions on a 327×327 viewBox, sourced
// pixel-perfect from the Claude Design handoff (Morabaraba.html L1864–1890).
// Three concentric squares + midpoint connectors. NO diagonals.

export const VIEW_SIZE = 327;

// Engine indices 0..23 mapped to handoff coordinates.
// Outer 0..7 (corners + midpoints, clockwise from top-left).
// Middle 8..15. Inner 16..23.
export const NODE_POSITIONS: { x: number; y: number }[] = [
  { x: 32,    y: 32    }, // 0  outer TL
  { x: 163.5, y: 32    }, // 1  outer TM
  { x: 295,   y: 32    }, // 2  outer TR
  { x: 295,   y: 163.5 }, // 3  outer RM
  { x: 295,   y: 295   }, // 4  outer BR
  { x: 163.5, y: 295   }, // 5  outer BM
  { x: 32,    y: 295   }, // 6  outer BL
  { x: 32,    y: 163.5 }, // 7  outer LM
  { x: 76,    y: 76    }, // 8  middle TL
  { x: 163.5, y: 76    }, // 9  middle TM
  { x: 251,   y: 76    }, // 10 middle TR
  { x: 251,   y: 163.5 }, // 11 middle RM
  { x: 251,   y: 251   }, // 12 middle BR
  { x: 163.5, y: 251   }, // 13 middle BM
  { x: 76,    y: 251   }, // 14 middle BL
  { x: 76,    y: 163.5 }, // 15 middle LM
  { x: 120,   y: 120   }, // 16 inner TL
  { x: 163.5, y: 120   }, // 17 inner TM
  { x: 207,   y: 120   }, // 18 inner TR
  { x: 207,   y: 163.5 }, // 19 inner RM
  { x: 207,   y: 207   }, // 20 inner BR
  { x: 163.5, y: 207   }, // 21 inner BM
  { x: 120,   y: 207   }, // 22 inner BL
  { x: 120,   y: 163.5 }, // 23 inner LM
];
