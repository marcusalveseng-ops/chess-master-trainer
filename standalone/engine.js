// Tess permits scripts but blocks Blob Workers. Run the pinned engine in a local
// scope, retain the UCI message barrier, and bound each search to a short burst.
export function createInlineStockfish(code) {
  let closed=false,receive;
  const timers=new Set();
  const later=(callback,delay=0,...args)=>{
    if(closed)return;
    const id=setTimeout(()=>{timers.delete(id);if(!closed)callback(...args);},delay);
    timers.add(id);return id;
  };
  const cancel=id=>{clearTimeout(id);timers.delete(id);};
  const port={onmessage:null,onerror:null,
    postMessage(data){later(()=>{try{receive(data);}catch(error){port.onerror?.(error);}});},
    terminate(){closed=true;for(const id of timers)clearTimeout(id);timers.clear();}
  };
  try {
    // Function scope contains Emscripten's globals and onmessage. The source is
    // fetched with a fixed integrity hash below, never from user input.
    receive=new Function('postMessage','close','setTimeout','clearTimeout',
      'var onmessage;\n'+code+'\n;return function(data){onmessage({data:data});};'
    )(data=>later(()=>port.onmessage?.({data})),()=>port.terminate(),later,cancel);
  } catch(error) {port.terminate();throw error;}
  return port;
}

export class StockfishCoach {
  constructor(onAnalysis, onStatus) {
    this.onAnalysis=onAnalysis; this.onStatus=onStatus;
    this.worker=null; this.active=null; this.pending=null; this.ready=false;
    this.lines=new Map(); this.timer=null; this.closed=false; this.cancelled=false;
  }
  async init() {
    try {
      const url='https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.js';
      const response=await fetch(url,{signal:AbortSignal.timeout(15000),integrity:'sha384-VtbI9eXlyH0iLETxBo+yJZD0egEZcin9R4ntQlcrrKjRYSTQmdhoiY/jGV9SGw4Q'});
      if(!response.ok) throw new Error('HTTP '+response.status);
      const code=await response.text();
      if(this.closed)return;
      this.worker=createInlineStockfish(code);
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
    this.worker.postMessage('go depth '+depth+' movetime 220');
  }
  message(text) {
    if(text==='uciok') {
      this.worker.postMessage('isready'); return;
    }
    if(text==='readyok') {
      clearTimeout(this.timer);this.ready=true;
      this.onStatus('Stockfish pronto · três variantes · modo compatível com Tess');this.start();return;
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
