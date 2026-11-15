import { Chess } from "chess.js";
import puzzles from "./exercises.json";
import { exerciseStages, exerciseThemes, matchesExercise, moveUci } from "./exercise-rules.js";

const book = "https://www.gutenberg.org/files/33870/33870-h/33870-h.htm";
export const classicalExercises = [
  {
    id: "capablanca-center", stage: "opening", themes: ["development"],
    fen: "rnbqkbnr/ppp2ppp/3p4/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 0 3",
    moves: ["d2d4", "b8d7", "f1c4"],
    goal: "Na linha de Capablanca, dispute o centro com um peão e depois desenvolva um bispo para atacar f7.",
    lesson: "d4 pressiona e5 e abre a diagonal do bispo de c1. Depois de ...Nd7, Bc4 desenvolve a peça com pressão sobre f7.",
    source: "Capablanca · Controle do centro, exemplo 18",
  },
  {
    id: "capablanca-rook", stage: "endgame", themes: ["mate"],
    fen: "7k/8/6K1/8/8/8/8/R7 w - - 0 1", moves: ["a1a8"],
    goal: "Dê mate em um lance com rei e torre.",
    lesson: "O rei branco tira g7 e h7. Na oitava fileira, a torre dá xeque e também cobre g8.",
    source: "Posição original inspirada em Capablanca · Rei e torre",
  },
  {
    id: "capablanca-queen", stage: "endgame", themes: ["mate"],
    fen: "k7/8/1K6/8/8/8/4Q3/8 w - - 0 1", moves: ["e2e8"],
    goal: "Dê mate em um lance com rei e dama.",
    lesson: "O rei branco tira a7 e b7. A dama fecha a oitava fileira, incluindo b8.",
    source: "Posição original inspirada em Capablanca · Rei e dama",
  },
];

