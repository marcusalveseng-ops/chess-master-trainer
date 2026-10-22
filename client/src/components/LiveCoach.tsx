import { useEffect, useState } from 'react';
import { Chess } from 'chess.js';
import type { Analysis } from '@shared/chess-coach';
import { trpc } from '@/lib/trpc';
import { Button } from './ui/button';
import ChessBoard from './ChessBoard';

export default function LiveCoach({ fen, pgn }: { fen: string; pgn: string }) {
  const auth = trpc.auth.me.useQuery(undefined, { retry: false });
  const [enabled, setEnabled] = useState(true);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<{ fen: string; pgn: string } | null>(null);
  const [explanation, setExplanation] = useState<{ fen: string; text: string } | null>(null);
  const explain = trpc.aiAnalysis.explainCandidates.useMutation();
  useEffect(() => {
    setAnalysis(null); setError(''); setPreview(null); setExplanation(null);
    if (!enabled || !fen) return;
    let worker: Worker | undefined;
    let active = true;
    const timer = setTimeout(() => {
      worker = new Worker(new URL('../workers/coach.worker.ts', import.meta.url), { type: 'module' });
      worker.onmessage = event => {
        if (!active) return;
        if (event.data.error) setError(event.data.error);
        else setAnalysis(event.data.result);
      };
      worker.onerror = () => { if (active) setError('O motor não pôde iniciar. Desative e ative o assistente para tentar novamente.'); };
      worker.postMessage({ fen, pgn });
    }, 250);
    return () => { active = false; clearTimeout(timer); worker?.terminate(); };
  }, [fen, pgn, enabled]);
  const current = analysis?.fen === fen ? analysis : null;
  async function explainPosition() {
    if (!current?.candidates.length) return;
    const requestedFen = fen;
    try {
      const result = await explain.mutateAsync({ fen, lines: current.candidates.map(c => c.line) });
      setExplanation({ fen: requestedFen, text: result.explanation });
    } catch { setExplanation({ fen: requestedFen, text: 'Explicação online indisponível. É necessário entrar na conta e configurar o serviço de IA no servidor. A análise local continua disponível.' }); }
  }
  return <section className="space-y-4 rounded-lg border p-4" aria-label="Assistente de IA">
    <div className="flex items-center justify-between gap-2"><h2 className="font-bold">Assistente de IA</h2>
      <Button variant="outline" onClick={() => setEnabled(!enabled)}>{enabled ? 'Desativar' : 'Ativar'}</Button></div>
    {enabled && <>
      <p className="text-sm">Análise local automática para quem joga agora. Valores positivos favorecem esse lado; 1 ponto equivale aproximadamente a um peão.</p>
      <p className="text-xs text-muted-foreground">Motor heurístico experimental, com busca curta. As linhas são possibilidades, não previsões garantidas.</p>
      {error ? <p role="alert">{error}</p> : !current ? <p role="status">Calculando possibilidades…</p> : current.terminal ? <p>Partida encerrada. Não há decisão pendente.</p> : <>
        <p className="text-xs">Profundidade concluída: {current.depth} meios-lances · {current.nodes} posições pesquisadas</p>
        {!current.candidates.length && <p>Limite de cálculo atingido antes de concluir a análise.</p>}
        {current.candidates.map(c => <article key={c.san} className="rounded border p-3 space-y-2">
          <h3 className="font-semibold">{c.san} · {Math.abs(c.score) > 90000 ? (c.score > 0 ? 'mate encontrado' : 'mate adversário encontrado') : `${c.score >= 0 ? '+' : ''}${(c.score / 100).toFixed(2)}`}</h3>
          <p className="font-mono text-sm">{c.line.join(' → ')}</p>
          <p className="text-sm"><strong>Pontos positivos:</strong> {c.positives.join(' ')}</p>
          <p className="text-sm"><strong>Riscos:</strong> {c.risks.join(' ')}</p>
          <Button size="sm" variant="outline" onClick={() => {
            const branch = new Chess(fen); c.line.forEach(move => branch.move(move));
            setPreview({ fen, pgn: branch.pgn() });
          }}>Explorar variante {c.san}</Button>
        </article>)}
        <Button onClick={explainPosition} disabled={!auth.data || explain.isPending || !current.candidates.length}>{explain.isPending ? 'Consultando IA…' : 'Explicar planos com IA online'}</Button>
        {!auth.data && <p className="text-xs">Entre na conta para usar explicações online. A análise local funciona sem login.</p>}
      </>}
      {explanation?.fen === fen && <p className="text-sm whitespace-pre-wrap">{explanation.text}</p>}
      {preview?.fen === fen && <div className="space-y-2"><p className="text-sm">Simulação da variante — use as setas para percorrer os lances.</p><ChessBoard initialPgn={preview.pgn} readOnly /><Button variant="outline" onClick={() => setPreview(null)}>Fechar variante</Button></div>}
    </>}
  </section>;
}
