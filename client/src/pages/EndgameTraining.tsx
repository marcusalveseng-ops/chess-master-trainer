import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import ChessBoard from '@/components/ChessBoard';
import { useLocation } from 'wouter';
import { ArrowLeft, Play, Trophy, Target } from 'lucide-react';

export default function EndgameTraining() {
  const [, setLocation] = useLocation();
  const [selectedPosition, setSelectedPosition] = useState<any>(null);
  const [currentChallenge, setCurrentChallenge] = useState<any>(null);
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced' | 'expert'>('beginner');
  const [selectedType, setSelectedType] = useState<string>('');

  // Fetch all positions
  const { data: allPositions } = trpc.endgame.getAllPositions.useQuery();
  
  // Fetch positions by difficulty
  const { data: positionsByDifficulty } = trpc.endgame.getByDifficulty.useQuery(difficulty);
  
  // Fetch endgame types
  const { data: endgameTypes } = trpc.endgame.getTypes.useQuery();
  
  // Fetch user challenges
  const { data: userChallenges } = trpc.endgame.getUserChallenges.useQuery();
  
  // Fetch user stats
  const { data: userStats } = trpc.endgame.getUserStats.useQuery();
  
  // Fetch recommended challenges
  const { data: recommended } = trpc.endgame.getRecommended.useQuery(difficulty);

  // Create challenge mutation
  const { mutate: createChallenge, isPending: isCreating } = trpc.endgame.createChallenge.useMutation({
    onSuccess: (data) => {
      setCurrentChallenge(data);
    },
  });

  // Record attempt mutation
  const { mutate: recordAttempt, isPending: isRecording } = trpc.endgame.recordAttempt.useMutation({
    onSuccess: (data) => {
      if (data.solved) {
        alert('Congratulations! You solved the endgame!');
      }
    },
  });

  const handleStartChallenge = (position: any) => {
    setSelectedPosition(position);
    createChallenge(position.id || 1);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-orange-100 text-orange-800';
      case 'expert':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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
            <h1 className="text-2xl font-bold text-foreground">Endgame Training</h1>
          </div>
        </div>
      </header>

      <main className="container py-8">
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="text-center">
                <Trophy className="w-8 h-8 mx-auto mb-2 text-amber-600" />
                <p className="text-sm text-foreground/60">Solved</p>
                <p className="text-2xl font-bold">{userStats?.solvedChallenges || 0}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="text-center">
                <Target className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                <p className="text-sm text-foreground/60">Total Attempts</p>
                <p className="text-2xl font-bold">{userStats?.totalAttempts || 0}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-foreground/60">Success Rate</p>
                <p className="text-2xl font-bold">{Math.round(userStats?.successRate || 0)}%</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-foreground/60">Total Score</p>
                <p className="text-2xl font-bold">{userStats?.totalScore || 0}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Chessboard */}
          <div className="lg:col-span-2">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>
                  {selectedPosition ? selectedPosition.name : 'Select a Position'}
                </CardTitle>
                {selectedPosition && (
                  <CardDescription>{selectedPosition.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="flex justify-center">
                {selectedPosition ? (
                  <ChessBoard 
                    initialPgn={selectedPosition.fen}
                    readOnly={false}
                  />
                ) : (
                  <div className="text-center py-12">
                    <p className="text-foreground/60">Select a position to start training</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {selectedPosition && (
              <Card className="border-border/50 mt-4">
                <CardHeader>
                  <CardTitle className="text-lg">Position Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-1">Objective</p>
                    <p className="text-sm text-foreground/70">{selectedPosition.objective}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2">Key Themes</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedPosition.keyThemes?.map((theme: string) => (
                        <Badge key={theme} variant="secondary">{theme}</Badge>
                      ))}
                    </div>
                  </div>
                  {selectedPosition.historicalContext && (
                    <div>
                      <p className="text-sm font-medium mb-1">Historical Context</p>
                      <p className="text-sm text-foreground/70">{selectedPosition.historicalContext}</p>
                    </div>
                  )}
                  <Button 
                    onClick={() => handleStartChallenge(selectedPosition)}
                    disabled={isCreating}
                    className="w-full"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    {isCreating ? 'Starting...' : 'Start Challenge'}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Filter by Difficulty</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {['beginner', 'intermediate', 'advanced', 'expert'].map((diff) => (
                  <Button
                    key={diff}
                    variant={difficulty === diff ? 'default' : 'outline'}
                    className="w-full justify-start"
                    onClick={() => setDifficulty(diff as any)}
                  >
                    <Badge className={`mr-2 ${getDifficultyColor(diff)}`}>
                      {diff.charAt(0).toUpperCase()}
                    </Badge>
                    {diff.charAt(0).toUpperCase() + diff.slice(1)}
                  </Button>
                ))}
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Recommended</CardTitle>
                <CardDescription>Based on your level</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {recommended?.slice(0, 3).map((pos: any) => (
                  <Button
                    key={pos.name}
                    variant="outline"
                    className="w-full justify-start text-left h-auto py-2"
                    onClick={() => handleStartChallenge(pos)}
                  >
                    <div>
                      <p className="text-sm font-medium">{pos.name}</p>
                      <p className="text-xs text-foreground/60">{pos.endgameType}</p>
                    </div>
                  </Button>
                ))}
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Positions</CardTitle>
                <CardDescription>{positionsByDifficulty?.length || 0} available</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 max-h-96 overflow-y-auto">
                {positionsByDifficulty?.map((pos: any) => (
                  <Button
                    key={pos.name}
                    variant={selectedPosition?.name === pos.name ? 'default' : 'outline'}
                    className="w-full justify-start text-left h-auto py-2"
                    onClick={() => setSelectedPosition(pos)}
                  >
                    <div>
                      <p className="text-sm font-medium">{pos.name}</p>
                      <p className="text-xs text-foreground/60">{pos.endgameType}</p>
                    </div>
                  </Button>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
