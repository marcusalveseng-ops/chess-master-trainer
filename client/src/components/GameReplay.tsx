import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
import ChessBoard from './ChessBoard';
import { trpc } from '@/lib/trpc';

interface GameReplayProps {
  pgn: string;
  title?: string;
}

export default function GameReplay({ pgn, title = 'Game Replay' }: GameReplayProps) {
  const [moveIndex, setMoveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [commentary, setCommentary] = useState<string>('');
  const [moveCount, setMoveCount] = useState(0);

  // Parse PGN to get move count
  useEffect(() => {
    const moves = pgn.match(/\d+\.\s+\S+/g) || [];
    setMoveCount(moves.length * 2); // Approximate move count
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
              style={{ width: `${(moveIndex / moveCount) * 100}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Commentary Panel */}
      {commentary && (
        <Card className="border-border/50 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base">Move Commentary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground/80">{commentary}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
