import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { trpc } from '@/lib/trpc';
import { AlertCircle, BookOpen, Zap, Target } from 'lucide-react';

interface PostGameAnalysisProps {
  pgn: string;
  playerColor?: 'white' | 'black';
}

export function PostGameAnalysis({ pgn, playerColor = 'white' }: PostGameAnalysisProps) {
  const [selectedPhase, setSelectedPhase] = useState<'opening' | 'middlegame' | 'endgame'>('opening');

  // Generate base analysis
  const analysisQuery = trpc.gameAnalysis.analyzeGame.useQuery({
    pgn,
    playerColor,
  });

  // Generate AI commentary
  const commentaryQuery = trpc.gameAnalysis.generateAICommentary.useQuery({
    pgn,
    playerColor,
    includeStrategicAdvice: true,
  });

  // Get recommendations
  const recommendationsQuery = trpc.gameAnalysis.getRecommendations.useQuery({
    pgn,
    focusArea: selectedPhase,
  });

  const analysis = analysisQuery.data;
  const commentary = commentaryQuery.data;
  const recommendations = recommendationsQuery.data;

  if (analysisQuery.isLoading || commentaryQuery.isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Post-Game Analysis</CardTitle>
          <CardDescription>Analyzing your game...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Spinner />
        </CardContent>
      </Card>
    );
  }

  if (!analysis) {
    return (
      <Card className="w-full border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            Analysis Unavailable
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-amber-800">
            Unable to analyze this game. Please ensure the PGN format is valid.
          </p>
        </CardContent>
      </Card>
    );
  }

  const currentPhaseAnalysis = analysis.phaseAnalyses.find(pa => pa.phase === selectedPhase);

  return (
    <div className="w-full space-y-4">
      {/* Overall Assessment */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Game Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-600">Total Moves</p>
              <p className="text-2xl font-bold text-slate-900">{analysis.totalMoves}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-600">Phases Played</p>
              <p className="text-2xl font-bold text-blue-900">{analysis.phases.length}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-green-600">Key Points</p>
              <p className="text-2xl font-bold text-green-900">{analysis.keyTurningPoints.length}</p>
            </div>
          </div>

          <div className="p-4 bg-slate-100 rounded-lg border border-slate-200">
            <p className="text-sm font-medium text-slate-700 mb-2">Assessment</p>
            <p className="text-slate-700">{analysis.overallAssessment}</p>
          </div>

          {analysis.keyTurningPoints.length > 0 && (
            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">Key Turning Points</p>
              <ul className="space-y-1">
                {analysis.keyTurningPoints.map((point, i) => (
                  <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                    <span className="text-amber-500 mt-1">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Phase-by-Phase Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Phase Analysis</CardTitle>
          <CardDescription>Detailed breakdown of each game phase</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedPhase} onValueChange={(v) => setSelectedPhase(v as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="opening" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                <span className="hidden sm:inline">Opening</span>
              </TabsTrigger>
              <TabsTrigger value="middlegame" className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                <span className="hidden sm:inline">Middlegame</span>
              </TabsTrigger>
              <TabsTrigger value="endgame" className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                <span className="hidden sm:inline">Endgame</span>
              </TabsTrigger>
            </TabsList>

            {analysis.phaseAnalyses.map((phase) => (
              <TabsContent key={phase.phase} value={phase.phase} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Phase Info */}
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-slate-600">Moves in Phase</p>
                      <p className="text-xl font-bold text-slate-900">{phase.moveCount}</p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-slate-600 mb-2">Key Themes</p>
                      <div className="flex flex-wrap gap-2">
                        {phase.themes.map((theme) => (
                          <Badge key={theme} variant="secondary">
                            {theme}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {phase.keyMoves.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-slate-600 mb-2">Key Moves</p>
                        <ul className="space-y-1">
                          {phase.keyMoves.map((move, i) => (
                            <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                              <span className="text-blue-500 mt-0.5">→</span>
                              <span>{move}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Recommendations */}
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-2">Recommendations</p>
                    <ul className="space-y-2">
                      {phase.recommendations.map((rec, i) => (
                        <li key={i} className="text-sm text-slate-700 p-2 bg-slate-50 rounded border-l-2 border-blue-400">
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-sm font-medium text-slate-700 mb-2">Strategic Notes</p>
                  <p className="text-sm text-slate-700">{phase.strategicNotes}</p>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* AI Commentary */}
      {commentary?.aiCommentary && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">AI Coach Commentary</CardTitle>
            <CardDescription>Detailed strategic insights from AI analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-sm text-slate-700 whitespace-pre-wrap">
                {commentary.aiCommentary}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Base Commentary */}
      {commentary?.baseCommentary && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Analysis Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-sm text-slate-700 whitespace-pre-wrap">
              {commentary.baseCommentary}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
