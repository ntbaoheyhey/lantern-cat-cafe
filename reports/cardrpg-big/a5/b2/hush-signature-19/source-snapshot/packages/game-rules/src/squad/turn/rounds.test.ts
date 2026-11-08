import { describe, expect, it } from 'vitest';
import { createTurnBattle, getTimeline, startTurn, endTurn, chooseAction, resolveAction, delayActor, advanceActor } from './engine';
import { orderForRound } from './rounds';
import { openRound } from './test-support';

describe('explicit shared rounds', () => {
  it.each([1, 11, 89, 721])('every living participant acts exactly once per round, seed %i', seed => {
    const b=createTurnBattle({seed,encounter:'group'});b.actors.forEach(a=>a.attack=1);
    const expected=b.actors.map(a=>a.id).sort();openRound(b,4);
    for(const round of [1,2,3]) expect(b.events.filter(e=>e.type==='turn_start'&&e.round===round).map(e=>e.actorId).sort()).toEqual(expected);
    expect(b.actors.every(a=>Number.isInteger(a.initiative))).toBe(true);
  });
  it('exposes precisely the remaining current round and the complete next order',()=>{
    const b=createTurnBattle({encounter:'group'}), count=b.actors.length;startTurn(b);
    const before=JSON.stringify(b), preview=getTimeline(b);
    expect(preview.filter(s=>s.round===1)).toHaveLength(count);
    expect(preview.filter(s=>s.round===2)).toHaveLength(count);
    expect(preview[0]!.actorId).toBe(b.activeId);expect(JSON.stringify(b)).toBe(before);
  });
  it('push back changes only this round, and cannot duplicate the active action',()=>{
    const b=createTurnBattle({encounter:'group'});startTurn(b);
    const next=orderForRound(b,2), id=b.queue[0]!.actorId;
    delayActor(b,id,2);expect(b.queue[2]!.actorId).toBe(id);
    expect(orderForRound(b,2)).toEqual(next);
    const before=JSON.stringify(b);delayActor(b,b.activeId!,8);advanceActor(b,b.activeId!,8);expect(JSON.stringify(b)).toBe(before);
  });
  it('Quicken is capped once per recipient per round and never adds actions',()=>{
    const b=createTurnBattle({encounter:'group'}), id=b.queue.at(-1)!.actorId, count=b.queue.length;
    advanceActor(b,id,1);const before=JSON.stringify(b);advanceActor(b,id,1);
    expect(JSON.stringify(b)).toBe(before);expect(b.queue).toHaveLength(count);
    expect(new Set(b.queue.map(s=>s.actorId)).size).toBe(count);
  });
  it('a defeated actor disappears from this and next round immediately',()=>{
    const b=createTurnBattle();startTurn(b);const victim=b.actors.find(a=>a.side==='enemy')!;victim.hp=1;
    chooseAction(b,{actorId:b.activeId!,skillId:'guardianBasic',targetId:victim.id});resolveAction(b);
    expect(getTimeline(b).some(s=>s.actorId===victim.id)).toBe(false);
  });
  it('a Binding Thread advertises its first action next round',()=>{
    const b=createTurnBattle({encounter:'boss'}), boss=b.actors.find(a=>a.role==='yarn')!;
    b.queue.sort((a,z)=>Number(z.actorId===boss.id)-Number(a.actorId===boss.id));
    Object.assign(b.intents[boss.id]!,{skillId:'bindThread',targetId:'witch',targetIds:['witch']});startTurn(b);
    chooseAction(b,{actorId:boss.id,skillId:'bindThread',targetId:'witch'});resolveAction(b);endTurn(b);
    const thread=b.actors.find(a=>a.role==='thread')!;
    expect(b.queue.some(s=>s.actorId===thread.id)).toBe(false);
    expect(getTimeline(b).filter(s=>s.actorId===thread.id).map(s=>s.round)).toEqual([2]);
    expect(b.intents[thread.id]!.countdown).toBe(1);
  });
  it('tied Initiative ranks use seed and stable IDs without consuming random state',()=>{
    const b=createTurnBattle({encounter:'group',seed:42});b.actors.forEach(a=>a.initiative=5);
    const rng=b.rng;expect(orderForRound(b)).toEqual(orderForRound(JSON.parse(JSON.stringify(b))));expect(b.rng).toBe(rng);
    expect(orderForRound({...b,seed:99})).not.toEqual(orderForRound(b));
  });
});
