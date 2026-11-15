// Run the bundled engine with its own UCI callbacks and cancellable timers.
export function createInlineStockfish(factory) {
  let closed = false,
    receive;
  const timers = new Set();
  const later = (callback, delay = 0, ...args) => {
    if (closed) return;
    const id = setTimeout(() => {
      timers.delete(id);
      if (!closed) callback(...args);
    }, delay);
    timers.add(id);
    return id;
  };
  const cancel = id => {
    clearTimeout(id);
    timers.delete(id);
  };
  const port = {
    onmessage: null,
    onerror: null,
    postMessage(data) {
      later(() => {
        try {
          receive(data);
        } catch (error) {
          port.onerror?.(error);
        }
      });
    },
    terminate() {
      closed = true;
      for (const id of timers) clearTimeout(id);
      timers.clear();
    },
  };
  try {
    receive = factory(
      data => later(() => port.onmessage?.({ data })),
      () => port.terminate(),
      later,
      cancel
    );
  } catch (error) {
    port.terminate();
    throw error;
  }
  return port;
}

export class StockfishCoach {
  constructor(onAnalysis, onStatus) {
    this.onAnalysis = onAnalysis;
    this.onStatus = onStatus;
    this.worker = null;
    this.active = null;
    this.pending = null;
    this.ready = false;
    this.lines = new Map();
    this.completed = new Map();
    this.timer = null;
    this.closed = false;
    this.cancelled = false;
  }
  init(factory) {
    try {
      if (this.closed) return;
      this.worker = createInlineStockfish(factory);
      this.worker.onmessage = e => this.message(String(e.data));
      this.worker.onerror = () => this.fail();
      this.worker.postMessage("uci");
      this.timer = setTimeout(() => this.fail(), 20000);
    } catch {
      this.fail();
    }
  }
  fail() {
    clearTimeout(this.timer);
    this.worker?.terminate();
    this.worker = null;
    this.ready = false;
    this.active = null;
    this.pending = null;
    if (!this.closed)
      this.onStatus("Stockfish indisponível. Assistente local ativo.");
  }
  request(position) {
    this.pending = position;
    if (!this.ready) return;
    if (this.active) {
      this.worker.postMessage("stop");
      return;
    }
    this.start();
  }
  start() {
    if (!this.pending || !this.ready) return;
    this.active = this.pending;
    this.pending = null;
    this.lines.clear();
    this.completed.clear();
    this.cancelled = false;
    const { depth, history } = this.active;
    this.worker.postMessage(
      "setoption name MultiPV value " + (this.active.expected || 3)
    );
    this.worker.postMessage(
      "position fen " + history.startFen + " moves " + history.moves.join(" ")
    );
    this.worker.postMessage("go depth " + depth + " movetime 220");
  }
  message(text) {
    if (text === "uciok") {
      this.worker.postMessage("isready");
      return;
    }
    if (text === "readyok") {
      clearTimeout(this.timer);
      this.ready = true;
      this.onStatus(
        "Stockfish pronto · três variantes · modo compatível com Tess"
      );
      this.start();
      return;
    }
    if (text.startsWith("bestmove")) {
      if (this.active && !this.pending && !this.cancelled) {
        if (this.active.purpose === "bot")
          this.onAnalysis({
            ...this.active,
            lines: [{ uci: [text.split(/\s+/)[1]] }],
          });
        else this.publish();
      }
      this.active = null;
      this.start();
      return;
    }
    if (
      !this.active ||
      this.pending ||
      this.cancelled ||
      !text.startsWith("info ") ||
      !text.includes(" pv ")
    )
      return;
    const score = text.match(/ score (cp|mate) (-?\d+)/);
    const depth = Number(text.match(/ depth (\d+)/)?.[1] || 0);
    if (!score || / (lowerbound|upperbound)(?: |$)/.test(text)) return;
    const rank = Number(text.match(/ multipv (\d+)/)?.[1] || 1);
    if (rank === 1 || !this.lines.has(depth)) this.lines.set(depth, new Map());
    this.lines
      .get(depth)
      .set(rank, {
        depth,
        kind: score[1],
        score: Number(score[2]),
        uci: text.split(" pv ")[1].trim().split(/\s+/).slice(0, 10),
      });
    const expected = this.active.expected || 3;
    const batch = Array.from({ length: expected }, (_, i) =>
      this.lines.get(depth).get(i + 1)
    );
    if (
      batch.every(Boolean) &&
      new Set(batch.map(line => line.uci[0])).size === expected
    )
      this.completed.set(depth, batch);
  }
  publish() {
    // Equal-depth alternatives only; partial MultiPV iterations are not compared.
    const completed = [...this.completed.entries()].sort((a, b) => b[0] - a[0]);
    if (!completed.length) return;
    const [depth, lines] = completed[0];
    this.onAnalysis({ ...this.active, lines, depth });
  }
  stop() {
    this.pending = null;
    this.cancelled = true;
    if (this.active) this.worker?.postMessage("stop");
  }
  dispose() {
    this.closed = true;
    clearTimeout(this.timer);
    this.worker?.terminate();
  }
}
