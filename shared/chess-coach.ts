import { Chess, type Move } from 'chess.js';

const values: Record<string, number> = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };
export interface Candidate { san: string; score: number; line: string[]; positives: string[]; risks: string[] }
export interface Analysis { fen: string; depth: number; nodes: number; candidates: Candidate[]; terminal: boolean }
function evaluate(game: Chess): number {
  let score = 0;
  for (const row of game.board()) for (const p of row) {
    if (!p) continue;
    const file = p.square.charCodeAt(0) - 97;
    const rank = Number(p.square[1]) - 1;
    const center = 3.5 - Math.max(Math.abs(file - 3.5), Math.abs(rank - 3.5));
    const bonus = p.type === 'n' || p.type === 'b' ? center * 12 : p.type === 'p' ? (p.color === 'w' ? rank : 7 - rank) * 5 : 0;
    score += (p.color === 'w' ? 1 : -1) * (values[p.type] + bonus);
  }
  return score * (game.turn() === 'w' ? 1 : -1);
}
const priority = (m: Move) => (m.captured ? 10 * values[m.captured] - values[m.piece] : 0) + (m.promotion ? values[m.promotion] : 0);

/** Bounded classical AI search. Scores are from the side to move at the root. */
export function analyzePosition(fen: string, options: { pgn?: string; maxDepth?: number; timeMs?: number; maxNodes?: number } = {}): Analysis {
  const game = new Chess(fen);
  if (options.pgn) { game.loadPgn(options.pgn); if (game.fen() !== fen) throw new Error('PGN e FEN divergentes'); }
  let nodes = 0;
  const deadline = Date.now() + (options.timeMs ?? 1200);
  const maxNodes = options.maxNodes ?? 30000;
  const timeout = new Error('budget');
  function search(depth: number, alpha: number, beta: number, ply: number): { score: number; line: string[] } {
    nodes++;
    if (nodes > maxNodes || Date.now() > deadline) throw timeout;
    if (game.isCheckmate()) return { score: -100000 + ply, line: [] };
    if (game.isDraw()) return { score: 0, line: [] };
    if (!depth) return { score: evaluate(game), line: [] };
    let best = { score: -Infinity, line: [] as string[] };
    for (const move of game.moves({ verbose: true }).sort((a, b) => priority(b) - priority(a))) {
      game.move(move);
      let reply;
      try { reply = search(depth - 1, -beta, -alpha, ply + 1); } finally { game.undo(); }
      const score = -reply.score;
      if (score > best.score) best = { score, line: [move.san, ...reply.line] };
      alpha = Math.max(alpha, score);
      if (alpha >= beta) break;
    }
    return best;
  }
  const terminal = game.isGameOver();
  const result: Analysis = { fen, depth: 0, nodes: 0, candidates: [], terminal };
  if (terminal) return result;
  const moves = game.moves({ verbose: true }).sort((a, b) => priority(b) - priority(a));
  for (let depth = 1; depth <= (options.maxDepth ?? 3); depth++) {
    const candidates: Candidate[] = [];
    try {
      for (const move of moves) {
        game.move(move);
        let reply;
        try { reply = search(depth - 1, -Infinity, Infinity, 1); } finally { game.undo(); }
        const positives: string[] = [];
        if (move.captured) positives.push(`Captura uma peça (${move.captured}).`);
        if (move.san.includes('#')) positives.push('Conclui com xeque-mate.');
        else if (move.san.includes('+')) positives.push('Dá xeque ao rei adversário.');
        if (move.isKingsideCastle() || move.isQueensideCastle()) positives.push('Executa o roque.');
        if (['d4', 'e4', 'd5', 'e5'].includes(move.to)) positives.push('Ocupa uma casa central.');
        if (move.promotion) positives.push(`Promove o peão (${move.promotion}).`);
        if (!positives.length) positives.push(`Reposiciona a peça de ${move.from} para ${move.to}.`);
        const risks = ['A busca é limitada; táticas além da profundidade calculada podem mudar a avaliação.'];
        if (reply.line[0]) risks.unshift(`Resposta adversária calculada: ${reply.line[0]}.`);
        if (-reply.score < -50) risks.unshift('A avaliação desta variante favorece o adversário.');
        candidates.push({ san: move.san, score: -reply.score, line: [move.san, ...reply.line], positives, risks });
      }
    } catch (error) { if (error !== timeout) throw error; break; }
    result.depth = depth;
    result.candidates = candidates.sort((a, b) => b.score - a.score).slice(0, 3);
  }
  result.nodes = nodes;
  return result;
}
