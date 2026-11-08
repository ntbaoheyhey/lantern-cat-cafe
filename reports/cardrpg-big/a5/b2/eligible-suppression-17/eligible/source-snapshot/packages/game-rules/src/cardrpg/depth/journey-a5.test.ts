import { describe, expect, it } from 'vitest';
import { clone } from '../internal';
import * as R from './index';
const fresh = () => R.setGameplayV4(R.createDepthAccount(7), true);
const take = (r: R.RuleResult<R.DepthAccount>) => { expect(r.ok, r.error).toBe(true); return r.state; };
const receipt = (): R.NodeStarsV4 => ({ key: '1/1/0-0/battle', chapter: 1, band: 1, nodeId: '0-0', kind: 'battle', conditions: [true, true, true] });

describe('route stars and discovery receipts', () => {
 it('settles exact combat goals once and records no star for a defeat', () => {
  let s=take(R.startRun(fresh(),1,7));s=take(R.enterNode(s,'0-0'));
  const run=s.run!,node=run.nodes[0]!,b=run.battle!;
  b.result='party';b.round=6;
  expect(R.combatStarsV4(run,node,b)?.conditions).toEqual([true,true,true]);
  b.log.push({round:1,actorId:'foe-0',targetId:'mochi',kind:'defeat',skillId:'',amount:0,text:''});
  expect(R.combatStarsV4(run,node,b)?.conditions).toEqual([true,false,true]);
  b.round=7;expect(R.combatStarsV4(run,node,b)?.conditions).toEqual([true,false,false]);
  b.result='enemy';expect(R.combatStarsV4(run,node,b)?.conditions).toEqual([false,false,false]);
  const lost=take(R.finishEncounter(s));expect(R.starCountV4(lost)).toBe(0);
  expect(R.finishEncounter(lost).ok).toBe(false);
 });
 it('keeps replay stars monotone and does not confuse two kinds of stop', () => {
  const first=receipt(),later={...first,conditions:[true,false,false] as [boolean,boolean,boolean]};
  expect(R.mergeNodeStarsV4(first,later)).toEqual({value:first,added:0});
  const s=fresh();R.recordNodeStarsV4(s,first);R.recordNodeStarsV4(s,first);expect(R.starCountV4(s)).toBe(3);
  expect(()=>R.mergeNodeStarsV4(first,{...first,key:'1/1/0-0/event'})).toThrow();
 });
 it('requires actual resolution and team health for noncombat stars', () => {
  const s=take(R.startRun(fresh(),1,7)),run=s.run!,node=run.nodes.find(n=>n.kind==='event')!;
  const hp=Object.fromEntries(R.battleCats(s).map(c=>[c.id,c.stats.hp]));
  expect(R.stopStarsV4(s,run,node,hp)).toBeNull();run.visited.push(node.id);
  const r=R.stopStarsV4(s,run,node,hp)!;expect(r.conditions[0]).toBe(true);expect(r.conditions[1]).toBe(true);
  run.hp.mochi=1;expect(R.stopStarsV4(s,run,node,hp)?.conditions[1]).toBe(false);
 });
 it('emits typed earned discoveries once and preserves them after dismissal', () => {
  let s=fresh();R.observeDiscoveriesV4(s);const pending=clone(s.v4!.journey!.pending);
  expect(pending.length).toBeGreaterThan(0);expect(pending.every(e=>e.version===2&&e.kind==='earned-reveal'&&!('draw' in e))).toBe(true);
  R.observeDiscoveriesV4(s);expect(s.v4!.journey!.pending).toEqual(pending);
  const before=clone(s),next=take(R.acknowledgeDiscoveryV4(s,pending[0]!.sequence));
  expect(s).toEqual(before);expect(next.v4!.journey!.found).toEqual(s.v4!.journey!.found);
  expect(R.acknowledgeDiscoveryV4(next,pending[0]!.sequence).ok).toBe(false);
  s=next;R.recordNodeStarsV4(s,receipt());R.observeDiscoveriesV4(s);
  expect(s.v4!.journey!.found.some(d=>d.id==='stars:3')).toBe(true);
 });
 it('never spends a capped star claim, settles once later and respects the existing allowance', () => {
  let s=fresh();R.recordNodeStarsV4(s,receipt());s.account.daily.earned.stamps=360;
  const before=clone(s);expect(R.claimStarRewardV4(s,'stars-3').ok).toBe(false);expect(s).toEqual(before);
  s.account.daily.earned.stamps=350;const balance=s.account.currencies.stamps;
  s=take(R.claimStarRewardV4(s,'stars-3'));expect(s.account.currencies.stamps-balance).toBe(10);expect(s.account.daily.earned.stamps).toBe(360);
  expect(R.claimStarRewardV4(s,'stars-3').ok).toBe(false);
 });
 it('migrates THC12 quietly, preserves OFF saves and retains progress through toggles', () => {
  const old=fresh();delete old.v4!.journey;const payload=JSON.stringify(old);
  const loaded=R.importSave(`THC12.${R.saveChecksum(payload)}.${payload}`);
  expect(loaded.v4!.journey!.found.length).toBeGreaterThan(0);expect(loaded.v4!.journey!.pending).toEqual([]);
  expect(loaded.v4!.journey!.stars).toEqual({});expect(R.exportSave(loaded)).toMatch(/^THC13\./);
  const off=R.createDepthAccount(7),code=R.exportSave(off);expect(R.exportSave(R.importSave(code))).toBe(code);
  const on=fresh();R.recordNodeStarsV4(on,receipt());const disabled=R.setGameplayV4(on,false);
  R.observeDiscoveriesV4(disabled);expect(disabled.v4).toEqual(on.v4);
  expect(R.importSave(R.exportSave(disabled))).toEqual(disabled);
 });
 it('validates bounded journal state and rejects malformed receipts', () => {
  const s=fresh();R.observeDiscoveriesV4(s);expect(()=>R.exportSave(s)).not.toThrow();
  for(const mutate of [
    (x:R.DepthAccount)=>{x.v4!.journey!.pending[0]!.version=1 as 2;},
    (x:R.DepthAccount)=>{x.v4!.journey!.found[0]!.id='invented';},
    (x:R.DepthAccount)=>{x.v4!.journey!.stars.bad=receipt();},
    (x:R.DepthAccount)=>{x.v4!.journey!.claims=['stars-3','stars-3'];},
  ]){const bad=clone(s);mutate(bad);expect(()=>R.exportSave(bad)).toThrow();}
 });
});

it('records earned set, rank and Legendary discoveries without losing their identities',()=>{
 let s=fresh();R.observeDiscoveriesV4(s);
 for(const slot of ['weapon','outfit','charm','relic'] as const){
  const gear=R.makeGear(s,`hearthloom-${slot}-common`,7);s.gear.push(gear);s=take(R.equipGear(s,'mochi',gear.id));
 }
 expect(s.v4!.journey!.found.some(d=>d.id==='set:hearthloom')).toBe(true);
 s.account.cards.find(c=>c.cardId==='mochi')!.stars=2;R.observeDiscoveriesV4(s);
 s.gear.push(R.makeGear(s,'hearthloom-weapon-legendary',7));R.observeDiscoveriesV4(s);
 expect(s.v4!.journey!.pending.some(e=>e.discovery.id==='rank:mochi:2')).toBe(true);
 expect(s.v4!.journey!.pending.some(e=>e.discovery.id==='legendary:first')).toBe(true);
 const before=clone(s.v4!.journey!);R.observeDiscoveriesV4(s);expect(s.v4!.journey).toEqual(before);
 expect(R.importSave(R.exportSave(s))).toEqual(s);
});
