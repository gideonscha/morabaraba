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
  const state = useGameStore();
  const prev = useRef({
    board: state.board,
    phase: state.phase,
    lastMillNodes: state.lastMillNodes,
    selectedNode: state.selectedNode,
    winner: state.winner as 'p1' | 'p2' | null,
    isDraw: state.isDraw,
    humanPlayer: state.humanPlayer,
  });

  useEffect(() => {
    const p = prev.current;
    const board = state.board;

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
    const isMill = state.lastMillNodes.length > 0;
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
    if (p.selectedNode === null && state.selectedNode !== null && !isPlace && !isSlide) {
      audio.playSound('select');
    }

    // Phase transitions worth a sting.
    if (p.phase !== state.phase) {
      const major =
        (p.phase === 'placing' && state.phase === 'moving') ||
        (p.phase === 'moving'  && state.phase === 'flying') ||
        (p.phase === 'placing' && state.phase === 'flying');
      if (major) audio.playSound('phase');
    }

    // End of game.
    if (!p.winner && !p.isDraw && (state.winner || state.isDraw)) {
      if (state.isDraw)                              audio.playSound('draw');
      else if (state.winner === state.humanPlayer)   audio.playSound('victory');
      else                                           audio.playSound('defeat');
    }

    prev.current = {
      board: state.board,
      phase: state.phase,
      lastMillNodes: state.lastMillNodes,
      selectedNode: state.selectedNode,
      winner: state.winner as 'p1' | 'p2' | null,
      isDraw: state.isDraw,
      humanPlayer: state.humanPlayer,
    };
  }, [
    state.board,
    state.phase,
    state.lastMillNodes,
    state.selectedNode,
    state.winner,
    state.isDraw,
    state.humanPlayer,
  ]);
}
