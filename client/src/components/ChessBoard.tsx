import { useState, useMemo, useEffect, useRef } from 'react';
import { Chess, type Move, type Square } from 'chess.js';
import { positionAt } from '@shared/chess-position';
import { Button } from '@/components/ui/button';

interface ChessBoardProps {
  onGameChange?: (fen: string, pgn: string, moves: Move[]) => void;
  initialPgn?: string;
  initialFen?: string;
  readOnly?: boolean;
  moveIndex?: number;
}
const pieces: Record<string, string> = {
  K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙',
  k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟',
};
export default function ChessBoard({ initialPgn = '', initialFen, readOnly = false, moveIndex: externalIndex, onGameChange }: ChessBoardProps) {
  const [record, setRecord] = useState('');
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<Square | null>(null);
  const [promotion, setPromotion] = useState<Square | null>(null);
  const [error, setError] = useState('');
  const callback = useRef(onGameChange);
  callback.current = onGameChange;
  useEffect(() => {
    try {
      const loaded = new Chess(initialFen);
      if (initialPgn.trim()) loaded.loadPgn(initialPgn);
      setRecord(loaded.pgn());
      setIndex(readOnly ? 0 : loaded.history().length);
      setError('');
      setSelected(null);
      setPromotion(null);
    } catch {
      setError('PGN ou FEN inválido. Corrija a posição para continuar.');
    }
  }, [initialPgn, initialFen, readOnly]);
  const game = useMemo(() => {
    try { return positionAt(record, externalIndex ?? index, initialFen); }
    catch { return new Chess(); }
  }, [record, index, externalIndex, initialFen]);
  const total = useMemo(() => {
    try { const g = new Chess(initialFen); if (record) g.loadPgn(record); return g.history().length; }
    catch { return 0; }
  }, [record, initialFen]);
  useEffect(() => { if (!error) callback.current?.(game.fen(), game.pgn(), game.history({ verbose: true })); }, [game, error]);
  const legal = selected ? game.moves({ square: selected, verbose: true }) : [];
  function commit(to: Square, piece = 'q') {
    try {
      const next = positionAt(record, index, initialFen);
      next.move({ from: selected!, to, promotion: piece });
      setRecord(next.pgn());
      setIndex(next.history().length);
      setSelected(null);
      setPromotion(null);
    } catch { setError('Esse lance não é permitido.'); }
  }
  function click(square: Square) {
    if (readOnly || error || game.isGameOver() || promotion) return;
    const candidate = legal.find(move => move.to === square);
    if (candidate) {
      if (candidate.promotion) setPromotion(square);
      else commit(square);
    } else {
      setSelected(selected === square || game.get(square)?.color !== game.turn() ? null : square);
    }
  }
  function navigate(next: number) { setIndex(next); setSelected(null); setPromotion(null); }
  return <div className="w-full max-w-lg space-y-4">
    {error && <p role="alert" className="text-destructive">{error}</p>}
    <div className="grid grid-cols-8 border-2 border-primary" aria-label="Tabuleiro de xadrez">
      {game.board().flatMap((rank, r) => rank.map((piece, f) => {
        const square = `${String.fromCharCode(97 + f)}${8 - r}` as Square;
        return <button type="button" key={square} aria-label={square} aria-pressed={selected === square}
          disabled={readOnly || !!error} onClick={() => click(square)}
          className={`relative aspect-square flex items-center justify-center text-3xl sm:text-5xl ${(r + f) % 2 ? 'bg-amber-700' : 'bg-amber-100'} ${selected === square ? 'ring-4 ring-inset ring-blue-500' : ''}`}>
          <span className="text-black">{piece && pieces[piece.color === 'w' ? piece.type.toUpperCase() : piece.type]}</span>
          {legal.some(m => m.to === square) && <span className="absolute w-3 h-3 rounded-full bg-blue-500/70" />}
          <span className="absolute bottom-0 left-0.5 text-[9px] text-black/70">{square}</span>
        </button>;
      }))}
    </div>
    {promotion && <div role="group" aria-label="Escolha a promoção" className="flex flex-wrap gap-2">
      {['q', 'r', 'b', 'n'].map((piece, i) => <Button key={piece} onClick={() => commit(promotion, piece)}>{['Dama', 'Torre', 'Bispo', 'Cavalo'][i]}</Button>)}
      <Button variant="outline" onClick={() => setPromotion(null)}>Cancelar</Button>
    </div>}
    {externalIndex === undefined && <div className="flex items-center justify-center gap-2">
      <Button variant="outline" onClick={() => navigate(0)} disabled={!index}>Início</Button>
      <Button variant="outline" aria-label="Lance anterior" onClick={() => navigate(index - 1)} disabled={!index}>←</Button>
      <span>{index} / {total}</span>
      <Button variant="outline" aria-label="Próximo lance" onClick={() => navigate(index + 1)} disabled={index >= total}>→</Button>
    </div>}
    <p aria-live="polite">{game.isCheckmate() ? 'Xeque-mate.' : game.isDraw() ? 'Empate.' : `Vez das ${game.turn() === 'w' ? 'brancas' : 'pretas'}.${game.isCheck() ? ' Xeque!' : ''}`}</p>
  </div>;
}
