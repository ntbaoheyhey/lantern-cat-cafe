import {expect,it,vi} from 'vitest';
import {CATS,ENEMIES} from '@taskbar-hero/game-rules/src/cardrpg/depth/catalog';
import {audioTimeline,VOICE_TIMING} from './audio-timeline';
import {configureSequence,type CinematicMode} from './sequence';
import {pilotFixture} from '../vfx-layered/fixture';
import {BattleAudio} from './battle-audio';
import type {SceneView} from '../../squad/turn3d/scene';
import {sampleActionPlan} from '../../squad/turn3d/effects';
import {reserveUltimateLeadIn} from './voice-windows';
it('warms newly appearing actors before their first cue without reloading unchanged rosters',()=>{
 const preloadVoices=vi.fn(async()=>{}),previous=window.__thAudio;
 window.__thAudio={...previous,preloadVoices} as NonNullable<Window['__thAudio']>;
 try{
  const audio=new BattleAudio(()=>{}),view={battleKey:{},formationC2:true,actors:[{id:'party-mochi'}],paused:true} as unknown as SceneView;
  audio.render(view);audio.render(view);expect(preloadVoices).toHaveBeenCalledTimes(1);
  audio.render({...view,actors:[...view.actors,{id:'foe-2-binding-thread'} as SceneView['actors'][number]]});
  expect(preloadVoices).toHaveBeenCalledTimes(2);expect(preloadVoices).toHaveBeenLastCalledWith(['party-mochi','foe-2-binding-thread']);
 }finally{window.__thAudio=previous;}
});
it('uses weapon cues for basics and at most one ultimate callout at focus start',()=>{
 for(const id of [...CATS.flatMap(c=>[`${c.id}-1`,`${c.id}-4`]),...ENEMIES.flatMap(e=>[`enemy:${e.id}`,`enemy:${e.id}:basic`])])for(const mode of ['full','short','off'] as CinematicMode[]){
  const plan=configureSequence(pilotFixture(id).plan,mode),track=audioTimeline(plan,plan.sequence),voices=track.filter(c=>c.role==='voice');
  expect(voices.length).toBeLessThanOrEqual(plan.ultimate?1:0);for(const voice of voices){expect(voice.t).toBe(0);expect(VOICE_TIMING.find(line=>line.cueId===voice.cue)).toBeDefined();}
  expect(track.every(c=>c.t>=0&&c.t<plan.duration)).toBe(true);expect(track.filter(c=>c.role==='impact').map(c=>c.t)).toEqual([plan.ultimate?1100:350]);
 }
});
it('keeps paused and gallery frames silent and never repeats a cue on redraw',()=>{
 const plan=configureSequence(pilotFixture('mochi-1').plan),played:string[]=[],audio=new BattleAudio(id=>played.push(id));
 const view={battleKey:plan,formationC2:true,actors:[],frame:sampleActionPlan(plan,200,false),paused:true} as unknown as SceneView;
 audio.render(view);audio.render({...view,paused:false,galleryPreview:true});expect(played).toEqual([]);audio.render({...view,paused:false});const first=[...played];expect(first.length).toBeGreaterThan(0);audio.render({...view,paused:false});expect(played).toEqual(first);
});
it('uses one impact cue for a simultaneous hit on many recipients',()=>{
 const plan=configureSequence(pilotFixture('mochi-1').plan);plan.events.push(...Array.from({length:12},(_,i)=>({...plan.events.find(e=>e.type==='damage')!,amount:1,targetIds:['target-'+i]})));
 const audio=new BattleAudio(()=>{});audio.setCapture(true);const view={battleKey:plan,formationC2:true,actors:[],paused:true} as unknown as SceneView;
 for(let i=0;i<16;i++)audio.render({...view,frame:sampleActionPlan(plan,plan.duration-1,false),fixedTime:10+i/60});expect(audio.events.filter(e=>e.role==='impact')).toHaveLength(1);
});
it('never starts optional chatter before or after an ultimate callout',()=>{
 const plan=configureSequence(pilotFixture('mochi-4').plan),played:string[]=[],audio=new BattleAudio(id=>played.push(id));audio.setCapture(true);
 const view={battleKey:plan,formationC2:true,actors:[{id:'mochi',side:'party',hp:10}],models:{mochi:'mochi'},paused:true,playbackSpeed:1} as unknown as SceneView;
 for(let i=0;i<160;i++)audio.render({...view,fixedTime:10+i*.25,...(i>32&&i<40?{frame:sampleActionPlan(plan,(i-33)*250,false)}:{})});
 expect(audio.events.filter(e=>e.role==='bark')).toHaveLength(0);const line=audioTimeline(plan,plan.sequence).find(k=>k.role==='voice')!;expect(played.filter(id=>id===line.cue)).toHaveLength(1);
});
it.each([1,2,3])('cannot reintroduce chatter through archived lead-in metadata at ×%s',speed=>{
 const plan=reserveUltimateLeadIn(configureSequence(pilotFixture('mochi-4').plan),4000),audio=new BattleAudio(()=>{});audio.setCapture(true);
 const view={battleKey:plan,formationC2:true,actors:[{id:'mochi',side:'party',hp:10}],models:{mochi:'mochi'},paused:true,reducedMotion:false,playbackSpeed:speed} as unknown as SceneView;
 for(let i=0;i<120;i++)audio.render({...view,fixedTime:10+i*.25});audio.render({...view,fixedTime:41,frame:sampleActionPlan(plan,0,false)});expect(audio.events.filter(e=>e.role==='bark')).toHaveLength(0);expect(plan.duration).toBe(2200);
});
