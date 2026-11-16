import {expect,it} from 'vitest';
import {createActionPlan} from '../../squad/turn3d/effects';
import {configureSequence} from './sequence';
import {MOTIONS,actionPose,actionCamera,fitMotionFrame,bracePose,hitPose,idlePhase,idlePose} from './motion';
import type {TurnEvent} from '@taskbar-hero/game-rules/src/squad/turn/types';
const events=[{type:'action_start',actorId:'cat',targetIds:['enemy'],skillId:'guardianBasic',actionId:1},{type:'damage',actorId:'cat',targetIds:['enemy'],amount:12,skillId:'guardianBasic',actionId:1}] as TurnEvent[];
const fixture=(ultimate=false)=>({plan:configureSequence({...createActionPlan(events),ultimate}),asset:'mochi',side:'party',home:{x:300,y:400,core:150},target:{x:850,y:380,core:160},width:1280,height:720});
it('holds the caster in its slot during focus and ignores archived walk-up metadata',()=>{
 const input=fixture(true);Object.assign(input.plan,{speechLeadInMs:1800});
 for(const elapsed of [0,300,599,600,900,1100,1800,2200]){expect(actionPose({...input,elapsed})).toMatchObject({x:0,y:0});expect(actionCamera({...input,elapsed},'ultimate')).toEqual({zoom:1,x:0,y:0,tilt:0});}
 expect(actionPose({...input,elapsed:300}).phase).toBe('idle');
});
it('keeps every archetype planted with readable weight changes and an exact return',()=>{
 const input=fixture(),before=JSON.stringify(input.plan);
 for(const motion of MOTIONS){const poses=Array.from({length:25},(_,i)=>actionPose({...input,elapsed:i*1000/30,motion}));
  expect(Math.max(...poses.map(p=>Math.hypot(p.x,p.y)))).toBeLessThanOrEqual(input.width*.05);
  expect(poses.some(p=>Math.abs(p.sy-1)>.03)).toBe(true);expect(actionPose({...input,motion,elapsed:800})).toMatchObject({x:0,y:0,sx:1,sy:1,angle:0});
  for(const phase of ['anticipation','strike','return'])expect(poses.some(p=>p.phase===phase)).toBe(true);
 }expect(JSON.stringify(input.plan)).toBe(before);
});
it('reacts to actual damage recipients, including counter-damage, and settles exactly',()=>{
 const plan=configureSequence(createActionPlan([...events,{...events[1]!,actorId:'enemy',targetIds:['cat'],critical:true}])),t=plan.beats[2]!.start;
 expect(hitPose(plan,t+67,'enemy',1,720).x).toBe(9);expect(hitPose(plan,t+67,'cat',-1,720).x).toBe(-9.5);
 expect(hitPose(plan,t+33,'enemy',1,720).flash).toBe(1);expect(hitPose(plan,t+400,'enemy',1,720)).toMatchObject({x:0,y:0,angle:0,flash:0});expect(hitPose(plan,t+33,'other',1,720).x).toBe(0);
});
it('seeks an ultimate identically in reverse order without a hero-spot approach',()=>{
 const input=fixture(true),expected=actionPose({...input,elapsed:900});expect(expected).toMatchObject({x:0,y:0});
 actionPose({...input,elapsed:2100});expect(actionPose({...input,elapsed:900})).toEqual(expected);expect(idlePhase('cat')).not.toBe(idlePhase('enemy'));
});
it('holds a bounded reflected hit for75ms, settles once, and leaves damage unchanged',()=>{
 const plan=configureSequence(createActionPlan([...events,{...events[1]!,actorId:'enemy',targetIds:['cat'],critical:true}]));
 const before=JSON.stringify(plan),impact=plan.beats[2]!.start;
 for(const height of [720,900]){
  const contact=hitPose(plan,impact,'cat',-1,height);
  expect(Math.abs(contact.x)).toBeGreaterThanOrEqual(6);expect(Math.abs(contact.x)).toBeLessThanOrEqual(12);
  for(const age of [0,1000/30,2000/30,75])expect(hitPose(plan,impact+age,'cat',-1,height).x).toBe(contact.x);
  expect(hitPose(plan,impact+150,'cat',-1,height).x).toBeGreaterThan(contact.x);
  expect(hitPose(plan,impact+300,'cat',-1,height)).toMatchObject({x:0,y:0,flash:0});
 }
 expect(hitPose(plan,impact+33,'cat',-1,720).flash).toBe(1);
 expect(hitPose(plan,impact+2000/30,'cat',-1,720).flash).toBe(0);
 const repeated={...plan,events:[...plan.events,plan.events.at(-1)!]};
 expect(hitPose(repeated,impact+100,'cat',-1,720)).toEqual(hitPose(plan,impact+100,'cat',-1,720));
 const zero={...plan,events:plan.events.map(e=>e.type==='damage'?{...e,amount:0}:e)};
 expect(hitPose(zero,impact+33,'cat',-1,720)).toMatchObject({x:0,y:0,flash:0});
 expect(JSON.stringify(plan)).toBe(before);
});
it('keeps both side cameras fixed before, during and after contact',()=>{
 const input=fixture();for(const side of ['party','enemy'])for(let elapsed=0;elapsed<=800;elapsed+=20)for(const tier of ['basic','active','ultimate'] as const)expect(actionCamera({...input,side,elapsed},tier)).toEqual({zoom:1,x:0,y:0,tilt:0});
});
it('never reframes the stage to follow a moving or clipped actor',()=>{
 for(const boxes of [[{x:100,y:-35,width:140,height:170},{x:1000,y:460,width:130,height:150}],[{x:200,y:100,width:800,height:400}]])expect(fitMotionFrame(boxes,1280,595)).toEqual({scale:1,dx:0,dy:0});
});
it('keeps archived spoken-release metadata from changing the fixed camera',()=>{
 const input=fixture(true);Object.assign(input.plan,{speechLeadInMs:4000,voiceWindows:[{start:0,end:8000}]});
 for(const elapsed of [0,600,1100,2200,4000,8000])expect(actionCamera({...input,elapsed},'ultimate')).toEqual({zoom:1,x:0,y:0,tilt:0});
});
it('finishes basic weight recovery within its 800 ms action',()=>{
 const input=fixture();expect(actionPose({...input,elapsed:700}).phase).toBe('return');expect(actionPose({...input,elapsed:800})).toMatchObject({phase:'idle',x:0,y:0,angle:0,sx:1,sy:1});
});
it('keeps idle feet planted, phases independent and seeks deterministic',()=>{
 const sample=idlePose(12.5,'mochi');expect(sample).not.toEqual(idlePose(12.5,'soot'));
 for(let t=0;t<20;t+=.1){const p=idlePose(t,'mochi');expect(p.x).toBe(0);expect(p.y).toBe(0);expect(Math.abs(p.angle)).toBeLessThanOrEqual(.064);expect(Math.abs(p.sy-1)).toBeLessThanOrEqual(.02800001);}
 idlePose(1,'mochi');expect(idlePose(12.5,'mochi')).toEqual(sample);
});
it('mirrors enemy poses while retaining the same timing and bounded displacement',()=>{
 const party=fixture(),enemy={...party,asset:'button-guard',side:'enemy',home:{...party.home,x:980},target:{...party.target,x:430}},before=JSON.stringify(party.plan);
 for(const motion of MOTIONS)for(let elapsed=0;elapsed<=800;elapsed+=1000/30){const a=actionPose({...party,motion,elapsed}),b=actionPose({...enemy,motion,elapsed});expect(b.x).toBeCloseTo(-a.x);expect(b.y).toBeCloseTo(a.y);expect(b.angle).toBeCloseTo(-a.angle);expect(b.phase).toBe(a.phase);expect(Math.hypot(b.x,b.y)).toBeLessThanOrEqual(1280*.05);}
 expect(JSON.stringify(party.plan)).toBe(before);
});
it('gives every simultaneous damage recipient its own recoil and flash',()=>{
 const recipients=['front','rear','healer'],plan=configureSequence(createActionPlan([events[0]!,...recipients.map(id=>({...events[1]!,targetIds:[id]}))]));
 for(const id of recipients){expect(hitPose(plan,383,id,1,720).flash).toBe(1);expect(hitPose(plan,417,id,1,720).x).toBe(9);expect(hitPose(plan,750,id,1,720).x).toBe(0);}
});
it('braces actual recipients without inventing a hit or moving bystanders',()=>{
 const plan=fixture().plan,before=JSON.stringify(plan),impact=plan.beats[2]!.start,ready=bracePose(plan,impact-67,'enemy',1,720);
 expect(ready).toMatchObject({phase:'anticipation',x:8,flash:0});expect(bracePose(plan,impact-67,'enemy',-1,720).x).toBe(-8);expect(hitPose(plan,impact-67,'enemy',1,720).x).toBe(0);
 for(const elapsed of [impact-201,impact+100,plan.duration])expect(bracePose(plan,elapsed,'enemy',1,720)).toMatchObject({phase:'idle',x:0,angle:0});
 expect(bracePose(plan,impact-67,'bystander',1,720).x).toBe(0);const dot={...plan,events:plan.events.filter(e=>e.type!=='action_start')};expect(bracePose(dot,impact-67,'enemy',1,720).x).toBe(0);bracePose(plan,0,'enemy',1,720);expect(bracePose(plan,impact-67,'enemy',1,720)).toEqual(ready);expect(JSON.stringify(plan)).toBe(before);
});
