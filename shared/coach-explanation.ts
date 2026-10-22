import { Chess } from 'chess.js';
import type { Candidate } from './chess-coach';
const names: Record<string, string> = { p:'peão', n:'cavalo', b:'bispo', r:'torre', q:'dama', k:'rei' };
/** All statements come from legally replayed moves; no claim of tactical safety. */
export function explainCandidate(fen: string, line: string[], score: number): Candidate {
  const game = new Chess(fen);
  const moves = line.map(san => game.move(san));
  const move = moves[0];
  if (!move) throw new Error('Variante vazia');
  const positives: string[] = [];
  if (move.captured) positives.push(`Captura ${names[move.captured]}.`);
  if (move.san.includes('#')) positives.push('Conclui com xeque-mate.');
  else if (move.san.includes('+')) positives.push('Dá xeque ao rei adversário.');
  if (move.isKingsideCastle() || move.isQueensideCastle()) positives.push('Executa o roque.');
  if (move.promotion) positives.push(`Promove o peão para ${names[move.promotion]}.`);
  if (['d4','e4','d5','e5'].includes(move.to)) positives.push('Ocupa uma casa central.');
  if (!positives.length) positives.push(`Reposiciona ${names[move.piece]} de ${move.from} para ${move.to}.`);
  const risks = [];
  if (moves[1]) risks.push(`Resposta calculada: ${moves[1].san}.${moves[1].captured ? ` O adversário captura ${names[moves[1].captured]}.` : ''}`);
  if (score < -50) risks.push('Nesta linha, a avaliação favorece o adversário.');
  risks.push('Outras respostas são possíveis; uma busca mais profunda pode mudar a avaliação.');
  return { san: move.san, score, line: moves.map(m => m.san), positives, risks };
}
