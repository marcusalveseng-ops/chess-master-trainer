import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLocation } from 'wouter';
import { ArrowLeft, Search, Play } from 'lucide-react';
import GameReplay from '@/components/GameReplay';

export default function MasterGames() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGame, setSelectedGame] = useState<any>(null);
  const [replayMode, setReplayMode] = useState(false);

  const masterGames = [
    {
      id: 1,
      white: 'Bobby Fischer',
      black: 'Boris Spassky',
      event: 'World Championship 1972',
      year: 1972,
      opening: 'Sicilian Defense',
      result: '1-0',
      pgn: '[Event "World Championship 1972"]\n[Site "Reykjavik"]\n[Date "1972.09.01"]\n[White "Fischer, Robert"]\n[Black "Spassky, Boris"]\n\n1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Be3 e5 7. Nb3 Be6 8. f3 Be7 9. Qd2 O-O 10. O-O-O Nbd7 11. g4 b5 12. g5 b4 13. Ne2 Ne8 14. f4 a5 15. fxe5 Nxe5 16. Nxe5 dxe5 17. Qxd8 Rxd8 18. Rxd8+ Kf7 19. Rd7+ Kg6 20. Rxe7 Nxe7 21. Bxb4 axb4 22. Nd5 Nxd5 23. exd5 Kf5 24. d6 Ke4 25. d7 Kd3 26. d8=Q Kxc2 27. Qd2+ Kb3 28. Qb2+ Ka4 29. Qa3+ Kb5 30. Qb4+ Ka6 31. Qa5#',
    },
    {
      id: 2,
      white: 'Anatoly Karpov',
      black: 'Garry Kasparov',
      event: 'World Championship 1985',
      year: 1985,
      opening: 'French Defense',
      result: '1/2-1/2',
      pgn: '[Event "World Championship 1985"]\n[Site "Moscow"]\n[Date "1985.10.15"]\n[White "Karpov, Anatoly"]\n[Black "Kasparov, Garry"]\n\n1. e4 e6 2. d4 d5 3. Nc3 Nf6 4. Bg5 Be7 5. e5 Nfd7 6. Bxe7 Qxe7 7. f4 O-O 8. Nf3 c5 9. O-O cxd4 10. Nxd4 Nc6 11. Nxc6 bxc6 12. a4 Bb7 13. Bd3 Rfc8 14. Qe2 c5 15. Nxe6 fxe6 16. Qxe6+ Kh8 17. Qe4 Rc7 18. f5 Qd8 19. Qg4 Rg8 20. h4 Rf8 21. Qh5 Kg7 22. Qg5 Kh8 23. Qh5 Kg7 1/2-1/2',
    },
    {
      id: 3,
      white: 'Mikhail Tal',
      black: 'Mikhail Botvinnik',
      event: 'World Championship 1960',
      year: 1960,
      opening: 'Sicilian Defense',
      result: '1-0',
      pgn: '[Event "World Championship 1960"]\n[Site "Moscow"]\n[Date "1960.05.09"]\n[White "Tal, Mikhail"]\n[Black "Botvinnik, Mikhail"]\n\n1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Bg5 e6 7. f4 Be7 8. Qf3 Nbd7 9. O-O-O b5 10. Bxf6 Nxf6 11. f5 b4 12. fxe6 fxe6 13. Ne2 Bb7 14. Kb1 Rc8 15. Nd5 Nxd5 16. exd5 exd5 17. Nxd5 Bxd5 18. Qxd5 Rxc3 19. bxc3 bxc3 20. Qxd6 Qxd6 21. Rxd6 Rc8 22. Rc6 Kf7 23. Rxc3 Kg6 24. Rc7 Bf8 25. Rf7 Kg5 26. Rxf8 Kh4 27. Rf4+ Kg5 28. h4+ Kh5 29. Rf5+ Kg4 30. h5 Kh3 31. Rf3+ Kg4 32. h6 Kh4 33. h7 Kg4 34. h8=Q Kf4 35. Qf8+ Kg4 36. Qf4+ Kh3 37. Qf3+ Kh4 38. Qf4+ Kh3 39. Qf3+ Kh4 40. Qf4+ 1-0',
    },
  ];

  const filteredGames = masterGames.filter(game =>
    game.white.toLowerCase().includes(searchQuery.toLowerCase()) ||
    game.black.toLowerCase().includes(searchQuery.toLowerCase()) ||
    game.opening.toLowerCase().includes(searchQuery.toLowerCase()) ||
    game.event.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleReplay = (game: any) => {
    setSelectedGame(game);
    setReplayMode(true);
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
            <h1 className="text-2xl font-bold text-foreground">Master Games</h1>
          </div>
        </div>
      </header>

      <main className="container py-8">
        {replayMode && selectedGame ? (
          <div className="space-y-4">
            <Button
              variant="ghost"
              onClick={() => setReplayMode(false)}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to List
            </Button>
            <GameReplay
              pgn={selectedGame.pgn}
              title={`${selectedGame.white} vs ${selectedGame.black} - ${selectedGame.event}`}
            />
          </div>
        ) : (
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Search and List */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Search Master Games</CardTitle>
                <CardDescription>Find games by player, opening, or event</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-foreground/50" />
                  <Input
                    placeholder="e.g., Fischer, Sicilian, 1972..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-input border-border/50"
                  />
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3">
              {filteredGames.length === 0 ? (
                <Card className="border-border/50">
                  <CardContent className="pt-6 text-center">
                    <p className="text-foreground/60">No games found matching your search.</p>
                  </CardContent>
                </Card>
              ) : (
                filteredGames.map((game) => (
                  <Card
                    key={game.id}
                    className={`cursor-pointer border-border/50 hover:border-primary/50 transition-all ${
                      selectedGame?.id === game.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setSelectedGame(game)}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground">
                            {game.white} vs {game.black}
                          </h3>
                          <p className="text-sm text-foreground/60 mt-1">{game.event}</p>
                          <p className="text-sm text-foreground/60">{game.opening} • {game.year}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-primary">{game.result}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Details */}
          <div className="space-y-6">
            {selectedGame ? (
              <>
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="text-lg">{selectedGame.white}</CardTitle>
                    <CardDescription>vs {selectedGame.black}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-foreground/70">Event</span>
                        <span className="text-sm font-medium text-foreground">{selectedGame.event}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-foreground/70">Opening</span>
                        <span className="text-sm font-medium text-foreground">{selectedGame.opening}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-foreground/70">Year</span>
                        <span className="text-sm font-medium text-foreground">{selectedGame.year}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-foreground/70">Result</span>
                        <span className="text-sm font-bold text-primary">{selectedGame.result}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Button 
                  className="w-full"
                  onClick={() => handleReplay(selectedGame)}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Replay Game
                </Button>
              </>
            ) : (
              <Card className="border-border/50">
                <CardContent className="pt-6 text-center">
                  <p className="text-foreground/60">Select a game to view details</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
        )}
      </main>
    </div>
  );
}
