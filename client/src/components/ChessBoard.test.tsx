// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Chess } from 'chess.js';
import ChessBoard from './ChessBoard';

afterEach(cleanup);
const click = (name: string) => fireEvent.click(screen.getByRole('button', { name }));
describe('interactive chessboard', () => {
  it('plays moves, ignores illegal clicks, navigates and branches', () => {
    const change = vi.fn();
    render(<ChessBoard onGameChange={change} />);
    click('e2'); click('e5');
    expect(change.mock.lastCall?.[2]).toHaveLength(0);
    click('e2'); click('e4'); click('e7'); click('e5');
    expect(change.mock.lastCall?.[2].map((m: any) => m.san)).toEqual(['e4', 'e5']);
    click('Lance anterior');
    expect(change.mock.lastCall?.[2].map((m: any) => m.san)).toEqual(['e4']);
    click('c7'); click('c5');
    expect(change.mock.lastCall?.[2].map((m: any) => m.san)).toEqual(['e4', 'c5']);
    click('Início');
    expect(change.mock.lastCall?.[0]).toBe(new Chess().fen());
    click('Próximo lance');
    expect(change.mock.lastCall?.[2]).toHaveLength(1);
  });
  it('offers all promotions including underpromotion', () => {
    const change = vi.fn();
    render(<ChessBoard initialFen="7k/P7/8/8/8/8/8/7K w - - 0 1" onGameChange={change} />);
    click('a7'); click('a8');
    expect(screen.getByRole('group', { name: 'Escolha a promoção' })).toBeTruthy();
    click('Cavalo');
    expect(change.mock.lastCall?.[2][0].san).toBe('a8=N');
    expect(screen.getByText('Empate.')).toBeTruthy();
  });
  it('displays replay index zero as the initial position and responds to external navigation', () => {
    const change = vi.fn();
    const view = render(<ChessBoard initialPgn="1. e4 e5" moveIndex={0} readOnly onGameChange={change} />);
    expect(change.mock.lastCall?.[0]).toBe(new Chess().fen());
    view.rerender(<ChessBoard initialPgn="1. e4 e5" moveIndex={2} readOnly onGameChange={change} />);
    expect(change.mock.lastCall?.[2]).toHaveLength(2);
    expect((screen.getByRole('button', { name: 'e7' }) as HTMLButtonElement).disabled).toBe(true);
  });
  it('handles invalid PGN without crashing and recovers after corrected input', () => {
    const view = render(<ChessBoard initialPgn="1. e4 e5 2. Bh6" />);
    expect(screen.getByRole('alert').textContent).toContain('inválido');
    view.rerender(<ChessBoard initialPgn="1. e4 e5" />);
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByText('2 / 2')).toBeTruthy();
  });
  it('prevents play after checkmate', () => {
    const change = vi.fn();
    render(<ChessBoard initialPgn="1. f3 e5 2. g4 Qh4#" onGameChange={change} />);
    expect(screen.getByText('Xeque-mate.')).toBeTruthy();
    const calls = change.mock.calls.length;
    click('a2'); click('a3');
    expect(change.mock.calls.length).toBe(calls);
  });
});
