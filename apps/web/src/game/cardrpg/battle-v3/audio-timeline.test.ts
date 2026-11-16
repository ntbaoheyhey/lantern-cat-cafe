import {expect,it,vi} from 'vitest';
import {CATS,ENEMIES} from '@taskbar-hero/game-rules/src/cardrpg/depth/catalog';
import {audioTimeline,VOICE_TIMING} from './audio-timeline';
import {configureSequence,type CinematicMode} from './sequence';
import {pilotFixture} from '../vfx-layered/fixture';
import {BattleAudio} from './battle-audio';
import type {SceneView} from '../../squad/turn3d/scene';
import {sampleActionPlan} from '../../squad/turn3d/effects';
import {reserveUltimateLeadIn} from './voice-windows';
import {readFileSync} from 'node:fs';
import {resolveDesign,type AudioManifest} from '../../../audio/cues';
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
it('keeps every healer contact and voice on the fixed clock without any impact samples',()=>{
 const manifest=JSON.parse(readFileSync('public/audio/manifest.json','utf8')) as AudioManifest;
 for(const unit of [...CATS,...ENEMIES].filter(u=>u.combatClass==='healer')){
  const ids=CATS.some(c=>c.id===unit.id)?[`${unit.id}-1`,`${unit.id}-4`]:[`enemy:${unit.id}:basic`,`enemy:${unit.id}`];
  for(const id of ids)for(const mode of ['full','short','off'] as CinematicMode[]){
   const plan=configureSequence(pilotFixture(id).plan,mode),track=audioTimeline(plan,plan.sequence);
   expect(plan.duration).toBe(plan.ultimate?2200:800);
   expect(track.filter(c=>c.role==='impact').map(c=>[c.t,c.cue])).toEqual([[plan.ultimate?1100:350,'heal.medium']]);
   expect(track.filter(c=>c.role==='movement'||c.role==='tail')).toEqual([]);
   expect(track.filter(c=>c.role==='voice').map(c=>c.t)).toEqual(plan.ultimate?[0]:[]);
   for(const cue of track.filter(c=>c.role!=='voice')){
    const design=resolveDesign(cue.cue,manifest,cue.element);expect(design).toBeDefined();
    expect(design!.layers.flatMap(l=>l.variants).some(v=>v.variantId?.includes('impact-sounds:'))).toBe(false);
   }
   const audio=new BattleAudio(()=>{});audio.setCapture(true);
   const view={battleKey:plan,formationC2:true,actors:[],paused:true} as unknown as SceneView;
   for(let i=0;i<3;i++)audio.render({...view,frame:sampleActionPlan(plan,plan.duration-1,false),fixedTime:10+i/60});
   expect(audio.events.filter(e=>e.role==='impact').map(e=>e.cue)).toEqual(['heal.medium']);
  }
 }
});
it('retains the existing non-healer basics and admits a single rising healer source',()=>{
 for(const [id,role,element] of [['mochi','guardian','holy'],['soot','hexer','ember'],['panko','guardian','heavy']]){
  const plan=configureSequence(pilotFixture(`${id}-1`).plan);
  expect(audioTimeline(plan,plan.sequence).map(c=>[c.t,c.cue])).toEqual([[0,`move.${role}.whoosh`],[350,`kit.${element}.impact`]]);
 }
 const manifest=JSON.parse(readFileSync('public/audio/manifest.json','utf8')) as AudioManifest;
 const heal=resolveDesign('heal.medium',manifest)!;
 expect(heal.layers).toHaveLength(1);expect(heal.priority).toBe(60);
 expect(heal.layers[0]!.variants.map(v=>v.variantId?.match(/maximize_(\d+)/)?.[1])).toEqual(['001','003','005','006']);
 expect(heal.layers[0]!.variants.every(v=>v.bus==='sfx'&&v.pack==='b2-ui')).toBe(true);
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
