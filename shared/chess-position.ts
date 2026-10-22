import { Chess } from 'chess.js';

/** Reconstruct from PGN so setup headers and repetition history survive navigation. */
export function positionAt(pgn: string, index: number, fen?: string): Chess {
  const game = new Chess(fen);
  if (pgn.trim()) game.loadPgn(pgn);
  const length = game.history().length;
  const target = Math.max(0, Math.min(length, Math.trunc(index)));
  for (let i = length; i > target; i--) game.undo();
  return game;
}
