import {expect,it} from 'vitest';
import {CARD_EFFECT_RECIPES} from './card-effect-data';
import {fullRecipes,fullEnemyRecipes} from './look-full-recipes';
import {artEffectRecipes,artLightBeatProgress,artImpactScale,ART_LIGHT_UNITS} from './look-art-effects';
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
 for(const id of Object.keys(base).filter(id=>id.startsWith('enemy:'))){
  const old=base[id]!,recipe=art[id]!;
  expect(recipe.target,id).toBe(old.target);expect(recipe.durations,id).toEqual(old.durations);
  expect(recipe.layers.some(l=>['door','roof','lantern','sock','cup','bow','button','bread','cushion','tray','needle'].includes(l.primitive)),id).toBe(false);
 }
});

it('preserves all hero kit targets and clocks while sourcing distinct generated components',()=>{
 const base=fullRecipes(CARD_EFFECT_RECIPES,[...ART_LIGHT_UNITS]);
 const before=JSON.stringify(base),art=artEffectRecipes(base),ultimates=new Set<string>();
 for(const [index,owner] of ART_LIGHT_UNITS.entries())for(const suffix of ['1','2','3','4','passive']){
  const id=`${owner}-${suffix}`,recipe=art[id]!,old=base[id]!;
  expect(recipe.target,id).toBe(old.target);expect(recipe.durations,id).toEqual(old.durations);
  expect(recipe.ultimate,id).toBe(old.ultimate);expect(recipe.layers.every(l=>l.primitive==='painted-light'),id).toBe(true);
  expect(recipe.layers.every(l=>l.start<l.end&&l.end<=1&&l.spriteRow!>=index*4&&l.spriteRow!<index*4+4),id).toBe(true);
  if(suffix!=='passive'){
   const charge=recipe.layers.find(l=>l.anchor==='caster'&&l.propOrigin)!,travel=recipe.layers.find(l=>l.motion==='projectile')!;
   expect(charge.end,id).toBe(travel.start);expect(travel.end,id).toBe(.52);expect(travel.propOrigin,id).toBe(true);
  }
  if(recipe.ultimate)ultimates.add(JSON.stringify(recipe.layers));
 }
 expect(ultimates.size).toBe(12);expect(JSON.stringify(base)).toBe(before);
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

it('keeps the airborne hit readable at landing instead of saving most scale for recovery',()=>{
 // At20% of the impact beat, an expand hit has barely begun its layer lifetime.
 const layerProgress=(.52+.08*.2-.52)/(.74-.52);
 const impact=artImpactScale(layerProgress);
 expect(impact).toBeGreaterThanOrEqual(.9);
 expect(artImpactScale(.8)/impact).toBeLessThan(1.4);
});

it('lands Midnight Service with converging strokes and clears its warm centre before the afterglow',()=>{
 const art=artEffectRecipes(fullRecipes(CARD_EFFECT_RECIPES,[...ART_LIGHT_UNITS]));
 const layers=art['soot-4']!.layers;
 const strokes=layers.find(l=>l.motion==='converge')!;
 const core=layers.find(l=>l.motion==='expand'&&!l.ground)!;
 const afterglow=layers.find(l=>l.motion==='hold')!;
 expect(strokes.anchor).toBe('all-targets');expect(strokes.count).toBe(2);
 expect(strokes.start).toBeLessThan(.52);expect(strokes.end).toBeLessThan(.66);
 expect(core.start).toBeGreaterThanOrEqual(.52);expect(core.start).toBeLessThan(.55);
 expect(core.end).toBeLessThan(afterglow.end);expect(core.opacity).toBeGreaterThan(afterglow.opacity*2);
 expect(layers.some(l=>l.motion==='crescent')).toBe(true);
 for(const [id,recipe] of Object.entries(art))if(id!=='soot-4'){
  expect(recipe.layers.some(l=>l.motion==='converge'||l.motion==='crescent'),id).toBe(false);
 }
});
