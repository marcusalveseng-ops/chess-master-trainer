import { z } from 'zod';
import { protectedProcedure, publicProcedure, router } from '../_core/trpc';
import { getDb } from '../db';
import { endgamePositions, endgameChallenges, endgameAttempts } from '../../drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { CLASSIC_ENDGAMES } from '../endgame-data';

export const endgameRouter = router({
  // Get all classic endgame positions
  getAllPositions: publicProcedure.query(async () => {
    return CLASSIC_ENDGAMES;
  }),

  // Get positions by difficulty
  getByDifficulty: publicProcedure
    .input(z.enum(['beginner', 'intermediate', 'advanced', 'expert']))
    .query(async ({ input }) => {
      return CLASSIC_ENDGAMES.filter(eg => eg.difficulty === input);
    }),

  // Get positions by type
  getByType: publicProcedure
    .input(z.string())
    .query(async ({ input }) => {
      return CLASSIC_ENDGAMES.filter(eg => eg.endgameType === input);
    }),

  // Get unique endgame types
  getTypes: publicProcedure.query(async () => {
    const types = new Set(CLASSIC_ENDGAMES.map(eg => eg.endgameType));
    return Array.from(types);
  }),

  // Get user's challenges
  getUserChallenges: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const challenges = await db
      .select()
      .from(endgameChallenges)
      .where(eq(endgameChallenges.userId, ctx.user.id));

    return challenges;
  }),

  // Get challenge details with position
  getChallengeDetails: protectedProcedure
    .input(z.number())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const challenge = await db
        .select()
        .from(endgameChallenges)
        .where(
          and(
            eq(endgameChallenges.id, input),
            eq(endgameChallenges.userId, ctx.user.id)
          )
        );

      if (challenge.length === 0) {
        throw new Error('Challenge not found');
      }

      const position = CLASSIC_ENDGAMES[challenge[0].endgamePositionId - 1];
      return { challenge: challenge[0], position };
    }),

  // Create a new challenge for a position
  createChallenge: protectedProcedure
    .input(z.number())
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const result = await db.insert(endgameChallenges).values({
        userId: ctx.user.id,
        endgamePositionId: input,
        attempts: 0,
        bestScore: 0,
        solved: false,
      });

      return { challengeId: (result as any).insertId || 0 };
    }),

  // Record an attempt
  recordAttempt: protectedProcedure
    .input(
      z.object({
        challengeId: z.number(),
        pgn: z.string(),
        result: z.enum(['win', 'loss', 'draw', 'incomplete']),
        movesPlayed: z.number(),
        score: z.number(),
        analysis: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      // Verify challenge belongs to user
      const challenge = await db
        .select()
        .from(endgameChallenges)
        .where(
          and(
            eq(endgameChallenges.id, input.challengeId),
            eq(endgameChallenges.userId, ctx.user.id)
          )
        );

      if (challenge.length === 0) {
        throw new Error('Challenge not found');
      }

      // Create attempt record
      const attemptResult = await db.insert(endgameAttempts).values({
        challengeId: input.challengeId,
        pgn: input.pgn,
        result: input.result,
        movesPlayed: input.movesPlayed,
        score: input.score,
        analysis: input.analysis,
      });

      // Update challenge stats
      const isSolved = input.result === 'win';
      const newBestScore = Math.max(challenge[0].bestScore || 0, input.score);

      await db
        .update(endgameChallenges)
        .set({
          attempts: (challenge[0].attempts || 0) + 1,
          bestScore: newBestScore,
          solved: isSolved,
          solvedAt: isSolved ? new Date() : challenge[0].solvedAt,
          lastAttemptAt: new Date(),
        })
        .where(eq(endgameChallenges.id, input.challengeId));

      return {
        attemptId: (attemptResult as any).insertId || 0,
        solved: isSolved,
        bestScore: newBestScore,
      };
    }),

  // Get attempt history for a challenge
  getAttempts: protectedProcedure
    .input(z.number())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      // Verify challenge belongs to user
      const challenge = await db
        .select()
        .from(endgameChallenges)
        .where(
          and(
            eq(endgameChallenges.id, input),
            eq(endgameChallenges.userId, ctx.user.id)
          )
        );

      if (challenge.length === 0) {
        throw new Error('Challenge not found');
      }

      const attempts = await db
        .select()
        .from(endgameAttempts)
        .where(eq(endgameAttempts.challengeId, input));

      return attempts;
    }),

  // Get user statistics
  getUserStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const challenges = await db
      .select()
      .from(endgameChallenges)
      .where(eq(endgameChallenges.userId, ctx.user.id));

    const solvedCount = challenges.filter(c => c.solved).length;
    const totalAttempts = challenges.reduce((sum, c) => sum + (c.attempts || 0), 0);
    const totalScore = challenges.reduce((sum, c) => sum + (c.bestScore || 0), 0);

    return {
      totalChallenges: challenges.length,
      solvedChallenges: solvedCount,
      totalAttempts,
      totalScore,
      successRate: challenges.length > 0 ? (solvedCount / challenges.length) * 100 : 0,
    };
  }),

  // Get recommended challenges based on difficulty
  getRecommended: protectedProcedure
    .input(z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const userChallenges = await db
        .select()
        .from(endgameChallenges)
        .where(eq(endgameChallenges.userId, ctx.user.id));

      const solvedIds = new Set(
        userChallenges.filter(c => c.solved).map(c => c.endgamePositionId)
      );

      let recommended = CLASSIC_ENDGAMES.filter(eg => !solvedIds.has(eg.name as any));

      if (input) {
        recommended = recommended.filter(eg => eg.difficulty === input);
      }

      return recommended.slice(0, 5);
    }),
});
