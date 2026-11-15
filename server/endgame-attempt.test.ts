import { Chess } from "chess.js";
import { it, expect } from "vitest";
import { gradeEndgameAttempt } from "./endgame-attempt";

const start = "7k/5K2/6Q1/8/8/8/8/8 w - - 0 1";
it("scores a legal mate from the assigned position and rejects a forged PGN result", () => {
  const game = new Chess(start);
  game.move("Qg7#");
  expect(gradeEndgameAttempt(start, "Checkmate", game.pgn())).toEqual({
    result: "win", movesPlayed: 1, score: 100, solved: true,
  });
  const stalemate = new Chess(start);
  stalemate.move("Qb1");
  stalemate.setHeader("Result", "1-0");
  expect(gradeEndgameAttempt(start, "Checkmate", stalemate.pgn())).toMatchObject({
    result: "draw", score: 0, solved: false,
  });
  expect(() => gradeEndgameAttempt(start, "Checkmate", "1. e4 1-0"))
    .toThrow("posição inicial incorreta");
});
