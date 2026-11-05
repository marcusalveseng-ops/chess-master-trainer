import { Chess } from "chess.js";
import { positionAt } from "../shared/chess-position.ts";
import { explainCandidate } from "../shared/coach-explanation.ts";
import { analyzePosition } from "../shared/chess-coach.ts";
import { StockfishCoach } from "./engine.js";
import pieces from "./pieces.json";

const $ = id => document.getElementById(id);
const PIECES = {
  p: "peão",
  n: "cavalo",
  b: "bispo",
  r: "torre",
  q: "dama",
  k: "rei",
};
let moves = [],
  ply = 0,
  flipped = false,
  selected = null,
  initialFen = new Chess().fen();
let headers = {
  White: "Brancas",
  Black: "Pretas",
  Result: "*",
  Event: "Partida casual",
};
let preview = null,
  analysisKey = "",
  timer = null,
  currentOrigin = "",
  db = [];
const engine = new StockfishCoach(showStockfish, text => {
  $("sfstatus").textContent = text;
});
function notice(message = "") {
  $("notice").textContent = message;
}
function record(until = moves.length) {
  const g = new Chess(initialFen);
  for (const [key, value] of Object.entries(headers)) g.setHeader(key, value);
  moves.slice(0, until).forEach(move => g.move(move));
  return g;
}
function cur() {
  return preview ? positionAt(preview.pgn, preview.ply) : record(ply);
}
function posAt(n) {
  return record(n);
}
function tab(i) {
  document.querySelectorAll(".tabs button").forEach((b, k) => {
    b.classList.toggle("on", k === i);
    b.setAttribute("aria-selected", String(k === i));
    b.tabIndex = k === i ? 0 : -1;
  });
  document.querySelectorAll(".main-nav button").forEach(b => {
    const active = Number(b.dataset.panel) === i;
    b.classList.toggle("active", active);
    if (active) b.setAttribute("aria-current", "page");
    else b.removeAttribute("aria-current");
  });
  for (let k = 0; k < 4; k++) {
    $("p" + k).classList.toggle("on", k === i);
    $("p" + k).hidden = k !== i;
  }
  $("panel-title").textContent = [
    "Seu assistente de xadrez",
    "Biblioteca de partidas",
    "Suas partidas salvas",
    "Importar e exportar",
  ][i];
  $("panel-subtitle").textContent = [
    "Veja possibilidades antes de decidir.",
    "Aprenda com cada lance dos mestres.",
    "Guarde seus estudos e acompanhe seus jogos.",
    "Leve suas partidas para onde quiser.",
  ][i];
}
function tabTo(i) {
  document.querySelectorAll(".tabs button")[i].click();
}
function pieceImage(piece) {
  const img = document.createElement("img");
  img.src = pieces[piece.color + piece.type];
  img.alt = "";
  img.draggable = false;
  return img;
}
function renderPlayers(c) {
  const history = c.history({ verbose: true });
  for (const [id, color] of [
    ["player-top", flipped ? "w" : "b"],
    ["player-bottom", flipped ? "b" : "w"],
  ]) {
    const row = $(id);
    row.querySelector(".player-name").textContent =
      headers[color === "w" ? "White" : "Black"] ||
      (color === "w" ? "Brancas" : "Pretas");
    row.querySelector(".avatar").classList.toggle("white", color === "w");
    row.querySelector(".turn-badge").textContent =
      !c.isGameOver() && c.turn() === color ? "Sua vez" : "";
    const captured = row.querySelector(".captured");
    captured.replaceChildren();
    const taken = history.filter(m => m.color === color && m.captured);
    taken.forEach(m =>
      captured.appendChild(
        pieceImage({ color: color === "w" ? "b" : "w", type: m.captured })
      )
    );
    captured.setAttribute(
      "aria-label",
      taken.length
        ? "Capturas: " + taken.map(m => PIECES[m.captured]).join(", ")
        : "Nenhuma captura"
    );
  }
}
function render() {
  const c = cur();
  $("board").replaceChildren();
  const last = c.history({ verbose: true }).at(-1);
  const legal = selected ? c.moves({ square: selected, verbose: true }) : [];
  for (let i = 0; i < 64; i++) {
    const row = Math.floor(i / 8),
      col = i % 8,
      r = flipped ? row : 7 - row,
      f = flipped ? 7 - col : col,
      sq = "abcdefgh"[f] + (r + 1);
    const d = document.createElement("button");
    d.type = "button";
    d.className = "sq " + ((f + r) % 2 ? "l" : "d");
    d.setAttribute("aria-label", sq);
    d.setAttribute("aria-pressed", String(sq === selected));
    if (sq === selected) d.classList.add("sel");
    if (last && (sq === last.from || sq === last.to)) d.classList.add("last");
    if (legal.some(m => m.to === sq)) d.classList.add("tgt");
    const p = c.get(sq);
    d.setAttribute(
      "aria-description",
      p
        ? PIECES[p.type] +
            " " +
            (p.color === "w" ? "das brancas" : "das pretas")
        : "Casa vazia"
    );
    if (p) {
      d.appendChild(pieceImage(p));
      d.classList.add("occupied");
      if (p.type === "k" && p.color === c.turn() && c.isCheck())
        d.classList.add("check");
    }
    for (const [show, value, kind] of [
      [col === 0, r + 1, "rank"],
      [row === 7, "abcdefgh"[f], "file"],
    ])
      if (show) {
        const coordinate = document.createElement("span");
        coordinate.className = "coord " + kind;
        coordinate.textContent = value;
        coordinate.setAttribute("aria-hidden", "true");
        d.appendChild(coordinate);
      }
    d.onclick = () => clickSq(sq);
    d.disabled = !!preview || c.isGameOver();
    $("board").appendChild(d);
  }
  const st = c.isCheckmate()
    ? "Xeque-mate!"
    : c.isStalemate()
      ? "Empate por afogamento."
      : c.isDraw()
        ? "Empate."
        : (c.turn() === "w" ? "Brancas" : "Pretas") +
          " jogam" +
          (c.isCheck() ? " — xeque!" : "");
  $("status").textContent =
    st +
    " • " +
    (preview
      ? "Explorando variante " + preview.ply + "/" + preview.total
      : "lance " + ply + "/" + moves.length);
  $("return-main").hidden = !preview;
  renderPlayers(c);
  const shownPly = preview ? preview.ply : ply,
    total = preview ? preview.total : moves.length;
  $("first-move").disabled = $("previous-move").disabled = shownPly === 0;
  $("next-move").disabled = $("last-move").disabled = shownPly === total;
  $("move-counter").textContent = total
    ? shownPly + " / " + total + " meios-lances"
    : "Posição inicial";
  $("moves").replaceChildren();
  const all = (preview ? ChessFromPgn(preview.pgn) : record()).history({
    verbose: true,
  });
  all.forEach((move, i) => {
    const fullmove = move.before.split(" ")[5];
    if (move.color === "w" || i === 0) {
      const n = document.createElement("b");
      n.textContent = fullmove + ".";
      $("moves").appendChild(n);
      if (move.color === "b")
        $("moves").appendChild(document.createElement("span"));
    }
    const item = document.createElement("button");
    item.textContent = move.san;
    item.className = i === shownPly - 1 ? "cur" : "";
    item.setAttribute(
      "aria-label",
      "Ir para " + fullmove + (move.color === "w" ? ". " : "... ") + move.san
    );
    if (i === shownPly - 1) item.setAttribute("aria-current", "step");
    item.onclick = () => go(i + 1);
    $("moves").appendChild(item);
  });
  if (!all.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "Escolha uma peça e uma casa para começar.";
    $("moves").appendChild(empty);
  }
  $("promotion").hidden = true;
  if (!preview) {
    try {
      localStorage.setItem(
        "xsf_current",
        JSON.stringify({ pgn: record().pgn(), ply })
      );
    } catch {
      notice(
        "Não foi possível salvar automaticamente neste navegador. Exporte o PGN para preservar a partida."
      );
    }
  }
  updateAnalysis();
}
function ChessFromPgn(pgn) {
  const g = new Chess();
  g.loadPgn(pgn);
  return g;
}
function clickSq(sq) {
  if (preview) return;
  const c = cur();
  if (c.isGameOver()) return;
  const options = selected
    ? c.moves({ square: selected, verbose: true }).filter(m => m.to === sq)
    : [];
  if (options.length) {
    if (options[0].promotion) {
      $("promotion").hidden = false;
      $("promotion").replaceChildren();
      ["q", "r", "b", "n"].forEach((p, i) => {
        const b = document.createElement("button");
        b.textContent = ["Dama", "Torre", "Bispo", "Cavalo"][i];
        b.onclick = () => playMove(sq, p);
        $("promotion").appendChild(b);
      });
      return;
    }
    playMove(sq);
    return;
  }
  selected = selected === sq || c.get(sq)?.color !== c.turn() ? null : sq;
  render();
}
function playMove(to, promotion = "q") {
  try {
    const c = record(ply),
      move = c.move({ from: selected, to, promotion });
    moves = moves.slice(0, ply);
    moves.push(move.san);
    ply++;
    selected = null;
    notice();
    render();
  } catch {
    notice("Lance ilegal.");
  }
}
function go(n) {
  if (preview) preview.ply = Math.max(0, Math.min(preview.total, n));
  else ply = Math.max(0, Math.min(moves.length, n));
  selected = null;
  render();
}
function goBack() {
  go((preview ? preview.ply : ply) - 1);
}
function goNext() {
  go((preview ? preview.ply : ply) + 1);
}
function goEnd() {
  go(preview ? preview.total : moves.length);
}
function flipBoard() {
  flipped = !flipped;
  render();
}
function newGame() {
  if (
    moves.length &&
    !confirm(
      "Iniciar nova partida? Exporte ou salve a atual antes de continuar."
    )
  )
    return;
  moves = [];
  ply = 0;
  initialFen = new Chess().fen();
  headers = {
    White: "Brancas",
    Black: "Pretas",
    Result: "*",
    Event: "Partida casual",
  };
  preview = null;
  selected = null;
  notice();
  render();
}
function buildPGN() {
  return cur().pgn();
}
function download(text, name) {
  const url = URL.createObjectURL(
    new Blob([text], { type: "application/x-chess-pgn" })
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function exportPGN() {
  $("pgnbox").value = buildPGN();
  tabTo(3);
}
function downloadPGN() {
  download(buildPGN(), "partida.pgn");
}
function loadPGN(text) {
  try {
    const g = ChessFromPgn(text);
    moves = g.history();
    initialFen = g.history({ verbose: true })[0]?.before || g.fen();
    headers = g.getHeaders();
    ply = 0;
    selected = null;
    preview = null;
    notice();
    render();
    return true;
  } catch {
    notice("PGN inválido. A partida atual foi preservada.");
    return false;
  }
}
function importBox() {
  if (loadPGN($("pgnbox").value)) tabTo(0);
}
$("onefile").onchange = async e => {
  const f = e.target.files[0];
  if (!f) return;
  try {
    const t = await f.text();
    if ((t.match(/^\[Event\s/gm) || []).length > 1) {
      buildDBFromText(t);
      tabTo(1);
    } else if (loadPGN(t)) tabTo(0);
  } catch {
    notice("Não foi possível ler o arquivo.");
  }
  e.target.value = "";
};
function buildDBFromText(text) {
  try {
    const parts = text
      .replace(/\r\n?/g, "\n")
      .split(/(?=^\[Event\s)/m)
      .filter(s => s.trim());
    const next = parts.map(raw => {
      const g = ChessFromPgn(raw);
      const h = g.getHeaders();
      return {
        pgn: raw,
        W: h.White || "?",
        B: h.Black || "?",
        R: h.Result || "*",
        E: h.Event || "",
        O: h.Opening || h.ECO || "",
        D: h.Date || h.UTCDate || "",
      };
    });
    db = next;
    notice();
    renderDB();
  } catch {
    notice("A base contém PGN inválido. A biblioteca anterior foi preservada.");
  }
}
function renderDB() {
  const q = $("q").value.toLowerCase(),
    list = db.filter(g =>
      (g.W + " " + g.B + " " + g.E + " " + g.O + " " + g.D)
        .toLowerCase()
        .includes(q)
    );
  $("dbcount").textContent = list.length + " de " + db.length + " partidas";
  const totalLabel=document.createElement('small');totalLabel.textContent=' partidas';
  $("library-total").replaceChildren(document.createTextNode(String(db.length)),totalLabel);
  $("dblist").replaceChildren();
  if (!list.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent =
      "Nenhuma partida encontrada. Tente outro jogador ou abertura.";
    $("dblist").appendChild(empty);
  }
  list.slice(0, 500).forEach(g => {
    const d = document.createElement("button");
    d.className = "gitem";
    d.textContent = g.W + " × " + g.B;
    const meta = document.createElement("small");
    meta.textContent = [g.R, g.E, g.D, g.O].filter(Boolean).join(" · ");
    d.appendChild(meta);
    d.onclick = () => {
      if (loadPGN(g.pgn)) tabTo(0);
    };
    $("dblist").appendChild(d);
  });
}
$("dbfile").onchange = async e => {
  const f = e.target.files[0];
  if (f)
    try {
      buildDBFromText(await f.text());
    } catch {
      notice("Falha ao ler a biblioteca.");
    }
  e.target.value = "";
};
function getSaved() {
  try {
    const saved = JSON.parse(localStorage.getItem("xsf_saved") || "[]");
    return Array.isArray(saved)
      ? saved.filter(
          g => typeof g?.pgn === "string" && typeof g?.name === "string"
        )
      : [];
  } catch {
    return [];
  }
}
function setSaved(a) {
  try {
    localStorage.setItem("xsf_saved", JSON.stringify(a));
    renderSaved();
    return true;
  } catch {
    notice("Armazenamento indisponível ou cheio. Baixe o PGN.");
    return false;
  }
}
function saveGame() {
  if (!moves.length) {
    notice("Nenhum lance para salvar.");
    return;
  }
  const name =
    $("save-name").value.trim() ||
    "Partida " + new Date().toLocaleDateString("pt-BR");
  const a = getSaved();
  a.unshift({ name, date: new Date().toISOString(), pgn: record().pgn() });
  if (setSaved(a)) {
    tabTo(2);
    notice("Partida completa salva neste navegador.");
  }
}
function downloadSaved() {
  download(
    getSaved()
      .map(g => g.pgn)
      .join("\n\n"),
    "historico-chess.pgn"
  );
}
function renderSaved() {
  $("savedlist").replaceChildren();
  const a = getSaved();
  if (!a.length) {
    $("savedlist").textContent = "Nenhuma partida salva ainda.";
    return;
  }
  a.forEach((g, i) => {
    const d = document.createElement("div");
    d.className = "gitem";
    d.textContent = g.name + " • " + new Date(g.date).toLocaleString("pt-BR");
    const row = document.createElement("div");
    row.className = "row";
    const load = document.createElement("button");
    load.textContent = "Carregar";
    load.onclick = () => {
      if (loadPGN(g.pgn)) tabTo(0);
    };
    const del = document.createElement("button");
    del.textContent = "Excluir";
    del.onclick = () => {
      if (confirm("Excluir esta partida salva?")) {
        a.splice(i, 1);
        setSaved(a);
      }
    };
    row.append(load, del);
    d.appendChild(row);
    $("savedlist").appendChild(d);
  });
}
function updateAnalysis(force = false) {
  if (preview) return;
  const g = record(ply),
    key = g.fen() + "|" + g.pgn();
  if (!force && key === analysisKey) return;
  analysisKey = key;
  clearTimeout(timer);
  engine.stop();
  currentOrigin = "";
  $("coach").replaceChildren();
  $("pvline").textContent = "";
  $("evaltxt").textContent = "…";
  $("depthtxt").textContent = "";
  $("evalfill").style.height = "50%";
  $("eval-perspective").textContent =
    "Vez das " + (g.turn() === "w" ? "brancas" : "pretas");
  if (g.isGameOver()) {
    $("coach").textContent = "Partida encerrada. Não há lances pendentes.";
    return;
  }
  if (!$("autoA").checked && !force) {
    $("coach").textContent = "Análise automática desativada.";
    return;
  }
  $("coach").textContent = "Calculando alternativas…";
  timer = setTimeout(() => {
    // Tess blocks Blob Workers. Keep the offline search short on the page thread.
    try {
      const result = analyzePosition(g.fen(), {
        pgn: g.pgn(),
        maxDepth: 2,
        timeMs: 160,
        maxNodes: 4000,
      });
      showCandidates(
        g.fen(),
        result.candidates,
        result.depth,
        "Assistente local"
      );
    } catch {
      $("coach").textContent = "Não foi possível analisar esta posição.";
    }
    engine.request({
      fen: g.fen(),
      pgn: g.pgn(),
      key,
      expected: Math.min(3, g.moves().length),
      depth: Number($("depthSel").value),
      history: {
        startFen: initialFen,
        moves: g
          .history({ verbose: true })
          .map(m => m.from + m.to + (m.promotion || "")),
      },
    });
  }, 250);
}
function showStockfish(result) {
  if (result.key !== analysisKey || preview) return;
  const candidates = [];
  for (const line of result.lines) {
    try {
      const g = new Chess(result.fen),
        san = [];
      for (const u of line.uci)
        san.push(
          g.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] })
            .san
        );
      const score =
        line.kind === "mate" ? (line.score > 0 ? 100000 : -100000) : line.score;
      candidates.push(explainCandidate(result.fen, san, score));
    } catch {
      /* Reject illegal or incomplete provider output. */
    }
  }
  if (candidates.length)
    showCandidates(result.fen, candidates, result.depth, "Stockfish");
}
function showCandidates(fen, candidates, depth, origin) {
  if (record(ply).fen() !== fen || preview) return;
  currentOrigin = origin;
  $("coach").replaceChildren();
  $("depthtxt").textContent =
    origin + " • profundidade " + depth + " meios-lances";
  const score = candidates[0]?.score;
  if (score === undefined) {
    $("coach").textContent =
      "Não foi possível concluir a busca. Tente novamente.";
    return;
  }
  $("evaltxt").textContent =
    Math.abs(score) > 90000
      ? score > 0
        ? "Mate a favor"
        : "Mate contra"
      : (score >= 0 ? "+" : "") + (score / 100).toFixed(2);
  const whiteScore = score * (record(ply).turn() === "w" ? 1 : -1);
  $("evalfill").style.height =
    Math.max(3, Math.min(97, 50 + 50 * Math.tanh(whiteScore / 600))) + "%";
  candidates.forEach((c, index) => {
    const article = document.createElement("article");
    article.className = "candidate";
    const head = document.createElement("div");
    head.className = "candidate-head";
    const rank = document.createElement("span");
    rank.className = "candidate-rank";
    rank.textContent = index + 1;
    head.appendChild(rank);
    const title = document.createElement("strong");
    title.textContent = c.san;
    head.appendChild(title);
    const value = document.createElement("span");
    value.className = "candidate-score";
    value.textContent =
      Math.abs(c.score) > 90000
        ? c.score > 0
          ? "mate a favor"
          : "mate contra"
        : (c.score >= 0 ? "+" : "") + (c.score / 100).toFixed(2);
    head.appendChild(value);
    article.appendChild(head);
    const line = document.createElement("p");
    line.className = "line";
    line.textContent = c.line.join(" → ");
    article.appendChild(line);
    const details = document.createElement("details");
    details.open = index === 0;
    const summary = document.createElement("summary");
    summary.textContent = "Pontos positivos e riscos";
    details.appendChild(summary);
    for (const [label, text] of [
      ["Pontos positivos", c.positives.join(" ")],
      ["Riscos", c.risks.join(" ")],
    ]) {
      const p = document.createElement("p");
      const caption = document.createElement("b");
      caption.textContent = label;
      p.append(caption, document.createTextNode(text));
      details.appendChild(p);
    }
    article.appendChild(details);
    const b = document.createElement("button");
    b.textContent = "Explorar variante " + c.san;
    b.onclick = () => {
      const branch = new Chess(fen);
      c.line.forEach(san => branch.move(san));
      preview = { pgn: branch.pgn(), ply: 0, total: c.line.length };
      clearTimeout(timer);
      engine.stop();
      selected = null;
      render();
    };
    article.appendChild(b);
    $("coach").appendChild(article);
  });
}
$("return-main").onclick = () => {
  preview = null;
  selected = null;
  render();
};
$("depthSel").onchange = () => updateAnalysis(true);
function analyze() {
  updateAnalysis(true);
}
document.querySelectorAll("[data-panel]").forEach(button =>
  button.addEventListener("click", () => {
    tab(Number(button.dataset.panel));
    if (window.matchMedia?.("(max-width: 720px)").matches)
      $("panel-title").scrollIntoView({ block: "start" });
  })
);
document.querySelectorAll('[role="tab"]').forEach((button, index) =>
  button.addEventListener("keydown", e => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
    e.preventDefault();
    e.stopPropagation();
    const next =
      e.key === "Home"
        ? 0
        : e.key === "End"
          ? 3
          : (index + (e.key === "ArrowRight" ? 1 : 3)) % 4;
    tab(next);
    $("tab" + next).focus();
  })
);
Object.assign(window, {
  go,
  goBack,
  goNext,
  goEnd,
  flipBoard,
  newGame,
  tab,
  analyze,
  renderDB,
  saveGame,
  downloadSaved,
  importBox,
  exportPGN,
  downloadPGN,
});
$("autoA").onchange = () => {
  analysisKey = "";
  updateAnalysis();
};
document.addEventListener("keydown", e => {
  if (/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
  if (e.key === "ArrowLeft") {
    e.preventDefault();
    goBack();
  }
  if (e.key === "ArrowRight") {
    e.preventDefault();
    goNext();
  }
  if (e.key === "Home") {
    e.preventDefault();
    go(0);
  }
  if (e.key === "End") {
    e.preventDefault();
    goEnd();
  }
});
try {
  const saved = JSON.parse(localStorage.getItem("xsf_current") || "null");
  if (saved?.pgn && loadPGN(saved.pgn))
    ply = Math.max(0, Math.min(moves.length, Number(saved.ply) || 0));
} catch {
  /* Empty or invalid old autosave; explicit saved games remain unchanged. */
}
render();
renderSaved();
buildDBFromText(__GAMES_PGN__);
engine.init();
window.addEventListener("pagehide", () => {
  clearTimeout(timer);
  engine.dispose();
});
