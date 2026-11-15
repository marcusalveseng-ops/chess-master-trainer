export const exerciseStages = { opening: "Abertura", middlegame: "Meio-jogo", endgame: "Final" };
export const exerciseThemes = {
  mate: "Xeque-mate",
  fork: "Garfo",
  pin: "Cravada",
  skewer: "Espeto",
  discoveredAttack: "Ataque descoberto",
  sacrifice: "Sacrifício",
  defensiveMove: "Defesa",
  promotion: "Promoção",
  hangingPiece: "Peça indefesa",
  deflection: "Desvio",
  development: "Centro e desenvolvimento",
  draw: "Empate",
  advantage: "Ganho de vantagem",
};

export function moveUci(game, uci) {
  return game.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] });
}

export function matchesExercise(exercise, stage, theme) {
  return (!stage || exercise.stage === stage) && (!theme || exercise.themes.includes(theme));
}
