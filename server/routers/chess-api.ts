import { z } from 'zod';
import { publicProcedure, router } from '../_core/trpc';
import axios from 'axios';
import { TRPCError } from '@trpc/server';

// Lichess API client
const lichessClient = axios.create({
  baseURL: 'https://lichess.org/api',
  headers: {
    'Accept': 'application/json',
  },
});

// Chess.com API client
const chessComClient = axios.create({
  baseURL: 'https://api.chess.com/pub',
  headers: {
    'Accept': 'application/json',
  },
});

export const chessApiRouter = router({
  // Get opening statistics from Lichess
  getOpeningStats: publicProcedure
    .input(z.object({
      fen: z.string(),
      speeds: z.array(z.string()).optional(),
      ratings: z.array(z.number()).optional(),
    }))
    .query(async ({ input }) => {
      try {
        const params = new URLSearchParams();
        params.append('fen', input.fen);
        
        if (input.speeds?.length) {
          params.append('speeds', input.speeds.join(','));
        }
        if (input.ratings?.length) {
          params.append('ratings', input.ratings.join(','));
        }

        const response = await lichessClient.get(`/opening?${params.toString()}`);
        return response.data;
      } catch (error) {
        console.error('Lichess API error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch opening statistics',
        });
      }
    }),

  // Search games by opening
  searchGamesByOpening: publicProcedure
    .input(z.object({
      eco: z.string(),
      limit: z.number().default(20),
    }))
    .query(async ({ input }) => {
      try {
        // This would typically call a database or external API
        // For now, returning mock data
        return {
          eco: input.eco,
          games: [],
          total: 0,
        };
      } catch (error) {
        console.error('Search error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to search games',
        });
      }
    }),

  // Get player profile from Chess.com
  getPlayerProfile: publicProcedure
    .input(z.object({
      username: z.string(),
    }))
    .query(async ({ input }) => {
      try {
        const response = await chessComClient.get(`/player/${input.username}`);
        return response.data;
      } catch (error) {
        console.error('Chess.com API error:', error);
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Player not found',
        });
      }
    }),

  // Get player games from Chess.com
  getPlayerGames: publicProcedure
    .input(z.object({
      username: z.string(),
      year: z.number().optional(),
      month: z.number().optional(),
    }))
    .query(async ({ input }) => {
      try {
        let url = `/player/${input.username}/games`;
        
        if (input.year && input.month) {
          url += `/${input.year}/${String(input.month).padStart(2, '0')}`;
        }

        const response = await chessComClient.get(url);
        return response.data;
      } catch (error) {
        console.error('Chess.com API error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch player games',
        });
      }
    }),

  // Get opening explorer data from Lichess
  getOpeningExplorer: publicProcedure
    .input(z.object({
      opening: z.string(),
      limit: z.number().default(50),
    }))
    .query(async ({ input }) => {
      try {
        // Mock data for opening explorer
        // In production, this would call Lichess API with proper parameters
        return {
          opening: input.opening,
          moves: [
            { san: 'e4', frequency: 0.45, whiteWins: 0.52, draws: 0.35, blackWins: 0.13 },
            { san: 'd4', frequency: 0.35, whiteWins: 0.51, draws: 0.38, blackWins: 0.11 },
            { san: 'c4', frequency: 0.15, whiteWins: 0.50, draws: 0.40, blackWins: 0.10 },
            { san: 'Nf3', frequency: 0.05, whiteWins: 0.48, draws: 0.42, blackWins: 0.10 },
          ],
        };
      } catch (error) {
        console.error('Opening explorer error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch opening explorer data',
        });
      }
    }),

  // Get famous games by opening
  getFamousGamesByOpening: publicProcedure
    .input(z.object({
      opening: z.string(),
      limit: z.number().default(10),
    }))
    .query(async ({ input }) => {
      try {
        // Mock data for famous games
        // In production, this would query a database of historical games
        return {
          opening: input.opening,
          games: [
            {
              id: 1,
              white: 'Bobby Fischer',
              black: 'Boris Spassky',
              result: '1-0',
              year: 1972,
              event: 'World Championship',
            },
          ],
        };
      } catch (error) {
        console.error('Famous games error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch famous games',
        });
      }
    }),
});
