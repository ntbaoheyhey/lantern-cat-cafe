import {expect,it} from 'vitest';
import {pilotFixture} from '../vfx-layered/fixture';
import {configureSequence} from './sequence';
import {sampleActionPlan} from '../../squad/turn3d/effects';
import {GROUND_BURST_CAP,GROUND_DUST_MS,GROUND_PUFFS,GroundImpacts,sampleDustPuff,type GroundPoint} from './ground-impact';

function fixture(id='panko-1'){
 const plan=configureSequence(pilotFixture(id).plan),ground=new GroundImpacts();
 const points=new Map<string,GroundPoint>(plan.events.flatMap(e=>e.targetIds).map(id=>[id,{x:400,y:300,scale:1}]));
 const at=(age:number,reduced=false)=>ground.sample(sampleActionPlan(plan,plan.beats[2]!.start+age,reduced),reduced,points);
 return {plan,ground,points,at};
}
it('emits once at contact, holds the ground during recoil and expires on the action clock',()=>{
 const {at,points}=fixture();expect(at(-1)).toHaveLength(0);
 const bursts=at(0),first={...bursts[0]!};expect(first.age).toBe(0);expect(bursts.length).toBeGreaterThan(0);
 for(const point of points.values()){point.x+=90;point.y-=40;}
 expect(at(120)).toBe(bursts);expect(bursts[0]).toMatchObject({...first,age:120});
 expect(at(120)).toHaveLength(new Set(bursts.map(b=>b.id)).size);
 expect(at(GROUND_DUST_MS)).toHaveLength(0);expect(at(GROUND_DUST_MS+10)).toHaveLength(0);
});
it('replays a rewind and clears between actions without carrying stale recipients',()=>{
 const {at,ground,plan,points}=fixture();const initial=structuredClone(at(70));
 at(400);expect(at(-1)).toHaveLength(0);expect(at(70)).toEqual(initial);
 ground.sample(null,false,points);expect(ground.bursts).toHaveLength(0);
 const next={...plan,events:[]};ground.sample(sampleActionPlan(next,plan.beats[2]!.start,false),false,points);
 expect(ground.bursts).toHaveLength(0);
});
it('suppresses reduced motion, healing and shield casts including retaliation',()=>{
 for(const id of ['clover-1','clover-4','enemy:teacup-healer','enemy:teacup-healer:basic'])expect(fixture(id).at(0)).toHaveLength(0);
 const {at}=fixture();expect(at(0,true)).toHaveLength(0);expect(at(40,true)).toHaveLength(0);
 const support=fixture('clover-1'),damage=fixture().plan.events.find(e=>e.type==='damage')!;
 support.plan.events.push({...damage,actorId:'retaliation'});expect(support.at(0)).toHaveLength(0);
});
it('deduplicates multihits, skips zero damage/missing contacts and caps area attacks',()=>{
 const {at,plan,points}=fixture(),damage=plan.events.find(e=>e.type==='damage')!;
 plan.events=Array.from({length:30},(_,i)=>({...damage,targetIds:['unit-'+i],amount:i?20:0}));
 plan.events.push({...damage,targetIds:['unit-1']});
 for(let i=0;i<30;i++)if(i!==2)points.set('unit-'+i,{x:i*10,y:300,scale:i?4:.1});
 const bursts=at(0);expect(bursts).toHaveLength(GROUND_BURST_CAP);
 expect(new Set(bursts.map(b=>b.id)).size).toBe(GROUND_BURST_CAP);
 expect(bursts.some(b=>b.id==='unit-0'||b.id==='unit-2')).toBe(false);
 expect(bursts.every(b=>b.scale<=1.5)).toBe(true);
});
it('keeps deterministic puffs beneath the body and bounded throughout dissipation',()=>{
 const out={x:0,y:0,rx:0,ry:0,alpha:0};
 for(let age=0;age<=GROUND_DUST_MS;age+=10)for(let i=0;i<GROUND_PUFFS;i++){
  expect(sampleDustPuff(age,i,out)).toBe(out);expect(Math.abs(out.x)).toBeLessThanOrEqual(34);
  expect(out.y).toBeGreaterThanOrEqual(-12);expect(out.y).toBeLessThanOrEqual(0);
  expect(out.alpha).toBeGreaterThanOrEqual(0);expect(out.alpha).toBeLessThanOrEqual(.58);
 }
 expect(out.alpha).toBe(0);
});
