import {describe,expect,it} from 'vitest';
import {gameEntry} from './game-entry-loader';
describe('judge-facing game routing',()=>{
 it('opens the V5 demo at the bare domain with the complete route flags',()=>{
  expect(gameEntry('')).toEqual({entry:'depth',search:'?demo=1&squad=1&cardrpg2=1&a6=1&ui=v3'});
 });
 it('keeps tracking parameters when selecting the default game',()=>{
  const route=gameEntry('?utm_source=judges');expect(route.entry).toBe('depth');
  expect(new URLSearchParams(route.search).get('utm_source')).toBe('judges');
 });
 it.each(['?legacy=1','?legacy=1&demo=1&squad=1&cardrpg2=1'])('keeps the explicit legacy escape %s',search=>{
  expect(gameEntry(search)).toEqual({entry:'legacy',search});
 });
 it.each([
  ['?demo=1&squad=1&cardrpg2=1&a6=1&ui=v3','depth'],
  ['?demo=1&squad=1&cardrpg=1','cardrpg'],
  ['?demo=1&squad=1&squad3d=1','squad3d'],
  ['?demo=1&squad=1','squad'],['?demo=1&squad=0','legacy'],
 ])('preserves the explicitly selected route %s', (search,entry)=>{
  expect(gameEntry(search)).toEqual({entry,search});
 });
});
