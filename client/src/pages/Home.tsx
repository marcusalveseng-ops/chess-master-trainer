import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { BookOpen, Gamepad2, TrendingUp, Users } from "lucide-react";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-secondary/10">
        <header className="border-b border-border/50 backdrop-blur-sm">
          <div className="container py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-xl font-bold text-primary-foreground">♟</span>
                </div>
                <h1 className="text-2xl font-bold text-foreground">Chess Master Trainer</h1>
              </div>
              <Button asChild>
                <a href={getLoginUrl()}>Sign In</a>
              </Button>
            </div>
          </div>
        </header>

        <main className="container py-20">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-5xl font-bold text-foreground mb-6">
              Master the Art of Chess Strategy
            </h2>
            <p className="text-xl text-foreground/70 mb-8">
              Study openings, analyze positions, and learn from the greatest masters of all time. 
              Train your strategic thinking with AI-powered insights and historical game analysis.
            </p>
            <Button size="lg" asChild className="text-lg px-8 py-6">
              <a href={getLoginUrl()}>Get Started</a>
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-16">
            <Card className="border-border/50 hover:border-primary/50 transition-colors">
              <CardHeader>
                <Gamepad2 className="w-8 h-8 text-primary mb-2" />
                <CardTitle>Interactive Training</CardTitle>
                <CardDescription>Play and analyze positions with real-time feedback</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground/70">
                  Simulate games, practice openings, and explore tactical variations with a fully interactive chessboard.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50 hover:border-primary/50 transition-colors">
              <CardHeader>
                <BookOpen className="w-8 h-8 text-primary mb-2" />
                <CardTitle>Opening Explorer</CardTitle>
                <CardDescription>Explore thousands of master games by opening</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground/70">
                  Access the Lichess and Chess.com databases to study openings played by the world's greatest players.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50 hover:border-primary/50 transition-colors">
              <CardHeader>
                <Users className="w-8 h-8 text-primary mb-2" />
                <CardTitle>Master Games Library</CardTitle>
                <CardDescription>Study 200 years of chess history</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground/70">
                  Replay and analyze games from legendary grandmasters throughout chess history with AI commentary.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50 hover:border-primary/50 transition-colors">
              <CardHeader>
                <TrendingUp className="w-8 h-8 text-primary mb-2" />
                <CardTitle>Strategic Analysis</CardTitle>
                <CardDescription>AI-powered insights for better decisions</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground/70">
                  Get contextual advice on when to force trades, play positionally, or make tactical strikes.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="bg-primary/10 border border-primary/20 rounded-lg p-8 text-center">
            <h3 className="text-2xl font-bold text-foreground mb-4">Ready to Elevate Your Game?</h3>
            <p className="text-foreground/70 mb-6">
              Join Chess Master Trainer and start your journey to mastery today.
            </p>
            <Button size="lg" asChild>
              <a href={getLoginUrl()}>Sign In to Begin</a>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-secondary/10">
      <header className="border-b border-border/50 backdrop-blur-sm">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-xl font-bold text-primary-foreground">♟</span>
              </div>
              <h1 className="text-2xl font-bold text-foreground">Chess Master Trainer</h1>
            </div>
            <div className="text-sm text-foreground/70">
              Welcome, <span className="font-semibold text-foreground">{user?.name || 'Trainer'}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card 
            className="cursor-pointer border-border/50 hover:border-primary/50 hover:shadow-lg transition-all"
            onClick={() => setLocation('/play')}
          >
            <CardHeader>
              <Gamepad2 className="w-8 h-8 text-primary mb-2" />
              <CardTitle>Play & Analyze</CardTitle>
              <CardDescription>Train your skills</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground/70">
                Play against AI or analyze your own positions with an interactive chessboard.
              </p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer border-border/50 hover:border-primary/50 hover:shadow-lg transition-all"
            onClick={() => setLocation('/openings')}
          >
            <CardHeader>
              <BookOpen className="w-8 h-8 text-primary mb-2" />
              <CardTitle>Opening Explorer</CardTitle>
              <CardDescription>Study openings</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground/70">
                Explore master games and opening statistics from Lichess and Chess.com.
              </p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer border-border/50 hover:border-primary/50 hover:shadow-lg transition-all"
            onClick={() => setLocation('/games')}
          >
            <CardHeader>
              <Users className="w-8 h-8 text-primary mb-2" />
              <CardTitle>Master Games</CardTitle>
              <CardDescription>Learn from legends</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground/70">
                Study and replay games from the greatest players throughout chess history.
              </p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer border-border/50 hover:border-primary/50 hover:shadow-lg transition-all"
            onClick={() => setLocation('/history')}
          >
            <CardHeader>
              <TrendingUp className="w-8 h-8 text-primary mb-2" />
              <CardTitle>My Games</CardTitle>
              <CardDescription>Track progress</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground/70">
                Review your training games, annotations, and key positions.
              </p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer border-border/50 hover:border-primary/50 hover:shadow-lg transition-all"
            onClick={() => setLocation('/progress')}
          >
            <CardHeader>
              <TrendingUp className="w-8 h-8 text-primary mb-2" />
              <CardTitle>Progress</CardTitle>
              <CardDescription>View statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground/70">
                Monitor your learning journey and opening mastery.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
