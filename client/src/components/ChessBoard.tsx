import { useState, useCallback, useMemo, useEffect } from 'react';
import { Chess } from 'chess.js';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ChessBoardProps {
  onGameChange?: (fen: string, pgn: string, moves: any[]) => void;
  initialPgn?: string;
  readOnly?: boolean;
  moveIndex?: number;
}

const SQUARE_SIZE = 60;
const BOARD_SIZE = SQUARE_SIZE * 8;

const PIECE_UNICODE: Record<string, string> = {
  'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
  'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟',
};

export default function ChessBoard({ onGameChange, initialPgn, readOnly = false, moveIndex: externalMoveIndex }: ChessBoardProps) {
  const [game, setGame] = useState<Chess>(() => new Chess());
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [moveIndex, setMoveIndex] = useState(0);
  const [legalMoves, setLegalMoves] = useState<any[]>([]);

  // Load PGN on mount or when initialPgn changes
  useEffect(() => {
    if (initialPgn) {
      const chess = new Chess();
      try {
        chess.loadPgn(initialPgn);
        setGame(chess);
        setMoveIndex(0);
        setSelectedSquare(null);
        setLegalMoves([]);
      } catch (e) {
        console.error('Failed to load PGN:', e);
      }
    }
  }, [initialPgn]);

  // Use external moveIndex if provided (for replay), otherwise use internal
  const effectiveMoveIndex = externalMoveIndex !== undefined ? externalMoveIndex : moveIndex;

  // Derive current game state at moveIndex
  const currentGame = useMemo(() => {
    const chess = new Chess();
    if (initialPgn) {
      chess.loadPgn(initialPgn);
    }
    
    // Get all moves in SAN format
    const moves = chess.moves({ verbose: false }) as string[];
    
    // Apply moves up to effectiveMoveIndex
    for (let i = 0; i < effectiveMoveIndex && i < moves.length; i++) {
      chess.move(moves[i]);
    }
    
    return chess;
  }, [effectiveMoveIndex, initialPgn]);

  const board = useMemo(() => currentGame.board(), [currentGame]);

  const handleSquareClick = useCallback((file: number, rank: number) => {
    if (readOnly) return;

    const square = String.fromCharCode(97 + file) + (8 - rank);

    if (selectedSquare === square) {
      setSelectedSquare(null);
      setLegalMoves([]);
      return;
    }

    if (selectedSquare) {
      // Try to make a move
      const move = currentGame.move({
        from: selectedSquare as any,
        to: square as any,
        promotion: 'q',
      });

      if (move) {
        // Create new game with the move applied
        const newGame = new Chess();
        if (initialPgn) {
          newGame.loadPgn(initialPgn);
        }
        
        const moves = newGame.moves({ verbose: false }) as string[];
        for (let i = 0; i < moveIndex && i < moves.length; i++) {
          newGame.move(moves[i]);
        }
        newGame.move(move);
        
        setGame(newGame);
        setMoveIndex(moveIndex + 1);
        setSelectedSquare(null);
        setLegalMoves([]);
        
        if (onGameChange) {
          onGameChange(newGame.fen(), newGame.pgn(), newGame.moves({ verbose: true }));
        }
      } else {
        setSelectedSquare(square);
        const moves = currentGame.moves({ square: square as any, verbose: true });
        setLegalMoves(moves);
      }
    } else {
      const moves = currentGame.moves({ square: square as any, verbose: true });
      if (moves.length > 0) {
        setSelectedSquare(square);
        setLegalMoves(moves);
      }
    }
  }, [selectedSquare, currentGame, moveIndex, readOnly, initialPgn, onGameChange]);

  const handlePrevMove = useCallback(() => {
    if (moveIndex > 0) {
      setMoveIndex(moveIndex - 1);
      setSelectedSquare(null);
      setLegalMoves([]);
    }
  }, [moveIndex]);

  const handleNextMove = useCallback(() => {
    const chess = new Chess();
    if (initialPgn) {
      chess.loadPgn(initialPgn);
    }
    const moves = chess.moves({ verbose: false }) as string[];
    if (moveIndex < moves.length) {
      setMoveIndex(moveIndex + 1);
      setSelectedSquare(null);
      setLegalMoves([]);
    }
  }, [moveIndex, initialPgn]);

  const handleReset = useCallback(() => {
    setMoveIndex(0);
    setSelectedSquare(null);
    setLegalMoves([]);
  }, []);

  const isLightSquare = (file: number, rank: number) => (file + rank) % 2 === 0;
  const isSelectedSquare = (file: number, rank: number) => {
    if (!selectedSquare) return false;
    const square = String.fromCharCode(97 + file) + (8 - rank);
    return square === selectedSquare;
  };
  const isLegalMove = (file: number, rank: number) => {
    const square = String.fromCharCode(97 + file) + (8 - rank);
    return legalMoves.some((m: any) => m.to === square);
  };

  // Get total moves count
  const chess = new Chess();
  if (initialPgn) {
    chess.loadPgn(initialPgn);
  }
  const totalMoves = (chess.moves({ verbose: false }) as string[]).length;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative bg-primary/10 p-4 rounded-lg shadow-lg" style={{ width: BOARD_SIZE + 32 }}>
        {/* Board coordinates */}
        <div className="absolute left-2 top-0 bottom-0 flex flex-col justify-between text-xs font-semibold text-foreground/60">
          {[8, 7, 6, 5, 4, 3, 2, 1].map(n => (
            <span key={n}>{n}</span>
          ))}
        </div>
        <div className="absolute left-0 right-0 bottom-2 flex justify-between px-6 text-xs font-semibold text-foreground/60">
          {['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map(f => (
            <span key={f}>{f}</span>
          ))}
        </div>

        {/* Chess board */}
        <div className="ml-6 mb-6 inline-block border-2 border-primary">
          {board.map((rank, rankIndex) => (
            <div key={rankIndex} className="flex">
              {rank.map((piece, fileIndex) => {
                const isLight = isLightSquare(fileIndex, rankIndex);
                const isSelected = isSelectedSquare(fileIndex, rankIndex);
                const isLegal = isLegalMove(fileIndex, rankIndex);

                return (
                  <button
                    key={`${fileIndex}-${rankIndex}`}
                    onClick={() => handleSquareClick(fileIndex, rankIndex)}
                    className={`
                      relative flex items-center justify-center
                      transition-colors duration-200 cursor-pointer
                      ${isLight ? 'bg-accent' : 'bg-secondary'}
                      ${isSelected ? 'ring-2 ring-primary ring-inset' : ''}
                      ${isLegal ? 'after:content-[""] after:w-3 after:h-3 after:bg-primary/50 after:rounded-full' : ''}
                    `}
                    style={{
                      width: SQUARE_SIZE,
                      height: SQUARE_SIZE,
                    }}
                    disabled={readOnly}
                  >
                    {piece && (
                      <span className="text-4xl select-none">
                        {PIECE_UNICODE[piece.color === 'w' ? piece.type.toUpperCase() : piece.type.toLowerCase()]}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleReset}
          title="Reset to start"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrevMove}
          disabled={moveIndex === 0}
          title="Previous move"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="px-3 py-2 text-sm font-medium text-foreground">
          {moveIndex} / {totalMoves}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={handleNextMove}
          disabled={moveIndex === totalMoves}
          title="Next move"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Game info */}
      <div className="text-sm text-foreground/70">
        <p>FEN: {currentGame.fen()}</p>
        <p>Turn: {currentGame.turn() === 'w' ? 'White' : 'Black'}</p>
        {currentGame.isCheckmate() && <p className="text-destructive font-semibold">Checkmate!</p>}
        {currentGame.isCheck() && <p className="text-accent font-semibold">Check!</p>}
      </div>
    </div>
  );
}
