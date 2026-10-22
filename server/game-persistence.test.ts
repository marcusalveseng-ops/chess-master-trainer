import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Chess } from 'chess.js';
const mocks = vi.hoisted(() => ({ getDb: vi.fn() }));
vi.mock('./db', () => ({ getDb: mocks.getDb }));
import { gamePersistenceRouter } from './routers/game-persistence';
import { pgnIORouter } from './routers/pgn-io';
import { validatePGN, parsePGN } from './pgn-utils';
const ctx: any = { user: { id: 1 }, req: {}, res: {} };
beforeEach(() => vi.clearAllMocks());
describe('game persistence contract', () => {
  it('returns the database id after saving', async () => {
    mocks.getDb.mockResolvedValue({ insert: () => ({ values: async () => [{ insertId: 42 }] }) });
    expect(await gamePersistenceRouter.createCaller(ctx).saveGame({ pgn: '1. e4 e5', title: 'Test' })).toEqual({ success: true, gameId: 42 });
  });
  it('returns the database id after importing', async () => {
    mocks.getDb.mockResolvedValue({ insert: () => ({ values: async () => [{ insertId: 42 }] }) });
    expect(await pgnIORouter.createCaller(ctx).importPGN({ pgnText: '1. e4 e5' })).toMatchObject({ success: true, gameId: 42 });
  });
  it('rejects an illegal PGN before writing', async () => {
    await expect(gamePersistenceRouter.createCaller(ctx).saveGame({ pgn: '1. e4 e5 2. Bh6', title: 'Test' })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    expect(mocks.getDb).not.toHaveBeenCalled();
    expect(validatePGN('1. e4 e5 2. Bh6 Nc6').valid).toBe(false);
  });
  it('accepts a legal setup game', () => {
    const game = new Chess('7k/P7/8/8/8/8/8/7K w - - 0 1'); game.move('a8=Q+');
    expect(validatePGN(game.pgn()).valid).toBe(true);
    expect(parsePGN(game.pgn()).moves).toEqual(['a8=Q+']);
  });
  it('preserves ratings and parses comments without treating them as moves', () => {
    const parsed = parsePGN('[WhiteElo "1800"]\n[BlackElo "1700"]\n\n1. e4 {Centro} e5 2. Nf3 (2. Bc4) Nc6 *');
    expect(parsed.metadata.whiteElo).toBe('1800');
    expect(parsed.moves).toEqual(['e4', 'e5', 'Nf3', 'Nc6']);
    expect(parsed.comments[1]).toBe('Centro');
  });
});
