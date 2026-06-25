import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import { getDb } from '../db';
import {
  parsePGN,
  validatePGN,
  generatePGN,
  getPGNStatistics,
  importMultiplePGNs,
} from '../pgn-utils';
import { games } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

export const pgnIORouter = router({
  /**
   * Importa um único PGN
   */
  importPGN: protectedProcedure
    .input(
      z.object({
        pgnText: z.string().min(1, 'PGN não pode estar vazio'),
        title: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Valida o PGN
      const validation = validatePGN(input.pgnText);
      if (!validation.valid) {
        throw new Error(`Validação de PGN falhou: ${validation.errors.join(', ')}`);
      }

      // Parse do PGN
      const parsed = parsePGN(input.pgnText);
      const stats = getPGNStatistics(input.pgnText);

      // Salva no banco de dados
      const db = await getDb();
      if (!db) {
        throw new Error('Database não disponível');
      }

      await db.insert(games).values({
        userId: ctx.user.id,
        pgn: input.pgnText,
        title: input.title || `${parsed.metadata.white || 'White'} vs ${parsed.metadata.black || 'Black'}`,
        notes: input.notes || `Importado de PGN. Abertura: ${stats.openingName}`,
        whitePlayer: parsed.metadata.white,
        blackPlayer: parsed.metadata.black,
        result: (parsed.metadata.result as '1-0' | '0-1' | '1/2-1/2' | '*' | null) || '*',
        opening: stats.openingName,
      });

      return {
        success: true,
        gameId: Date.now(),
        stats: {
          totalMoves: stats.totalMoves,
          opening: stats.openingName,
          whitePlayer: parsed.metadata.white,
          blackPlayer: parsed.metadata.black,
          result: parsed.metadata.result,
        },
      };
    }),

  /**
   * Importa múltiplos PGNs de um arquivo
   */
  importMultiplePGNs: protectedProcedure
    .input(
      z.object({
        fileContent: z.string().min(1, 'Arquivo não pode estar vazio'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error('Database não disponível');
      }

      const parsedGames = importMultiplePGNs(input.fileContent);
      const results = [];
      let successCount = 0;
      let errorCount = 0;

      for (const parsed of parsedGames) {
        try {
          // Valida cada PGN
          const validation = validatePGN(generatePGN(parsed.moves, parsed.metadata));
          if (!validation.valid) {
            errorCount++;
            results.push({
              success: false,
              error: validation.errors.join(', '),
            });
            continue;
          }

          // Salva no banco de dados
          await db.insert(games).values({
            userId: ctx.user.id,
            pgn: generatePGN(parsed.moves, parsed.metadata),
            title: `${parsed.metadata.white || 'White'} vs ${parsed.metadata.black || 'Black'}`,
            notes: `Importado em lote. Abertura: ${parsed.metadata.opening || 'Unknown'}`,
            whitePlayer: parsed.metadata.white,
            blackPlayer: parsed.metadata.black,
            result: (parsed.metadata.result as '1-0' | '0-1' | '1/2-1/2' | '*' | null) || '*',
            opening: parsed.metadata.opening,
          });

          successCount++;
          results.push({
            success: true,
            gameId: Date.now(),
          });
        } catch (error) {
          errorCount++;
          results.push({
            success: false,
            error: error instanceof Error ? error.message : 'Erro desconhecido',
          });
        }
      }

      return {
        totalGames: parsedGames.length,
        successCount,
        errorCount,
        results,
      };
    }),

  /**
   * Exporta uma partida em formato PGN
   */
  exportGame: protectedProcedure
    .input(
      z.object({
        gameId: z.number(),
        includeAnnotations: z.boolean().default(true),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error('Database não disponível');
      }

      // Busca a partida
      const gameResult = await db
        .select()
        .from(games)
        .where(eq(games.id, input.gameId))
        .limit(1);

      if (gameResult.length === 0) {
        throw new Error('Partida não encontrada');
      }

      const game = gameResult[0];

      // Verifica permissão
      if (game.userId !== ctx.user.id) {
        throw new Error('Você não tem permissão para exportar esta partida');
      }

      // Usa o PGN já armazenado
      const pgn = game.pgn;
      const parsed = parsePGN(pgn);

      return {
        pgn,
        filename: `${game.title || 'game'}_${new Date().getTime()}.pgn`,
        stats: {
          totalMoves: parsed.moves.length,
          whitePlayer: game.whitePlayer,
          blackPlayer: game.blackPlayer,
          result: game.result,
          opening: game.opening,
        },
      };
    }),

  /**
   * Exporta múltiplas partidas em um arquivo PGN
   */
  exportMultipleGames: protectedProcedure
    .input(
      z.object({
        gameIds: z.array(z.number()),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error('Database não disponível');
      }

      // Busca as partidas
      const gameResults = await db
        .select()
        .from(games)
        .where(eq(games.userId, ctx.user.id));

      const userGames = gameResults.filter(g => input.gameIds.includes(g.id));

      if (userGames.length === 0) {
        throw new Error('Nenhuma partida encontrada');
      }

      // Gera PGNs
      const pgnLines: string[] = [];

      for (const game of userGames) {
        try {
          pgnLines.push(game.pgn);
          pgnLines.push(''); // Linha em branco entre partidas
        } catch (e) {
          // Ignora partidas com erro
        }
      }

      const combinedPGN = pgnLines.join('\n');

      return {
        pgn: combinedPGN,
        filename: `chess-games-export_${new Date().getTime()}.pgn`,
        totalGames: userGames.length,
        totalMoves: userGames.reduce((sum, g) => {
          try {
            const parsed = parsePGN(g.pgn);
            return sum + parsed.moves.length;
          } catch {
            return sum;
          }
        }, 0),
      };
    }),

  /**
   * Preview de PGN antes de importar
   */
  previewPGN: protectedProcedure
    .input(
      z.object({
        pgnText: z.string().min(1, 'PGN não pode estar vazio'),
      })
    )
    .query(({ input }) => {
      const validation = validatePGN(input.pgnText);

      if (!validation.valid) {
        return {
          valid: false,
          errors: validation.errors,
        };
      }

      const parsed = parsePGN(input.pgnText);
      const stats = getPGNStatistics(input.pgnText);

      return {
        valid: true,
        errors: [],
        preview: {
          title: `${parsed.metadata.white || 'White'} vs ${parsed.metadata.black || 'Black'}`,
          opening: stats.openingName,
          totalMoves: stats.totalMoves,
          whiteElo: parsed.metadata.whiteElo,
          blackElo: parsed.metadata.blackElo,
          firstMoves: parsed.moves.slice(0, 10).join(' '),
        },
      };
    }),

  /**
   * Obtém estatísticas de um PGN
   */
  getPGNStats: protectedProcedure
    .input(
      z.object({
        pgnText: z.string().min(1, 'PGN não pode estar vazio'),
      })
    )
    .query(({ input }) => {
      try {
        const stats = getPGNStatistics(input.pgnText);
        const parsed = parsePGN(input.pgnText);

        return {
          success: true,
          stats: {
            totalMoves: stats.totalMoves,
            opening: stats.openingName,
            averageElo: Math.round(stats.averageElo),
            result: parsed.metadata.result || '*',
            whitePlayer: parsed.metadata.white,
            blackPlayer: parsed.metadata.black,
          },
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Erro ao processar PGN',
        };
      }
    }),
});

export type PGNIORouter = typeof pgnIORouter;
