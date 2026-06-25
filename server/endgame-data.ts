/**
 * Classic endgame positions for training
 * Each position includes FEN, objective, and strategic themes
 */

export interface EndgameData {
  name: string;
  description: string;
  fen: string;
  difficulty: "beginner" | "intermediate" | "advanced" | "expert";
  endgameType: string;
  sideToMove: "white" | "black";
  objective: string;
  keyThemes: string[];
  historicalContext?: string;
}

export const CLASSIC_ENDGAMES: EndgameData[] = [
  // King and Pawn vs King
  {
    name: "King and Pawn vs King - Basic Win",
    description: "Fundamental position where White must advance the pawn while supporting it with the king",
    fen: "8/8/8/8/8/k7/P7/K7 w - - 0 1",
    difficulty: "beginner",
    endgameType: "King and Pawn vs King",
    sideToMove: "white",
    objective: "Promote the pawn to a queen",
    keyThemes: ["Opposition", "Zugzwang", "Pawn promotion"],
    historicalContext: "Fundamental endgame principle"
  },

  // Rook Endgames
  {
    name: "Rook and Pawn vs Rook - Lucena Position",
    description: "The defending side has a rook on the 6th rank. White must build a bridge to promote",
    fen: "8/8/1R6/8/8/8/r1P5/k1K5 w - - 0 1",
    difficulty: "intermediate",
    endgameType: "Rook Endgame",
    sideToMove: "white",
    objective: "Promote the pawn by building a bridge",
    keyThemes: ["Building a bridge", "Rook technique", "Pawn promotion"],
    historicalContext: "Lucena's classic technique from 1497"
  },

  {
    name: "Rook and Pawn vs Rook - Philidor Position",
    description: "The defending rook is behind the pawn. Philidor's defense: keep the rook on the 6th rank",
    fen: "8/8/8/8/8/8/r1P5/R1K5 b - - 0 1",
    difficulty: "intermediate",
    endgameType: "Rook Endgame",
    sideToMove: "black",
    objective: "Hold the draw with correct defense",
    keyThemes: ["Philidor's defense", "Rook placement", "Drawing technique"],
    historicalContext: "Philidor's defensive method"
  },

  // Queen vs Rook
  {
    name: "Queen vs Rook - Winning Technique",
    description: "Queen must checkmate the rook. Requires precise technique and coordination",
    fen: "8/8/8/8/8/8/r7/Q1K5 w - - 0 1",
    difficulty: "advanced",
    endgameType: "Queen vs Rook",
    sideToMove: "white",
    objective: "Checkmate the black rook",
    keyThemes: ["Queen coordination", "Checkmate patterns", "Rook confinement"],
    historicalContext: "Classic queen endgame study"
  },

  // Bishop and Knight vs King
  {
    name: "Bishop and Knight vs King - Checkmate",
    description: "Fundamental technique to checkmate a lone king with bishop and knight",
    fen: "8/8/8/8/8/8/B1N5/k1K5 w - - 0 1",
    difficulty: "advanced",
    endgameType: "Bishop and Knight vs King",
    sideToMove: "white",
    objective: "Checkmate the black king",
    keyThemes: ["Bishop and knight coordination", "Checkmate pattern", "King confinement"],
    historicalContext: "Essential endgame knowledge"
  },

  // Two Rooks vs King
  {
    name: "Two Rooks vs King - Checkmate",
    description: "Two rooks must coordinate to checkmate a lone king efficiently",
    fen: "8/8/8/8/8/8/R7/Rk1K4 w - - 0 1",
    difficulty: "beginner",
    endgameType: "Two Rooks vs King",
    sideToMove: "white",
    objective: "Checkmate the black king",
    keyThemes: ["Rook coordination", "Back rank mate", "Checkmate pattern"],
    historicalContext: "Fundamental checkmate pattern"
  },

  // Pawn Endgames
  {
    name: "Pawn Endgame - Opposition",
    description: "Critical position demonstrating the power of opposition in pawn endgames",
    fen: "8/8/8/3k4/3P4/3K4/8/8 w - - 0 1",
    difficulty: "intermediate",
    endgameType: "Pawn Endgame",
    sideToMove: "white",
    objective: "Promote the pawn using opposition",
    keyThemes: ["Opposition", "Key squares", "Zugzwang"],
    historicalContext: "Fundamental pawn endgame principle"
  },

  {
    name: "Pawn Endgame - Triangulation",
    description: "Demonstrates the triangulation technique to force zugzwang",
    fen: "8/8/8/3k4/2PP4/3K4/8/8 w - - 0 1",
    difficulty: "advanced",
    endgameType: "Pawn Endgame",
    sideToMove: "white",
    objective: "Win using triangulation",
    keyThemes: ["Triangulation", "Zugzwang", "Maneuvering"],
    historicalContext: "Advanced pawn endgame technique"
  },

  // Knight Endgames
  {
    name: "Knight and Pawn vs King",
    description: "Knight must support the pawn's advance to promotion",
    fen: "8/8/8/8/8/k7/N1P5/K7 w - - 0 1",
    difficulty: "intermediate",
    endgameType: "Knight Endgame",
    sideToMove: "white",
    objective: "Promote the pawn",
    keyThemes: ["Knight support", "Pawn promotion", "King activity"],
    historicalContext: "Knight endgame fundamentals"
  },

  // Bishop Endgames
  {
    name: "Bishop and Pawn vs King",
    description: "Bishop must support the pawn while controlling key squares",
    fen: "8/8/8/8/8/k7/B1P5/K7 w - - 0 1",
    difficulty: "beginner",
    endgameType: "Bishop Endgame",
    sideToMove: "white",
    objective: "Promote the pawn",
    keyThemes: ["Bishop support", "Pawn promotion", "Control of squares"],
    historicalContext: "Bishop endgame fundamentals"
  },

  // Complex Positions
  {
    name: "Rook and Two Pawns vs Rook",
    description: "Advanced rook endgame with multiple pawns. Requires precise calculation",
    fen: "8/8/8/8/8/8/r1P1P3/R1K5 w - - 0 1",
    difficulty: "advanced",
    endgameType: "Rook Endgame",
    sideToMove: "white",
    objective: "Promote one of the pawns",
    keyThemes: ["Multiple pawns", "Rook activity", "Pawn coordination"],
    historicalContext: "Complex rook endgame"
  },

  {
    name: "Queen and Pawn vs Queen",
    description: "Queen endgame with pawn advantage. Requires precise technique",
    fen: "8/8/8/8/8/8/q1P5/Q1K5 w - - 0 1",
    difficulty: "expert",
    endgameType: "Queen Endgame",
    sideToMove: "white",
    objective: "Promote the pawn",
    keyThemes: ["Queen coordination", "Pawn promotion", "Checks and tactics"],
    historicalContext: "Advanced queen endgame"
  },

  // Fortress Positions
  {
    name: "Fortress - Bishop and Pawns vs Rook",
    description: "Defensive position where correct play leads to a draw despite material disadvantage",
    fen: "8/8/8/8/8/8/r1BP4/k1K5 b - - 0 1",
    difficulty: "advanced",
    endgameType: "Fortress",
    sideToMove: "black",
    objective: "Hold the draw with correct fortress setup",
    keyThemes: ["Fortress", "Defensive technique", "Holding a draw"],
    historicalContext: "Defensive endgame principle"
  },

  // Zugzwang Positions
  {
    name: "Pure Zugzwang - King and Pawn",
    description: "Any move by Black worsens the position. A fundamental zugzwang example",
    fen: "8/8/8/3k4/3P4/3K4/8/8 b - - 0 1",
    difficulty: "intermediate",
    endgameType: "Pawn Endgame",
    sideToMove: "black",
    objective: "Understand why Black is in zugzwang",
    keyThemes: ["Zugzwang", "Opposition", "Pawn promotion"],
    historicalContext: "Fundamental zugzwang example"
  }
];

export function getEndgamesByDifficulty(difficulty: string): EndgameData[] {
  return CLASSIC_ENDGAMES.filter(eg => eg.difficulty === difficulty);
}

export function getEndgamesByType(type: string): EndgameData[] {
  return CLASSIC_ENDGAMES.filter(eg => eg.endgameType === type);
}

export function getEndgamesByTheme(theme: string): EndgameData[] {
  return CLASSIC_ENDGAMES.filter(eg => eg.keyThemes.includes(theme));
}
