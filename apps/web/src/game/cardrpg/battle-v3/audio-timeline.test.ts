import {expect,it} from 'vitest';
import {audioTimeline,VOICE_TIMING} from './audio-timeline';
import {configureSequence,SEQUENCES,type CinematicMode} from './sequence';
import {pilotFixture} from '../vfx-layered/fixture';
import {BattleAudio} from './battle-audio';
import type {SceneView} from '../../squad/turn3d/scene';
import {sampleActionPlan} from '../../squad/turn3d/effects';
import {reserveUltimateLeadIn} from './voice-windows';
it('gives every active one specific voice and every ultimate two phases with a single SFX owner',()=>{
 for(const id of SEQUENCES.keys())for(const mode of ['full','short','off'] as CinematicMode[]){
  const plan=configureSequence(pilotFixture(id).plan,mode),track=audioTimeline(plan,plan.sequence),tier=plan.sequence!.tier;
  const voices=track.filter(c=>c.role==='voice');expect(voices.length).toBe(tier==='ultimate'?2:tier==='active'?1:0);
  for(const voice of voices){
   const cast=track.find(c=>c.t===voice.t&&c.role!=='voice'&&/^(skill|ult)\./.test(c.cue));expect(cast).toBeDefined();expect(track.indexOf(voice)).toBeLessThan(track.indexOf(cast!));
   expect(VOICE_TIMING.find(line=>line.cueId===voice.cue),voice.cue).toBeDefined();
  }
  expect(track.every(c=>c.t>=0&&c.t<plan.duration)).toBe(true);
 }
});
it('keeps paused and gallery frames silent and never repeats a cue on redraw',()=>{
 const plan=configureSequence(pilotFixture('mochi-2').plan),played:string[]=[],audio=new BattleAudio(id=>played.push(id));
 const view={battleKey:plan,actors:[],frame:sampleActionPlan(plan,200,false),paused:true} as unknown as SceneView;
 audio.render(view);audio.render({...view,paused:false,galleryPreview:true});expect(played).toEqual([]);
 audio.render({...view,paused:false});const first=[...played];expect(first.length).toBeGreaterThan(0);audio.render({...view,paused:false});expect(played).toEqual(first);
});
it('caps a late multi-target impact at six cues in a hundred milliseconds',()=>{
 const plan=configureSequence(pilotFixture('mochi-2').plan);plan.events.push(...Array.from({length:12},(_,i)=>({...plan.events.find(e=>e.type==='shield')!,type:'damage' as const,amount:1,targetIds:['target-'+i]})));
 const played:string[]=[],audio=new BattleAudio(id=>played.push(id));audio.setCapture(true);
 const view={battleKey:plan,actors:[],paused:true} as unknown as SceneView;
 for(let i=0;i<16;i++)audio.render({...view,frame:sampleActionPlan(plan,plan.duration-1,false),fixedTime:10+i/60});
 const hits=audio.events.filter(e=>e.role==='impact');expect(hits.length).toBeGreaterThanOrEqual(12);
 for(const hit of hits)expect(hits.filter(e=>e.at>=hit.at&&e.at<hit.at+.1-1e-8).length).toBeLessThanOrEqual(6);
});
it('holds a due bark when an authored callout is about to start and resumes it afterwards',()=>{
 const plan=configureSequence(pilotFixture('mochi-4').plan),played:string[]=[],audio=new BattleAudio(id=>played.push(id));audio.setCapture(true);
 const view={battleKey:plan,actors:[{id:'mochi',side:'party',hp:10}],models:{mochi:'mochi'},paused:true,playbackSpeed:1} as unknown as SceneView;
 for(let i=0;i<32;i++)audio.render({...view,fixedTime:10+i*.25});
 const charge=audioTimeline(plan,plan.sequence).find(key=>key.voicePhase==='charge')!;
 audio.render({...view,fixedTime:18,frame:sampleActionPlan(plan,Math.max(0,charge.t-50),false)});
 expect(audio.events.filter(e=>e.role==='bark')).toHaveLength(0);
 audio.render({...view,fixedTime:18.25,frame:sampleActionPlan(plan,charge.t,false)});
 expect(played).toContain(charge.cue);expect(audio.events.filter(e=>e.role==='bark')).toHaveLength(0);
 audio.render({...view,fixedTime:18.5,frame:sampleActionPlan(plan,charge.t+100,false)});
 expect(audio.events.filter(e=>e.role==='bark')).toHaveLength(1);
});
it.each([1,2,3])('fits a bark before a real-time lead-in without over-reserving at ×%s',speed=>{
 const plan=reserveUltimateLeadIn(configureSequence(pilotFixture('mochi-4').plan),4000);
 const audio=new BattleAudio(()=>{});audio.setCapture(true);
 const view={battleKey:plan,actors:[{id:'mochi',side:'party',hp:10}],models:{mochi:'mochi'},paused:true,reducedMotion:false,playbackSpeed:speed} as unknown as SceneView;
 for(let i=0;i<32;i++)audio.render({...view,fixedTime:10+i*.25});
 const charge=audioTimeline(plan,plan.sequence).find(key=>key.voicePhase==='charge')!;
 audio.render({...view,fixedTime:18,frame:sampleActionPlan(plan,charge.t-2100,false)});
 expect(audio.events.filter(e=>e.role==='bark')).toHaveLength(1);
});
