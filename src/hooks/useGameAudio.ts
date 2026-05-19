import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { audio } from '../lib/audio';

/**
 * Watches game state for transitions and fires the appropriate SFX.
 *
 * Diff-based: the engine doesn't emit events, but every gameplay action
 * leaves a unique fingerprint in the state delta (placing adds a cell;
 * sliding removes one cell and fills another with the same colour;
 * removal empties one cell; mill detection populates `lastMillNodes`).
 */
export function useGameAudio() {
  // Subscribe to individual slices only — using `useGameStore()` with no
  // selector returns the whole state object, which changes reference on
  // every set() and forces this hook to re-render on every store mutation.
  const board = useGameStore((s) => s.board);
  const phase = useGameStore((s) => s.phase);
  const lastMillNodes = useGameStore((s) => s.lastMillNodes);
  const selectedNode = useGameStore((s) => s.selectedNode);
  const winner = useGameStore((s) => s.winner);
  const isDraw = useGameStore((s) => s.isDraw);
  const humanPlayer = useGameStore((s) => s.humanPlayer);

  const prev = useRef({
    board,
    phase,
    lastMillNodes,
    selectedNode,
    winner: winner as 'p1' | 'p2' | null,
    isDraw,
    humanPlayer,
  });

  useEffect(() => {
    const p = prev.current;

    let placed = 0;
    let cleared = 0;
    for (let i = 0; i < board.length; i++) {
      const before = p.board[i];
      const after = board[i];
      if (before === after) continue;
      if (!before && after) placed++;
      else if (before && !after) cleared++;
    }

    const wasMill = p.lastMillNodes.length > 0;
    const isMill = lastMillNodes.length > 0;
    const newMill = !wasMill && isMill;

    // Identify which kind of action this tick represents.
    // - Slide: placed === 1 && cleared === 1 (and not a mill-driven capture)
    // - Placement: placed === 1 && cleared === 0
    // - Capture-only: placed === 0 && cleared === 1 (mill removal)
    const isSlide  = placed === 1 && cleared === 1 && !newMill;
    const isPlace  = placed === 1 && cleared === 0;
    const isRemove = placed === 0 && cleared === 1;

    if (isSlide)        audio.playSound('move');
    else if (isPlace)   audio.playSound('place');
    else if (isRemove)  audio.playSound('capture');

    // Mill fires on top of place/slide so the user hears both.
    if (newMill) audio.playSound('mill');

    // Selection — only fire when selecting (null→node), not on deselect.
    if (p.selectedNode === null && selectedNode !== null && !isPlace && !isSlide) {
      audio.playSound('select');
    }

    // Phase transitions worth a sting.
    if (p.phase !== phase) {
      const major =
        (p.phase === 'placing' && phase === 'moving') ||
        (p.phase === 'moving'  && phase === 'flying') ||
        (p.phase === 'placing' && phase === 'flying');
      if (major) audio.playSound('phase');
    }

    // End of game.
    if (!p.winner && !p.isDraw && (winner || isDraw)) {
      if (isDraw)                              audio.playSound('draw');
      else if (winner === humanPlayer)   audio.playSound('victory');
      else                                           audio.playSound('defeat');
    }

    prev.current = {
      board: board,
      phase: phase,
      lastMillNodes: lastMillNodes,
      selectedNode: selectedNode,
      winner: winner as 'p1' | 'p2' | null,
      isDraw: isDraw,
      humanPlayer: humanPlayer,
    };
  }, [
    board,
    phase,
    lastMillNodes,
    selectedNode,
    winner,
    isDraw,
    humanPlayer,
  ]);
}
