import {expect,it} from 'vitest';
import {CATS,ENEMIES} from '@taskbar-hero/game-rules/src/cardrpg/depth/catalog';
import {pilotFixture} from '../vfx-layered/fixture';
import {configureSequence,sequenceAt,sequenceWorldTime,type CinematicMode} from './sequence';
import {audioTimeline} from './audio-timeline';
import {advanceBattleClock} from './final-hit';
import {reserveUltimateLeadIn} from './voice-windows';
it.each([1,2,3])('never lets an old speech lead-in move the fixed beat at ×%s',speed=>{
 const original=configureSequence(pilotFixture('mochi-4').plan),before=JSON.stringify(original);
 const plan=reserveUltimateLeadIn(original,1800);expect(plan).toBe(original);expect(JSON.stringify(original)).toBe(before);
 expect(plan.beats[2]!.start).toBe(1100);expect(plan.duration).toBe(2200);
 expect(audioTimeline(plan,plan.sequence)).toEqual(audioTimeline(original,original.sequence));
 expect(advanceBattleClock(plan,0,100,false,speed)).toBe(100*speed);
 expect(sequenceWorldTime(plan.sequence!,1000)).toBe(1000);expect(sequenceAt(plan,0)?.dim).toBe(.55);expect(sequenceAt(plan,800)?.dim).toBe(0);
 const basic=configureSequence(pilotFixture('mochi-1').plan);expect(reserveUltimateLeadIn(basic,1800)).toBe(basic);
});
it.each([1,2,3])('scales every live Basic and Ultimate uniformly at ×%s',speed=>{
 const ids=[...CATS.flatMap(c=>[`${c.id}-1`,`${c.id}-4`]),...ENEMIES.flatMap(e=>[`enemy:${e.id}`,`enemy:${e.id}:basic`])];
 for(const id of ids)for(const mode of ['full','short','off'] as CinematicMode[]){
  const original=pilotFixture(id).plan,plan=configureSequence(original,mode),voices=audioTimeline(plan,plan.sequence).filter(k=>k.role==='voice');
  expect(voices.length).toBeLessThanOrEqual(plan.ultimate?1:0);expect(voices.every(v=>v.t===0)).toBe(true);
  let at=0,wall=0;while(at<plan.duration){at=advanceBattleClock(plan,at,1000/30,false,speed);wall+=1000/30;}
  expect(Math.abs(wall-plan.duration/speed)).toBeLessThanOrEqual(1000/30+.001);
  expect(plan.events).toBe(original.events);expect(plan.beats.at(-1)!.start+plan.beats.at(-1)!.duration).toBeCloseTo(plan.duration);
 }
});
it('keeps final hits and reduced motion on the same fixed clock',()=>{
 const plan=configureSequence(pilotFixture('mochi-4').plan),start=plan.beats[2]!.start-80;
 for(const reduced of [false,true])for(const finalHit of [false,true])expect(advanceBattleClock({...plan,finalHit},start,100,reduced,3)).toBe(start+300);
});
it('keeps basic and ultimate contact fixed with no plate or speech windows',()=>{
 const basic=configureSequence(pilotFixture('mochi-1').plan);expect(basic.voiceWindows).toEqual([]);expect(advanceBattleClock(basic,100,100,false,3)).toBe(400);
 const ultimate=configureSequence(pilotFixture('mochi-4').plan);expect(ultimate.beats[2]!.start).toBe(1100);expect(ultimate.sequence!.plate).toBeUndefined();expect(ultimate.speechLeadInMs).toBe(0);
});
