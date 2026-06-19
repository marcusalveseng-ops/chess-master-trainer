import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import { TRPCError } from '@trpc/server';
import { getDb } from '../db';
import { games, keyPositions } from '../../drizzle/schema';
import { eq, and } from 'drizzle-orm';

export const gamePersistenceRouter = router({
  // Save a game
  saveGame: protectedProcedure
    .input(z.object({
      pgn: z.string(),
      title: z.string(),
      notes: z.string().optional(),
      opening: z.string().optional(),
      result: z.enum(['1-0', '0-1', '1/2-1/2']).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error('Database not available');

        await db.insert(games).values({
          userId: ctx.user.id,
          pgn: input.pgn,
          title: input.title,
          notes: input.notes,
          opening: input.opening,
          result: input.result,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        return { success: true };
      } catch (error) {
        console.error('Save game error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to save game',
        });
      }
    }),

  // Get user's games
  getUserGames: protectedProcedure
    .input(z.object({
      limit: z.number().default(50),
      offset: z.number().default(0),
    }))
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error('Database not available');

        const userGames = await db
          .select()
          .from(games)
          .where(eq(games.userId, ctx.user.id))
          .limit(input.limit)
          .offset(input.offset);

        return userGames;
      } catch (error) {
        console.error('Get games error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch games',
        });
      }
    }),

  // Get single game
  getGame: protectedProcedure
    .input(z.object({
      gameId: z.number(),
    }))
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error('Database not available');

        const game = await db
          .select()
          .from(games)
          .where(and(eq(games.id, input.gameId), eq(games.userId, ctx.user.id)))
          .limit(1);

        if (game.length === 0) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Game not found',
          });
        }

        return game[0];
      } catch (error) {
        console.error('Get game error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch game',
        });
      }
    }),

  // Update game
  updateGame: protectedProcedure
    .input(z.object({
      gameId: z.number(),
      title: z.string().optional(),
      notes: z.string().optional(),
      result: z.enum(['1-0', '0-1', '1/2-1/2']).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error('Database not available');

        const updateData: any = {
          updatedAt: new Date(),
        };

        if (input.title !== undefined) updateData.title = input.title;
        if (input.notes !== undefined) updateData.notes = input.notes;
        if (input.result !== undefined) updateData.result = input.result;

        await db
          .update(games)
          .set(updateData)
          .where(and(eq(games.id, input.gameId), eq(games.userId, ctx.user.id)));

        return { success: true };
      } catch (error) {
        console.error('Update game error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update game',
        });
      }
    }),

  // Delete game
  deleteGame: protectedProcedure
    .input(z.object({
      gameId: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error('Database not available');

        await db
          .delete(games)
          .where(and(eq(games.id, input.gameId), eq(games.userId, ctx.user.id)));

        return { success: true };
      } catch (error) {
        console.error('Delete game error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete game',
        });
      }
    }),

  // Mark key position
  markKeyPosition: protectedProcedure
    .input(z.object({
      gameId: z.number(),
      fen: z.string(),
      moveNumber: z.number(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error('Database not available');

        await db.insert(keyPositions).values({
          gameId: input.gameId,
          fen: input.fen,
          moveNumber: input.moveNumber,
          annotation: input.notes,
          createdAt: new Date(),
        });

        return { success: true };
      } catch (error) {
        console.error('Mark key position error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to mark key position',
        });
      }
    }),

  // Get key positions for game
  getKeyPositions: protectedProcedure
    .input(z.object({
      gameId: z.number(),
    }))
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error('Database not available');

        const positions = await db
          .select()
          .from(keyPositions)
          .where(eq(keyPositions.gameId, input.gameId));

        return positions;
      } catch (error) {
        console.error('Get key positions error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch key positions',
        });
      }
    }),
});
