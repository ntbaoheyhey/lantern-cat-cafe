import {describe,it,expect} from 'vitest';
import {soundScene,ambienceScene} from './scene';
describe('music scene routing',()=>{
 it('uses the visible encounter, even though the model keeps screen=map',()=>{
  expect(soundScene('map',true,false)).toBe('battle');
  expect(soundScene('map',true,true)).toBe('boss');
  expect(soundScene('map',false,false)).toBe('map');
 });
 it('returns to menu music on results, settings and hub without a home remount',()=>{
  for(const screen of ['result','save','inventory','hub'])expect(soundScene(screen,false,true)).toBe('home');
  expect(soundScene('gacha',false,true)).toBe('gacha');
 });
 it('routes room tone to the visible screen and battle, independent of music reuse',()=>{
  expect(ambienceScene('inventory',false,false)).toBe('bag');
  expect(ambienceScene('gacha',false,false)).toBe('invitations');
  expect(ambienceScene('map',true,true)).toBe('boss');
  expect(ambienceScene('map',false,false)).toBe('chapter-map');
 });
});
