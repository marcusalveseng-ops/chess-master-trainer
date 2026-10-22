import { Chess } from 'chess.js';
import { positionAt } from '../shared/chess-position.ts';
import { explainCandidate } from '../shared/coach-explanation.ts';
import { StockfishCoach } from './engine.js';

const $=id=>document.getElementById(id);
const PIECES={p:'♟',n:'♞',b:'♝',r:'♜',q:'♛',k:'♚'};
let moves=[],ply=0,flipped=false,selected=null,initialFen=new Chess().fen();
let headers={White:'Brancas',Black:'Pretas',Result:'*',Event:'Partida casual'};
let preview=null,analysisKey='',worker=null,timer=null,currentOrigin='',db=[];
const engine=new StockfishCoach(showStockfish,text=>{$('sfstatus').textContent=text;});
function notice(message=''){$('notice').textContent=message;}
function record(until=moves.length){const g=new Chess(initialFen);for(const [key,value] of Object.entries(headers))g.setHeader(key,value);moves.slice(0,until).forEach(move=>g.move(move));return g;}
function cur(){return preview ? positionAt(preview.pgn,preview.ply) : record(ply);}
function posAt(n){return record(n);}
function tab(i,btn){document.querySelectorAll('.tabs button').forEach(b=>b.classList.remove('on'));btn.classList.add('on');for(let k=0;k<4;k++)$('p'+k).classList.toggle('on',k===i);}
function tabTo(i){document.querySelectorAll('.tabs button')[i].click();}
function render(){
 const c=cur();$('board').replaceChildren();
 const last=c.history({verbose:true}).at(-1);const legal=selected?c.moves({square:selected,verbose:true}):[];
 for(let i=0;i<64;i++){
  const row=Math.floor(i/8),col=i%8,r=flipped?row:7-row,f=flipped?7-col:col,sq='abcdefgh'[f]+(r+1);
  const d=document.createElement('button');d.type='button';d.className='sq '+((f+r)%2?'l':'d');
  d.setAttribute('aria-label',sq);d.setAttribute('aria-pressed',String(sq===selected));
  if(sq===selected)d.classList.add('sel');if(last&&(sq===last.from||sq===last.to))d.classList.add('last');
  if(legal.some(m=>m.to===sq))d.classList.add('tgt');
  const p=c.get(sq);if(p){const span=document.createElement('span');span.className=p.color==='w'?'wp':'bp';span.textContent=PIECES[p.type];d.appendChild(span);}
  d.onclick=()=>clickSq(sq);d.disabled=!!preview||c.isGameOver();$('board').appendChild(d);
 }
 const st=c.isCheckmate()?'Xeque-mate!':c.isStalemate()?'Empate por afogamento.':c.isDraw()?'Empate.':(c.turn()==='w'?'Brancas':'Pretas')+' jogam'+(c.isCheck()?' — xeque!':'');
 $('status').textContent=st+' • '+(preview?'Explorando variante '+preview.ply+'/'+preview.total:'lance '+ply+'/'+moves.length);
 $('return-main').hidden=!preview;
 $('moves').replaceChildren();(preview?ChessFromPgn(preview.pgn).history():moves).forEach((san,i)=>{
  if(i%2===0){const n=document.createElement('b');n.textContent=(i/2+1)+'.';$('moves').appendChild(n);}
  const item=document.createElement('button');item.textContent=san;item.className=i===(preview?preview.ply:ply)-1?'cur':'';item.onclick=()=>go(i+1);$('moves').appendChild(item);
 });
 $('promotion').hidden=true;
 if(!preview){try{localStorage.setItem('xsf_current',JSON.stringify({pgn:record().pgn(),ply}));}catch{notice('Não foi possível salvar automaticamente neste navegador. Exporte o PGN para preservar a partida.');}}
 updateAnalysis();
}
function ChessFromPgn(pgn){const g=new Chess();g.loadPgn(pgn);return g;}
function clickSq(sq){
 if(preview)return;const c=cur();if(c.isGameOver())return;
 const options=selected?c.moves({square:selected,verbose:true}).filter(m=>m.to===sq):[];
 if(options.length){
  if(options[0].promotion){$('promotion').hidden=false;$('promotion').replaceChildren();
   ['q','r','b','n'].forEach((p,i)=>{const b=document.createElement('button');b.textContent=['Dama','Torre','Bispo','Cavalo'][i];b.onclick=()=>playMove(sq,p);$('promotion').appendChild(b);});return;}
  playMove(sq);return;
 }
 selected=selected===sq||c.get(sq)?.color!==c.turn()?null:sq;render();
}
function playMove(to,promotion='q'){try{const c=record(ply),move=c.move({from:selected,to,promotion});moves=moves.slice(0,ply);moves.push(move.san);ply++;selected=null;notice();render();}catch{notice('Lance ilegal.');}}
function go(n){if(preview)preview.ply=Math.max(0,Math.min(preview.total,n));else ply=Math.max(0,Math.min(moves.length,n));selected=null;render();}
function goBack(){go((preview?preview.ply:ply)-1);}function goNext(){go((preview?preview.ply:ply)+1);}function goEnd(){go(preview?preview.total:moves.length);}
function flipBoard(){flipped=!flipped;render();}
function newGame(){if(moves.length&&!confirm('Iniciar nova partida? Exporte ou salve a atual antes de continuar.'))return;moves=[];ply=0;initialFen=new Chess().fen();headers={White:'Brancas',Black:'Pretas',Result:'*',Event:'Partida casual'};preview=null;selected=null;notice();render();}
function buildPGN(){return cur().pgn();}
function download(text,name){const url=URL.createObjectURL(new Blob([text],{type:'application/x-chess-pgn'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function exportPGN(){$('pgnbox').value=buildPGN();tabTo(3);}function downloadPGN(){download(buildPGN(),'partida.pgn');}
function loadPGN(text){try{const g=ChessFromPgn(text);moves=g.history();initialFen=g.history({verbose:true})[0]?.before||g.fen();headers=g.getHeaders();ply=0;selected=null;preview=null;notice();render();return true;}catch{notice('PGN inválido. A partida atual foi preservada.');return false;}}
function importBox(){if(loadPGN($('pgnbox').value))tabTo(0);}
$('onefile').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const t=await f.text();if((t.match(/^\[Event\s/gm)||[]).length>1){buildDBFromText(t);tabTo(1);}else if(loadPGN(t))tabTo(0);}catch{notice('Não foi possível ler o arquivo.');}e.target.value='';};
function buildDBFromText(text){try{const parts=text.replace(/\r\n?/g,'\n').split(/(?=^\[Event\s)/m).filter(s=>s.trim());const next=parts.map(raw=>{const g=ChessFromPgn(raw);const h=g.getHeaders();return{pgn:raw,W:h.White||'?',B:h.Black||'?',R:h.Result||'*',E:h.Event||'',O:h.Opening||h.ECO||'',D:h.Date||h.UTCDate||''};});db=next;notice();renderDB();}catch{notice('A base contém PGN inválido. A biblioteca anterior foi preservada.');}}
function renderDB(){const q=$('q').value.toLowerCase(),list=db.filter(g=>(g.W+' '+g.B+' '+g.E+' '+g.O+' '+g.D).toLowerCase().includes(q));$('dbcount').textContent=list.length+' de '+db.length+' partidas';$('dblist').replaceChildren();list.slice(0,500).forEach(g=>{const d=document.createElement('button');d.className='gitem';d.style.cssText='display:block;width:100%;text-align:left';d.textContent=g.W+' × '+g.B+' — '+g.R+' • '+g.E+' • '+g.D+' • '+g.O;d.onclick=()=>{if(loadPGN(g.pgn))tabTo(0);};$('dblist').appendChild(d);});}
$('dbfile').onchange=async e=>{const f=e.target.files[0];if(f)try{buildDBFromText(await f.text());}catch{notice('Falha ao ler a biblioteca.');}e.target.value='';};
function getSaved(){try{const saved=JSON.parse(localStorage.getItem('xsf_saved')||'[]');return Array.isArray(saved)?saved.filter(g=>typeof g?.pgn==='string'&&typeof g?.name==='string'):[];}catch{return[];}}
function setSaved(a){try{localStorage.setItem('xsf_saved',JSON.stringify(a));renderSaved();return true;}catch{notice('Armazenamento indisponível ou cheio. Baixe o PGN.');return false;}}
function saveGame(){if(!cur().history().length){notice('Nenhum lance para salvar.');return;}const name=$('save-name').value.trim()||'Partida '+new Date().toLocaleDateString('pt-BR');const a=getSaved();a.unshift({name,date:new Date().toISOString(),pgn:buildPGN()});if(setSaved(a))tabTo(2);}
function downloadSaved(){download(getSaved().map(g=>g.pgn).join('\n\n'),'historico-chess.pgn');}
function renderSaved(){$('savedlist').replaceChildren();const a=getSaved();if(!a.length){$('savedlist').textContent='Nenhuma partida salva ainda.';return;}a.forEach((g,i)=>{const d=document.createElement('div');d.className='gitem';d.textContent=g.name+' • '+new Date(g.date).toLocaleString('pt-BR');const row=document.createElement('div');row.className='row';const load=document.createElement('button');load.textContent='Carregar';load.onclick=()=>{if(loadPGN(g.pgn))tabTo(0);};const del=document.createElement('button');del.textContent='Excluir';del.onclick=()=>{if(confirm('Excluir esta partida salva?')){a.splice(i,1);setSaved(a);}};row.append(load,del);d.appendChild(row);$('savedlist').appendChild(d);});}
function updateAnalysis(force=false){
 if(preview)return;const g=record(ply),key=g.fen()+'|'+g.pgn();if(!force&&key===analysisKey)return;analysisKey=key;
 worker?.terminate();clearTimeout(timer);engine.stop();currentOrigin='';$('coach').replaceChildren();$('pvline').textContent='';$('evaltxt').textContent='…';$('depthtxt').textContent='';$('evalfill').style.height='50%';
 if(g.isGameOver()){$('coach').textContent='Partida encerrada. Não há lances pendentes.';return;}
 if(!$('autoA').checked&&!force){$('coach').textContent='Análise automática desativada.';return;}
 $('coach').textContent='Calculando alternativas…';
 timer=setTimeout(()=>{
  const url=URL.createObjectURL(new Blob([__COACH_WORKER__],{type:'text/javascript'}));worker=new Worker(url);URL.revokeObjectURL(url);
  worker.onmessage=e=>{if(key!==analysisKey||currentOrigin==='Stockfish')return;if(e.data.error){$('coach').textContent=e.data.error;return;}showCandidates(g.fen(),e.data.candidates,e.data.depth,'Assistente local');};
  worker.onerror=()=>{if(key===analysisKey&&!currentOrigin)$('coach').textContent='Motor local indisponível. Tente analisar novamente.';};worker.postMessage({fen:g.fen(),pgn:g.pgn()});
  engine.request({fen:g.fen(),pgn:g.pgn(),key,expected:Math.min(3,g.moves().length),depth:Number($('depthSel').value),history:{startFen:initialFen,moves:g.history({verbose:true}).map(m=>m.from+m.to+(m.promotion||''))}});
 },250);
}
function showStockfish(result){if(result.key!==analysisKey||preview)return;const candidates=[];for(const line of result.lines){try{const g=new Chess(result.fen),san=[];for(const u of line.uci)san.push(g.move({from:u.slice(0,2),to:u.slice(2,4),promotion:u[4]}).san);const score=line.kind==='mate'?(line.score>0?100000:-100000):line.score;candidates.push(explainCandidate(result.fen,san,score));}catch{/* Reject illegal or incomplete provider output. */}}if(candidates.length)showCandidates(result.fen,candidates,result.depth,'Stockfish');}
function showCandidates(fen,candidates,depth,origin){if(record(ply).fen()!==fen||preview)return;currentOrigin=origin;$('coach').replaceChildren();$('depthtxt').textContent=origin+' • profundidade '+depth+' meios-lances';const score=candidates[0]?.score;if(score===undefined){$('coach').textContent='Não foi possível concluir a busca. Tente novamente.';return;}$('evaltxt').textContent=Math.abs(score)>90000?(score>0?'Mate a favor':'Mate contra'):(score>=0?'+':'')+(score/100).toFixed(2);const whiteScore=score*(record(ply).turn()==='w'?1:-1);$('evalfill').style.height=Math.max(3,Math.min(97,50+50*Math.tanh(whiteScore/600)))+'%';
 candidates.forEach(c=>{const article=document.createElement('article');article.className='candidate';const title=document.createElement('strong');title.textContent=c.san+' · '+(Math.abs(c.score)>90000?(c.score>0?'mate a favor':'mate contra'):(c.score>=0?'+':'')+(c.score/100).toFixed(2));article.appendChild(title);for(const text of [c.line.join(' → '),'Pontos positivos: '+c.positives.join(' '),'Riscos: '+c.risks.join(' ')]){const p=document.createElement('p');p.textContent=text;article.appendChild(p);}const b=document.createElement('button');b.textContent='Explorar variante '+c.san;b.onclick=()=>{const branch=new Chess(fen);c.line.forEach(san=>branch.move(san));preview={pgn:branch.pgn(),ply:0,total:c.line.length};selected=null;render();};article.appendChild(b);$('coach').appendChild(article);});}
$('return-main').onclick=()=>{preview=null;selected=null;render();};
$('depthSel').onchange=()=>updateAnalysis(true);
function analyze(){updateAnalysis(true);}
Object.assign(window,{go,goBack,goNext,goEnd,flipBoard,newGame,tab,analyze,renderDB,saveGame,downloadSaved,importBox,exportPGN,downloadPGN});
$('autoA').onchange=()=>{analysisKey='';updateAnalysis();};
document.addEventListener('keydown',e=>{if(/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;if(e.key==='ArrowLeft'){e.preventDefault();goBack();}if(e.key==='ArrowRight'){e.preventDefault();goNext();}if(e.key==='Home'){e.preventDefault();go(0);}if(e.key==='End'){e.preventDefault();goEnd();}});
try{const saved=JSON.parse(localStorage.getItem('xsf_current')||'null');if(saved?.pgn&&loadPGN(saved.pgn))ply=Math.max(0,Math.min(moves.length,Number(saved.ply)||0));}catch{/* Empty or invalid old autosave; explicit saved games remain unchanged. */}
render();renderSaved();buildDBFromText(__GAMES_PGN__);engine.init();
window.addEventListener('pagehide',()=>{worker?.terminate();engine.dispose();});
