import {afterEach,describe,it,expect,vi} from 'vitest';
import {Chess} from 'chess.js';
import {BotOpponent} from '../standalone/bot.js';
afterEach(()=>vi.useRealTimers());
describe('bot turn ownership',()=>{
 const setup=()=>{vi.useFakeTimers();const engine={ready:true,stop:vi.fn(),request:vi.fn()};const play=vi.fn();const bot=new BotOpponent(engine,play,vi.fn());return{engine,play,bot};};
 it('executes Stockfish bestmove once, outside the UCI callback',()=>{
  const {engine,play,bot}=setup();const g=new Chess();g.move('e4');bot.request(g,new Chess().fen());
  const request=engine.request.mock.calls[0][0];bot.receive({...request,lines:[{uci:['e7e5']}]});
  expect(play).not.toHaveBeenCalled();vi.advanceTimersByTime(1);expect(play).toHaveBeenCalledWith('e5',g.fen());
  bot.receive({...request,lines:[{uci:['e7e5']}]});vi.advanceTimersByTime(3000);expect(play).toHaveBeenCalledTimes(1);
 });
 it('rejects a late response after cancellation',()=>{
  const {engine,play,bot}=setup();const g=new Chess();bot.request(g,g.fen());const old=engine.request.mock.calls[0][0];bot.cancel();
  bot.receive({...old,lines:[{uci:['e2e4']}]});vi.advanceTimersByTime(3000);expect(play).not.toHaveBeenCalled();
 });
 it('falls back to a legal move if the engine never responds',()=>{
  const {play,bot}=setup();const g=new Chess();g.move('e4');bot.request(g,new Chess().fen());vi.advanceTimersByTime(2600);
  expect(play).toHaveBeenCalledTimes(1);expect(g.moves()).toContain(play.mock.calls[0][0]);
 });
});
