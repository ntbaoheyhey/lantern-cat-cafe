import { describe, expect, it } from 'vitest';
import * as E from '../squad/turn/engine';
import { choosePolicyLoot } from '../squad/gear/run';
import type { TurnBattle } from '../squad/turn/types';
import * as R from './index';
function play(b:TurnBattle) { E.beginRun(b);while(!b.result&&b.turn<650){if(b.run.stage==='loot'){E.chooseLoot(b,choosePolicyLoot(b,'active')!);continue;}if(b.run.stage==='rest'){E.autoEquipGear(b);E.continueRun(b);continue;}E.startTurn(b);if(b.phase==='choose'){const c=E.getAutoAction(b,'active');if(!c||!E.chooseAction(b,c))throw Error('illegal');E.resolveAction(b);}E.endTurn(b);}return b; }
describe('account to numbered-round combat',()=>{
 it('uses exact computed account stats and freezes the input snapshot',()=>{const s=R.createStarterAccount(),r=R.startBattle(s,11);if(!r.ok)throw Error();const b=r.value.battle;const stats=R.computeCardStats(s,'soot');const a=b.actors.find(a=>a.id==='witch')!;expect(a.attack).toBe(Math.round(stats.attack*1.04));expect(a.defense).toBe(stats.defense);expect(R.enhance(r.state,r.state.inventory.items[0]!.id).ok).toBe(false);expect(R.advanceLocalDay(r.state).ok).toBe(false);expect(s.pendingRun).toBeNull();});
 it('replays the full event stream with account gear and temporary expedition loot',()=>{const s=R.createStarterAccount(),r=R.startBattle(s,23);if(!r.ok)throw Error();const b=play(r.value.battle),replay=E.replayRun(r.value.options,b.run.commands);expect(replay.events).toEqual(b.events);expect(replay.result).toEqual(b.result);});
 it('every actor resolves at most once per numbered round',()=>{const r=R.startBattle(R.createStarterAccount(),11);if(!r.ok)throw Error();const b=play(r.value.battle),seen=new Set<string>();for(const e of b.events.filter(e=>e.type==='turn_start')){const key=`${e.round}:${e.actorId}`;expect(seen.has(key)).toBe(false);seen.add(key);}expect(b.actors.every(a=>Number.isInteger(a.initiative))).toBe(true);});
 it('settles once and rejects fabricated reward amounts',()=>{const r=R.startBattle(R.createStarterAccount(),11);if(!r.ok)throw Error();const b=play(r.value.battle),p=R.previewBattleRewards(r.state,b);if(!p.ok)throw Error();expect(R.applyBattleRewards(r.state,{...p.value,reward:{currencies:{fish:999999},xp:0}}).ok).toBe(false);const settled=R.finishBattle(r.state,b);expect(settled.ok).toBe(true);expect(R.applyBattleRewards(settled.state,p.value).ok).toBe(false);expect(R.finishBattle(settled.state,b).ok).toBe(false);});
 it('blocks unfinished/mismatched battles and future chapters',()=>{const r=R.startBattle(R.createStarterAccount(),11);if(!r.ok)throw Error();expect(R.finishBattle(r.state,r.value.battle).ok).toBe(false);expect(R.startBattle(r.state,12).ok).toBe(false);expect(R.startBattle(R.createStarterAccount(),11,'rooftop-orchard').ok).toBe(false);expect(R.abandonBattle(r.state).state.pendingRun).toBeNull();});
 it('extra brewed supplies are spent on entry, including abandoned runs',()=>{const s=R.createStarterAccount();s.inventory.stacks['milk-tonic']=4;const r=R.startBattle(s,11);if(!r.ok)throw Error();expect(r.state.inventory.stacks['milk-tonic']).toBe(2);expect(r.value.battle.run.consumables.healTonic).toBe(4);expect(R.abandonBattle(r.state).state.inventory.stacks['milk-tonic']).toBe(2);});
 it('an enhanced item changes battle damage inputs and rare traits remain soulbound',()=>{const s=R.createStarterAccount();s.inventory.items[2]!.enhancement=12;const r=R.startBattle(s,11);if(!r.ok)throw Error();expect(r.value.battle.actors.find(a=>a.id==='witch')!.attack).toBeGreaterThan(E.createTurnBattle(R.toBattleOptions(R.createStarterAccount(),11)).actors.find(a=>a.id==='witch')!.attack);expect(s.inventory.items.every(i=>i.soulbound)).toBe(true);});
 it('default-off turn engine keeps the original non-meta shape and values',()=>{const b=E.createTurnBattle({gearMode:'starter'});expect(b.run.cardRpg).toBeUndefined();expect(b.actors.every(a=>a.cardRpg===undefined)).toBe(true);expect(b.actors.find(a=>a.id==='witch')!.name).toBe('Soot');});
});

