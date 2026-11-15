import { writeFile } from 'node:fs/promises';
import { Readable, Transform } from 'node:stream';
import { createInterface } from 'node:readline';
import { createZstdDecompress } from 'node:zlib';
import { Chess } from 'chess.js';
import { exerciseStages, exerciseThemes, moveUci } from '../standalone/exercise-rules.js';

const source = 'https://database.lichess.org/lichess_db_puzzle.csv.zst';
const countPerGroup = 15;
const controller = new AbortController();
// Sample a bounded prefix; the committed data is used by all normal builds.
const response = await fetch(source, {
  signal: controller.signal, headers: { Range: 'bytes=0-4194303' },
});
if (response.status !== 206 || !response.body || !response.headers.get('content-range')?.startsWith('bytes 0-')) {
  controller.abort();
  throw new Error('O Lichess não retornou o intervalo solicitado (HTTP ' + response.status + ').');
}
const input = Readable.fromWeb(response.body);
let prefix = Buffer.alloc(0);
const frames = new Transform({
  transform(chunk, _encoding, callback) {
    if (prefix === null) return callback(null, chunk);
    prefix = Buffer.concat([prefix, chunk]);
    while (prefix.length >= 8) {
      if (prefix.readUInt32LE(0) >>> 4 !== 0x184d2a5) {
        const data = prefix;
        prefix = null;
        return callback(null, data);
      }
      const size = 8 + prefix.readUInt32LE(4);
      if (prefix.length < size) break;
      prefix = prefix.subarray(size);
    }
    callback();
  },
});
const csv = input.pipe(frames).pipe(createZstdDecompress());
input.on('error', error => frames.destroy(error));
frames.on('error', error => csv.destroy(error));
const lines = createInterface({ input: csv, crlfDelay: Infinity });
const groups = new Map(), positions = new Set(), puzzles = [];
try {
  for await (const row of lines) {
    const [id, fen, sequence, ratingText, , popularity, plays, tagText] = row.split(',');
    const rating = Number(ratingText);
    if (!tagText || !Number.isInteger(rating) || rating < 800 || rating > 2400 || Number(popularity) < 75 || Number(plays) < 30) continue;
    const tags = tagText.split(' ');
    const stage = Object.keys(exerciseStages).find(key => tags.includes(key));
    const themes = Object.keys(exerciseThemes).filter(key => tags.includes(key));
    if (!stage || !themes.length) continue;
    const band = rating < 1300 ? 0 : rating < 1800 ? 1 : 2;
    const group = stage + band;
    const motifs = groups.get(group) || [];
    if (motifs.length >= countPerGroup || motifs.filter(theme => theme === themes[0]).length >= 6) continue;
    const [setup, ...moves] = sequence.split(' ');
    if (!moves.length || moves.length % 2 !== 1 || moves.length > 13) continue;
    try {
      const game = new Chess(fen);
      moveUci(game, setup);
      const start = game.fen(), position = start.split(' ').slice(0, 4).join(' ');
      if (positions.has(position)) continue;
      moves.forEach(uci => moveUci(game, uci));
      if (themes.includes('mate') && !game.isCheckmate()) continue;
      puzzles.push({ id, fen: start, moves, stage, themes, rating });
      positions.add(position);
      groups.set(group, [...motifs, themes[0]]);
      if (puzzles.length === 9 * countPerGroup) break;
    } catch {
      // Never embed a line that fails legal replay.
    }
  }
} catch (error) {
  if (error.code !== 'Z_BUF_ERROR') throw error;
} finally {
  lines.close();
  input.destroy();
  frames.destroy();
  csv.destroy();
  controller.abort();
}
if (puzzles.length !== 9 * countPerGroup) {
  throw new Error('A amostra não cobriu todos os grupos: ' + JSON.stringify([...groups].map(([key, rows]) => [key, rows.length])));
}
puzzles.sort((a, b) => a.rating - b.rating || a.id.localeCompare(b.id));
const target = new URL('../standalone/exercises.json', import.meta.url);
await writeFile(target, '[\n' + puzzles.map(puzzle => '  ' + JSON.stringify(puzzle)).join(',\n') + '\n]\n');
console.log(`${puzzles.length} exercícios validados; fonte ${source}; ETag ${response.headers.get('etag')}`);
