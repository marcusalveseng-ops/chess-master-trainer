import { describe, expect, it, vi } from 'vitest';
import { Chess } from 'chess.js';
import { analyzePosition } from '../shared/chess-coach';
import { positionAt } from '../shared/chess-position';
vi.mock('./_core/llm', () => ({ invokeLLM: vi.fn() }));
import { invokeLLM } from './_core/llm';
import { aiAnalysisRouter } from './routers/ai-analysis';

describe('board history', () => {
  it('replays the start, intermediate position, and final position', () => {
    const pgn = '1. e4 e5 2. Nf3 Nc6';
    expect(positionAt(pgn, 0).fen()).toBe(new Chess().fen());
    expect(positionAt(pgn, 2).history()).toEqual(['e4', 'e5']);
    expect(positionAt(pgn, 99).history()).toHaveLength(4);
  });
  it('branches from the displayed position without retaining the old continuation', () => {
    const g = positionAt('1. e4 e5 2. Nf3 Nc6', 2);
    g.move('Bc4');
    expect(g.history()).toEqual(['e4', 'e5', 'Bc4']);
  });
  it('preserves setup FEN and promotion', () => {
    const fen = '7k/P7/8/8/8/8/8/7K w - - 0 1';
    const g = new Chess(fen); g.move('a8=N');
    expect(positionAt(g.pgn(), 0).fen()).toBe(fen);
    expect(positionAt(g.pgn(), 1).get('a8')?.type).toBe('n');
  });
  it('preserves castling and en passant', () => {
    const g = new Chess();
    ['e4','a6','e5','d5','exd6','exd6','Nf3','Nf6','Be2','Be7','O-O'].forEach(m => g.move(m));
    expect(positionAt(g.pgn(), 11).fen()).toBe(g.fen());
    expect(positionAt(g.pgn(), 5).get('d5')).toBeUndefined();
  });
  it('rejects invalid notation rather than silently changing the game', () => {
    expect(() => positionAt('1. e4 e5 2. Bh6', 3)).toThrow();
  });
});
describe('local chess AI', () => {
  it('finds mate in one for black, with correctly signed evaluation', () => {
    const g = new Chess(); ['f3','e5','g4'].forEach(m => g.move(m));
    const a = analyzePosition(g.fen(), { maxDepth: 1, timeMs: 5000 });
    expect(a.candidates[0].san).toBe('Qh4#');
    expect(a.candidates[0].score).toBeGreaterThan(90000);
  });
  it('returns legal reply paths without modifying the input position', () => {
    const g = new Chess();
    const a = analyzePosition(g.fen(), { maxDepth: 2, timeMs: 10000 });
    expect(a.depth).toBe(2);
    expect(a.candidates).toHaveLength(3);
    for (const candidate of a.candidates) {
      const replay = new Chess(g.fen());
      candidate.line.forEach(m => expect(replay.move(m)).toBeTruthy());
      expect(candidate.line).toHaveLength(2);
    }
    expect(g.history()).toHaveLength(0);
  });
  it.each([
    '7k/6Q1/5K2/8/8/8/8/8 b - - 0 1',
    '7k/5Q2/6K1/8/8/8/8/8 b - - 0 1',
    '7k/8/8/8/8/8/8/K7 w - - 0 1',
  ])('stops at terminal position %s', fen => {
    expect(analyzePosition(fen)).toMatchObject({ terminal: true, candidates: [] });
  });
  it('recognizes threefold repetition from history', () => {
    const g = new Chess();
    for (let i = 0; i < 2; i++) ['Nf3','Nf6','Ng1','Ng8'].forEach(m => g.move(m));
    expect(analyzePosition(g.fen(), { pgn: g.pgn() }).terminal).toBe(true);
  });
  it('returns only fully completed search iterations when the budget expires', () => {
    const a = analyzePosition(new Chess().fen(), { maxNodes: 22, timeMs: 10000 });
    expect(a.depth).toBe(1);
    expect(a.candidates).toHaveLength(3);
  });
});
describe('online coach boundary', () => {
  const context = { user: { id: 1 }, req: {}, res: {} } as any;
  it('rejects anonymous requests', async () => {
    await expect(aiAnalysisRouter.createCaller({ ...context, user: null }).explainCandidates({ fen: new Chess().fen(), lines: [['e4']] })).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });
  it('rejects fabricated moves before contacting the model', async () => {
    vi.mocked(invokeLLM).mockClear();
    await expect(aiAnalysisRouter.createCaller(context).explainCandidates({ fen: new Chess().fen(), lines: [['Qh8#']] })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    expect(invokeLLM).not.toHaveBeenCalled();
  });
  it('returns a bounded explanation for legal lines', async () => {
    vi.mocked(invokeLLM).mockResolvedValue({ choices: [{ message: { content: 'e4 ocupa o centro.' } }] } as any);
    const r = await aiAnalysisRouter.createCaller(context).explainCandidates({ fen: new Chess().fen(), lines: [['e4', 'e5']] });
    expect(r.explanation).toBe('e4 ocupa o centro.');
  });
  it('handles an unavailable provider without fabricating advice', async () => {
    vi.mocked(invokeLLM).mockRejectedValue(new Error('offline'));
    await expect(aiAnalysisRouter.createCaller(context).explainCandidates({ fen: new Chess().fen(), lines: [['e4']] })).rejects.toMatchObject({ code: 'SERVICE_UNAVAILABLE' });
  });
});
