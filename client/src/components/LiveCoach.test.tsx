// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { Chess } from 'chess.js';
import LiveCoach from './LiveCoach';
vi.mock('@/lib/trpc', () => ({ trpc: { auth: { me: { useQuery: () => ({ data: null }) } }, aiAnalysis: { explainCandidates: { useMutation: () => ({ isPending: false, mutateAsync: vi.fn() }) } } } }));
class FakeWorker {
  static instances: FakeWorker[] = [];
  onmessage?: (event: any) => void;
  onerror?: () => void;
  terminate = vi.fn();
  postMessage = vi.fn();
  constructor() { FakeWorker.instances.push(this); }
}
beforeEach(() => { vi.useFakeTimers(); FakeWorker.instances = []; vi.stubGlobal('Worker', FakeWorker); });
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); });
it('terminates obsolete searches and ignores late results when the position changes', () => {
  const game = new Chess(); const oldFen = game.fen();
  const view = render(<LiveCoach fen={oldFen} pgn="" />);
  act(() => vi.advanceTimersByTime(300));
  const old = FakeWorker.instances[0];
  game.move('e4'); view.rerender(<LiveCoach fen={game.fen()} pgn={game.pgn()} />);
  expect(old.terminate).toHaveBeenCalled();
  act(() => old.onmessage?.({ data: { result: { fen: oldFen, terminal: true, candidates: [] } } }));
  expect(screen.queryByText('Partida encerrada. Não há decisão pendente.')).toBeNull();
  act(() => vi.advanceTimersByTime(300));
  const current = FakeWorker.instances[1];
  expect(current.postMessage).toHaveBeenCalledWith({ fen: game.fen(), pgn: game.pgn() });
  fireEvent.click(screen.getByRole('button', { name: 'Desativar' }));
  expect(current.terminate).toHaveBeenCalled();
});
