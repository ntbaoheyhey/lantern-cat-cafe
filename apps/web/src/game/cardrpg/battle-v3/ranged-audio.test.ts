import {expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {CATS,ENEMIES} from '@taskbar-hero/game-rules/src/cardrpg/depth/catalog';
import {audioTimeline} from './audio-timeline';
import {BattleAudio} from './battle-audio';
import {configureSequence} from './sequence';
import {advanceBattleClock} from './final-hit';
import {pilotFixture} from '../vfx-layered/fixture';
import {PAINT_TIMELINES} from '../vfx-layered/player';
import {paintTime} from '../vfx-layered/timeline';
import {sampleActionPlan} from '../../squad/turn3d/effects';
import type {SceneView} from '../../squad/turn3d/scene';
import {resolveDesign,type AudioManifest} from '../../../audio/cues';
import {rangedPacksForRoster} from '../../../audio/ranged-packs';
const actions=[...CATS.filter(c=>c.combatClass==='ranged').flatMap(c=>[`${c.id}-1`,`${c.id}-4`]),...ENEMIES.filter(c=>c.combatClass==='ranged').flatMap(c=>[`enemy:${c.id}:basic`,`enemy:${c.id}`])];

it('uses the shipping flight timing for every ranged action without changing combat events',()=>{
 const manifest=JSON.parse(readFileSync('public/audio/manifest.json','utf8')) as AudioManifest;
 expect(actions).toHaveLength(14);
 for(const id of actions){
  const plan=configureSequence(pilotFixture(id).plan),before=JSON.stringify(plan),track=audioTimeline(plan,plan.sequence),paint=PAINT_TIMELINES.get(id)!;
  const flight=paint.layers.filter(l=>l.anchor==='flight'&&l.start<paint.impact&&l.keys.some(k=>k.alpha>0&&k.t<paint.impact));
  expect(JSON.stringify(plan)).toBe(before);
  const release=track.filter(c=>c.role==='release'),travel=track.filter(c=>c.role==='travel'),impact=track.filter(c=>c.role==='impact');
  expect(impact).toHaveLength(1);expect(impact[0]!.t).toBe(plan.beats[2]!.start);
  expect(release).toHaveLength(flight.length?1:0);expect(travel).toHaveLength(flight.length?1:0);
  if(flight.length){
   expect(track.some(c=>c.role==='movement')).toBe(false);
   expect(paintTime(paint,release[0]!.t,plan.duration,impact[0]!.t,false,plan.ultimate?600:0)).toBeCloseTo(Math.min(...flight.map(l=>l.start)),7);
   expect(travel[0]!.t).toBeGreaterThan(release[0]!.t);expect(travel[0]!.t).toBeLessThan(impact[0]!.t);
  }else expect(id).toBe('sorrel-4');
  for(const cue of [...release,...travel,...impact]){
   const design=resolveDesign(cue.cue,manifest,cue.element);expect(design).toBeDefined();
   expect(design!.baked?1:design!.layers.length).toBe(1);
   if(cue.role==='impact'){
    const owner=id.replace(/^enemy:/,'').replace(/:basic$/,'').replace(/-[1-4]$/,'');
    const packs=rangedPacksForRoster([owner]);expect(packs).toHaveLength(1);
    expect(design!.baked!.every(v=>packs.includes(v.sample.pack))).toBe(true);
   }
  }
 }
});

it('dispatches every flight phase once across speed changes and keeps contact on the rules beat',()=>{
 const transitions=[[1,3],[3,1],[1,2],[2,1],[2,3],[3,2]];
 for(const id of actions){
  const plan=configureSequence(pilotFixture(id).plan),track=audioTimeline(plan,plan.sequence),release=track.find(c=>c.role==='release'),contact=plan.beats[2]!.start;
  if(!release)continue;
  for(const [from,to]of transitions)for(const switchAt of [0,release.t-1,release.t+1,(release.t+contact)/2,contact+1]){
   let elapsed=0,wall=0;const requests:Array<{cue:string;elapsed:number}>=[],audio=new BattleAudio(cue=>requests.push({cue,elapsed}));audio.setCapture(true);
   const view={battleKey:plan,formationC2:true,actors:[],paused:false,reducedMotion:false} as unknown as SceneView;
   while(elapsed<plan.duration){
    const speed=elapsed>=switchAt?to!:from!;
    const frame={...view,playbackSpeed:speed,fixedTime:wall/1000,frame:sampleActionPlan(plan,elapsed,false)};
    audio.render(frame);audio.render(frame);
    elapsed=advanceBattleClock(plan,elapsed,1000/60,false,speed);wall+=1000/60;
   }
   const phase=audio.events.filter(e=>['release','travel','impact'].includes(e.role));
   expect(phase.map(e=>e.role),`${id} ${from}->${to} at ${switchAt}`).toEqual(['release','travel','impact']);
   for(const cue of track.filter(c=>c.role==='release'||c.role==='travel')){
    const fired=requests.filter(r=>r.cue===cue.cue);expect(fired).toHaveLength(1);expect(fired[0]!.elapsed).toBeLessThan(contact);
   }
   expect(requests.find(r=>r.cue===track.find(c=>c.role==='impact')!.cue)!.elapsed).toBeGreaterThanOrEqual(contact);
  }
 }
});
