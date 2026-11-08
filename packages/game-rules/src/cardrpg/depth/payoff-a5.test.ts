import { describe, expect, it } from 'vitest';
import { clone } from '../internal';
import * as R from './index';
const fresh = () => R.setGameplayV4(R.createDepthAccount(7), true);
const setup = (s = fresh()): R.BattleSetup => ({ seed: 7, chapter: 1, gameplayV4: true, cats: R.battleCats(s), enemies: ['practice-cushion'] });

describe('choice evidence and forecasts', () => {
 it('predicts deterministically without changing the encounter or account and rejects OFF', () => {
  const s = fresh(), initial = setup(s), before = clone(initial);
  const a = R.forecastV4(initial), b = R.forecastV4({...initial, seed: 999});
  expect({...a, computeMs: 0}).toEqual({...b, computeMs: 0}); expect(initial).toEqual(before);
  expect(a.samples).toBe(20); expect(['Risky','Even','Favoured']).toContain(a.band);
  expect(() => R.forecastV4({...initial, gameplayV4:false})).toThrow();
 });
 it('keeps forecast seeds out of cache identity, but includes health, gear, plan and band', () => {
  const initial = setup(), key = R.forecastKeyV4(initial);
  expect(R.forecastKeyV4({...initial, seed:13})).toBe(key);
  for (const changed of [{...initial,hp:{mochi:1}}, {...initial,challengeLevel:2}, {...initial,plan:{focus:'leader',care:'protect'} as R.StandingPlan}])
   expect(R.forecastKeyV4(changed)).not.toBe(key);
 });
 it('names observed actors and exact amounts without mutating a replay', () => {
  const battle = R.playBattle(R.createBattle(setup()), 'auto'), before=clone(battle), out=R.outcomeV4(battle);
  expect(battle).toEqual(before); expect(out.causes.length).toBeGreaterThan(0);
  expect(out.causes.every(c=>c.amount>0&&c.text.includes(battle.actors.find(a=>a.id===c.actorId)!.name))).toBe(true);
  const damage = battle.log.filter(e=>['damage','dot','detonate','shared','reflect'].includes(e.kind)&&setup().cats.some(c=>c.id===e.actorId)&&e.targetId.startsWith('foe-')).reduce((n,e)=>n+e.amount,0);
  expect(out.totalDamage).toBe(damage);
 });
 it('keeps two-piece and unique grants distinct even when four matching pieces are worn', () => {
  const battle=R.createBattle(setup()),cat=battle.initial.cats[0]!;
  cat.equipment=['weapon','outfit','charm','relic'].map(slot=>`hearthloom-${slot}-epic`);
  battle.v4!.events=[{version:1,sequence:0,round:1,kind:'gear-trigger',actorId:cat.id,templateId:'hearthloom-weapon-epic',effect:'defend-shield',amount:12,text:'Item granted 12 shield to Mochi.'}];
  expect(R.outcomeV4(battle).allCauses.find(c=>c.kind==='gear')?.text).toBe('Hearthloom 2-piece on Mochi granted 12 shield.');
  cat.equipment=[];expect(R.outcomeV4(battle).allCauses.some(c=>c.kind==='gear')).toBe(false);
 });
 it('reveals only completed route clues and leaves OFF routes unscouted', () => {
  const s=R.startRun(fresh(),1,17).state,run=s.run!;
  expect(R.scoutingV4(run).found).toBe(0);
  const first=run.nodes.find(n=>n.depth===0)!;run.current=first.id;
  expect(R.scoutingV4(run).found).toBe(0);
  run.visited.push(first.id);expect(R.scoutingV4(run).clues.find(c=>c.id==='opening')?.known).toBe(true);
  expect(R.scoutingV4({...run,gameplayV4:false}).found).toBe(0);
 });
});

describe('available build advice', () => {
 it('rejects impossible rows, live-route upgrades and stale costs without mutation', () => {
  const s=fresh(),before=clone(s);
  expect(R.changeBuildV4(s,{kind:'row',catId:'missing',row:'front'}).ok).toBe(false);
  expect(R.changeBuildV4(s,{kind:'row',catId:'mochi',row:'rear'}).ok).toBe(false);
  const active=R.startRun(s,1,17).state;expect(R.changeBuildV4(active,{kind:'level',cardId:active.account.cards[0]!.id}).ok).toBe(false);
  const advice:R.BuildAdviceV4={change:{kind:'plan',plan:{focus:'leader',care:'protect'}},label:'Focus the boss',cost:{},expectedBuild:R.adviceBuildKeyV4(s),before:{wins:0,margin:0},after:{wins:1,margin:0},samples:10};
  expect(R.applyAdviceV4(s,advice).ok).toBe(true);
  const changed=clone(s);changed.account.currencies.fish++;
  const rejected=R.applyAdviceV4(changed,advice);expect(rejected.ok).toBe(false);expect(rejected.state).toBe(changed);expect(s).toEqual(before);
 });
 it('never changes an account while looking for a useful affordable improvement', () => {
  const s=fresh(),before=clone(s),initial=setup(s),advice=R.recommendBuildV4(s,initial);
  expect(s).toEqual(before);
  if(advice){expect(advice.after.wins).toBeGreaterThanOrEqual(advice.before.wins);expect(R.applyAdviceV4(s,advice).ok).toBe(true);}
  expect(R.recommendBuildV4(R.setGameplayV4(s,false),initial)).toBeNull();
 });
 it('settles a loss once on apply; stale advice cannot collect rewards or spend currency', () => {
  let s=R.startRun(fresh(),1,17).state;s=R.enterNode(s,R.availableNodes(s.run!)[0]!.id).state;
  s.run!.battle!.result='enemy'; // Controlled settlement fixture, not an earned-progression receipt.
  const before=clone(s),settled=R.resultAdviceStateV4(s);expect(settled.ok).toBe(true);expect(s).toEqual(before);
  const advice:R.BuildAdviceV4={change:{kind:'plan',plan:{focus:'leader',care:'protect'}},label:'Focus the boss',cost:{},expectedBuild:R.adviceBuildKeyV4(settled.state),before:{wins:0,margin:0},after:{wins:1,margin:0},samples:10};
  const wrong=R.applyResultAdviceV4(s,{...advice,expectedBuild:'stale'});expect(wrong.ok).toBe(false);expect(wrong.state).toBe(s);
  const applied=R.applyResultAdviceV4(s,advice);expect(applied.ok).toBe(true);expect(applied.state.account.currencies).toEqual(settled.state.account.currencies);
  expect(R.applyResultAdviceV4(applied.state,advice).ok).toBe(false);
 });
});
