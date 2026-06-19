import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { AlertCircle, Lightbulb, Zap } from 'lucide-react';
import { trpc } from '@/lib/trpc';

interface StrategicAnalysisPanelProps {
  fen: string;
  gamePhase?: 'opening' | 'middlegame' | 'endgame';
}

export default function StrategicAnalysisPanel({ fen, gamePhase = 'middlegame' }: StrategicAnalysisPanelProps) {
  const [showAnalysis, setShowAnalysis] = useState(false);

  const { mutate, data: analysis, isPending } = trpc.aiAnalysis.getStrategicTips.useMutation({
    onSuccess: () => setShowAnalysis(true),
  });

  const handleAnalyze = async () => {
    mutate({
      fen,
      gamePhase,
    });
  };

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-primary" />
          Strategic Analysis
        </CardTitle>
        <CardDescription>AI-powered position insights</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!showAnalysis ? (
          <Button onClick={handleAnalyze} className="w-full" disabled={isPending}>
            {isPending ? (
              <>
                <Spinner className="w-4 h-4 mr-2" />
                Analyzing...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Get Strategic Tips
              </>
            )}
          </Button>
        ) : isPending ? (
          <div className="flex items-center justify-center py-8">
            <Spinner className="w-6 h-6" />
          </div>
        ) : analysis ? (
          <div className="space-y-4">
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
              <p className="text-sm font-semibold text-foreground mb-1">Trading Strategy</p>
              <p className="text-sm text-foreground/70">{analysis.tradingAdvice}</p>
            </div>

            <div className="bg-secondary/10 border border-secondary/20 rounded-lg p-3">
              <p className="text-sm font-semibold text-foreground mb-1">Approach</p>
              <p className="text-sm text-foreground/70">{analysis.approach}</p>
            </div>

            <div className="bg-accent/10 border border-accent/20 rounded-lg p-3">
              <p className="text-sm font-semibold text-foreground mb-1">Piece Strategy</p>
              <p className="text-sm text-foreground/70">{analysis.pieceStrategy}</p>
            </div>

            {analysis.keyThemes && analysis.keyThemes.length > 0 && (
              <div className="bg-muted rounded-lg p-3">
                <p className="text-sm font-semibold text-foreground mb-2">Key Themes</p>
                <div className="flex flex-wrap gap-2">
                  {analysis.keyThemes.map((theme: string, idx: number) => (
                    <span
                      key={idx}
                      className="text-xs bg-primary/20 text-primary px-2 py-1 rounded"
                    >
                      {theme}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-primary/5 border border-primary/10 rounded-lg p-3">
              <p className="text-sm font-semibold text-foreground mb-1">Recommendation</p>
              <p className="text-sm text-foreground/70 font-medium">{analysis.recommendation}</p>
            </div>

            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setShowAnalysis(false)}
            >
              Clear Analysis
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="w-4 h-4" />
            <span>Failed to analyze position</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
