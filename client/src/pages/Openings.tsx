import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLocation } from 'wouter';
import { ArrowLeft, Search, TrendingUp } from 'lucide-react';

export default function Openings() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOpening, setSelectedOpening] = useState<any>(null);

  const popularOpenings = [
    { eco: 'C20', name: 'Italian Game', games: 45230, whiteWins: 0.52, draws: 0.35, blackWins: 0.13 },
    { eco: 'C44', name: 'Scotch Game', games: 38920, whiteWins: 0.51, draws: 0.36, blackWins: 0.13 },
    { eco: 'B20', name: 'Sicilian Defense', games: 156780, whiteWins: 0.48, draws: 0.32, blackWins: 0.20 },
    { eco: 'D35', name: 'Queen\'s Gambit Declined', games: 89340, whiteWins: 0.52, draws: 0.38, blackWins: 0.10 },
    { eco: 'E60', name: 'King\'s Indian Defense', games: 67890, whiteWins: 0.50, draws: 0.40, blackWins: 0.10 },
    { eco: 'A40', name: 'English Opening', games: 45670, whiteWins: 0.51, draws: 0.37, blackWins: 0.12 },
  ];

  const filteredOpenings = popularOpenings.filter(op =>
    op.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    op.eco.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            <h1 className="text-2xl font-bold text-foreground">Opening Explorer</h1>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Search and List */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Search Openings</CardTitle>
                <CardDescription>Find openings by name or ECO code</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-foreground/50" />
                  <Input
                    placeholder="e.g., Sicilian, D35, Italian..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-input border-border/50"
                  />
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3">
              {filteredOpenings.map((opening) => (
                <Card
                  key={opening.eco}
                  className={`cursor-pointer border-border/50 hover:border-primary/50 transition-all ${
                    selectedOpening?.eco === opening.eco ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedOpening(opening)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-foreground">{opening.name}</h3>
                        <p className="text-sm text-foreground/60">ECO: {opening.eco}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-foreground">{opening.games.toLocaleString()} games</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Details */}
          <div className="space-y-6">
            {selectedOpening ? (
              <>
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="text-lg">{selectedOpening.name}</CardTitle>
                    <CardDescription>{selectedOpening.eco}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-foreground/70">White Wins</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary"
                              style={{ width: `${selectedOpening.whiteWins * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-foreground">
                            {(selectedOpening.whiteWins * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-foreground/70">Draws</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-secondary"
                              style={{ width: `${selectedOpening.draws * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-foreground">
                            {(selectedOpening.draws * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-foreground/70">Black Wins</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-accent"
                              style={{ width: `${selectedOpening.blackWins * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-foreground">
                            {(selectedOpening.blackWins * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Statistics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-foreground/70">Total Games</span>
                      <span className="font-semibold">{selectedOpening.games.toLocaleString()}</span>
                    </div>
                  </CardContent>
                </Card>

                <Button className="w-full">Study This Opening</Button>
              </>
            ) : (
              <Card className="border-border/50">
                <CardContent className="pt-6 text-center">
                  <p className="text-foreground/60">Select an opening to view details</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
