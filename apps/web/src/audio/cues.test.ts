import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {CATS,voiceProfiles,eventCue,EVENT_CUES,resolveCue,type AudioManifest} from './cues';
import {playFrame} from './events';
import type {AudioBridge} from '../game/cardrpg/contracts/audio-cues';
const m=JSON.parse(readFileSync(resolve(import.meta.dirname,'../../public/audio/manifest.json'),'utf8')) as AudioManifest;
describe('sample cue coverage',()=>{
 it('maps every existing event and all 12 cat kits, voices and elements',()=>{
  for(const type of Object.keys(EVENT_CUES))expect(resolveCue(eventCue({type}),m)?.length,type).toBeGreaterThan(0);
  for(const cat of CATS){for(const phase of ['charge','release','impact','tail'])expect(resolveCue(`ult.${cat}.${phase}`,m)?.length).toBeGreaterThan(0);expect(resolveCue(`voice.${cat}.ult`,m)?.[0]?.bus).toBe('voice');}
 });
 it('keeps twelve distinct pitch or timbre identities',()=>{
  expect(Object.keys(voiceProfiles)).toHaveLength(12);const p=Object.values(voiceProfiles);for(let a=0;a<p.length;a++)for(let b=a+1;b<p.length;b++)expect(Math.abs(12*Math.log2(p[a]!.pitch/p[b]!.pitch))>=3.99||p[a]!.timbre!==p[b]!.timbre).toBe(true);
 });
 it('emits damage/status/death at impact and the ultimate voice at charge',()=>{
  const ids:string[]=[];const audio={play:(id:string)=>{ids.push(id);}};
  const frame={plan:{id:1,actorId:'mochi',shape:'bash',ultimate:true,events:[{type:'damage'},{type:'death'},{type:'status_apply',status:'burn'}]},beat:{kind:'anticipation'}};
  playFrame(audio,frame as never);expect(ids).toContain('voice.mochi.ult');frame.beat.kind='impact';playFrame(audio,frame as never);expect(ids).toEqual(expect.arrayContaining(['hit.blunt','ui.death','status.burn.on']));for(const id of ids)expect(resolveCue(id,m)?.length,id).toBeGreaterThan(0);
 });
 it('does not turn travel, recoil or residue into repeated skill impacts',()=>{
  const ids:string[]=[];const audio={play:(id:string)=>ids.push(id)};
  for(const kind of ['anticipation','travel','impact','reaction','residue'])playFrame(audio,{plan:{id:2,actorId:'mochi',shape:'bash',ultimate:false,events:[{type:'damage'}]},beat:{kind}} as never);
  expect(ids.filter(id=>id==='skill.mochi.1.impact')).toHaveLength(1);
  expect(ids.filter(id=>id==='hit.blunt')).toHaveLength(1);
  expect(ids).toContain('kit.slash.release');
 });
});
