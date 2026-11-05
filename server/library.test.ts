import {describe,it,expect} from 'vitest';
import {classify,matchesGame} from '../standalone/library.js';
describe('opening and defense filters',()=>{
 it('distinguishes the Caro-Kann from the Italian game',()=>{
  expect(classify(['e4','c6','d4','d5'])).toMatchObject({opening:'Peão do Rei',defense:'Caro-Kann'});
  expect(classify(['e4','e5','Nf3','Nc6','Bc4'])).toMatchObject({opening:'Italiana',defense:'Jogos Abertos'});
 });
 it('combines players in either color with exact family filters',()=>{
  const g={W:'Nakamura, Hikaru',B:'Carlsen, Magnus',opening:'Peão do Rei',defense:'Caro-Kann'};
  expect(matchesGame(g,{player1:'carlsen',player2:'nakamura',defense:'Caro-Kann'})).toBe(true);
  expect(matchesGame(g,{opening:'Italiana',defense:'Caro-Kann'})).toBe(false);
  expect(matchesGame(g,{query:'karo khan'})).toBe(true);
 });
});
