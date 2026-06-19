import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLocation } from 'wouter';
import { ArrowLeft, Trash2, Eye } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import GameReplay from '@/components/GameReplay';

export default function History() {
  const [, setLocation] = useLocation();
  const [selectedGame, setSelectedGame] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'list' | 'replay'>('list');

  const { data: userGames, isLoading, refetch } = trpc.gamePersistence.getUserGames.useQuery(
    { limit: 50, offset: 0 }
  );

  const { mutate: deleteGame } = trpc.gamePersistence.deleteGame.useMutation({
    onSuccess: () => {
      refetch();
      alert('Game deleted successfully');
    },
  });

  const handleDelete = (gameId: number) => {
    if (confirm('Are you sure you want to delete this game?')) {
      deleteGame({ gameId });
    }
  };

  const handleReplay = (game: any) => {
    setSelectedGame(game);
    setViewMode('replay');
  };

  if (viewMode === 'replay' && selectedGame) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-secondary/10">
        <header className="border-b border-border/50 backdrop-blur-sm">
          <div className="container py-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setViewMode('list');
                  setSelectedGame(null);
                }}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to List
              </Button>
              <h1 className="text-2xl font-bold text-foreground">Game Replay</h1>
            </div>
          </div>
        </header>

        <main className="container py-8">
          <GameReplay
            pgn={selectedGame.pgn}
            title={`${selectedGame.title} - ${new Date(selectedGame.createdAt).toLocaleDateString()}`}
          />
          
          {selectedGame.notes && (
            <Card className="border-border/50 mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground/80 whitespace-pre-wrap">{selectedGame.notes}</p>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    );
  }

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
            <h1 className="text-2xl font-bold text-foreground">My Games</h1>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <div className="space-y-4">
          {isLoading ? (
            <Card className="border-border/50">
              <CardContent className="py-8">
                <p className="text-center text-foreground/60">Loading your games...</p>
              </CardContent>
            </Card>
          ) : userGames && userGames.length > 0 ? (
            userGames.map((game: any) => (
              <Card key={game.id} className="border-border/50 hover:border-border/80 transition-colors">
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{game.title}</h3>
                      <p className="text-sm text-foreground/60 mt-1">
                        {new Date(game.createdAt).toLocaleDateString()} • {game.opening || 'Unknown Opening'}
                      </p>
                      {game.notes && (
                        <p className="text-sm text-foreground/70 mt-2 line-clamp-2">{game.notes}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReplay(game)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Replay
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(game.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="border-border/50">
              <CardContent className="py-8">
                <p className="text-center text-foreground/60">
                  No games yet. Start playing and analyzing to build your library!
                </p>
                <div className="flex justify-center mt-4">
                  <Button onClick={() => setLocation('/play')}>
                    Play Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
