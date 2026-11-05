import fs from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { Chess } from 'chess.js';
const cache='review/library-source';
const rows=[];
for(const letter of ['a','b','c','d','e']){
 const text=await fs.readFile(`${cache}/${letter}.tsv`,'utf8');
 for(const row of text.trim().split(/\r?\n/).slice(1)){
  const [eco,name,pgn]=row.split('\t');const game=new Chess();game.loadPgn(pgn);rows.push([eco,name,game.history().join(' ')]);
 }
}
await fs.writeFile('standalone/openings.json',JSON.stringify(rows));
const {classify}=await import('../standalone/library.js');
const sources=['standalone/games.pgn',`${cache}/carlsen/Carlsen.pgn`,`${cache}/nakamura/Nakamura.pgn`];
const games=[],seen=new Set(),report={sources:[],duplicates:0,rejected:[],count:0};
for(const path of sources){
 const content=await fs.readFile(path,'utf8');const parts=content.replace(/\r\n?/g,'\n').split(/(?=^\[Event\s)/m).filter(p=>p.trim());
 report.sources.push({path,count:parts.length,sha256:createHash('sha256').update(content).digest('hex')});
 for(let i=0;i<parts.length;i++){
  try{const g=new Chess();g.loadPgn(parts[i]);const h=g.getHeaders(),moves=g.history();
   if(!moves.length)continue;
   const key=[h.White,h.Black,h.Date,h.FEN||'',moves.join(' ')].join('|');if(seen.has(key)){report.duplicates++;continue;}seen.add(key);
   const classification=classify(moves);g.removeComments();
   games.push({pgn:g.pgn(),W:h.White||'?',B:h.Black||'?',R:h.Result||'*',E:h.Event||'',D:h.Date||'',O:classification.name,...classification});
  }catch(e){report.rejected.push({source:path,index:i,error:e.message});}
  if(i%1000===0)console.log(path,i,'accepted',games.length);
 }
}
report.count=games.length;report.openings=new Set(games.map(g=>g.opening)).size;report.defenses=new Set(games.map(g=>g.defense)).size;
await fs.writeFile('standalone/library.gz.b64',gzipSync(JSON.stringify(games),{level:9}).toString('base64'));
await fs.writeFile('docs/library-validation.json',JSON.stringify(report,null,2)+'\n');console.log(report.count,'validated games');
