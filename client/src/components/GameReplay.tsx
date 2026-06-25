import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
import ChessBoard from './ChessBoard';
import { Chess } from 'chess.js';

interface GameReplayProps {
  pgn: string;
  title?: string;
}

export default function GameReplay({ pgn, title = 'Game Replay' }: GameReplayProps) {
  const [moveIndex, setMoveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [moveCount, setMoveCount] = useState(0);

  // Parse PGN correctly using chess.js
  useEffect(() => {
    try {
      const chess = new Chess();
      chess.loadPgn(pgn);
      const moves = chess.moves({ verbose: false });
      setMoveCount(moves.length);
    } catch (e) {
      console.error('Failed to parse PGN:', e);
      setMoveCount(0);
    }
  }, [pgn]);

  // Auto-play moves
  useEffect(() => {
    if (!isPlaying) return;

    const timer = setTimeout(() => {
      if (moveIndex < moveCount) {
        setMoveIndex(moveIndex + 1);
      } else {
        setIsPlaying(false);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [isPlaying, moveIndex, moveCount]);

  const handlePrevious = () => {
    if (moveIndex > 0) setMoveIndex(moveIndex - 1);
  };

  const handleNext = () => {
    if (moveIndex < moveCount) setMoveIndex(moveIndex + 1);
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setMoveIndex(0);
    setIsPlaying(false);
  };

  return (
    <div className="space-y-4">
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>Move {moveIndex} of {moveCount}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-center">
            <ChessBoard initialPgn={pgn} moveIndex={moveIndex} readOnly={true} />
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={moveIndex === 0}
              title="Reset to start"
            >
              ⟲
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevious}
              disabled={moveIndex === 0}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handlePlayPause}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4 mr-1" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-1" />
                  Play
                </>
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleNext}
              disabled={moveIndex >= moveCount}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Move Progress */}
          <div className="w-full bg-secondary/20 rounded-lg h-2">
            <div
              className="bg-primary h-2 rounded-lg transition-all"
              style={{ width: moveCount > 0 ? `${(moveIndex / moveCount) * 100}%` : '0%' }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