describe('complete reward and equipment presentation contract', () => {
 it('effect-hit investment rescues resisted casts without changing numbered-round action limits', () => {
  let baseHits=0, improvedHits=0;
  for(let seed=1;seed<=400;seed++){
   const outcomes=[0,800].map(hit=>{
    const options=R.toBattleOptions(R.createStarterAccount(),seed);
    options.cardRpg!.cards.witch.stats.effectHitBp=hit;
    const b=E.createTurnBattle({...options,encounter:'dummy'});E.beginRun(b);
    b.queue.sort((a,z)=>Number(z.actorId==='witch')-Number(a.actorId==='witch'));
    E.startTurn(b);const target=E.getLegalTargets(b,'threadSnare').find(t=>t.legal)!;
    expect(E.chooseAction(b,{actorId:'witch',skillId:'threadSnare',targetId:target.actorId})).toBe(true);
    const events=E.resolveAction(b);E.endTurn(b);
    expect(b.acted.filter(id=>id==='witch')).toHaveLength(1);
    return events.some(e=>e.type==='status_apply'&&e.status==='snare');
   });
   if(outcomes[0])baseHits++;if(outcomes[1])improvedHits++;
   expect(!outcomes[0]||outcomes[1]).toBe(true);
  }
  expect(baseHits).toBeGreaterThan(300);expect(baseHits).toBeLessThan(380);
  expect(improvedHits-baseHits).toBeGreaterThan(15);
  expect(improvedHits).toBeLessThan(400);
 });
 it('preview exactly equals settlement, including first-clear gear and seal, without mutation', () => {
  const r=R.startBattle(R.createStarterAccount(),1); if(!r.ok)throw Error();
  const before=JSON.stringify(r.state), b=play(r.value.battle), p=R.previewBattleRewards(r.state,b);if(!p.ok)throw Error();
  const settled=R.finishBattle(r.state,b);if(!settled.ok)throw Error();
  expect(JSON.stringify(r.state)).toBe(before);expect(p.value.reward).toEqual(settled.value);
  expect(b.result!.winner).toBe('party');expect(p.value.reward.currencies.fish).toBe(290);expect(p.value.reward.items).toHaveLength(1);expect(p.value.reward.stacks).toEqual({'boss-proof':1});
 });
 it('preview shows the capped amounts actually received', () => {
  const state=R.createStarterAccount();state.daily.earned={...R.CARD_RPG_CONFIG.dailyCaps};state.daily.xpEarned=R.CARD_RPG_CONFIG.dailyXpCap;state.clearedChapters=['cafe-patrol'];
  const r=R.startBattle(state,11);if(!r.ok)throw Error();const b=play(r.value.battle),p=R.previewBattleRewards(r.state,b);if(!p.ok)throw Error();
  expect(p.value.reward.currencies).toEqual({});expect(p.value.reward.xp).toBe(0);const done=R.finishBattle(r.state,b);if(!done.ok)throw Error();expect(done.value).toEqual(p.value.reward);
 });
 it('freezes all equipped template identities and stable card identities for the renderer', () => {
  const s=R.createStarterAccount(),r=R.startBattle(s,5);if(!r.ok)throw Error();const c=r.value.battle.run.cardRpg!.cards.guardian;
  expect(c.cardId).toBe('mochi');expect(c.instanceId).toBe('mochi');expect(c.rarity).toBe('common');expect(c.itemIds).toEqual(['hearthloom-weapon-common','hearthloom-outfit-common']);
  s.inventory.items[0]!.itemId='moonwick-weapon-legendary';expect(c.itemIds![0]).toBe('hearthloom-weapon-common');
 });
 it('all five pantry supplies transfer once and replay with the same finite quantities', () => {
  const s=R.createStarterAccount();for(const id of Object.keys(R.CARD_RPG_CONFIG.supplies))s.inventory.stacks[id]=3;
  const r=R.startBattle(s,23);if(!r.ok)throw Error();for(const [id,v] of Object.entries(R.CARD_RPG_CONFIG.supplies))expect(r.state.inventory.stacks[id]).toBe(3-v.max);
  expect(r.value.battle.run.consumables).toEqual({healTonic:4,shieldBiscuit:4,quickenYarn:4,cleanseTea:4,ultimateTreat:2});
  const b=play(r.value.battle),replay=E.replayRun(r.value.options,b.run.commands);expect(replay.events).toEqual(b.events);
 });
});
