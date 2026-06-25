import { z } from 'zod';
import { protectedProcedure, publicProcedure, router } from '../_core/trpc';
import { analyzeGame, generateGameCommentary, generatePhaseCommentary } from '../game-analysis';
import { invokeLLM } from '../_core/llm';

export const gameAnalysisRouter = router({
  // Analyze a game and get phase breakdown
  analyzeGame: publicProcedure
    .input(z.object({
      pgn: z.string(),
      playerColor: z.enum(['white', 'black']).optional(),
    }))
    .query(async ({ input }) => {
      try {
        const analysis = analyzeGame(input.pgn);
        return analysis;
      } catch (error) {
        console.error('Game analysis error:', error);
        throw new Error('Failed to analyze game');
      }
    }),

  // Generate commentary for a game
  generateCommentary: publicProcedure
    .input(z.object({
      pgn: z.string(),
      playerColor: z.enum(['white', 'black']).optional(),
    }))
    .query(async ({ input }) => {
      try {
        const analysis = analyzeGame(input.pgn);
        const commentary = generateGameCommentary(analysis);
        return {
          commentary,
          analysis
        };
      } catch (error) {
        console.error('Commentary generation error:', error);
        throw new Error('Failed to generate commentary');
      }
    }),

  // Generate AI-enhanced commentary using LLM
  generateAICommentary: publicProcedure
    .input(z.object({
      pgn: z.string(),
      playerColor: z.enum(['white', 'black']).optional(),
      includeStrategicAdvice: z.boolean().default(true),
    }))
    .query(async ({ input }) => {
      try {
        const analysis = analyzeGame(input.pgn);
        const baseCommentary = generateGameCommentary(analysis);
        
        // Enhance with LLM
        const prompt = `You are a chess coach analyzing a game. Here is the game analysis:

${baseCommentary}

${input.includeStrategicAdvice ? `
Please provide:
1. Key strategic lessons from each phase
2. Specific recommendations for improvement
3. Tactical patterns that appeared
4. Positional concepts demonstrated
` : ''}

Format your response in clear sections with markdown.`;

        const llmResponse = await invokeLLM({
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          model: 'gpt-4o-mini',
        });

        const aiCommentary = typeof llmResponse.choices[0]?.message.content === 'string' 
          ? llmResponse.choices[0].message.content 
          : '';

        return {
          baseCommentary,
          aiCommentary,
          analysis,
          success: true
        };
      } catch (error) {
        console.error('AI commentary generation error:', error);
        throw new Error('Failed to generate AI commentary');
      }
    }),

  // Get detailed phase analysis
  getPhaseAnalysis: publicProcedure
    .input(z.object({
      pgn: z.string(),
      phase: z.enum(['opening', 'middlegame', 'endgame']),
    }))
    .query(async ({ input }) => {
      try {
        const analysis = analyzeGame(input.pgn);
        const phaseAnalysis = analysis.phaseAnalyses.find(pa => pa.phase === input.phase);
        
        if (!phaseAnalysis) {
          throw new Error(`${input.phase} phase not found in game`);
        }

        const commentary = generatePhaseCommentary(phaseAnalysis);
        
        return {
          phaseAnalysis,
          commentary
        };
      } catch (error) {
        console.error('Phase analysis error:', error);
        throw new Error('Failed to analyze phase');
      }
    }),

  // Save game analysis for a user
  saveGameAnalysis: protectedProcedure
    .input(z.object({
      gameId: z.number(),
      pgn: z.string(),
      analysis: z.any(),
      commentary: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        // This would save to database
        // For now, just return success
        return {
          success: true,
          message: 'Game analysis saved'
        };
      } catch (error) {
        console.error('Save analysis error:', error);
        throw new Error('Failed to save analysis');
      }
    }),

  // Get saved analysis for a game
  getGameAnalysis: protectedProcedure
    .input(z.number())
    .query(async ({ ctx, input }) => {
      try {
        // This would fetch from database
        // For now, return empty
        return null;
      } catch (error) {
        console.error('Fetch analysis error:', error);
        throw new Error('Failed to fetch analysis');
      }
    }),

  // Generate recommendations based on analysis
  getRecommendations: publicProcedure
    .input(z.object({
      pgn: z.string(),
      focusArea: z.enum(['opening', 'middlegame', 'endgame', 'all']).optional(),
    }))
    .query(async ({ input }) => {
      try {
        const analysis = analyzeGame(input.pgn);
        const recommendations: string[] = [];

        const phaseAnalyses = input.focusArea === 'all' 
          ? analysis.phaseAnalyses 
          : analysis.phaseAnalyses.filter(pa => pa.phase === input.focusArea);

        for (const phase of phaseAnalyses) {
          recommendations.push(...phase.recommendations);
        }

        return {
          recommendations,
          focusArea: input.focusArea || 'all',
          totalMoves: analysis.totalMoves
        };
      } catch (error) {
        console.error('Recommendations error:', error);
        throw new Error('Failed to generate recommendations');
      }
    }),
});
