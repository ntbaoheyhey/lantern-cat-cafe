import { expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { TurnPresenter } from './presenter';
import { EFFECT_REGISTRY, createActionPlan, sampleActionPlan } from './effects';
import { createTurnBattle, startTurn, getAutoAction, chooseAction, resolveAction, endTurn } from '@taskbar-hero/game-rules/src/squad/turn/engine';
import { TURN_SKILLS } from '@taskbar-hero/game-rules/src/squad/turn/config';
const fixture=()=>{const b=createTurnBattle();startTurn(b);const initial=b.events.slice();chooseAction(b,getAutoAction(b)!);const events=resolveAction(b);endTurn(b);return {b,initial,events,rest:b.events.slice(initial.length)};};
it('all skill ids and lifecycle effects have five intentional beats',()=>{
  for(const id of [...Object.keys(TURN_SKILLS),'steadfast','warmWick','lastSip','status_apply','status_expire','death','wave_clear','victory']){const r=EFFECT_REGISTRY[id];expect(r,id).toBeDefined();expect(r!.duration).toHaveLength(5);expect(r!.duration.every(t=>t>=40)).toBe(true);}
});
it('records complete anticipation, travel, impact, reaction and residue',()=>{
  const {events}=fixture();const p=createActionPlan(events);expect(p.beats.map(b=>b.kind)).toEqual(['anticipation','travel','impact','reaction','residue']);
  for(const b of p.beats)expect(sampleActionPlan(p,b.start+b.duration/2).beat.kind).toBe(b.kind);
});
it('does not leak future HP before the impact beat',()=>{
  const {initial,events}=fixture(),p=new TurnPresenter();p.push(initial);while(p.busy)p.skip();const hp=p.state.actors.map(a=>a.hp);
  p.push(events);const impact=p.frame!.plan.beats[2]!.start;p.tick(impact-1);expect(p.state.actors.map(a=>a.hp)).toEqual(hp);
  p.tick(2);expect(p.state.actors.map(a=>a.hp)).not.toEqual(hp);
});
it('consumes a recorded fight in event order and projects its final snapshot',()=>{
  const b=createTurnBattle({encounter:'patrol'});const p=new TurnPresenter();p.push(b.events);let read=b.events.length;
  for(let i=0;i<100&&!b.result;i++){startTurn(b);if(b.phase==='choose'){chooseAction(b,getAutoAction(b)!);resolveAction(b);}endTurn(b);p.push(b.events.slice(read));read=b.events.length;p.tick(100000);}
  expect(p.appliedSeq).toBe(b.events.length-1);expect(p.state.actors).toEqual(b.actors);expect(p.state.result).toEqual(b.result);expect(p.busy).toBe(false);
});
it('skip, duplicate batches, huge deltas and speed never duplicate events',()=>{
  const {initial,rest,b}=fixture(),p=new TurnPresenter();p.reset(initial);p.push(rest);p.push(rest);p.speed=4;p.fast=true;
  while(p.busy)p.skip();expect(p.appliedSeq).toBe(b.events.length-1);expect(p.recent.map(e=>e.seq)).toEqual([...new Set(p.recent.map(e=>e.seq))]);
  const seq=p.appliedSeq;p.tick(1e8);p.skip();expect(p.appliedSeq).toBe(seq);
});
it('pause freezes, reset discards leftovers, gaps reject instead of corrupting projection',()=>{
  const {initial,events}=fixture(),p=new TurnPresenter();p.reset(initial);p.push(events);p.paused=true;const f=p.frame!.elapsed;p.tick(1000);expect(p.frame!.elapsed).toBe(f);
  p.reset();expect(p.busy).toBe(false);expect(p.state.actors).toEqual([]);expect(()=>p.push(events)).toThrow('Event gap');
});
it('reduced motion removes camera, shake and flash without dropping beats',()=>{
  const plan=createActionPlan(fixture().events);for(const b of plan.beats){const f=sampleActionPlan(plan,b.start+1,true);expect([f.camera,f.shake,f.flash]).toEqual([0,0,0]);expect(f.color).toBe(plan.color);}
});
it('presenter production source cannot import the rules engine or inspect a battle',()=>{
  const source=readFileSync('src/game/squad/turn3d/presenter.ts','utf8');expect(source).not.toMatch(/from ['"].*(?:engine|config|policy|targeting)/);expect(source).not.toMatch(/\bTurnBattle\b|\.battle\b/);
});
