import {expect,it} from 'vitest';
import {CARD_EFFECT_RECIPES} from './card-effect-data';
import {fullRecipes,fullEnemyRecipes} from './look-full-recipes';
import {artEffectRecipes,artLightBeatProgress} from './look-art-effects';
import type {EffectFrame} from './effects';

it('keeps legacy art and battle timing intact while replacing pilot props',()=>{
 const base=fullEnemyRecipes(fullRecipes(CARD_EFFECT_RECIPES,['mochi']));
 const original=JSON.stringify(base),art=artEffectRecipes(base);
 for(const id of ['mochi-1','mochi-2','mochi-3','mochi-4','mochi-passive','enemy:sock-skipper','enemy:teacup-healer']){
  const a=art[id]!,b=base[id]!;
  expect(a.target).toBe(b.target);expect(a.durations).toEqual(b.durations);
  expect(a.ultimate).toBe(b.ultimate);
  expect(a.layers.some(l=>['door','roof','lantern','sock','cup','bow','button'].includes(l.primitive))).toBe(false);
  for(const l of a.layers){expect(l.start).toBeLessThan(l.end);expect(l.end).toBeLessThanOrEqual(1);}
 }
 expect(JSON.stringify(base)).toBe(original);
 expect(art['soot-1']).toBe(base['soot-1']);
});

it('connects Mochi release and impact at the existing landing beat',()=>{
 const art=artEffectRecipes(fullRecipes(CARD_EFFECT_RECIPES,['mochi']));
 for(const id of ['mochi-1','mochi-2','mochi-3','mochi-4']){
  const layers=art[id]!.layers;
  const charge=layers.find(l=>l.anchor==='caster'&&l.propOrigin)!;
  const travel=layers.find(l=>l.motion==='projectile')!;
  expect(charge.height).toBe(0);expect(travel.propOrigin).toBe(true);
  expect(charge.end).toBe(travel.start);expect(travel.end).toBe(.52);
  if(id!=='mochi-1')expect(layers.find(l=>l.spriteRow===2)?.motion).toBe('hold');
  for(const l of layers.filter(l=>l.anchor!=='caster'&&l.motion!=='projectile'))expect(l.start).toBeGreaterThanOrEqual(.52);
 }
});

it('shows impact light while the actor pose is held, without mutating the action',()=>{
 const frame={beat:{kind:'impact',start:900,duration:100},elapsed:955,progress:0} as EffectFrame;
 const before=JSON.stringify(frame);
 expect(artLightBeatProgress(frame)).toBeCloseTo(.55);
 const arch=artEffectRecipes(fullRecipes(CARD_EFFECT_RECIPES,['mochi']))['mochi-4']!.layers.find(l=>l.spriteRow===2)!;
 const lightProgress=(.52+.08*artLightBeatProgress(frame)-arch.start)/(arch.end-arch.start);
 expect(lightProgress).toBeGreaterThan(1/12); // Fully visible before the pose releases.
 expect(JSON.stringify(frame)).toBe(before);
 expect(artLightBeatProgress({...frame,beat:{...frame.beat,kind:'travel'},progress:.3})).toBe(.3);
});
