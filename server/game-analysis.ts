import { Chess } from 'chess.js';

export interface GamePhase {
  phase: 'opening' | 'middlegame' | 'endgame';
  startMove: number;
  endMove: number;
  description: string;
}

export interface PhaseAnalysis {
  phase: 'opening' | 'middlegame' | 'endgame';
  moveCount: number;
  keyMoves: string[];
  themes: string[];
  strategicNotes: string;
  recommendations: string[];
}

export interface GameAnalysisResult {
  totalMoves: number;
  phases: GamePhase[];
  phaseAnalyses: PhaseAnalysis[];
  overallAssessment: string;
  keyTurningPoints: string[];
  bestMoves: string[];
  mistakesMade: string[];
}

/**
 * Detect game phases based on material and move count
 */
export function detectGamePhases(pgn: string): GamePhase[] {
  const chess = new Chess();
  const moves = pgn.split(' ').filter(m => /^[a-h][1-8][a-h][1-8]|^[KQRBN]?[a-h]?[1-8]?x?[a-h][1-8](?:=[QRBN])?$/.test(m));
  
  const phases: GamePhase[] = [];
  let openingEnd = 12; // Typically 12-15 moves for opening
  let middlegameEnd = moves.length - 1;
  
  // Detect endgame start by material count
  for (let i = 0; i < moves.length; i++) {
    try {
      chess.move(moves[i], { strict: false });
      const board = chess.board();
      let materialCount = 0;
      
      for (let row of board) {
        for (let piece of row) {
          if (piece) {
            const values: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
            materialCount += values[piece.type] || 0;
          }
        }
      }
      
      // Endgame typically has less than 15 points of material
      if (materialCount < 15 && i > 20) {
        middlegameEnd = i;
        break;
      }
    } catch (e) {
      // Skip invalid moves
    }
  }
  
  // Opening phase
  if (openingEnd > 0) {
    phases.push({
      phase: 'opening',
      startMove: 1,
      endMove: Math.min(openingEnd, moves.length),
      description: 'Opening phase - piece development and king safety'
    });
  }
  
  // Middlegame phase
  if (openingEnd < middlegameEnd) {
    phases.push({
      phase: 'middlegame',
      startMove: openingEnd + 1,
      endMove: middlegameEnd,
      description: 'Middlegame phase - tactical and strategic battles'
    });
  }
  
  // Endgame phase
  if (middlegameEnd < moves.length) {
    phases.push({
      phase: 'endgame',
      startMove: middlegameEnd + 1,
      endMove: moves.length,
      description: 'Endgame phase - converting advantage or defending'
    });
  }
  
  return phases;
}

/**
 * Analyze a specific game phase
 */
export function analyzePhase(pgn: string, phase: GamePhase): PhaseAnalysis {
  const chess = new Chess();
  const moves = pgn.split(' ').filter(m => /^[a-h][1-8][a-h][1-8]|^[KQRBN]?[a-h]?[1-8]?x?[a-h][1-8](?:=[QRBN])?$/.test(m));
  
  const phaseMoves = moves.slice(phase.startMove - 1, phase.endMove);
  const themes: string[] = [];
  const keyMoves: string[] = [];
  const recommendations: string[] = [];
  
  // Analyze based on phase type
  if (phase.phase === 'opening') {
    themes.push('Piece Development');
    themes.push('King Safety');
    themes.push('Control of Center');
    
    // Check for common opening principles
    let centerControl = false;
    let kingMoved = false;
    
    for (const move of phaseMoves) {
      if (move.includes('e') || move.includes('d')) centerControl = true;
      if (move.includes('K')) kingMoved = true;
    }
    
    if (centerControl) keyMoves.push('Central control established');
    if (!kingMoved && phaseMoves.length > 5) {
      recommendations.push('Consider castling to improve king safety');
    }
    
    recommendations.push('Develop all pieces before moving the same piece twice');
    recommendations.push('Control the center with pawns and pieces');
  } else if (phase.phase === 'middlegame') {
    themes.push('Tactical Opportunities');
    themes.push('Positional Advantage');
    themes.push('Attack and Defense');
    
    // Detect captures and checks
    let captureCount = 0;
    let checkCount = 0;
    
    for (const move of phaseMoves) {
      if (move.includes('x')) captureCount++;
      if (move.includes('+')) checkCount++;
    }
    
    // Try to play moves to validate
    try {
      for (const move of phaseMoves) {
        chess.move(move, { strict: false });
      }
    } catch (e) {
      // Skip validation errors
    }
    
    if (captureCount > 0) keyMoves.push(`${captureCount} captures made`);
    if (checkCount > 0) keyMoves.push(`${checkCount} checks given`);
    
    recommendations.push('Look for tactical patterns: pins, forks, skewers');
    recommendations.push('Maintain piece coordination and control key squares');
    recommendations.push('Create threats while defending your position');
  } else if (phase.phase === 'endgame') {
    themes.push('King Activity');
    themes.push('Pawn Promotion');
    themes.push('Zugzwang');
    
    keyMoves.push('King must be active in the endgame');
    recommendations.push('Activate your king - it becomes a strong piece');
    recommendations.push('Push passed pawns and create threats');
    recommendations.push('Use opposition and zugzwang principles');
  }
  
  const strategicNotes = `${phase.phase.charAt(0).toUpperCase() + phase.phase.slice(1)} analysis: ${phaseMoves.length} moves played. Key themes: ${themes.join(', ')}.`;
  
  return {
    phase: phase.phase,
    moveCount: phaseMoves.length,
    keyMoves,
    themes,
    strategicNotes,
    recommendations
  };
}

