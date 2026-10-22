import { Chess } from 'chess.js';

/**
 * Tipos para PGN
 */
export interface PGNMetadata {
  event?: string;
  site?: string;
  date?: string;
  round?: string;
  white?: string;
  black?: string;
  result?: string;
  whiteElo?: string;
  blackElo?: string;
  eco?: string;
  opening?: string;
  variation?: string;
  timeControl?: string;
  [key: string]: string | undefined;
}

export interface ParsedPGN {
  metadata: PGNMetadata;
  moves: string[];
  comments: Record<number, string>;
  annotations: Record<number, string>;
  variations: Record<number, string[]>;
  fen?: string;
}

export interface GameForExport {
  id: number;
  pgn: string;
  moves: string[];
  metadata: PGNMetadata;
  annotations: string;
  keyPositions: Array<{ moveNumber: number; note: string }>;
}

/**
 * Parser de PGN
 */
export function parsePGN(pgnText: string): ParsedPGN {
  const game = new Chess();
  game.loadPgn(pgnText);
  const metadata: PGNMetadata = {};
  const names: Record<string, string> = { WhiteElo: 'whiteElo', BlackElo: 'blackElo', TimeControl: 'timeControl' };
  for (const [key, value] of Object.entries(game.getHeaders())) metadata[names[key] ?? key.toLowerCase()] = value;
  const comments: Record<number, string> = {};
  const commentsByFen = new Map(game.getComments().map(item => [item.fen, item.comment]));
  const history = game.history({ verbose: true });
  history.forEach((move, index) => { const comment = commentsByFen.get(move.after); if (comment) comments[index + 1] = comment; });
  return { metadata, moves: history.map(move => move.san), comments, annotations: {}, variations: {}, fen: game.getHeaders().FEN };
}

/**
 * Valida PGN antes de importar
 */
export function validatePGN(pgnText: string): { valid: boolean; errors: string[] } {
  if (!pgnText.trim()) return { valid: false, errors: ['PGN está vazio'] };
  try {
    const game = new Chess();
    game.loadPgn(pgnText);
    return { valid: true, errors: [] };
  } catch (error) {
    return { valid: false, errors: [error instanceof Error ? error.message : 'PGN inválido'] };
  }
}

/**
 * Gera PGN a partir de lances
 */
export function generatePGN(
  moves: string[],
  metadata: PGNMetadata = {},
  comments: Record<number, string> = {},
  annotations: Record<number, string> = {}
): string {
  const lines: string[] = [];
  
  // Adiciona metadados
  const defaultMetadata: PGNMetadata = {
    event: metadata.event || 'Training Game',
    site: metadata.site || 'Chess Master Trainer',
    date: metadata.date || new Date().toISOString().split('T')[0],
    round: metadata.round || '?',
    white: metadata.white || 'White',
    black: metadata.black || 'Black',
    result: metadata.result || '*',
    ...metadata,
  };
  
  for (const [key, value] of Object.entries(defaultMetadata)) {
    if (value) {
      lines.push(`[${key.charAt(0).toUpperCase() + key.slice(1)} "${value}"]`);
    }
  }
  
  lines.push('');
  
  // Adiciona lances com comentários
  let moveNumber = 1;
  let moveText = '';
  
  for (let i = 0; i < moves.length; i++) {
    const move = moves[i];
    
    // Adiciona número de movimento para lances das brancas
    if (i % 2 === 0) {
      if (moveText.length > 0) {
        moveText += ' ';
      }
      moveText += `${moveNumber}.`;
    }
    
    moveText += ` ${move}`;
    
    // Adiciona comentário se existir
    if (comments[i]) {
      moveText += ` {${comments[i]}}`;
    }
    
    // Adiciona anotação se existir
    if (annotations[i]) {
      moveText += ` ${annotations[i]}`;
    }
    
    // Quebra linha a cada 10 lances
    if ((i + 1) % 10 === 0) {
      lines.push(moveText);
      moveText = '';
    }
    
    // Incrementa número de movimento após lance das pretas
    if (i % 2 === 1) {
      moveNumber++;
    }
  }
  
  // Adiciona lances restantes
  if (moveText.length > 0) {
    lines.push(moveText);
  }
  
  // Adiciona resultado
  lines.push('');
  lines.push(defaultMetadata.result || '*');
  
  return lines.join('\n');
}

/**
 * Extrai FEN de uma posição específica
 */
export function getFENAtMove(moves: string[], moveIndex: number): string {
  const chess = new Chess();
  
  for (let i = 0; i < Math.min(moveIndex, moves.length); i++) {
    try {
      chess.move(moves[i]);
    } catch (e) {
      // Ignora lances inválidos
    }
  }
  
  return chess.fen();
}

/**
 * Converte PGN para formato de exportação
 */
export function pgnToExportFormat(pgn: string): GameForExport {
  const parsed = parsePGN(pgn);
  
  return {
    id: Date.now(),
    pgn,
    moves: parsed.moves,
    metadata: parsed.metadata,
    annotations: Object.entries(parsed.annotations)
      .map(([moveNum, annotation]) => `${moveNum}: ${annotation}`)
      .join('\n'),
    keyPositions: [],
  };
}

/**
 * Importa múltiplos PGNs de um arquivo
 */
export function importMultiplePGNs(fileContent: string): ParsedPGN[] {
  // Divide por linhas em branco duplas (separador de partidas)
  const gameSections = fileContent.split(/\n\s*\n\s*\n/);
  
  return gameSections
    .map(section => section.trim())
    .filter(section => section.length > 0)
    .map(section => parsePGN(section));
}

/**
 * Gera estatísticas de um PGN
 */
export function getPGNStatistics(pgn: string): {
  totalMoves: number;
  whiteWins: number;
  blackWins: number;
  draws: number;
  averageElo: number;
  openingName: string;
} {
  const parsed = parsePGN(pgn);
  const result = parsed.metadata.result || '*';
  
  let whiteWins = 0;
  let blackWins = 0;
  let draws = 0;
  
  if (result === '1-0') whiteWins = 1;
  else if (result === '0-1') blackWins = 1;
  else if (result === '1/2-1/2') draws = 1;
  
  const whiteElo = parseInt(parsed.metadata.whiteElo || '0', 10);
  const blackElo = parseInt(parsed.metadata.blackElo || '0', 10);
  const averageElo = (whiteElo + blackElo) / 2;
  
  return {
    totalMoves: parsed.moves.length,
    whiteWins,
    blackWins,
    draws,
    averageElo,
    openingName: parsed.metadata.opening || 'Unknown',
  };
}
