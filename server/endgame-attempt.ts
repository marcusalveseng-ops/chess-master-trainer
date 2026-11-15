import { Chess } from "chess.js";
import { TRPCError } from "@trpc/server";
import { PGN_MAX_PLIES } from "@shared/pgn-limits";

export function gradeEndgameAttempt(fen: string, objective: string | null, pgn: string) {
  try {
    const initial = new Chess(fen);
    const game = new Chess();
    game.loadPgn(pgn, { strict: true });
    const history = game.history({ verbose: true });
    if (!history.length || history.length > PGN_MAX_PLIES || history[0].before !== initial.fen()) {
      throw new Error("Attempt starts from the wrong position");
    }
    const player = initial.turn();
    const result: "win" | "loss" | "draw" | "incomplete" = game.isCheckmate() ? (game.turn() !== player ? "win" : "loss")
      : game.isDraw() ? "draw" : "incomplete";
    const description = objective ?? "";
    const solved = /^hold the draw/i.test(description) ? result === "draw"
      : /promot/i.test(description)
        ? history.some(move => move.color === player &&
            (/to a queen/i.test(description) ? move.promotion === "q" : Boolean(move.promotion)))
        : result === "win";
    return { result, movesPlayed: history.length, score: solved ? 100 : 0, solved };
  } catch {
    throw new TRPCError({ code: "BAD_REQUEST", message: "PGN inválido ou posição inicial incorreta." });
  }
}
