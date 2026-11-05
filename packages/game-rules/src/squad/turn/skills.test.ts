import { expect, it } from 'vitest';
import { createTurnBattle, startTurn, chooseAction, resolveAction, endTurn, getAutoAction, getLegalTargets } from './engine';
import { TURN_KITS } from './config';

it.each(Object.entries(TURN_KITS).flatMap(([hero,kit])=>kit.map(skill=>[hero,skill])))('%s resolves %s through the same public action API',(hero,skill)=>{
  const b=createTurnBattle({encounter:'group'});b.queue.sort((a,z)=>Number(z.actorId===hero)-Number(a.actorId===hero));
  const cat=b.actors.find(a=>a.id===hero)!;cat.charge=100;b.actors.filter(a=>a.side==='party').forEach(a=>a.hp-=80);
  startTurn(b);const t=getLegalTargets(b,skill!).find(t=>t.legal)!;expect(t).toBeDefined();
  expect(chooseAction(b,{actorId:hero!,skillId:skill!,targetId:t.actorId})).toBe(true);
  const events=resolveAction(b);expect(events.some(e=>e.type==='action_start'&&e.skillId===skill)).toBe(true);
  expect(events.some(e=>['damage','shield','heal','status_apply'].includes(e.type))).toBe(true);endTurn(b);
  expect(b.phase).toBe('ready');expect(new Set(b.queue.map(s=>s.actorId)).size).toBe(b.queue.length);
});

it('burn ticks only at the affected actor boundary and expires in owner turns',()=>{
  const b=createTurnBattle({encounter:'group'});const target=b.actors.find(a=>a.role==='guard')!;
  target.statuses.push({kind:'burn',source:'witch',turns:2,strength:1,appliedTurn:-1});
  const before=target.hp;for(let i=0;i<2;i++){
    b.queue.sort((a,z)=>Number(z.actorId===target.id)-Number(a.actorId===target.id));startTurn(b);
    const choice=getAutoAction(b)!;chooseAction(b,choice);resolveAction(b);endTurn(b);
  }
  expect(target.hp).toBeLessThan(before);expect(target.statuses.some(s=>s.kind==='burn')).toBe(false);
  expect(b.events.filter(e=>e.type==='damage'&&e.skillId==='burn')).toHaveLength(2);
});

it('stun loses exactly one intent and its control recovery prevents an immediate lock',()=>{
  const b=createTurnBattle({encounter:'boss'});const g=b.actors.find(a=>a.role==='guardian')!,boss=b.actors.find(a=>a.role==='yarn')!;
  b.queue.sort((a,z)=>Number(z.actorId===g.id)-Number(a.actorId===g.id));startTurn(b);
  chooseAction(b,{actorId:g.id,skillId:'shieldBash',targetId:boss.id});resolveAction(b);endTurn(b);
  b.queue.sort((a,z)=>Number(z.actorId===boss.id)-Number(a.actorId===boss.id));startTurn(b);expect(b.phase).toBe('resolved');endTurn(b);
  expect(boss.statuses.some(s=>s.kind==='stun')).toBe(false);expect(b.intents[boss.id]!.interrupted).toBe(false);expect(boss.controlCount).toBeGreaterThan(0);
});

it('newly applied guard lasts for two subsequent owner turns and shield expires with it',()=>{
  const b=createTurnBattle({encounter:'dummy'});b.queue.sort((a,z)=>Number(z.actorId==='guardian')-Number(a.actorId==='guardian'));startTurn(b);
  chooseAction(b,{actorId:'guardian',skillId:'rally',targetId:'guardian'});resolveAction(b);endTurn(b);
  const g=b.actors.find(a=>a.id==='guardian')!;expect(g.statuses.find(s=>s.kind==='guard')!.turns).toBe(2);
  for(let i=0;i<2;i++){b.queue.sort((a,z)=>Number(z.actorId==='guardian')-Number(a.actorId==='guardian'));startTurn(b);chooseAction(b,{actorId:'guardian',skillId:'guardianBasic',targetId:b.actors.find(a=>a.side==='enemy')!.id});resolveAction(b);endTurn(b);}
  expect(g.statuses.some(s=>s.kind==='guard')).toBe(false);expect(g.shield).toBe(0);
});
