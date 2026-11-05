import openingLines from "./openings.json" with { type: "json" };
const catalogue = new Map(
  openingLines.map(([eco, name, moves]) => [moves, { eco, name }])
);
export function normalize(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/karo[ -]?khan|caro[ -]?khan/g, "caro-kann");
}
export function classify(sans) {
  let found = { eco: "", name: "Sem classificação" };
  for (let i = 1; i <= Math.min(sans.length, 32); i++) {
    const entry = catalogue.get(sans.slice(0, i).join(" "));
    if (entry) found = entry;
  }
  const line = sans.join(" ");
  let opening = found.name.split(":")[0],
    defense = "Não especificada";
  const starts = p => line === p || line.startsWith(p + " ");
  if (starts("e4")) opening = "Peão do Rei";
  else if (starts("d4")) opening = "Peão da Dama";
  if (starts("e4 c6")) defense = "Caro-Kann";
  else if (starts("e4 c5")) defense = "Siciliana";
  else if (starts("e4 e6")) defense = "Francesa";
  else if (starts("e4 d5")) defense = "Escandinava";
  else if (starts("e4 Nf6")) defense = "Alekhine";
  else if (starts("e4 d6")) defense = "Pirc / Moderna";
  else if (starts("e4 e5")) defense = "Jogos Abertos";
  if (starts("e4 e5 Nf3 Nc6 Bc4")) opening = "Italiana";
  if (starts("e4 e5 Nf3 Nc6 Bb5")) opening = "Ruy Lopez (Espanhola)";
  if (starts("e4 e5 Nf3 Nc6 d4")) opening = "Escocesa";
  if (starts("d4 d5 c4")) opening = "Gambito da Dama";
  if (starts("c4")) opening = "Inglesa";
  if (starts("Nf3")) opening = "Réti / Abertura de cavalo";
  const named = [
    ["Nimzo-Indian", "Nimzoíndia"],
    ["King\'s Indian Defense", "Índia do Rei"],
    ["Queen\'s Indian Defense", "Índia da Dama"],
    ["Grünfeld", "Grünfeld"],
    ["Slav Defense", "Eslava"],
    ["Semi-Slav", "Semieslava"],
    ["Dutch Defense", "Holandesa"],
    ["Benoni", "Benoni"],
    ["Benko", "Gambito Benko"],
    ["Petrov", "Petrov"],
    ["Philidor", "Philidor"],
  ];
  for (const [en, pt] of named) if (found.name.includes(en)) defense = pt;
  return { ...found, opening, defense };
}
export function matchesGame(
  g,
  { query = "", player1 = "", player2 = "", opening = "", defense = "" } = {}
) {
  const players = normalize(g.W + " " + g.B);
  return (
    (!opening || g.opening === opening) &&
    (!defense || g.defense === defense) &&
    (!player1 || players.includes(normalize(player1))) &&
    (!player2 || players.includes(normalize(player2))) &&
    normalize(query)
      .split(/\s+/)
      .filter(Boolean)
      .every(word =>
        normalize(
          [g.W, g.B, g.E, g.O, g.eco, g.opening, g.defense, g.D].join(" ")
        ).includes(word)
      )
  );
}
