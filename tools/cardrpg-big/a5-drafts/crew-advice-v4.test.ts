import { describe, expect, it } from 'vitest';
import { clone } from '../internal';
import * as R from './index';
const fresh = () => {
 const state=R.setGameplayV4(R.createDepthAccount(7),true);
 state.account.cards.push({id:'reserve-panko',cardId:'panko',level:6,stars:1,shards:0,soulbound:true});
 return state;
};
describe('owned reserve cat advice',()=>{
 it('replaces only a collected reserve in the same slot while retaining all equipment',()=>{
  const s=fresh(),before=clone(s),gear=R.makeGear(s,'bellsteel-weapon-epic',7);
  s.gear.push(gear);s.equipment.mochi={weapon:gear.id};
  const inventory=clone(s.gear),equipment=clone(s.equipment);
  const r=R.changeBuildV4(s,{kind:'cat',catId:'mochi',replacementId:'panko'});
  expect(r.ok).toBe(true);expect(r.state.team).toEqual(['panko','soot','clover']);
  expect(r.state.rows.panko).toBe('front');expect(r.state.gear).toEqual(inventory);expect(r.state.equipment).toEqual(equipment);
  expect(r.state.account.currencies).toEqual(s.account.currencies);expect(s.team).toEqual(before.team);
  expect(R.battleCats(r.state)[0]!.skills).toEqual(R.defaultSkills(r.state,'panko'));
 });
 it('rejects unowned, duplicate and missing swaps and every active-route replacement atomically',()=>{
  const s=fresh();
  for(const change of [{kind:'cat',catId:'mochi',replacementId:'missing'}, {kind:'cat',catId:'mochi',replacementId:'clover'}, {kind:'cat',catId:'missing',replacementId:'panko'}] as const){
   const result=R.changeBuildV4(s,change);expect(result.ok).toBe(false);expect(result.state).toBe(s);
  }
  const active=R.startRun(s,1,17).state,before=clone(active);
  expect(R.changeBuildV4(active,{kind:'cat',catId:'mochi',replacementId:'panko'}).ok).toBe(false);expect(active).toEqual(before);
  const off=R.setGameplayV4(s,false);expect(R.changeBuildV4(off,{kind:'cat',catId:'mochi',replacementId:'panko'}).ok).toBe(false);
 });
 it('uses the same stale-build guard and applies a swap only once',()=>{
  const s=fresh(),advice:R.BuildAdviceV4={change:{kind:'cat',catId:'mochi',replacementId:'panko'},label:'Replace Mochi with Panko in Front',cost:{},expectedBuild:R.adviceBuildKeyV4(s),before:{wins:0,margin:0},after:{wins:1,margin:0},samples:10};
  const applied=R.applyAdviceV4(s,advice);expect(applied.ok).toBe(true);expect(R.applyAdviceV4(applied.state,advice).ok).toBe(false);
  const changed=clone(s);changed.account.cards.find(c=>c.cardId==='panko')!.level++;
  const rejected=R.applyAdviceV4(changed,advice);expect(rejected.ok).toBe(false);expect(rejected.state).toBe(changed);
 });
 it('finds an earned reserve deterministically without changing the account or encounter',()=>{
  const s=fresh();s.account.cards.find(c=>c.cardId==='panko')!.level=50;
  for(const currency of Object.keys(s.account.currencies) as (keyof typeof s.account.currencies)[])s.account.currencies[currency]=0;
  const encounter:R.BattleSetup={seed:7,chapter:1,gameplayV4:true,challengeLevel:6,cats:R.battleCats(s),enemies:['yarn-giant']};
  const before=clone(s),input=clone(encounter),a=R.recommendBuildV4(s,encounter),b=R.recommendBuildV4(s,encounter);
  expect(a).toEqual(b);expect(a?.change.kind).toBe('cat');expect(a?.label).toContain('Panko');
  expect(a!.after.wins).toBeGreaterThanOrEqual(a!.before.wins);expect(R.applyAdviceV4(s,a!).ok).toBe(true);
  expect(s).toEqual(before);expect(encounter).toEqual(input);
 });
});
