import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLocation } from 'wouter';
import { ArrowLeft, TrendingUp, BookOpen, Target } from 'lucide-react';

export default function Progress() {
  const [, setLocation] = useLocation();

  const stats = {
    gamesAnalyzed: 12,
    openingsStudied: 5,
    keyPositionsMarked: 23,
    totalHours: 8.5,
  };

  const recentOpenings = [
    { name: 'Sicilian Defense', games: 4, lastStudied: '2024-01-15' },
    { name: 'Italian Game', games: 3, lastStudied: '2024-01-14' },
    { name: 'Queen\'s Gambit', games: 2, lastStudied: '2024-01-12' },
    { name: 'King\'s Indian Defense', games: 2, lastStudied: '2024-01-10' },
    { name: 'English Opening', games: 1, lastStudied: '2024-01-08' },
  ];

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
            <h1 className="text-2xl font-bold text-foreground">Your Progress</h1>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-foreground/70">Games Analyzed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{stats.gamesAnalyzed}</div>
              <p className="text-xs text-foreground/60 mt-1">Training sessions</p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-foreground/70">Openings Studied</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-secondary">{stats.openingsStudied}</div>
              <p className="text-xs text-foreground/60 mt-1">Different openings</p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-foreground/70">Key Positions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-accent">{stats.keyPositionsMarked}</div>
              <p className="text-xs text-foreground/60 mt-1">Marked for study</p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-foreground/70">Study Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{stats.totalHours}h</div>
              <p className="text-xs text-foreground/60 mt-1">Total hours</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Learning Journey
                </CardTitle>
                <CardDescription>Your chess improvement over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Opening Knowledge</span>
                      <span className="text-sm text-foreground/60">65%</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: '65%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Middlegame Strategy</span>
                      <span className="text-sm text-foreground/60">52%</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-secondary" style={{ width: '52%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Endgame Mastery</span>
                      <span className="text-sm text-foreground/60">48%</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-accent" style={{ width: '48%' }} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Study Goals
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
                  <span className="text-sm font-medium">Master 10 Openings</span>
                  <span className="text-sm text-foreground/60">5/10</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-secondary/10 rounded-lg">
                  <span className="text-sm font-medium">Analyze 50 Master Games</span>
                  <span className="text-sm text-foreground/60">12/50</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-accent/10 rounded-lg">
                  <span className="text-sm font-medium">Study 5 Endgame Types</span>
                  <span className="text-sm text-foreground/60">2/5</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  Recent Openings
                </CardTitle>
                <CardDescription>Your studied openings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentOpenings.map((opening, idx) => (
                    <div key={idx} className="pb-3 border-b border-border/50 last:border-0 last:pb-0">
                      <p className="font-medium text-sm text-foreground">{opening.name}</p>
                      <div className="flex justify-between mt-1">
                        <span className="text-xs text-foreground/60">{opening.games} games</span>
                        <span className="text-xs text-foreground/60">{opening.lastStudied}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