/**
 * Generate comprehensive game analysis
 */
export function analyzeGame(pgn: string): GameAnalysisResult {
  const phases = detectGamePhases(pgn);
  const phaseAnalyses = phases.map(phase => analyzePhase(pgn, phase));
  
  const moves = pgn.split(' ').filter(m => /^[a-h][1-8][a-h][1-8]|^[KQRBN]?[a-h]?[1-8]?x?[a-h][1-8](?:=[QRBN])?$/.test(m));
  
  // Detect key turning points
  const keyTurningPoints: string[] = [];
  let captureCount = 0;
  let checkCount = 0;
  
  for (const move of moves) {
    if (move.includes('x')) captureCount++;
    if (move.includes('+')) checkCount++;
  }
  
  if (captureCount > 5) keyTurningPoints.push('Multiple tactical exchanges occurred');
  if (checkCount > 3) keyTurningPoints.push('Several forcing moves were played');
  
  // Overall assessment
  let overallAssessment = 'Game showed good understanding of chess principles. ';
  if (moves.length < 20) {
    overallAssessment += 'Game ended quickly - consider analyzing the opening strategy.';
  } else if (moves.length > 60) {
    overallAssessment += 'Long game with complex positions - endgame technique was important.';
  } else {
    overallAssessment += 'Balanced game with both tactical and strategic elements.';
  }
  
  return {
    totalMoves: moves.length,
    phases,
    phaseAnalyses,
    overallAssessment,
    keyTurningPoints,
    bestMoves: [],
    mistakesMade: []
  };
}

/**
 * Generate AI commentary for a phase
 */
export function generatePhaseCommentary(analysis: PhaseAnalysis): string {
  const { phase, moveCount, themes, strategicNotes, recommendations } = analysis;
  
  let commentary = `**${phase.toUpperCase()} ANALYSIS**\n\n`;
  commentary += `${strategicNotes}\n\n`;
  commentary += `**Key Themes:** ${themes.join(', ')}\n\n`;
  commentary += `**Recommendations:**\n`;
  
  for (const rec of recommendations) {
    commentary += `• ${rec}\n`;
  }
  
  return commentary;
}

/**
 * Generate full game commentary
 */
export function generateGameCommentary(gameAnalysis: GameAnalysisResult): string {
  let commentary = `# POST-GAME ANALYSIS\n\n`;
  commentary += `**Total Moves:** ${gameAnalysis.totalMoves}\n\n`;
  commentary += `**Overall Assessment:** ${gameAnalysis.overallAssessment}\n\n`;
  
  if (gameAnalysis.keyTurningPoints.length > 0) {
    commentary += `**Key Turning Points:**\n`;
    for (const point of gameAnalysis.keyTurningPoints) {
      commentary += `• ${point}\n`;
    }
    commentary += '\n';
  }
  
  commentary += `## PHASE-BY-PHASE ANALYSIS\n\n`;
  
  for (const phaseAnalysis of gameAnalysis.phaseAnalyses) {
    commentary += generatePhaseCommentary(phaseAnalysis);
    commentary += '\n---\n\n';
  }
  
  return commentary;
}
