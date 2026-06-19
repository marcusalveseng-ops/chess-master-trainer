import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import ChessBoard from '@/components/ChessBoard';
import { useLocation } from 'wouter';
import { ArrowLeft, Save } from 'lucide-react';

export default function Play() {
  const [, setLocation] = useLocation();
  const [pgn, setPgn] = useState('');
  const [gameTitle, setGameTitle] = useState('');
  const [gameNotes, setGameNotes] = useState('');
  const [currentFen, setCurrentFen] = useState('');
  const [currentPgn, setCurrentPgn] = useState('');

  const handleGameChange = (fen: string, pgn: string, moves: any[]) => {
    setCurrentFen(fen);
    setCurrentPgn(pgn);
  };

  const handleSaveGame = async () => {
    if (!currentPgn) {
      alert('No game to save');
      return;
    }
    // TODO: Call tRPC procedure to save game
    alert('Game saved! (Feature coming soon)');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-secondary/10">
      <header className="border-b border-border/50 backdrop-blur-sm">
        <div className="container py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setLocation('/')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold text-foreground">Play & Analyze</h1>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Chessboard */}
          <div className="lg:col-span-2">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Interactive Chessboard</CardTitle>
                <CardDescription>Play moves or paste a PGN to analyze</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <ChessBoard 
                  onGameChange={handleGameChange}
                  initialPgn={pgn || undefined}
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Game Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground/70 mb-2 block">
                    Game Title
                  </label>
                  <Input
                    placeholder="e.g., Sicilian Defense Study"
                    value={gameTitle}
                    onChange={(e) => setGameTitle(e.target.value)}
                    className="bg-input border-border/50"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground/70 mb-2 block">
                    Notes
                  </label>
                  <Textarea
                    placeholder="Add your observations..."
                    value={gameNotes}
                    onChange={(e) => setGameNotes(e.target.value)}
                    className="bg-input border-border/50 h-24"
                  />
                </div>
                <Button 
                  onClick={handleSaveGame}
                  className="w-full"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Game
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Current Position</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs text-foreground/60 mb-1">FEN</p>
                  <p className="text-xs font-mono bg-muted p-2 rounded break-all">
                    {currentFen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="pgn" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="pgn">PGN</TabsTrigger>
                <TabsTrigger value="analysis">Analysis</TabsTrigger>
              </TabsList>
              <TabsContent value="pgn" className="space-y-4">
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="text-sm">Load PGN</CardTitle>
                    <CardDescription className="text-xs">Paste a game in PGN format</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      placeholder='[Event "?"]\n[Site "?"]\n[Date "2024.01.01"]\n\n1. e4 c5 2. Nf3...'
                      value={pgn}
                      onChange={(e) => setPgn(e.target.value)}
                      className="bg-input border-border/50 h-32 text-xs font-mono"
                    />
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="analysis" className="space-y-4">
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="text-sm">Strategic Tips</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-foreground/70">
                    <p>AI analysis coming soon...</p>
                    <ul className="mt-3 space-y-2 text-xs">
                      <li>• Consider forcing trades to enter the endgame</li>
                      <li>• Play positionally to maintain pressure</li>
                      <li>• Look for tactical opportunities</li>
                    </ul>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
}
