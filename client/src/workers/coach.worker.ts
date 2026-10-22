import { analyzePosition } from '@shared/chess-coach';
self.onmessage = (event: MessageEvent<{ fen: string; pgn: string }>) => {
  try { self.postMessage({ result: analyzePosition(event.data.fen, { pgn: event.data.pgn }) }); }
  catch { self.postMessage({ error: 'Não foi possível analisar esta posição.' }); }
};
