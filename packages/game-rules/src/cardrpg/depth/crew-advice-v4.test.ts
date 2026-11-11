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
 it('rejects a reserve below the completed route band without settling or changing the live account',()=>{
  let s=fresh();
  for(const card of s.account.cards)card.level=6;
  s.account.cards.find(card=>card.cardId==='panko')!.level=1;
  s=R.startRun(s,1,17,'campaign','2026-11-06',6).state;
  s=R.enterNode(s,R.availableNodes(s.run!)[0]!.id).state;
  s.run!.battle!.result='enemy'; // Controlled settlement, not earned progression.
  const before=clone(s),settled=R.resultAdviceStateV4(s);
  expect(settled.ok).toBe(true);
  const advice:R.BuildAdviceV4={change:{kind:'cat',catId:'mochi',replacementId:'panko'},label:'Replace Mochi with Panko in Front',cost:{},expectedBuild:R.adviceBuildKeyV4(settled.state),before:{wins:0,margin:0},after:{wins:1,margin:0},samples:10};
  const rejected=R.applyResultAdviceV4(s,advice);
  expect(rejected.ok).toBe(false);expect(rejected.state).toBe(s);expect(s).toEqual(before);
  expect(rejected.error).toContain('challenge band 6');
 });
 it('starts a same-band retry with an eligible reserve and keeps settlement exactly once',()=>{
  let s=fresh();for(const card of s.account.cards)card.level=6;
  s=R.startRun(s,1,17,'campaign','2026-11-06',6).state;
  s=R.enterNode(s,R.availableNodes(s.run!)[0]!.id).state;
  s.run!.battle!.result='enemy';
  const settled=R.resultAdviceStateV4(s);
  const advice:R.BuildAdviceV4={change:{kind:'cat',catId:'mochi',replacementId:'panko'},label:'Replace Mochi with Panko in Front',cost:{},expectedBuild:R.adviceBuildKeyV4(settled.state),before:{wins:0,margin:0},after:{wins:1,margin:0},samples:10};
  const applied=R.applyResultAdviceV4(s,advice);expect(applied.ok).toBe(true);
  const retry=R.startRun(applied.state,1,18,'campaign','2026-11-06',6);
  expect(retry.ok).toBe(true);expect(retry.state.run!.challengeLevel).toBe(6);
  expect(retry.state.team[0]).toBe('panko');expect(R.applyResultAdviceV4(applied.state,advice).ok).toBe(false);
 });
});

it('evaluates A6 loss advice at the full health offered by the next retry without altering the frozen enemy budget',()=>{
 const s=R.setGameplayA6(fresh(),true);s.account.cards.find(c=>c.cardId==='panko')!.level=50;
 const encounter:R.BattleSetup={seed:7,chapter:3,gameplayV4:true,skillsV5:true,gameplayA6:true,challengeLevel:1,cats:R.battleCats(s),enemies:['pantry-crown']};
 const before=clone(s),input=clone(encounter),full=R.recommendBuildV4(s,encounter);
 const worn=R.recommendBuildV4(s,{...encounter,hp:Object.fromEntries(s.team.map(id=>[id,1]))});
 expect(full).not.toBeNull();expect(worn).toEqual(full);
 expect(s).toEqual(before);expect(encounter).toEqual(input);
});

it.each(['level','row','cat'] as const)('allows a legal %s change below the fixed Tower enemy level and preserves its retry',kind=>{
 let s=R.setGameplayA6(fresh(),true);s.cleared=[1];s.towerBest=4;
 for(const card of s.account.cards)card.level=1;
 s=R.startTowerFloorA6(s,5).state;s=R.enterNode(s,R.availableNodes(s.run!)[0]!.id).state;
 s.run!.battle!.result='enemy';
 const original=clone(s),floor=clone(s.run!),settled=R.resultAdviceStateV4(s);
 const change:R.BuildChangeV4=kind==='level'?{kind:'level',cardId:s.account.cards[0]!.id}:kind==='row'?{kind:'row',catId:'soot',row:'front'}:{kind:'cat',catId:'mochi',replacementId:'panko'};
 const expected=R.changeBuildV4(settled.state,change);expect(expected.ok).toBe(true);
 const advice:R.BuildAdviceV4={change,label:'Controlled Tower recovery change',cost:{},expectedBuild:R.adviceBuildKeyV4(settled.state),before:{wins:0,margin:0},after:{wins:1,margin:.1},samples:10};
 expect(s.run!.challengeLevel).toBe(2);expect(s.team.some(id=>s.account.cards.find(c=>c.cardId===id)!.level<2)).toBe(true);
 const applied=R.applyResultAdviceV4(s,advice);expect(applied.ok).toBe(true);expect(applied.state).toEqual(expected.state);expect(s).toEqual(original);
 const retry=R.startTowerFloorA6(applied.state,floor.floor);expect(retry.ok).toBe(true);
 expect(retry.state.run!.towerA6).toEqual(floor.towerA6);expect(retry.state.run!.nodes).toEqual(floor.nodes);expect(retry.state.run!.seed).toBe(floor.seed);expect(retry.state.run!.challengeLevel).toBe(floor.challengeLevel);
 expect(R.battleCats(retry.state).every(cat=>retry.state.run!.hp[cat.id]===cat.stats.hp)).toBe(true);
 expect(R.applyResultAdviceV4(applied.state,advice).ok).toBe(false);
 const stale=clone(s);stale.account.currencies.fish++;
 const rejected=R.applyResultAdviceV4(stale,advice);expect(rejected.ok).toBe(false);expect(rejected.state).toBe(stale);
});
