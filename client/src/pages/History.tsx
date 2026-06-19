import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useLocation } from 'wouter';
import { ArrowLeft, Trash2, Eye } from 'lucide-react';

export default function History() {
  const [, setLocation] = useLocation();
  const [games, setGames] = useState<any[]>([
    {
      id: 1,
      title: 'Sicilian Defense Study',
      opening: 'Sicilian Defense',
      date: '2024-01-15',
      result: '1-0',
      moves: 45,
      notes: 'Good endgame conversion'
    },
    {
      id: 2,
      title: 'Italian Game Practice',
      opening: 'Italian Game',
      date: '2024-01-14',
      result: '1/2-1/2',
      moves: 32,
      notes: 'Balanced position'
    },
  ]);

  const handleDelete = (id: number) => {
    setGames(games.filter(g => g.id !== id));
  };

  const handleView = (id: number) => {
    setLocation(`/play?gameId=${id}`);
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
            <h1 className="text-2xl font-bold text-foreground">My Games</h1>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <div className="space-y-4">
          {games.length === 0 ? (
            <Card className="border-border/50">
              <CardContent className="pt-8 text-center">
                <p className="text-foreground/60 mb-4">No games yet. Start training!</p>
                <Button onClick={() => setLocation('/play')}>
                  Play Now
                </Button>
              </CardContent>
            </Card>
          ) : (
            games.map((game) => (
              <Card key={game.id} className="border-border/50 hover:border-primary/50 transition-colors">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground text-lg">{game.title}</h3>
                      <p className="text-sm text-foreground/60 mb-2">{game.opening}</p>
                      <div className="flex gap-4 text-sm text-foreground/70">
                        <span>Date: {game.date}</span>
                        <span>Moves: {game.moves}</span>
                        <span>Result: {game.result}</span>
                      </div>
                      {game.notes && (
                        <p className="text-sm text-foreground/60 mt-2">Notes: {game.notes}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleView(game.id)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(game.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