export function setupExercises(pieceImage, pieceNames) {
  const $ = id => document.getElementById("exercise-" + id);
  const board = $("board"), stage = $("stage"), theme = $("theme"), level = $("level");
  const feedback = $("feedback"), solution = $("solution"), promotion = $("promotion");
  const source = $("source"), hint = $("hint"), reveal = $("reveal"), reset = $("reset"), next = $("next");
  const all = [...classicalExercises, ...puzzles];
  for (const [select, labels] of [[stage, exerciseStages], [theme, exerciseThemes]]) {
    for (const [value, label] of Object.entries(labels)) select.add(new Option(label, value));
  }

  let filtered, index, exercise, game, side, cursor, selected, pending, done;
  const files = "abcdefgh";
  const colorName = color => color === "w" ? "Brancas" : "Pretas";
  const message = text => { feedback.textContent = text; };
  const notation = move => move.from + move.to + (move.promotion || "");

  function render() {
    const focus = board.contains(document.activeElement) ? document.activeElement.dataset.square : null;
    board.hidden = !game;
    board.replaceChildren();
    promotion.hidden = !pending;
    promotion.replaceChildren();
    if (!game) return;
    const targets = selected && !done ? game.moves({ square: selected, verbose: true }).map(move => move.to) : [];
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const square = side === "w" ? files[col] + (8 - row) : files[7 - col] + (1 + row);
        const piece = game.get(square);
        const button = document.createElement("button");
        button.type = "button";
        button.className = "sq " + ((row + col) % 2 ? "d" : "l");
        button.classList.toggle("sel", square === selected);
        button.classList.toggle("tgt", targets.includes(square));
        button.classList.toggle("occupied", !!piece);
        button.dataset.square = square;
        button.setAttribute("aria-label", piece ? `${square} · ${pieceNames[piece.type]} · ${colorName(piece.color)}` : square);
        button.setAttribute("aria-pressed", String(square === selected));
        button.disabled = done;
        if (piece) button.append(pieceImage(piece));
        for (const [shown, edge, label] of [[col === 0, "rank", square[1]], [row === 7, "file", square[0]]]) {
          if (!shown) continue;
          const coord = document.createElement("span");
          coord.className = "coord " + edge;
          coord.setAttribute("aria-hidden", "true");
          coord.textContent = label;
          button.append(coord);
        }
        button.onclick = () => choose(square);
        board.append(button);
        if (square === focus && !done) button.focus({ preventScroll: true });
      }
    }
    if (pending) {
      for (const move of pending) {
        const button = document.createElement("button");
        button.textContent = pieceNames[move.promotion];
        button.onclick = () => play(move);
        promotion.append(button);
      }
      promotion.firstElementChild.focus({ preventScroll: true });
    }
  }

  function start() {
    exercise = filtered[index];
    game = exercise ? new Chess(exercise.fen) : null;
    side = game?.turn();
    cursor = 0;
    selected = pending = null;
    done = false;
    hint.disabled = reveal.disabled = reset.disabled = !exercise;
    next.disabled = filtered.length < 2;
    $("side").textContent = side ? colorName(side) + " jogam" : "";
    $("goal").textContent = exercise?.goal || (exercise ? "Encontre a melhor continuação nesta posição." : "");
    $("count").textContent = exercise ? `${index + 1} de ${filtered.length} exercícios` : "0 exercícios";
    $("meta").textContent = exercise
      ? [exerciseStages[exercise.stage], ...exercise.themes.map(key => exerciseThemes[key]), exercise.rating && `Rating Lichess: ${exercise.rating}`].filter(Boolean).join(" · ")
      : "";
    source.hidden = !exercise;
    if (exercise) {
      source.href = exercise.source ? book : `https://lichess.org/training/${exercise.id}`;
      source.textContent = exercise.source || "Ver exercício no Lichess";
    }
    message(exercise ? "Selecione uma peça e depois a casa de destino." : "Nenhum exercício com esses filtros. Experimente outra combinação.");
    solution.textContent = "";
    render();
  }

  function filter() {
    filtered = all.filter(item => matchesExercise(item, stage.value, theme.value) && (
      !level.value || level.value === (item.rating == null ? "classic" : item.rating < 1300 ? "intro" : item.rating < 1800 ? "intermediate" : "advanced")
    ));
    index = 0;
    start();
  }

  function choose(square) {
    if (done) return;
    const choosingPromotion = !!pending;
    pending = null;
    if (game.get(square)?.color === side) {
      selected = selected === square ? null : square;
      render();
      return;
    }
    if (!selected) return;
    const moves = game.moves({ square: selected, verbose: true }).filter(move => move.to === square);
    if (moves.length > 1) {
      pending = moves;
      message("Escolha a peça para a promoção.");
      render();
    } else if (moves.length) play(moves[0]);
    else {
      message("Essa peça não pode ir para essa casa.");
      if (choosingPromotion) render();
    }
  }

  function play(move) {
    pending = selected = null;
    const expected = exercise.moves[cursor];
    const alternativeMate = cursor === exercise.moves.length - 1 && exercise.themes.includes("mate") && move.san.endsWith("#");
    if (notation(move) !== expected && !alternativeMate) {
      message(`${move.san} é legal, mas não segue a linha deste exercício. Tente outra vez.`);
    } else {
      game.move(move);
      cursor++;
      if (cursor === exercise.moves.length) {
        done = true;
        hint.disabled = reveal.disabled = true;
        message(`Resolvido! Último lance: ${move.san}.`);
        solution.textContent = exercise.lesson || "";
      } else {
        const reply = moveUci(game, exercise.moves[cursor++]);
        message(`Correto! Resposta: ${reply.san}. Encontre o próximo lance.`);
      }
    }
    render();
  }

  for (const select of [stage, theme, level]) select.onchange = filter;
  next.onclick = () => { index = (index + 1) % filtered.length; start(); };
  reset.onclick = start;
  hint.onclick = () => {
    pending = null;
    selected = exercise.moves[cursor].slice(0, 2);
    message(`Dica: mova a peça em ${selected}.`);
    render();
  };
  reveal.onclick = () => {
    done = true;
    pending = selected = null;
    hint.disabled = reveal.disabled = true;
    const line = new Chess(exercise.fen);
    const san = exercise.moves.map(move => moveUci(line, move).san);
    message("Solução revelada. Recomece para praticar ou avance para outro exercício.");
    solution.textContent = "Solução: " + san.join(" → ") + (exercise.lesson ? ". " + exercise.lesson : "");
    render();
  };
  filter();
}
