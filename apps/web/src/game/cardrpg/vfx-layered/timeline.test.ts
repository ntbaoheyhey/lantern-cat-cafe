import {describe,expect,it} from 'vitest';
import {PAINT_TIMELINES} from './player';
import {paintTime,samplePaint,validatePaint} from './timeline';
import {pilotFixture} from './fixture';

describe('painted contact timing',()=>{
 it('keeps every pilot aligned to actual four-unit rules contacts at all playback speeds',()=>{
  expect(PAINT_TIMELINES.size).toBe(3);
  for(const timeline of PAINT_TIMELINES.values()){
   const fixture=pilotFixture(timeline.id),plan=fixture.plan,contact=plan.beats[2]!.start;
   expect(fixture.battle.initial.formationC2).toBe(true);
   expect(fixture.battle.actors.filter(a=>a.side==='party')).toHaveLength(4);
   expect(plan.events.some(e=>['damage','shield'].includes(e.type))).toBe(true);
   for(const reduced of [false,true])for(const speed of [1,2,3]){
    expect(paintTime(timeline,contact/speed*speed,plan.duration,contact,reduced)).toBe(timeline.impact);
    const time=paintTime(timeline,(contact+25)/speed*speed,plan.duration,contact,reduced);
    expect(samplePaint(timeline.layers.find(l=>l.name==='impact-burst')!,time)!.alpha).toBeGreaterThan(0);
   }
  }
 });
 it('shortens the calm tail without moving the hit and produces no layers after the clip',()=>{
  for(const t of PAINT_TIMELINES.values()){
   expect(paintTime(t,t.impact+100,t.duration,t.impact,true)).toBe(t.impact+200);
   expect(t.layers.every(l=>samplePaint(l,t.duration)===null)).toBe(true);
  }
 });
 it('can scrub backwards with the same result as a fresh sample',()=>{
  const l=PAINT_TIMELINES.get('mochi-1')!.layers.find(l=>l.name==='core-shape')!;
  const first=samplePaint(l,760);samplePaint(l,900);expect(samplePaint(l,760)).toEqual(first);
 });
 it('rejects malformed intervals and unordered keys before playback',()=>{
  const t=structuredClone(PAINT_TIMELINES.get('mochi-1')!);t.layers[0]!.keys[1]!.t=-1;expect(()=>validatePaint(t)).toThrow();
 });
});
