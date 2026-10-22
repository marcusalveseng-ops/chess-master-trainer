import { Chess } from 'chess.js';
import { analyzePosition } from '../shared/chess-coach.ts';
import { positionAt } from '../shared/chess-position.ts';
import { mkdirSync, writeFileSync, appendFileSync, renameSync } from 'node:fs';
import assert from 'node:assert/strict';

// node scripts/chess-soak.mjs --minutes 210 --seed 20261021
const arg = (name, fallback) => process.argv.includes(name) ? process.argv[process.argv.indexOf(name) + 1] : fallback;
const minutes = Number(arg('--minutes', '2'));
let seed = Number(arg('--seed', '20261021')) >>> 0;
if (!Number.isFinite(minutes) || minutes <= 0 || minutes > 360) throw new Error('minutes must be in (0, 360]');
const initialSeed = seed;
const random = () => { seed = (Math.imul(1664525, seed) + 1013904223) >>> 0; return seed / 4294967296; };
const started = Date.now();
const deadline = started + minutes * 60000;
const out = String(arg('--output', 'test-results/soak'));
mkdirSync(out, { recursive: true });
const report = { startedAt: new Date(started).toISOString(), updatedAt: '', status: 'running', seed: initialSeed, minutes, games: 0, plies: 0, analyses: 0, mates: 0, draws: 0, truncated: 0, failures: 0, maxAnalysisMs: 0 };
function checkpoint() {
  report.updatedAt = new Date().toISOString();
  writeFileSync(`${out}/progress.tmp`, JSON.stringify(report, null, 2));
  renameSync(`${out}/progress.tmp`, `${out}/progress.json`);
}
checkpoint();
while (Date.now() < deadline) {
  const gameSeed = seed;
  const game = new Chess();
  try {
    for (let ply = 0; ply < 180 && !game.isGameOver() && Date.now() < deadline; ply++) {
      const legal = game.moves();
      let move = legal[Math.floor(random() * legal.length)];
      if (ply % 4 === 0) {
        const before = Date.now();
        const analysis = analyzePosition(game.fen(), { pgn: game.pgn(), maxDepth: 2, timeMs: 100 });
        report.maxAnalysisMs = Math.max(report.maxAnalysisMs, Date.now() - before);
        for (const candidate of analysis.candidates) {
          assert(legal.includes(candidate.san));
          const branch = new Chess(game.fen());
          for (const san of candidate.line) assert(branch.move(san));
          assert(Number.isFinite(candidate.score));
        }
        if (analysis.candidates.length && random() < 0.7) move = analysis.candidates[0].san;
        report.analyses++;
      }
      assert(game.move(move));
      report.plies++;
      const replay = new Chess(); replay.loadPgn(game.pgn());
      assert.equal(replay.fen(), game.fen());
      if (ply % 12 === 0) {
        const target = Math.floor(random() * game.history().length);
        const prior = positionAt(game.pgn(), target);
        assert.equal(prior.history().length, target);
        assert.equal(prior.fen(), target ? game.history({ verbose: true })[target - 1].after : new Chess().fen());
      }
    }
    report.games++;
    if (game.isCheckmate()) report.mates++;
    else if (game.isDraw()) report.draws++;
    else report.truncated++;
  } catch (error) {
    report.failures++;
    appendFileSync(`${out}/failures.jsonl`, JSON.stringify({ gameSeed, fen: game.fen(), pgn: game.pgn(), error: String(error), stack: error.stack }) + '\n');
    report.status = 'failed'; checkpoint(); process.exitCode = 1; break;
  }
  checkpoint();
  // Yield between games so the bounded soak does not monopolize the workstation.
  await new Promise(resolve => setTimeout(resolve, 200));
}
if (!report.failures) report.status = 'completed';
checkpoint();
console.log(JSON.stringify(report));
