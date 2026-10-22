import { beforeAll, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { JSDOM, VirtualConsole } from 'jsdom';
import { StockfishCoach } from '../standalone/engine.js';
let html: string;
beforeAll(() => { execFileSync(process.execPath, ['scripts/build-tess.mjs']); html=readFileSync('dist/tess/index.html','utf8'); });
function app(legacy?: object[]) {
  const errors: Error[]=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e));
  const dom=new JSDOM(html,{url:'https://xadrez-stockfish.tess.page',runScripts:'dangerously',virtualConsole:vc,beforeParse(w){
    w.fetch=vi.fn().mockRejectedValue(new Error('offline'));
    w.Worker=class { terminate(){} postMessage(){} } as any;
    w.URL.createObjectURL=()=> 'blob:test';w.URL.revokeObjectURL=()=>{};w.confirm=()=>true;
    if(legacy)w.localStorage.setItem('xsf_saved',JSON.stringify(legacy));
  }});
  const document=dom.window.document;
  const click=(selector:string)=>{const el=document.querySelector(selector) as HTMLElement;expect(el,selector).toBeTruthy();el.click();};
  const square=(s:string)=>click(`[aria-label="${s}"]`);
  return {dom,document,errors,click,square,close:()=>{dom.window.dispatchEvent(new dom.window.Event('pagehide'));dom.window.close();}};
}
describe('single-file Tess export',()=>{
  it('renders the board and all 205 recovered games without script errors',()=>{
    const a=app();expect(a.errors).toEqual([]);expect(a.document.querySelectorAll('#board button')).toHaveLength(64);
    expect(a.document.querySelector('#dbcount')?.textContent).toBe('205 de 205 partidas');a.close();
  });
  it('plays, navigates, branches and exports the displayed position',()=>{
    const a=app();a.square('e2');a.square('e4');a.square('e7');a.square('e5');
    a.dom.window.goBack();a.square('c7');a.square('c5');a.dom.window.exportPGN();
    expect((a.document.querySelector('#pgnbox') as HTMLTextAreaElement).value).toContain('1. e4 c5');
    a.dom.window.go(0);expect(a.document.querySelector('#status')?.textContent).toContain('lance 0/2');a.close();
  });
  it('imports setup FEN, chooses underpromotion and recognizes a draw',()=>{
    const a=app();const box=a.document.querySelector('#pgnbox') as HTMLTextAreaElement;
    box.value='[SetUp "1"]\n[FEN "7k/P7/8/8/8/8/8/7K w - - 0 1"]\n\n*';
    a.dom.window.importBox();a.square('a7');a.square('a8');
    expect(a.document.querySelectorAll('#promotion button')).toHaveLength(4);
    (a.document.querySelectorAll('#promotion button')[3] as HTMLElement).click();a.dom.window.exportPGN();
    expect(box.value).toContain('a8=N');expect(a.document.querySelector('#status')?.textContent).toContain('Empate.');a.close();
  });
  it('preserves old saved games under the original localStorage key',()=>{
    const a=app([{name:'Antiga',date:'2026-10-01T00:00:00Z',pgn:'1. d4 d5'}]);
    expect(a.document.querySelector('#savedlist')?.textContent).toContain('Antiga');
    a.click('#savedlist button');a.dom.window.goEnd();a.dom.window.exportPGN();
    expect((a.document.querySelector('#pgnbox') as HTMLTextAreaElement).value).toContain('1. d4 d5');
    a.dom.window.saveGame();expect(JSON.parse(a.dom.window.localStorage.getItem('xsf_saved')!)).toHaveLength(2);a.close();
  });
  it('rejects invalid PGN while retaining the existing game',()=>{
    const a=app();a.square('e2');a.square('e4');(a.document.querySelector('#pgnbox') as HTMLTextAreaElement).value='1. e4 e5 2. Bh6';
    a.dom.window.importBox();expect(a.document.querySelector('#notice')?.textContent).toContain('inválido');
    a.dom.window.exportPGN();expect((a.document.querySelector('#pgnbox') as HTMLTextAreaElement).value).toContain('1. e4');a.close();
  });
});
describe('Stockfish search synchronization',()=>{
  function engine(){const result=vi.fn();const coach=new StockfishCoach(result,vi.fn());coach.worker={postMessage:vi.fn(),terminate:vi.fn()};coach.ready=true;return {coach,result};}
  const position=(key:string)=>({key,fen:key,history:{startFen:key,moves:[]},depth:12,expected:1});
  it('waits for the old bestmove barrier before starting a new position',()=>{
    const {coach,result}=engine();coach.request(position('old'));coach.request(position('new'));
    coach.message('info depth 8 score cp 100 pv e2e4');expect(result).not.toHaveBeenCalled();
    coach.message('bestmove e2e4');expect(coach.active.key).toBe('new');
    coach.message('info depth 8 score cp 25 pv d2d4');coach.message('bestmove d2d4');
    expect(result).toHaveBeenCalledTimes(1);expect(result.mock.calls[0][0]).toMatchObject({key:'new',depth:8});
  });
  it('ignores a cancelled search after automatic analysis is disabled',()=>{
    const {coach,result}=engine();coach.request(position('old'));coach.stop();coach.message('info depth 8 score cp 100 pv e2e4');coach.message('bestmove e2e4');expect(result).not.toHaveBeenCalled();
  });
  it('publishes the last fully completed MultiPV depth',()=>{
    const {coach,result}=engine();coach.request({...position('root'),expected:3});
    for(let i=1;i<=3;i++)coach.message(`info depth 6 multipv ${i} score cp ${40-i} pv e2e4 e7e5`);
    coach.message('info depth 7 multipv 1 score cp 55 pv d2d4 d7d5');coach.message('bestmove d2d4');
    expect(result.mock.calls[0][0]).toMatchObject({depth:6});expect(result.mock.calls[0][0].lines).toHaveLength(3);
  });
});
