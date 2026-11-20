import {describe,expect,it} from 'vitest';
import {PAINT_TIMELINES} from './player';
import {paintTime,samplePaint,validatePaint} from './timeline';
import {pilotFixture} from './fixture';

describe('painted contact timing',()=>{
 it('reserves ultimate focus and retimes the complete cast without moving contact',()=>{
  for(const timeline of PAINT_TIMELINES.values())for(const reduced of [false,true]){
   for(const at of [0,200,599]){
    const time=paintTime(timeline,at,2200,1100,reduced,600);
    expect(timeline.layers.every(layer=>samplePaint(layer,time)===null)).toBe(true);
   }
   expect(paintTime(timeline,600,2200,1100,reduced,600)).toBe(0);
   expect(paintTime(timeline,850,2200,1100,reduced,600)).toBe(timeline.impact/2);
   expect(paintTime(timeline,1100,2200,1100,reduced,600)).toBe(timeline.impact);
   const end=paintTime(timeline,2200,2200,1100,reduced,600);
   expect(timeline.layers.every(layer=>samplePaint(layer,end)===null)).toBe(true);
  }
 });
 it('keeps every pilot aligned to actual four-unit rules contacts at all playback speeds',()=>{
  expect(PAINT_TIMELINES.size).toBeGreaterThanOrEqual(3);
  for(const timeline of PAINT_TIMELINES.values()){
   const fixture=pilotFixture(timeline.id,false,true),plan=fixture.plan,contact=plan.beats[2]!.start;
   expect(fixture.battle.initial.formationC2).toBe(true);
   expect(fixture.battle.actors.filter(a=>a.side==='party')).toHaveLength(4);
   expect(plan.events.some(e=>['damage','shield','heal','status_apply','status_expire','charge'].includes(e.type))).toBe(true);
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
 it('does not stretch painted tails when combat has a longer recovery',()=>{
  const t={...PAINT_TIMELINES.get('mochi-2')!,duration:1200,impact:775};
  expect(paintTime(t,1200,1600,775)).toBe(t.duration);
 });
 it('rejects malformed intervals and unordered keys before playback',()=>{
  const t=structuredClone(PAINT_TIMELINES.get('mochi-1')!);t.layers[0]!.keys[1]!.t=-1;expect(()=>validatePaint(t)).toThrow();
 });
});
