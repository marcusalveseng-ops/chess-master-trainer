import { Chess } from "chess.js";
import { analyzePosition } from "../shared/chess-coach.ts";

// One request owns one turn. Navigation or a new game invalidates its ticket.
export class BotOpponent {
  constructor(engine, play, status) {
    this.engine = engine;
    this.play = play;
    this.status = status;
    this.ticket = 0;
    this.pending = null;
    this.timer = null;
  }
  cancel() {
    this.ticket++;
    clearTimeout(this.timer);
    if (this.pending) this.engine.stop();
    this.pending = null;
  }
  request(game, startFen, level = "normal") {
    const pgn = game.pgn();
    if (this.pending?.pgn === pgn) return;
    this.cancel();
    const key = "bot:" + this.ticket;
    this.pending = { key, pgn, fen: game.fen() };
    this.status("Bot pensando…");
    const fallback = () => {
      if (this.pending?.key !== key) return;
      const result = analyzePosition(game.fen(), {
        pgn,
        maxDepth: level === "easy" ? 1 : 2,
        timeMs: 160,
        maxNodes: 4000,
      });
      this.finish(key, result.candidates[0]?.san || game.moves()[0]);
    };
    this.timer = setTimeout(fallback, this.engine.ready ? 2500 : 400);
    this.engine.request({
      key,
      purpose: "bot",
      fen: game.fen(),
      pgn,
      expected: 1,
      depth: level === "easy" ? 2 : level === "hard" ? 14 : 8,
      history: {
        startFen,
        moves: game
          .history({ verbose: true })
          .map(m => m.from + m.to + (m.promotion || "")),
      },
    });
  }
  receive(result) {
    if (result.key !== this.pending?.key) return;
    const u = result.lines[0]?.uci[0];
    if (!u) return;
    try {
      const g = new Chess(result.fen);
      const move = g.move({
        from: u.slice(0, 2),
        to: u.slice(2, 4),
        promotion: u[4],
      });
      // Leave the UCI callback before rendering/requesting the next position.
      clearTimeout(this.timer);
      this.timer = setTimeout(() => this.finish(result.key, move.san), 0);
    } catch {
      /* The bounded fallback remains available for invalid output. */
    }
  }
  finish(key, san) {
    if (key !== this.pending?.key || !san) return;
    const fen = this.pending.fen;
    this.cancel();
    this.play(san, fen);
  }
}
