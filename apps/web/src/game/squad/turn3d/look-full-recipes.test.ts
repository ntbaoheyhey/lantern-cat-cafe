import {describe,expect,it} from 'vitest';
import {CARD_EFFECT_RECIPES} from './card-effect-data';
import {fullRecipes,fullEnemyRecipes} from './look-full-recipes';
const cats=['soot','velvet','cinnamon','sorrel','inkcap','brioche','panko','mallow','clover','marigold','mochi','biscuit'];
describe('authored presentation recipes',()=>{
 it('preserves the legacy recipes and the action timing contract for every presentation',()=>{
  const before=JSON.stringify(CARD_EFFECT_RECIPES),recipes=fullRecipes(CARD_EFFECT_RECIPES,cats);
  for(const cat of cats)for(const slot of [1,2,3,4,'passive']){
   const id=`${cat}-${slot}`,recipe=recipes[id]!,legacy=CARD_EFFECT_RECIPES[id]!;
   expect(recipe.durations).toEqual(legacy.durations);
   expect(recipe.target).toBe(legacy.target);
   expect(recipe.ultimate).toBe(legacy.ultimate);
   expect(recipe.layers.length).toBeGreaterThanOrEqual(4);
   expect(recipe.layers.some(l=>l.ground)).toBe(true);
   expect(recipe.layers.some(l=>l.emitter)).toBe(true);
   for(const layer of recipe.layers){expect(layer.start).toBeGreaterThanOrEqual(0);expect(layer.end).toBeLessThanOrEqual(1);expect(layer.end).toBeGreaterThan(layer.start);}
  }
  expect(JSON.stringify(CARD_EFFECT_RECIPES)).toBe(before);
 });
 it('limits rollout to the reviewed whole-cat batch and retains unknown/enemy fallback',()=>{
  const recipes=fullRecipes(CARD_EFFECT_RECIPES,['soot']);
  expect(recipes['soot-1']).not.toBe(CARD_EFFECT_RECIPES['soot-1']);
  expect(recipes['mochi-1']).toBe(CARD_EFFECT_RECIPES['mochi-1']);
  expect(recipes['enemy:button-guard']).toBe(CARD_EFFECT_RECIPES['enemy:button-guard']);
  expect(recipes['unknown']).toBeUndefined();
 });
});

it('keeps published enemy action clocks and the legacy catalog unchanged',()=>{
 const before=JSON.stringify(CARD_EFFECT_RECIPES),result=fullEnemyRecipes(CARD_EFFECT_RECIPES);
 for(const owner of ['button-guard','sock-skipper','spool-ram','needle-moth','teacup-healer','kettle-knight','yarn-giant'])for(const suffix of ['',':basic']){
  const id='enemy:'+owner+suffix,old=CARD_EFFECT_RECIPES[id]!;
  expect(result[id]!.durations).toEqual(old.durations);
  expect(result[id]!.target).toEqual(old.target);
  expect(result[id]!.layers.length).toBeGreaterThanOrEqual(4);
 }
 expect(JSON.stringify(CARD_EFFECT_RECIPES)).toBe(before);
 expect(result['enemy:practice-cushion']).toBe(CARD_EFFECT_RECIPES['enemy:practice-cushion']);
});
