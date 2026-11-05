import { expect, it } from 'vitest';
import { createTurnBattle, startTurn, chooseAction, resolveAction, endTurn, getAutoAction, getLegalTargets } from './engine';
import { TURN_KITS } from './config';
import { openRound } from './test-support';

it.each(Object.entries(TURN_KITS).flatMap(([hero,kit])=>kit.map(skill=>[hero,skill])))('%s resolves %s through the same public action API',(hero,skill)=>{
  const b=createTurnBattle({encounter:'group'});b.queue.sort((a,z)=>Number(z.actorId===hero)-Number(a.actorId===hero));
  const cat=b.actors.find(a=>a.id===hero)!;cat.charge=100;b.actors.filter(a=>a.side==='party').forEach(a=>a.hp-=80);
  startTurn(b);const t=getLegalTargets(b,skill!).find(t=>t.legal)!;expect(t).toBeDefined();
  expect(chooseAction(b,{actorId:hero!,skillId:skill!,targetId:t.actorId})).toBe(true);
  const events=resolveAction(b);expect(events.some(e=>e.type==='action_start'&&e.skillId===skill)).toBe(true);
  expect(events.some(e=>['damage','shield','heal','status_apply'].includes(e.type))).toBe(true);endTurn(b);
  expect(b.phase).toBe('ready');expect(new Set(b.queue.map(s=>s.actorId)).size).toBe(b.queue.length);
});

it('burn ticks once per round at the affected opening and expires at a round boundary',()=>{
  const b=createTurnBattle({encounter:'group'});b.actors.forEach(a=>a.attack=1);
  const target=b.actors.find(a=>a.role==='guard')!;
  target.statuses.push({kind:'burn',source:'witch',rounds:2,strength:1,appliedRound:0});
  openRound(b,3);
  expect(target.statuses.some(s=>s.kind==='burn')).toBe(false);
  const hits=b.events.filter(e=>e.type==='damage'&&e.skillId==='burn');
  expect(hits).toHaveLength(2);expect(hits.map(e=>e.round)).toEqual([1,2]);
});

it('stun loses exactly one intent and its control recovery prevents an immediate lock',()=>{
  const b=createTurnBattle({encounter:'boss'});const g=b.actors.find(a=>a.role==='guardian')!,boss=b.actors.find(a=>a.role==='yarn')!;
  b.queue.sort((a,z)=>Number(z.actorId===g.id)-Number(a.actorId===g.id));startTurn(b);
  chooseAction(b,{actorId:g.id,skillId:'shieldBash',targetId:boss.id});resolveAction(b);endTurn(b);
  b.queue.sort((a,z)=>Number(z.actorId===boss.id)-Number(a.actorId===boss.id));startTurn(b);expect(b.phase).toBe('resolved');endTurn(b);
  expect(boss.statuses.some(s=>s.kind==='stun')).toBe(false);expect(b.intents[boss.id]!.interrupted).toBe(false);expect(boss.controlCount).toBeGreaterThan(0);
});

it('new guard and shield retain two full subsequent rounds regardless of actor order',()=>{
  const b=createTurnBattle({encounter:'dummy'});b.actors.forEach(a=>a.attack=1);startTurn(b);
  chooseAction(b,{actorId:'guardian',skillId:'rally',targetId:'guardian'});resolveAction(b);endTurn(b);
  const g=b.actors.find(a=>a.id==='guardian')!;
  openRound(b,2);expect(g.statuses.find(s=>s.kind==='guard')!.rounds).toBe(2);expect(g.shield).toBeGreaterThan(0);
  openRound(b,3);expect(g.statuses.find(s=>s.kind==='guard')!.rounds).toBe(1);
  openRound(b,4);expect(g.statuses.some(s=>s.kind==='guard')).toBe(false);expect(g.shield).toBe(0);
});
