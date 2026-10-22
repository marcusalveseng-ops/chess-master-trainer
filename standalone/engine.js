// Stockfish 10.0.2 matches the published Tess app; fallback uses the shared coach.
// Fetch in the page and execute a Blob worker, avoiding cross-origin importScripts.
export class StockfishCoach {
  constructor(onAnalysis, onStatus) {
    this.onAnalysis=onAnalysis; this.onStatus=onStatus;
    this.worker=null; this.active=null; this.pending=null; this.ready=false;
    this.lines=new Map(); this.timer=null; this.closed=false; this.cancelled=false;
  }
  async init() {
    try {
      const url='https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.js';
      const response=await fetch(url,{signal:AbortSignal.timeout(15000)});
      if(!response.ok) throw new Error('HTTP '+response.status);
      const code=await response.text();
      if(this.closed)return;
      const objectUrl=URL.createObjectURL(new Blob([code],{type:'text/javascript'}));
      this.worker=new Worker(objectUrl);
      URL.revokeObjectURL(objectUrl);
      this.worker.onmessage=e=>this.message(String(e.data));
      this.worker.onerror=()=>this.fail();
      this.worker.postMessage('uci');
      this.timer=setTimeout(()=>this.fail(),20000);
    } catch { this.fail(); }
  }
  fail() {
    clearTimeout(this.timer); this.worker?.terminate(); this.worker=null;
    this.ready=false; this.active=null; this.pending=null;
    if(!this.closed)this.onStatus('Stockfish indisponível. Assistente local ativo.');
  }
  request(position) {
    this.pending=position;
    if(!this.ready)return;
    if(this.active) { this.worker.postMessage('stop'); return; }
    this.start();
  }
  start() {
    if(!this.pending || !this.ready)return;
    this.active=this.pending; this.pending=null; this.lines.clear(); this.cancelled=false;
    const { depth, history }=this.active;
    this.worker.postMessage('setoption name MultiPV value 3');
    this.worker.postMessage('position fen '+history.startFen+' moves '+history.moves.join(' '));
    this.worker.postMessage('go depth '+depth+' movetime 1800');
  }
  message(text) {
    if(text==='uciok') {
      this.worker.postMessage('isready'); return;
    }
    if(text==='readyok') {
      clearTimeout(this.timer);this.ready=true;
      this.onStatus('Stockfish pronto · três variantes · cálculo no navegador');this.start();return;
    }
    if(text.startsWith('bestmove')) {
      if(this.active && !this.pending && !this.cancelled)this.publish();
      this.active=null;this.start();return;
    }
    if(!this.active || this.pending || this.cancelled || !text.startsWith('info ') || !text.includes(' pv '))return;
    const score=text.match(/ score (cp|mate) (-?\d+)/);
    const depth=Number(text.match(/ depth (\d+)/)?.[1]||0);
    if(!score || / (lowerbound|upperbound)(?: |$)/.test(text))return;
    const rank=Number(text.match(/ multipv (\d+)/)?.[1]||1);
    if(!this.lines.has(depth))this.lines.set(depth,new Map());
    this.lines.get(depth).set(rank,{depth,kind:score[1],score:Number(score[2]),uci:text.split(' pv ')[1].trim().split(/\s+/).slice(0,10)});
  }
  publish() {
    // Equal-depth alternatives only; partial MultiPV iterations are not compared.
    const expected=this.active.expected||3;
    const completed=[...this.lines.entries()].filter(([,lines])=>Array.from({length:expected},(_,i)=>i+1).every(rank=>lines.has(rank))).sort((a,b)=>b[0]-a[0]);
    if(!completed.length)return;
    const [depth,ranks]=completed[0];
    this.onAnalysis({ ...this.active, lines: [...ranks.entries()].sort((a,b)=>a[0]-b[0]).slice(0,expected).map(([,line])=>line), depth });
  }
  stop() {this.pending=null; this.cancelled=true; if(this.active)this.worker?.postMessage('stop');}
  dispose() {this.closed=true;clearTimeout(this.timer);this.worker?.terminate();}
}
