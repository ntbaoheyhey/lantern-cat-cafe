import {describe,expect,it} from 'vitest';
import {gameEntry} from './game-entry-loader';
describe('judge-facing game routing',()=>{
 it('opens the full campaign at the bare domain',()=>{
  expect(gameEntry('')).toEqual({entry:'depth',search:'?demo=1&squad=1&cardrpg2=1&a6=1'});
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
  ['?demo=1&squad=1','squad'],
 ])('preserves the explicitly selected route %s', (search,entry)=>{
  expect(gameEntry(search)).toEqual({entry,search});
 });
 it.each(['?demo=1','?demo=0','?squad=0','?demo=1&squad=0','?legacy=0','?cardrpg2=0'])('never falls into legacy from incomplete game links %s',search=>{
  const route=gameEntry(search),query=new URLSearchParams(route.search);
  expect(route.entry).toBe('depth');
  for(const key of ['demo','squad','cardrpg2','a6'])expect(query.get(key)).toBe('1');
  expect(query.get('ui')).toBeNull();
 });
 it('adds the guest context when an explicit game link omits it',()=>{
  expect(gameEntry('?cardrpg=1')).toEqual({entry:'cardrpg',search:'?cardrpg=1&demo=1&squad=1'});
 });
});
