import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {AudioEngine} from './engine';
import {VariantPools} from './variants';
import type {AudioManifest,CueDesign,Sample} from './cues';
class Param {value=1;setTargetAtTime(v:number){this.value=v;}setValueAtTime(v:number){this.value=v;}linearRampToValueAtTime(v:number){this.value=v;}cancelScheduledValues(){}}
class Node {connect(n:Node){return n;}disconnect(){}}
class Source extends Node {buffer:unknown;playbackRate=new Param();loop=false;loopStart=0;loopEnd=0;onended?:()=>void;start=vi.fn();stop(){this.onended?.();}}
class Gain extends Node {gain=new Param();}
class Filter extends Node {type='';frequency=new Param();Q=new Param();gain=new Param();}
class Context {
 static latest:Context;currentTime=10;state='running';destination=new Node();sources:Source[]=[];filters:Filter[]=[];
 constructor(){Context.latest=this;}
 createGain(){return new Gain();}createBufferSource(){const s=new Source();this.sources.push(s);return s;}
 createBiquadFilter(){const f=new Filter();this.filters.push(f);return f;}
 createDynamicsCompressor(){return Object.assign(new Node(),{threshold:new Param(),knee:new Param(),ratio:new Param(),attack:new Param(),release:new Param()});}
 async resume(){this.state='running';}async suspend(){this.state='suspended';}async decodeAudioData(){return {duration:20};}
}
const samples=(bus:Sample['bus']='sfx')=>Array.from({length:6},(_,i)=>({pack:'test',start:i,duration:.4,bus,variantId:String(i)}));
const design:CueDesign={bus:'sfx',layers:['transient','body','tail','sweetener'].map((role,i)=>({role,variants:samples(),offsetMs:[0,7,18,23][i]!,eq:i===1?'low-shelf-180':i===3?'high-pass-1800':'flat',gainDb:-8})),pitchRange:[.94,1.06],gainRange:[-1.5,1.5],cooldownMs:30,priority:60};
const fixture:AudioManifest={version:4,packs:{test:{webm:'/test.webm',mp3:'/test.mp3'}},cues:{'voice.meow':samples('voice')},designs:{'hit.blunt':design,'hit.magic':design,'ui.click':{...design,bus:'ui',layers:design.layers.slice(0,2).map(l=>({...l,variants:samples('ui')}))}}};
const flush=async()=>{for(let i=0;i<12;i++)await Promise.resolve();};
beforeEach(()=>{localStorage.clear();vi.stubGlobal('AudioContext',Context);vi.stubGlobal('fetch',vi.fn(async(url:string)=>url.endsWith('.json')?{ok:true,json:async()=>fixture}:{ok:true,arrayBuffer:async()=>new ArrayBuffer(8)}));});
afterEach(()=>vi.unstubAllGlobals());
describe('layered playback admission and variants',()=>{
 it('cycles each pool without repeats across several cycles',()=>{
  const p=new VariantPools(()=>.99);const values=Array.from({length:25},()=>p.next('hit/body',[0,1,2,3,4,5]));
  expect(new Set(values)).toHaveLength(6);expect(values.every((v,i)=>i===0||v!==values[i-1])).toBe(true);
 });
 it('plays four audible roles with bounded jitter, micro offsets and role EQ',async()=>{
  const e=new AudioEngine(()=>.5);await e.unlock();e.play('hit.blunt');await flush();
  expect(e.diagnostics.sfx).toBe(4);expect(e.hits.at(-1)?.layers?.map(l=>l.offsetMs)).toEqual([0,7,18,23]);
  expect(Context.latest.filters.map(f=>f.type)).toEqual(['lowshelf','highpass']);
  expect(Context.latest.sources.map(s=>s.start.mock.calls[0]?.[0])).toEqual([10,10.007,10.018,10.023]);
 });
 it('avoids a repeated source when an element changes to a shorter overlapping pool',()=>{
  const p=new VariantPools(()=>0),a=[{id:'a'},{id:'b'},{id:'c'}],b=[{id:'b'},{id:'a'}];
  expect(p.next('skill/body',a,s=>s.id).id).toBe('a');
  expect(p.next('skill/body',b,s=>s.id).id).toBe('b');
  expect(p.next('skill/body',a,s=>s.id).id).not.toBe('b');
  for(let i=0,last='';i<30;i++){const value=p.next('dynamic',i%2?a:b,s=>s.id).id;expect(value).not.toBe(last);last=value;}
 });
 it('never exceeds 14 actual SFX sources, including scheduled layers, under a burst',async()=>{
  const e=new AudioEngine(()=>0);await e.unlock();
  for(let i=0;i<20;i++){Context.latest.currentTime+=.1;e.play('hit.blunt');await flush();expect(e.diagnostics.sfx).toBeLessThanOrEqual(14);}
  const played=e.hits.filter(h=>h.result==='played');
  for(let i=1;i<played.length;i++)expect(played[i]!.layers!.every((l,j)=>l.variantId!==played[i-1]!.layers![j]!.variantId)).toBe(true);
 });
 it('keeps a single voice source and protects the ultimate from a lower priority request',async()=>{
  const e=new AudioEngine();await e.unlock();e.play('voice.mochi.ult');await flush();e.play('voice.soot.attack');await flush();
  expect(e.diagnostics.voice).toBe(1);expect(e.hits.at(-1)?.result).toBe('priority');
  Context.latest.currentTime+=7;e.play('voice.soot.ult');await flush();expect(e.diagnostics.voice).toBe(1);
 });
 it('spaces ordinary cat-speak across units, including generic skill barks, by seven seconds',async()=>{
  const e=new AudioEngine();await e.unlock();e.play('voice.mochi.skill');await flush();
  Context.latest.currentTime+=1;e.play('voice.soot.skill');await flush();expect(e.hits.at(-1)?.result).toBe('cadence');
  Context.latest.currentTime+=6;e.play('voice.soot.skill');await flush();expect(e.hits.at(-1)?.result).toBe('played');
 });
 it('preserves an authored voice pitch instead of processing it twice',async()=>{
  const m={...fixture,cues:{...fixture.cues,'voice.mochi.select':samples('voice').map(s=>({...s,processedVoice:true}))}};
  vi.stubGlobal('fetch',vi.fn(async(url:string)=>url.endsWith('.json')?{ok:true,json:async()=>m}:{ok:true,arrayBuffer:async()=>new ArrayBuffer(8)}));
  const e=new AudioEngine();await e.unlock();e.play('voice.mochi.select');await flush();
  expect(Context.latest.sources.at(-1)?.playbackRate.value).toBe(1);
 });
 it('plays an ultimate release during chatter cooldown and ducks while keeping one voice',async()=>{
  const e=new AudioEngine();await e.unlock();e.play('voice.mochi.skill');await flush();
  Context.latest.currentTime+=.4;e.play('voice.soot.ult.release');await flush();
  expect(e.hits.at(-1)).toMatchObject({id:'voice.soot.ult.release',result:'played',voice:1,duckDb:-8});
 });
 it('supplies a callout without A changes, suppresses a same-tick explicit duplicate and honors recent voices',async()=>{
  const e=new AudioEngine();await e.unlock();e.play('ult.mochi.charge');await flush();
  expect(e.hits.filter(h=>h.id==='voice.mochi.ult.charge'&&h.result==='played')).toHaveLength(1);
  e.play('voice.mochi.ult.charge');await flush();expect(e.hits.at(-1)?.result).toBe('duplicate');
  const f=new AudioEngine();await f.unlock();f.play('ult.soot.charge');f.play('voice.soot.ult.charge');await flush();
  expect(f.hits.filter(h=>h.id==='voice.soot.ult.charge'&&h.result==='played')).toHaveLength(1);
  f.play('ult.clover.charge');await flush();expect(f.hits.some(h=>h.id==='voice.clover.ult.charge')).toBe(false);
 });
 it('routes an enemy cast fallback to its own spoken signature and cancels a stopped pending fallback',async()=>{
  const e=new AudioEngine();await e.unlock();e.play('skill.foe-0-yarn-giant.2.cast');await flush();
  expect(e.hits.some(h=>h.id==='voice.yarn-giant.skill.enemy:yarn-giant'&&h.result==='played')).toBe(true);
  const f=new AudioEngine();await f.unlock();f.play('ult.mochi.release');f.stop();await flush();
  expect(f.hits.some(h=>h.id==='voice.mochi.ult.release')).toBe(false);
 });
 it('invalidates in-flight requests when stop is called while a pack is loading',async()=>{
  let finish:()=>void=()=>{};const pending=new Promise<void>(r=>{finish=r;});
  vi.stubGlobal('fetch',vi.fn(async(url:string)=>url.endsWith('.json')?{ok:true,json:async()=>fixture}:{ok:true,arrayBuffer:async()=>{await pending;return new ArrayBuffer(8);}}));
  const e=new AudioEngine();await e.unlock();e.play('hit.blunt');await flush();e.stop('hit.blunt');finish();await flush();expect(e.diagnostics.sfx).toBe(0);
 });
 it('does not run muted transients, and retains the original random pitch when speed changes',async()=>{
  const e=new AudioEngine(()=>0);await e.unlock();e.mute(true);e.play('hit.blunt');await flush();expect(e.diagnostics.sfx).toBe(0);
  e.mute(false);e.play('hit.blunt');await flush();e.speed(2);expect(Context.latest.sources[0]!.playbackRate.value).toBeCloseTo(.94*2);
 });
 it('persists and clamps each bus separately without overwriting the others',async()=>{
  const e=new AudioEngine();await e.unlock();e.setBus('voice',.25);e.setBus('music',2);e.setBus('sfx',-1);e.mute(true);
  const restored=new AudioEngine();expect(restored.settings).toMatchObject({voice:.25,music:1,sfx:0,ui:.6});expect(restored.muted).toBe(true);
 });
 it('keeps the current music playing during decode and rejects a superseded scene load',async()=>{
  let finish:()=>void=()=>{};const pending=new Promise<void>(r=>{finish=r;});
  const m:AudioManifest={...fixture,packs:{...fixture.packs,slow:{webm:'/slow.webm',mp3:'/slow.mp3'}},cues:{...fixture.cues,
   'music.home':[{pack:'test',start:0,duration:10,bus:'music',loop:true}],
   'music.battle':[{pack:'slow',start:0,duration:10,bus:'music',loop:true}],
   'ambience.bag':[{pack:'test',start:0,duration:10,bus:'ambience',loop:true}]}};
  vi.stubGlobal('fetch',vi.fn(async(url:string)=>url.endsWith('.json')?{ok:true,json:async()=>m}:{ok:true,arrayBuffer:async()=>{if(url==='/slow.webm')await pending;return new ArrayBuffer(8);}}));
  const e=new AudioEngine();await e.unlock();e.music('home');await flush();
  const original=Context.latest.sources[0]!;expect(original.onended).toBeTypeOf('function');
  const stopped=vi.spyOn(original,'stop');e.music('battle');await flush();expect(stopped).not.toHaveBeenCalled();
  e.music('home');e.ambience('bag');await flush();finish();await flush();
  expect(e.hits.filter(h=>h.id==='music.battle'&&h.result==='played')).toHaveLength(0);
  expect(e.hits.some(h=>h.id==='ambience.bag'&&h.result==='played')).toBe(true);
  e.stop();expect(e.diagnostics.active).toBe(0);
 });
});
