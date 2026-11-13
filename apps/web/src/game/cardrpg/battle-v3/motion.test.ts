import {expect,it} from 'vitest';
import {createActionPlan} from '../../squad/turn3d/effects';
import {MOTIONS,actionPose,actionCamera,hitPose,idlePhase} from './motion';
import type {TurnEvent} from '@taskbar-hero/game-rules/src/squad/turn/types';
const events=[{type:'action_start',actorId:'cat',targetIds:['enemy'],skillId:'guardianBasic',actionId:1},{type:'damage',actorId:'cat',targetIds:['enemy'],amount:12,skillId:'guardianBasic',actionId:1}] as TurnEvent[];
it('moves every archetype through anticipation, strike, return without mutating the event plan',()=>{
 const plan=createActionPlan(events),before=JSON.stringify(plan),input={plan,asset:'mochi',side:'party',home:{x:300,y:400,core:150},target:{x:850,y:380,core:160},width:1280,height:720};
 for(const motion of MOTIONS){const poses=Array.from({length:Math.ceil(plan.duration/16)+1},(_,i)=>actionPose({...input,elapsed:Math.min(i*16,plan.duration),motion}));
  expect(Math.max(...poses.map(p=>Math.hypot(p.x,p.y)))).toBeGreaterThan(1280*.06);
  expect(poses.at(-1)).toMatchObject({x:0,y:0,sx:1,sy:1,angle:0});
  for(const phase of ['anticipation','travel','strike','return'])expect(poses.some(p=>p.phase===phase)).toBe(true);
 }
 expect(JSON.stringify(plan)).toBe(before);
});
it('reacts to actual damage recipients, including counter-damage, and settles exactly',()=>{
 const plan=createActionPlan([...events,{...events[1]!,actorId:'enemy',targetIds:['cat'],critical:true}]);const t=plan.beats[2]!.start;
 expect(hitPose(plan,t+67,'enemy',1,720).x).toBeGreaterThanOrEqual(23);
 expect(hitPose(plan,t+67,'cat',-1,720).x).toBeLessThanOrEqual(-29);
 expect(hitPose(plan,t+33,'enemy',1,720).flash).toBe(1);
 expect(hitPose(plan,t+400,'enemy',1,720)).toMatchObject({x:0,y:0,angle:0,flash:0});
 expect(hitPose(plan,t+33,'other',1,720).x).toBe(0);
});
it('lands at the hero spot before the cut-in and seeks identically in reverse order',()=>{
 const plan={...createActionPlan(events),ultimate:true},input={plan,asset:'soot',side:'party',home:{x:250,y:400,core:150},target:{x:850,y:400,core:160},width:1280,height:720};
 const expected=actionPose({...input,elapsed:150});expect(expected.x).toBeCloseTo(1280*.48-250);
 actionPose({...input,elapsed:plan.duration-30});expect(actionPose({...input,elapsed:150})).toEqual(expected);
 expect(idlePhase('cat')).not.toBe(idlePhase('enemy'));
});
it('holds the camera through contact, restores framing, and mirrors enemy attacks',()=>{
 const plan=createActionPlan(events),input={plan,asset:'mochi',side:'party',home:{x:300,y:400,core:150},target:{x:850,y:380,core:160},width:1280,height:720};
 const at=(elapsed:number)=>actionCamera({...input,elapsed},'active'),contact=plan.beats[2]!.start;
 expect(at(0)).toEqual({zoom:1,x:0,y:0,tilt:0});expect(at(plan.duration)).toEqual(at(0));
 expect(at(contact).zoom).toBeCloseTo(1.18);expect(at(contact+80)).toEqual(at(contact));
 const reverse=actionCamera({...input,elapsed:contact,side:'enemy',home:{...input.home,x:980},target:{...input.target,x:430}},'active');
 expect(reverse.x).toBeCloseTo(-at(contact).x);expect(reverse.zoom).toBe(at(contact).zoom);
 expect(actionCamera({...input,elapsed:contact},'ultimate')).toEqual(at(0));
});
