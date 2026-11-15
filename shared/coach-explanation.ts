import { Chess, type Move, type Square } from 'chess.js';
import type { Candidate } from './chess-coach';
const names: Record<string, string> = { p:'peão', n:'cavalo', b:'bispo', r:'torre', q:'dama', k:'rei' };
const center: Square[] = ['d4', 'e4', 'd5', 'e5'];
const pieceWithArticle = (piece: string) => `${piece === 'q' || piece === 'r' ? 'a' : 'o'} ${names[piece]}`;

function capture(move: Move): string {
  const square = move.isEnPassant() ? move.to[0] + move.from[1] : move.to;
  const piece = move.captured!;
  return `captura ${piece === 'q' || piece === 'r' ? 'uma' : 'um'} ${names[piece]} em ${square}`;
}

function explainRisks(moves: Move[], score: number): string[] {
  const [first, reply] = moves;
  if (!reply) {
    return [first.san.endsWith('#') ? 'O lance é mate: não há resposta legal.' :
      'A linha calculada termina neste lance. Ainda não há uma resposta adversária para avaliar.'];
  }

  const replyEffects: string[] = [];
  if (reply.captured) replyEffects.push(capture(reply));
  if (reply.promotion) replyEffects.push(`promove o peão a ${names[reply.promotion]} em ${reply.to}`);
  if (reply.san.endsWith('#')) replyEffects.push('dá xeque-mate');
  else if (reply.san.endsWith('+')) replyEffects.push('dá xeque');
  if (!replyEffects.length) {
    if (reply.isKingsideCastle() || reply.isQueensideCastle()) {
      replyEffects.push(`faz o roque e leva o rei para ${reply.to}`);
    } else {
      const position = new Chess(reply.after);
      const controlled = center.filter(square => position.attackers(square, reply.color).includes(reply.to));
      const piece = pieceWithArticle(reply.piece);
      replyEffects.push(`move ${piece} de ${reply.from} para ${reply.to}` +
        (controlled.length ? `, de onde ${piece} controla ${new Intl.ListFormat('pt-BR').format(controlled)}` : ''));
    }
  }

  const risks = [`Com ${reply.san}, o adversário ${replyEffects.join(' e ')}.`];
  const laterCaptures = moves.slice(3).filter(move => move.color === reply.color && move.captured);
  // Prefer a fresh capture over the routine recapture in a trade.
  const consequence = moves.slice(3).find(move => move.color === reply.color && move.san.endsWith('#')) ||
    laterCaptures.find(move => {
      const previous = moves[moves.indexOf(move) - 1];
      return !previous.captured || previous.to !== move.to;
    }) || laterCaptures[0] ||
    moves.slice(3).find(move => move.color === reply.color && move.san.endsWith('+'));
  if (consequence) {
    const effect = consequence.san.endsWith('#') ? 'dá xeque-mate' : consequence.captured ? capture(consequence) : 'dá xeque';
    const previous = moves[moves.indexOf(consequence) - 1];
    risks.push(`Na linha calculada, depois de ${previous.san}, ${pieceWithArticle(consequence.piece)} de ${consequence.from} ${effect} com ${consequence.san}.`);
  }
  if (score < -50 && !reply.san.endsWith('#') && !consequence?.san.endsWith('#')) {
    risks.push('A avaliação desta linha favorece o adversário.');
  }
  return risks;
}
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
  const risks = explainRisks(moves, score);
  return { san: move.san, score, line: moves.map(m => m.san), positives, risks };
}
