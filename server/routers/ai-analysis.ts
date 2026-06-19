import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import { invokeLLM } from '../_core/llm';
import { TRPCError } from '@trpc/server';

export const aiAnalysisRouter = router({
  // Get strategic tips for current position
  getStrategicTips: protectedProcedure
    .input(z.object({
      fen: z.string(),
      moveHistory: z.array(z.string()).optional(),
      gamePhase: z.enum(['opening', 'middlegame', 'endgame']).optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        const prompt = `You are a chess strategy expert. Analyze this chess position and provide strategic advice.

FEN: ${input.fen}
Game Phase: ${input.gamePhase || 'unknown'}

Provide concise strategic guidance on:
1. Whether to force trades or maintain material
2. Positional vs tactical approach
3. Piece preservation (bishops, knights, queen)
4. Key strategic themes

Format your response as a JSON object with these fields:
- tradingAdvice: string (when to force/avoid trades)
- approach: string (positional or tactical)
- pieceStrategy: string (which pieces to preserve)
- keyThemes: string[] (main strategic ideas)
- recommendation: string (primary move strategy)`;

        const response = await invokeLLM({
          messages: [
            {
              role: 'system',
              content: 'You are a chess strategy expert providing analysis in JSON format.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: 'chess_strategy',
              strict: false,
              schema: {
                type: 'object',
                properties: {
                  tradingAdvice: { type: 'string' },
                  approach: { type: 'string' },
                  pieceStrategy: { type: 'string' },
                  keyThemes: { type: 'array', items: { type: 'string' } },
                  recommendation: { type: 'string' },
                },
                required: ['tradingAdvice', 'approach', 'pieceStrategy', 'recommendation'],
              },
            },
          },
        });

        const content = response.choices[0]?.message?.content;
        if (!content || typeof content !== 'string') {
          throw new Error('No response from LLM');
        }

        return JSON.parse(content);
      } catch (error) {
        console.error('AI analysis error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to generate strategic analysis',
        });
      }
    }),

  // Generate commentary for a game move
  generateMoveCommentary: protectedProcedure
    .input(z.object({
      fen: z.string(),
      move: z.string(),
      previousFen: z.string().optional(),
      gamePhase: z.enum(['opening', 'middlegame', 'endgame']),
    }))
    .mutation(async ({ input }) => {
      try {
        const prompt = `You are a chess commentator. Analyze this move and provide brief commentary.

Position before: ${input.previousFen || 'starting position'}
Move: ${input.move}
Position after: ${input.fen}
Game Phase: ${input.gamePhase}

Provide a brief (2-3 sentences) commentary on:
- Why this move was played
- Its strategic significance
- Potential consequences

Format as JSON with field: commentary`;

        const response = await invokeLLM({
          messages: [
            {
              role: 'system',
              content: 'You are a chess commentator providing brief move analysis.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: 'move_commentary',
              strict: false,
              schema: {
                type: 'object',
                properties: {
                  commentary: { type: 'string' },
                },
                required: ['commentary'],
              },
            },
          },
        });

        const content = response.choices[0]?.message?.content;
        if (!content || typeof content !== 'string') {
          throw new Error('No response from LLM');
        }

        return JSON.parse(content);
      } catch (error) {
        console.error('Commentary generation error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to generate move commentary',
        });
      }
    }),

  // Analyze game phases (opening, middlegame, endgame)
  analyzeGamePhase: protectedProcedure
    .input(z.object({
      pgn: z.string(),
      moveNumber: z.number(),
    }))
    .mutation(async ({ input }) => {
      try {
        const prompt = `Analyze this chess game at move ${input.moveNumber}.

PGN: ${input.pgn}

Identify and explain:
1. Current game phase (opening/middlegame/endgame)
2. Key strategic themes
3. Critical decisions made so far
4. Upcoming strategic challenges

Format as JSON with fields:
- phase: string (opening/middlegame/endgame)
- themes: string[] (key strategic themes)
- analysis: string (detailed analysis)
- nextSteps: string (what to focus on next)`;

        const response = await invokeLLM({
          messages: [
            {
              role: 'system',
              content: 'You are a chess analyst providing game phase analysis.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: 'game_phase_analysis',
              strict: false,
              schema: {
                type: 'object',
                properties: {
                  phase: { type: 'string' },
                  themes: { type: 'array', items: { type: 'string' } },
                  analysis: { type: 'string' },
                  nextSteps: { type: 'string' },
                },
                required: ['phase', 'themes', 'analysis', 'nextSteps'],
              },
            },
          },
        });

        const content = response.choices[0]?.message?.content;
        if (!content || typeof content !== 'string') {
          throw new Error('No response from LLM');
        }

        return JSON.parse(content);
      } catch (error) {
        console.error('Game phase analysis error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to analyze game phase',
        });
      }
    }),

  // Get opening recommendations
  getOpeningRecommendations: protectedProcedure
    .input(z.object({
      opening: z.string(),
      eco: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        const prompt = `You are a chess opening expert. Provide recommendations for the ${input.opening} opening${input.eco ? ` (ECO: ${input.eco})` : ''}.

Provide:
1. Key ideas and plans
2. Typical pawn structures
3. Piece placement principles
4. Common traps to avoid
5. Recommended study games

Format as JSON with fields:
- keyIdeas: string[]
- pawnStructure: string
- piecePlacement: string
- trapsToAvoid: string[]
- studyRecommendations: string[]`;

        const response = await invokeLLM({
          messages: [
            {
              role: 'system',
              content: 'You are a chess opening expert providing opening recommendations.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: 'opening_recommendations',
              strict: false,
              schema: {
                type: 'object',
                properties: {
                  keyIdeas: { type: 'array', items: { type: 'string' } },
                  pawnStructure: { type: 'string' },
                  piecePlacement: { type: 'string' },
                  trapsToAvoid: { type: 'array', items: { type: 'string' } },
                  studyRecommendations: { type: 'array', items: { type: 'string' } },
                },
                required: ['keyIdeas', 'pawnStructure', 'piecePlacement'],
              },
            },
          },
        });

        const content = response.choices[0]?.message?.content;
        if (!content || typeof content !== 'string') {
          throw new Error('No response from LLM');
        }

        return JSON.parse(content);
      } catch (error) {
        console.error('Opening recommendations error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to generate opening recommendations',
        });
      }
    }),
});
