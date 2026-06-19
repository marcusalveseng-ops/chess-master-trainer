import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import { createGame, getUserGames, getGameById, updateGame, createKeyPosition, getGameKeyPositions, getOrCreateOpeningStudy, getUserOpeningStudies, getOrCreateUserProgress, updateUserProgress } from '../db';
import { TRPCError } from '@trpc/server';

export const gamesRouter = router({
  // Create a new game
  create: protectedProcedure
    .input(z.object({
      pgn: z.string(),
      title: z.string().optional(),
      opening: z.string().optional(),
      openingEco: z.string().optional(),
      result: z.enum(['1-0', '0-1', '1/2-1/2', '*']).optional(),
      whitePlayer: z.string().optional(),
      blackPlayer: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const game = await createGame({
        userId: ctx.user.id,
        pgn: input.pgn,
        title: input.title,
        opening: input.opening,
        openingEco: input.openingEco,
        result: input.result || '*',
        whitePlayer: input.whitePlayer,
        blackPlayer: input.blackPlayer,
        notes: input.notes,
        isHistorical: false,
      });

      if (!game) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create game' });
      }

      // Update user progress
      const progress = await getOrCreateUserProgress(ctx.user.id);
      if (progress) {
        await updateUserProgress(ctx.user.id, {
          totalGamesAnalyzed: (progress.totalGamesAnalyzed || 0) + 1,
          lastActivityAt: new Date(),
        });
      }

      // Track opening study if opening is provided
      if (input.openingEco && input.opening) {
        const study = await getOrCreateOpeningStudy(ctx.user.id, input.openingEco, input.opening);
        if (study) {
          await updateUserProgress(ctx.user.id, {
            totalOpeningsStudied: (progress?.totalOpeningsStudied || 0) + 1,
          });
        }
      }

      return game;
    }),

  // Get user's games
  list: protectedProcedure
    .input(z.object({
      limit: z.number().default(50),
      offset: z.number().default(0),
    }))
    .query(async ({ ctx, input }) => {
      const games = await getUserGames(ctx.user.id, input.limit, input.offset);
      return games;
    }),

  // Get a specific game
  get: protectedProcedure
    .input(z.object({
      gameId: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      const game = await getGameById(input.gameId);
      
      if (!game) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Game not found' });
      }

      // Check ownership
      if (game.userId !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'You do not have permission to view this game' });
      }

      return game;
    }),

  // Update a game
  update: protectedProcedure
    .input(z.object({
      gameId: z.number(),
      title: z.string().optional(),
      notes: z.string().optional(),
      result: z.enum(['1-0', '0-1', '1/2-1/2', '*']).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const game = await getGameById(input.gameId);
      
      if (!game) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Game not found' });
      }

      if (game.userId !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'You do not have permission to update this game' });
      }

      const updates: any = {};
      if (input.title !== undefined) updates.title = input.title;
      if (input.notes !== undefined) updates.notes = input.notes;
      if (input.result !== undefined) updates.result = input.result;

      await updateGame(input.gameId, updates);
      return await getGameById(input.gameId);
    }),

  // Add a key position to a game
  addKeyPosition: protectedProcedure
    .input(z.object({
      gameId: z.number(),
      moveNumber: z.number(),
      fen: z.string(),
      annotation: z.string().optional(),
      strategicTheme: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const game = await getGameById(input.gameId);
      
      if (!game) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Game not found' });
      }

      if (game.userId !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'You do not have permission to modify this game' });
      }

      const position = await createKeyPosition({
        gameId: input.gameId,
        moveNumber: input.moveNumber,
        fen: input.fen,
        annotation: input.annotation,
        strategicTheme: input.strategicTheme,
      });

      if (!position) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create key position' });
      }

      // Update user progress
      const progress = await getOrCreateUserProgress(ctx.user.id);
      if (progress) {
        await updateUserProgress(ctx.user.id, {
          keyPositionsMarked: (progress.keyPositionsMarked || 0) + 1,
        });
      }

      return position;
    }),

  // Get key positions for a game
  getKeyPositions: protectedProcedure
    .input(z.object({
      gameId: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      const game = await getGameById(input.gameId);
      
      if (!game) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Game not found' });
      }

      if (game.userId !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'You do not have permission to view this game' });
      }

      return await getGameKeyPositions(input.gameId);
    }),

  // Get user's opening studies
  getOpeningStudies: protectedProcedure
    .query(async ({ ctx }) => {
      return await getUserOpeningStudies(ctx.user.id);
    }),

  // Get user progress
  getProgress: protectedProcedure
    .query(async ({ ctx }) => {
      const progress = await getOrCreateUserProgress(ctx.user.id);
      return progress || {
        userId: ctx.user.id,
        totalGamesAnalyzed: 0,
        totalOpeningsStudied: 0,
        keyPositionsMarked: 0,
        lastActivityAt: new Date(),
        updatedAt: new Date(),
      };
    }),
});
