import {expect,it} from 'vitest';
import {ENEMIES} from '@taskbar-hero/game-rules/src/cardrpg/depth/catalog';
import {pilotFixture} from '../vfx-layered/fixture';
import {configureSequence,SEQUENCES,type CinematicMode} from './sequence';
import {audioTimeline,VOICE_TIMING} from './audio-timeline';
import {advanceBattleClock} from './final-hit';
import {reserveUltimateLeadIn} from './voice-windows';

it.each([1,2,3])('keeps the whole deferred wind-up and its spoken tracks in sync at ×%s',speed=>{
 const original=configureSequence(pilotFixture('mochi-4').plan),before=JSON.stringify(original);
 const plan=reserveUltimateLeadIn(original,1800);
 expect(JSON.stringify(original)).toBe(before);
 expect(plan.events).toBe(original.events);
 expect(plan.sequence!.impact).toBe(original.sequence!.impact+1800);
 expect(plan.beats[2]!.start).toBe(original.beats[2]!.start+1800);
 const beforeVoices=audioTimeline(original,original.sequence).filter(c=>c.role==='voice');
 const afterVoices=audioTimeline(plan,plan.sequence).filter(c=>c.role==='voice');
 expect(afterVoices.map(c=>c.t)).toEqual(beforeVoices.map(c=>c.t+1800));
 expect(advanceBattleClock(plan,0,1000,false,speed)).toBe(1000);
 const basic=configureSequence(pilotFixture('mochi-1').plan);
 expect(reserveUltimateLeadIn(basic,1800)).toBe(basic);
});

it.each([1,2,3])('finishes every required spoken take before the next voice or action at ×%s',speed=>{
 const ids=[...SEQUENCES.keys(),...ENEMIES.map(enemy=>`enemy:${enemy.id}`)];
 for(const id of new Set(ids))for(const mode of ['full','short','off'] as CinematicMode[]){
  const original=pilotFixture(id).plan,plan=configureSequence(original,mode);
  const voices=audioTimeline(plan,plan.sequence).filter(key=>key.role==='voice');
  let at=0,wall=0;const starts:number[]=[];
  while(at<plan.duration){
   at=advanceBattleClock(plan,at,1000/30,false,speed);wall+=1000/30;
   for(let i=0;i<voices.length;i++)if(starts[i]===undefined&&voices[i]!.t<=at)starts[i]=wall;
  }
  for(let i=0;i<voices.length;i++){
   const duration=VOICE_TIMING.find(take=>take.cueId===voices[i]!.cue)!.durationMs;
   expect((starts[i+1]??wall)-starts[i]!,`${id} ${mode} ${voices[i]!.cue}`).toBeGreaterThanOrEqual(duration);
  }
  expect(plan.events).toBe(original.events);
  expect(plan.beats.at(-1)!.start+plan.beats.at(-1)!.duration).toBe(plan.duration);
 }
});

it('preserves final-hit slow motion inside a spoken window and reduced-motion speech timing',()=>{
 const plan=configureSequence(pilotFixture('mochi-4').plan);
 const end=plan.voiceWindows!.at(-1)!;
 expect(advanceBattleClock(plan,end.start,500,true,3)).toBeCloseTo(end.start+500);
 const final={...plan,finalHit:true},start=plan.beats[2]!.start-80;
 expect(advanceBattleClock(final,start,500,false,3)).toBeCloseTo(start+200);
 expect(advanceBattleClock(final,start,500,true,3)).toBeGreaterThan(start+200);
});

it('keeps ordinary basic attacks at the selected speed and leaves the full-plate contact unchanged',()=>{
 const basic=configureSequence(pilotFixture('mochi-1').plan);
 expect(basic.voiceWindows).toBeUndefined();expect(advanceBattleClock(basic,100,100,false,3)).toBe(400);
 const ultimate=configureSequence(pilotFixture('mochi-4').plan);
 expect(ultimate.beats[2]!.start).toBe(3200);
 expect(ultimate.sequence!.plate).toMatchObject({start:950,end:3200});
});
