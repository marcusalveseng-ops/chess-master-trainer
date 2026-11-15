import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { sdk } from "./_core/sdk";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { gamesRouter } from "./routers/games";
import { chessApiRouter } from "./routers/chess-api";
import { aiAnalysisRouter } from "./routers/ai-analysis";
import { gamePersistenceRouter } from './routers/game-persistence';
import { pgnIORouter } from './routers/pgn-io';
import { endgameRouter } from './routers/endgame';
import { gameAnalysisRouter } from './routers/game-analysis';

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(async ({ ctx }) => {
      await sdk.revokeRequestSession(ctx.req);
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, cookieOptions);
      return {
        success: true,
      } as const;
    }),
  }),

  games: gamesRouter,
  chessApi: chessApiRouter,
  aiAnalysis: aiAnalysisRouter,
  gamePersistence: gamePersistenceRouter,
  pgnIO: pgnIORouter,
  endgame: endgameRouter,
  gameAnalysis: gameAnalysisRouter,
});

export type AppRouter = typeof appRouter;
