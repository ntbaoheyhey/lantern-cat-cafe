import {expect,it} from 'vitest';
import {createActionPlan} from '../../squad/turn3d/effects';
import {MOTIONS,actionPose,actionCamera,fitMotionFrame,bracePose,hitPose,idlePhase,idlePose} from './motion';
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
 expect(at(contact).zoom).toBeCloseTo(1.24);expect(at(contact+80)).toEqual(at(contact));
 const reverse=actionCamera({...input,elapsed:contact,side:'enemy',home:{...input.home,x:980},target:{...input.target,x:430}},'active');
 expect(reverse.x).toBeCloseTo(-at(contact).x);expect(reverse.zoom).toBe(at(contact).zoom);
 expect(actionCamera({...input,elapsed:contact},'ultimate')).toEqual(at(0));
});
it('fits an action shot without clipping the upper row or a returning actor',()=>{
 const width=1280,height=595,boxes=[{x:100,y:-35,width:140,height:170},{x:1000,y:460,width:130,height:150}];
 const fit=fitMotionFrame(boxes,width,height);
 for(const box of boxes){
  const x=width*.5+(box.x-width*.5)*fit.scale+fit.dx,y=height*.5+(box.y-height*.5)*fit.scale+fit.dy;
  expect(x).toBeGreaterThanOrEqual(12-1e-6);expect(x+box.width*fit.scale).toBeLessThanOrEqual(width-12+1e-6);
  expect(y).toBeGreaterThanOrEqual(height*.10-1e-6);expect(y+box.height*fit.scale).toBeLessThanOrEqual(height-10+1e-6);
 }
 expect(fitMotionFrame([{x:200,y:100,width:800,height:400}],width,height)).toEqual({scale:1,dx:0,dy:0});
});
it('leaves the ultimate plate camera intact and resolves the field shot through a long spoken release',()=>{
 const plan={...createActionPlan(events),duration:4670,ultimate:true};
 plan.beats=plan.beats.map((beat,i)=>i===2?{...beat,start:3200}:beat);
 const input={plan,asset:'mochi',side:'party',home:{x:300,y:400,core:150},target:{x:850,y:380,core:160},width:1280,height:720};
 const at=(elapsed:number)=>actionCamera({...input,elapsed},'ultimate');
 expect(at(3000)).toEqual(at(0));expect(at(3200)).toEqual(at(0));
 expect(at(3400).zoom).toBeCloseTo(1.2);expect(at(4000).zoom).toBeGreaterThan(1);
 expect(at(4670)).toEqual(at(0));
 const expected=at(4000);at(3400);expect(at(4000)).toEqual(expected);
});
it('finishes the landing squash before a long spoken recovery ends',()=>{
 const plan={...createActionPlan(events),duration:2000};
 const input={plan,asset:'soot',side:'party',home:{x:300,y:400,core:150},target:{x:850,y:380,core:160},width:1280,height:720};
 const impact=plan.beats[2]!.start;
 expect(actionPose({...input,elapsed:impact+390}).phase).toBe('land');
 expect(actionPose({...input,elapsed:impact+500})).toMatchObject({phase:'idle',x:0,y:0,angle:0,sx:1,sy:1});
});
it('keeps idle feet planted, phases independent and seeks deterministic',()=>{
 const sample=idlePose(12.5,'mochi');expect(sample).not.toEqual(idlePose(12.5,'soot'));
 for(let t=0;t<20;t+=.1){const p=idlePose(t,'mochi');expect(p.x).toBe(0);expect(p.y).toBe(0);expect(Math.abs(p.angle)).toBeLessThanOrEqual(.035);expect(Math.abs(p.sy-1)).toBeLessThanOrEqual(.01800001);}
 idlePose(1,'mochi');expect(idlePose(12.5,'mochi')).toEqual(sample);
});
it('mirrors every enemy archetype through travel, strike and recovery without changing timing',()=>{
 const plan=createActionPlan(events),before=JSON.stringify(plan),width=1280;
 const party={plan,asset:'mochi',side:'party',home:{x:300,y:400,core:150},target:{x:850,y:380,core:160},width,height:720};
 const enemy={...party,asset:'button-guard',side:'enemy',home:{...party.home,x:width-party.home.x},target:{...party.target,x:width-party.target.x}};
 for(const motion of MOTIONS){let peak=0;
  for(let elapsed=0;elapsed<=plan.duration;elapsed+=1000/30){
   const a=actionPose({...party,motion,elapsed}),b=actionPose({...enemy,motion,elapsed});
   expect(b.x).toBeCloseTo(-a.x);expect(b.y).toBeCloseTo(a.y);expect(b.angle).toBeCloseTo(-a.angle);expect(b.phase).toBe(a.phase);
   peak=Math.max(peak,Math.hypot(b.x,b.y));
  }
  expect(peak/width).toBeGreaterThan(.06);
  expect(actionPose({...enemy,motion,elapsed:plan.duration})).toMatchObject({x:0,y:0,sx:1,sy:1,angle:0});
 }
 expect(JSON.stringify(plan)).toBe(before);
});
it('gives every target of a simultaneous multi-target hit its own recoil and flash',()=>{
 const recipients=['front','rear','healer'];
 const plan=createActionPlan([events[0]!,...recipients.map(id=>({...events[1]!,targetIds:[id]}))]);
 for(const id of recipients){
  expect(hitPose(plan,plan.beats[2]!.start+33,id,1,720).flash).toBe(1);
  expect(hitPose(plan,plan.beats[2]!.start+67,id,1,720).x).toBeGreaterThanOrEqual(23);
  expect(hitPose(plan,plan.beats[2]!.start+400,id,1,720).x).toBe(0);
 }
});
it('braces actual recipients before contact without inventing a hit or moving bystanders',()=>{
 const plan=createActionPlan(events),before=JSON.stringify(plan),impact=plan.beats[2]!.start;
 const ready=bracePose(plan,impact-67,'enemy',1,720);
 expect(ready).toMatchObject({phase:'anticipation',x:8,flash:0});
 expect(bracePose(plan,impact-67,'enemy',-1,720).x).toBe(-8);
 expect(hitPose(plan,impact-67,'enemy',1,720).x).toBe(0);
 for(const elapsed of [impact-201,impact+100,plan.duration])expect(bracePose(plan,elapsed,'enemy',1,720)).toMatchObject({phase:'idle',x:0,angle:0});
 expect(bracePose(plan,impact-67,'bystander',1,720).x).toBe(0);
 const dot={...plan,events:plan.events.filter(e=>e.type!=='action_start')};
 expect(bracePose(dot,impact-67,'enemy',1,720).x).toBe(0);
 bracePose(plan,0,'enemy',1,720);expect(bracePose(plan,impact-67,'enemy',1,720)).toEqual(ready);
 expect(JSON.stringify(plan)).toBe(before);
});
