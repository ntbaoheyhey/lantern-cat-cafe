import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {AudioEngine} from './engine';
import {VariantPools} from './variants';
import type {AudioManifest,CueDesign,Sample} from './cues';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {ALL_RANGED_PACKS} from './ranged-packs';
import {loadV5AudioManifest} from './v5-manifest-loader';
import {PackedAudioLoader} from './packed-audio-loader';
class Param {value=1;setTargetAtTime(v:number){this.value=v;}setValueAtTime(v:number){this.value=v;}linearRampToValueAtTime(v:number,_time?:number){this.value=v;}cancelScheduledValues(){}}
class Node {connect(n:Node){return n;}disconnect(){}}
class Source extends Node {buffer:unknown;playbackRate=new Param();loop=false;loopStart=0;loopEnd=0;onended?:()=>void;start=vi.fn();stop(){this.onended?.();}}
class Gain extends Node {gain=new Param();}
class Filter extends Node {type='';frequency=new Param();Q=new Param();gain=new Param();}
class Context {
 static latest:Context;currentTime=10;sampleRate=48000;state='running';destination=new Node();sources:Source[]=[];filters:Filter[]=[];
 constructor(){Context.latest=this;}
 createGain(){return new Gain();}createBufferSource(){const s=new Source();this.sources.push(s);return s;}
 createBiquadFilter(){const f=new Filter();this.filters.push(f);return f;}
 createDynamicsCompressor(){return Object.assign(new Node(),{threshold:new Param(),knee:new Param(),ratio:new Param(),attack:new Param(),release:new Param()});}
 async resume(){this.state='running';}async suspend(){this.state='suspended';}async decodeAudioData(){return {duration:20,numberOfChannels:1,sampleRate:this.sampleRate};}
}
class OfflineContext {
 static instances:OfflineContext[]=[];static failAt=-1;
 destination=new Node();sources:Source[]=[];filters:Filter[]=[];
 createGain=Context.prototype.createGain;createBufferSource=Context.prototype.createBufferSource;createBiquadFilter=Context.prototype.createBiquadFilter;
 constructor(readonly numberOfChannels:number,readonly length:number,readonly sampleRate:number){OfflineContext.instances.push(this);}
 async startRendering(){
  if(OfflineContext.instances.indexOf(this)===OfflineContext.failAt)throw Error('offline preparation unavailable');
  return {numberOfChannels:this.numberOfChannels,length:this.length,sampleRate:this.sampleRate,duration:this.length/this.sampleRate};
 }
}
const samples=(bus:Sample['bus']='sfx')=>Array.from({length:6},(_,i)=>({pack:'test',start:i,duration:.4,bus,variantId:String(i)}));
const design:CueDesign={bus:'sfx',layers:['transient','body','tail','sweetener'].map((role,i)=>({role,variants:samples(),offsetMs:[0,7,18,23][i]!,eq:i===1?'low-shelf-180':i===3?'high-pass-1800':'flat',gainDb:-8})),pitchRange:[.94,1.06],gainRange:[-1.5,1.5],cooldownMs:30,priority:60};
const fixture:AudioManifest={version:4,packs:{test:{webm:'/test.webm',mp3:'/test.mp3'}},cues:{'voice.meow':samples('voice')},designs:{'hit.blunt':design,'hit.magic':design,'ui.click':{...design,bus:'ui',layers:design.layers.slice(0,2).map(l=>({...l,variants:samples('ui')}))}}};
const flush=async()=>{for(let i=0;i<12;i++)await Promise.resolve();};
beforeEach(()=>{localStorage.clear();vi.stubGlobal('AudioContext',Context);vi.stubGlobal('fetch',vi.fn(async(url:string)=>url.endsWith('.json')?{ok:true,json:async()=>fixture}:{ok:true,arrayBuffer:async()=>new ArrayBuffer(8)}));});
afterEach(()=>{vi.unstubAllGlobals();vi.restoreAllMocks();});
describe('layered playback admission and variants',()=>{
 it.each(['http','integrity','decode'])('retries the original Opus before alternate codecs after package %s failure',async failure=>{
  const m={...fixture,packs:{test:{opus:'/test.opus',m4a:'/test.m4a',preferredFormat:'opus' as const}}};
  const fetcher=vi.fn(async(url:string)=>{
   if(url==='/audio-delivery/test.json'){
    if(failure==='integrity')throw Error('Integrity mismatch');
    return {ok:failure!=='http',json:async()=>({version:1,files:{'/test.opus':'AQID'}})};
   }
   return url.endsWith('.json')?{ok:true,json:async()=>m}:{ok:true,arrayBuffer:async()=>new ArrayBuffer(8)};
  });vi.stubGlobal('fetch',fetcher);
  if(failure==='decode')vi.spyOn(Context.prototype,'decodeAudioData').mockRejectedValueOnce(Error('Decode failed'));
  const packages=new PackedAudioLoader([{url:'/audio-delivery/test.json',integrity:'sha256-test',paths:['/test.opus']}]);packages.allow(['/test.opus']);
  const e=new AudioEngine(()=>0,'/audio/',undefined,packages);await e.unlock();e.play('hit.blunt');
  await vi.waitFor(()=>expect(e.hits.at(-1)?.result).toBe('played'));
  expect(fetcher.mock.calls.map(c=>c[0])).toEqual(['/audio/manifest.json','/audio-delivery/test.json','/test.opus']);
 });
 it.each(['http','decode'])('falls back from Opus to M4A after %s failure',async failure=>{
  const m={...fixture,packs:{test:{opus:'/test.opus',m4a:'/test.m4a',preferredFormat:'opus' as const}}};
  const fetcher=vi.fn(async(url:string)=>url.endsWith('.json')?{ok:true,json:async()=>m}:{ok:!(failure==='http'&&url.endsWith('.opus')),arrayBuffer:async()=>new ArrayBuffer(8)});
  vi.stubGlobal('fetch',fetcher);if(failure==='decode')vi.spyOn(Context.prototype,'decodeAudioData').mockRejectedValueOnce(Error('codec unavailable'));
  const e=new AudioEngine();await e.unlock();e.play('hit.blunt');await vi.waitFor(()=>expect(e.hits.at(-1)?.result).toBe('played'));
  expect(fetcher.mock.calls.map(c=>c[0])).toEqual(['/audio/manifest.json','/test.opus','/test.m4a']);
 });
 it('preloads delivered packs and keeps scheduled contacts synchronous with original variant metadata',async()=>{
  const read=(path:string)=>JSON.parse(readFileSync(resolve(import.meta.dirname,'../../public/audio',path),'utf8'));
  const m=read('manifest.json'),v5=read('v5/manifest.json');
  const fetcher=vi.fn(async(url:string)=>url.endsWith('.json')?{ok:true,json:async()=>url.includes('/v5/')?v5:m}:{ok:true,arrayBuffer:async()=>new ArrayBuffer(8)});
  vi.stubGlobal('fetch',fetcher);const e=new AudioEngine(()=>0,'/audio/',loadV5AudioManifest);await e.unlock();e.setBattleRoster(['soot','mochi']);await e.preload('battle');
  expect(e.diagnostics.packs).toContain('v5:legacy/ranged-ember-impact-0-0');
  for(const pack of ['b2-hits','b2-ui','b2-motion','b2-magic'])expect(e.diagnostics.packs).not.toContain(pack);
  expect(e.diagnostics.packs.some(pack=>pack.startsWith('v5:b2/'))).toBe(true);
  const fetched=fetcher.mock.calls.length;e.play('kit.ranged-ember.impact');
  expect(Context.latest.sources).toHaveLength(1);expect(e.hits.at(-1)?.layers).toHaveLength(4);
  e.play('skill.mochi.1.impact',{element:'holy'});expect(Context.latest.sources).toHaveLength(2);
  expect(Context.latest.sources[1]!.start.mock.calls[0]!.slice(0,2)).toEqual([10,0]);
  expect(fetcher.mock.calls).toHaveLength(fetched);
 });
 const shippedForge=()=>{
  const m=JSON.parse(readFileSync(resolve(import.meta.dirname,'../../public/audio/manifest.json'),'utf8')) as AudioManifest;
  OfflineContext.instances=[];OfflineContext.failAt=-1;vi.stubGlobal('OfflineAudioContext',OfflineContext);
  const fetcher=vi.fn(async(url:string)=>url.endsWith('.json')?{ok:true,json:async()=>m}:{ok:true,arrayBuffer:async()=>new ArrayBuffer(8)});
  vi.stubGlobal('fetch',fetcher);return {m,fetcher};
 };
 it('prepares all forge pairs once across concurrent home preloads without live starts or new asset requests',async()=>{
  const {fetcher}=shippedForge(),e=new AudioEngine(()=>.5);
  await e.preload('home');expect(OfflineContext.instances).toHaveLength(0);
  await e.unlock();await Promise.all([e.preload('home'),e.preload('home'),e.preload('home')]);
  expect(e.diagnostics.forgeVariants).toBe(72);expect(OfflineContext.instances).toHaveLength(72);expect(Context.latest.sources).toHaveLength(0);
  expect(OfflineContext.instances.every(c=>c.sources.length===2&&c.filters.length===1&&c.filters[0]?.frequency.value===1800)).toBe(true);
  const urls=fetcher.mock.calls.map(([url])=>url);expect(new Set(urls).size).toBe(urls.length);expect(urls.some(url=>url.includes('native'))).toBe(false);
  await e.preload('home');expect(OfflineContext.instances).toHaveLength(72);expect(fetcher.mock.calls).toHaveLength(urls.length);
 });
 it('admits forge feedback and speech in the six-source UI burst while generic confirmations stay layered',async()=>{
  shippedForge();const e=new AudioEngine(()=>.5);await e.unlock();await e.preload('home');
  for(const cue of ['ui.hover','ui.release','ui.click','ui.forge.hammer'])e.play(cue);
  Context.latest.currentTime+=.016;e.play('ui.forge-success');e.play('voice.mochi.forge');
  expect(Context.latest.sources).toHaveLength(6);expect(e.hits.every(h=>h.result==='played')).toBe(true);
  expect(e.hits.filter(h=>h.id.startsWith('ui.forge')).every(h=>h.layers?.length===2)).toBe(true);
  expect(Context.latest.sources.slice(3,5).every(s=>s.start.mock.calls[0]?.[1]===0)).toBe(true);
  e.play('ui.confirm');expect(e.hits.at(-1)?.result).toBe('rate-limit');expect(Context.latest.sources).toHaveLength(6);
  Context.latest.currentTime+=1;e.play('ui.confirm');expect(Context.latest.sources).toHaveLength(8);
  Context.latest.currentTime+=1;e.play('ui.hammer');expect(Context.latest.sources).toHaveLength(10);
 });
 it('retains the original complete layers when preparation fails, then retries without refetching',async()=>{
  const {fetcher}=shippedForge();OfflineContext.failAt=40;const e=new AudioEngine(()=>.5);await e.unlock();await e.preload('home');
  expect(e.diagnostics.forgeVariants).toBe(0);e.play('ui.forge.hammer');expect(Context.latest.sources).toHaveLength(2);
  const requests=fetcher.mock.calls.length;OfflineContext.failAt=-1;await e.preload('home');expect(e.diagnostics.forgeVariants).toBe(72);
  expect(fetcher.mock.calls).toHaveLength(requests);Context.latest.currentTime+=1;e.play('ui.forge.hammer');expect(Context.latest.sources).toHaveLength(3);
 });
 it('keeps each authored layer variant pool and avoids a second envelope at the slow pitch boundary',async()=>{
  shippedForge();const e=new AudioEngine(()=>0);await e.unlock();await e.preload('home');const ramp=vi.spyOn(Param.prototype,'linearRampToValueAtTime');
  for(let n=0;n<6;n++){e.play('ui.forge.hammer',{pitch:.25});Context.latest.currentTime+=1;}
  expect(Context.latest.sources).toHaveLength(6);expect(ramp).not.toHaveBeenCalled();
  for(const index of [0,1])expect(new Set(e.hits.map(h=>h.layers?.[index]?.variantId)).size).toBe(6);
  for(const source of Context.latest.sources){const [,,duration]=source.start.mock.calls[0]!;expect(duration/source.playbackRate.value).toBeLessThanOrEqual(.3+1e-9);}
 });
 it.each([false,true])('uses a pack-selected MP3 first and retains WebM fallback (MP3 unavailable: %s)',async unavailable=>{
  const m={...fixture,packs:{test:{webm:'/test.webm',mp3:'/test.mp3',preferredFormat:'mp3' as const}}};
  const fetcher=vi.fn(async(url:string)=>url.endsWith('.json')?{ok:true,json:async()=>m}:{ok:!(unavailable&&url.endsWith('.mp3')),arrayBuffer:async()=>new ArrayBuffer(8)});
  vi.stubGlobal('fetch',fetcher);const e=new AudioEngine();await e.unlock();e.play('hit.blunt');await vi.waitFor(()=>expect(e.hits.at(-1)?.result).toBe('played'));
  expect(fetcher.mock.calls.map(c=>c[0])).toEqual(unavailable?['/audio/manifest.json','/test.mp3','/test.webm']:['/audio/manifest.json','/test.mp3']);
  expect(e.hits.at(-1)?.result).toBe('played');
 });
 it('plays two distinct shipped receipt composites within20ms while retaining the six-source ceiling',async()=>{
  const m=JSON.parse(readFileSync(resolve(import.meta.dirname,'../../public/audio/manifest.json'),'utf8')) as AudioManifest;
  vi.stubGlobal('fetch',vi.fn(async(url:string)=>url.endsWith('.json')?{ok:true,json:async()=>m}:{ok:true,arrayBuffer:async()=>new ArrayBuffer(8)}));
  const e=new AudioEngine(()=>.5);await e.unlock();await e.preload('home');
  e.play('tx.confirmed');Context.latest.currentTime+=.02;e.play('tx.confirmed');
  expect(Context.latest.sources).toHaveLength(2);
  for(let i=0;i<5;i++)e.play('tx.confirmed');
  expect(Context.latest.sources).toHaveLength(6);expect(e.hits.at(-1)?.result).toBe('rate-limit');
  expect(e.hits.filter(h=>h.result==='played').every(h=>h.layers?.length===2)).toBe(true);
 });
 it('preloads the receipt composite before the first confirmation without playing it',async()=>{
  const m={...fixture,packs:{...fixture.packs,'v4-receipt':{webm:'/receipt.webm',mp3:'/receipt.mp3'}}};
  vi.stubGlobal('fetch',vi.fn(async(url:string)=>url.endsWith('.json')?{ok:true,json:async()=>m}:{ok:true,arrayBuffer:async()=>new ArrayBuffer(8)}));
  const e=new AudioEngine();await e.unlock();await e.preload('home');
  expect(e.diagnostics.packs).toContain('v4-receipt');expect(Context.latest.sources).toHaveLength(0);
 });
 it.each(['battle','boss'] as const)('predecodes shipped ranged composites for %s without starting a source',async screen=>{
  const m=JSON.parse(readFileSync(resolve(import.meta.dirname,'../../public/audio/manifest.json'),'utf8')) as AudioManifest;
  vi.stubGlobal('fetch',vi.fn(async(url:string)=>url.endsWith('.json')?{ok:true,json:async()=>m}:{ok:true,arrayBuffer:async()=>new ArrayBuffer(8)}));
  const e=new AudioEngine();await e.unlock();await e.preload('home');expect(e.diagnostics.packs.some(p=>p.startsWith('v4-ranged-'))).toBe(false);
  await e.preload(screen);expect(e.diagnostics.packs).toEqual(expect.arrayContaining([...ALL_RANGED_PACKS]));expect(Context.latest.sources).toHaveLength(0);
  e.play('kit.ranged-ember.impact');expect(Context.latest.sources).toHaveLength(1);expect(e.hits.at(-1)?.result).toBe('played');
 });
 it('selects from a pre-unlock roster, adds new arrivals and keeps contacts synchronous after preload',async()=>{
  const m=JSON.parse(readFileSync(resolve(import.meta.dirname,'../../public/audio/manifest.json'),'utf8')) as AudioManifest;
  const fetcher=vi.fn(async(url:string)=>url.endsWith('.json')?{ok:true,json:async()=>m}:{ok:true,arrayBuffer:async()=>new ArrayBuffer(8)});vi.stubGlobal('fetch',fetcher);
  const e=new AudioEngine();e.setBattleRoster(['party-soot','foe-2-binding-thread','mochi','clover']);
  expect(fetcher).not.toHaveBeenCalled();await e.unlock();await e.preload('boss');
  expect(e.diagnostics.packs.filter(p=>p.startsWith('v4-ranged-')).sort()).toEqual(['v4-ranged-ember','v4-ranged-heavy']);
  expect(Context.latest.sources).toHaveLength(0);const fetched=fetcher.mock.calls.length;
  e.play('kit.ranged-ember.impact');expect(Context.latest.sources).toHaveLength(1);expect(fetcher.mock.calls).toHaveLength(fetched);
  e.setBattleRoster(['inkcap','velvet']);await e.preload('boss');
  expect(e.diagnostics.packs).toEqual(expect.arrayContaining([...ALL_RANGED_PACKS]));
  e.play('kit.ranged-ice.impact');expect(Context.latest.sources).toHaveLength(2);
  const beforeRepeat=fetcher.mock.calls.length;await e.preload('boss');expect(fetcher.mock.calls).toHaveLength(beforeRepeat);
 });
 it.each([undefined,[],['soot','unrecognized-actor']])('keeps all ranged coverage for missing or unknown roster %s',async roster=>{
  const m=JSON.parse(readFileSync(resolve(import.meta.dirname,'../../public/audio/manifest.json'),'utf8')) as AudioManifest;
  vi.stubGlobal('fetch',vi.fn(async(url:string)=>url.endsWith('.json')?{ok:true,json:async()=>m}:{ok:true,arrayBuffer:async()=>new ArrayBuffer(8)}));
  const e=new AudioEngine();await e.unlock();e.setBattleRoster(roster);await e.preload('battle');
  expect(e.diagnostics.packs).toEqual(expect.arrayContaining([...ALL_RANGED_PACKS]));
 });
 it('avoids ranged payloads for a known melee/healer roster and does not load all packs when leaving battle',async()=>{
  const m=JSON.parse(readFileSync(resolve(import.meta.dirname,'../../public/audio/manifest.json'),'utf8')) as AudioManifest;
  const fetcher=vi.fn(async(url:string)=>url.endsWith('.json')?{ok:true,json:async()=>m}:{ok:true,arrayBuffer:async()=>new ArrayBuffer(8)});vi.stubGlobal('fetch',fetcher);
  const e=new AudioEngine();await e.unlock();e.setBattleRoster(['mochi','panko','clover','teacup-healer']);e.music('battle');await e.preload('battle');
  expect(e.diagnostics.packs.some(p=>p.startsWith('v4-ranged-'))).toBe(false);
  e.setBattleRoster();e.music('home');await flush();expect(fetcher.mock.calls.some(([url])=>url.includes('v4-ranged-'))).toBe(false);
 });
 it('retries a failed selected pack without replaying or re-fetching successful packs',async()=>{
  const m=JSON.parse(readFileSync(resolve(import.meta.dirname,'../../public/audio/manifest.json'),'utf8')) as AudioManifest;
  let fail=true;const fetcher=vi.fn(async(url:string)=>url.endsWith('.json')?{ok:true,json:async()=>m}:{ok:!(fail&&url.includes('v4-ranged-ember.')),arrayBuffer:async()=>new ArrayBuffer(8)});vi.stubGlobal('fetch',fetcher);
  const e=new AudioEngine();await e.unlock();e.setBattleRoster(['soot','binding-thread']);await e.preload('battle');await flush();
  expect(e.diagnostics.packs).not.toContain('v4-ranged-ember');expect(e.diagnostics.packs).toContain('v4-ranged-heavy');expect(Context.latest.sources).toHaveLength(0);
  const heavyRequests=fetcher.mock.calls.filter(([url])=>url.includes('v4-ranged-heavy.')).length;
  fail=false;await e.preload('battle');e.play('kit.ranged-ember.impact');expect(e.hits.at(-1)?.result).toBe('played');
  expect(Context.latest.sources).toHaveLength(1);expect(fetcher.mock.calls.filter(([url])=>url.includes('v4-ranged-heavy.'))).toHaveLength(heavyRequests);
 });
 it('preserves a pre-rendered envelope while two distinct receipts share one short window',async()=>{
  const layers=design.layers.slice(0,2),baked=samples().map(sample=>({sample:{...sample,duration:.132,enveloped:true},layers:layers.map(l=>({role:l.role,variantId:'existing',offsetMs:l.offsetMs}))}));
  const m={...fixture,designs:{...fixture.designs,'tx.confirmed':{...design,layers,baked,cooldownMs:0,pitchRange:[1,1],gainRange:[0,0]}}};
  vi.stubGlobal('fetch',vi.fn(async(url:string)=>url.endsWith('.json')?{ok:true,json:async()=>m}:{ok:true,arrayBuffer:async()=>new ArrayBuffer(8)}));
  const e=new AudioEngine();await e.unlock();const ramp=vi.spyOn(Param.prototype,'linearRampToValueAtTime');
  e.play('tx.confirmed');await flush();Context.latest.currentTime+=.02;e.play('tx.confirmed');await flush();
  expect(Context.latest.sources).toHaveLength(2);expect(ramp).not.toHaveBeenCalled();ramp.mockRestore();
  for(let i=0;i<5;i++){e.play('tx.confirmed');await flush();}
  expect(Context.latest.sources).toHaveLength(6);expect(e.hits.at(-1)?.result).toBe('rate-limit');
 });
 it('warms the shared menu speech pack at home without loading it for battle',async()=>{
  const m={...fixture,packs:{...fixture.packs,'menu-voices':{webm:'/menu.webm',mp3:'/menu.mp3'}},cues:{...fixture.cues,'voice.guide.idle':samples('voice').map(s=>({...s,pack:'menu-voices'}))}};
  vi.stubGlobal('fetch',vi.fn(async(url:string)=>url.endsWith('.json')?{ok:true,json:async()=>m}:{ok:true,arrayBuffer:async()=>new ArrayBuffer(8)}));
  const e=new AudioEngine();await e.unlock();await e.preload('battle');expect(e.diagnostics.packs).not.toContain('menu-voices');
  await e.preload('home');expect(e.diagnostics.packs).toContain('menu-voices');
 });
 it('finishes duck recovery on its original deadline while unrelated effects end',async()=>{
  const e=new AudioEngine();await e.unlock();e.play('voice.mochi.ult');await flush();
  const voice=Context.latest.sources[0]!,duck=(e as unknown as {duck:Gain}).duck.gain;
  const ramp=vi.spyOn(duck,'linearRampToValueAtTime');
  Context.latest.currentTime+=.15;e.play('hit.blunt');await flush();
  Context.latest.currentTime=10.4;voice.onended!();
  expect(ramp).toHaveBeenLastCalledWith(1,10.8);
  for(const source of Context.latest.sources.slice(1)){Context.latest.currentTime+=.1;source.onended!();}
  expect(ramp).toHaveBeenCalledTimes(1);
 });
 it('holds a designed effect duck through its last layer before recovering once',async()=>{
  const m={...fixture,designs:{...fixture.designs,'fx.charge':{...design,ducking:true}}};
  vi.stubGlobal('fetch',vi.fn(async(url:string)=>url.endsWith('.json')?{ok:true,json:async()=>m}:{ok:true,arrayBuffer:async()=>new ArrayBuffer(8)}));
  const e=new AudioEngine();await e.unlock();e.play('fx.charge');await flush();
  const duck=(e as unknown as {duck:Gain}).duck.gain,ramp=vi.spyOn(duck,'linearRampToValueAtTime');
  for(const source of Context.latest.sources.slice(0,-1))source.onended!();
  expect(ramp).not.toHaveBeenCalled();expect(duck.value).toBeCloseTo(10**(-8/20));
  Context.latest.currentTime+=.423;Context.latest.sources.at(-1)!.onended!();
  expect(ramp).toHaveBeenCalledTimes(1);expect(ramp).toHaveBeenCalledWith(1,Context.latest.currentTime+.4);
 });
 it('warms authored callouts and resolved terminal fallback only for the current roster after unlock',async()=>{
  const m={...fixture,packs:{...fixture.packs,mochi:{webm:'/mochi.webm',mp3:'/mochi.mp3'},soot:{webm:'/soot.webm',mp3:'/soot.mp3'}},cues:{...fixture.cues,
   'voice.mochi.ult.charge':samples('voice').map(s=>({...s,pack:'mochi'})),
   'voice.soot.ult.charge':samples('voice').map(s=>({...s,pack:'soot'}))}};
  vi.stubGlobal('fetch',vi.fn(async(url:string)=>url.endsWith('.json')?{ok:true,json:async()=>m}:{ok:true,arrayBuffer:async()=>new ArrayBuffer(8)}));
  const e=new AudioEngine();await e.preloadVoices(['party-mochi']);expect(e.diagnostics.packs).toEqual([]);
  await e.unlock();await e.preloadVoices(['party-mochi']);expect(e.diagnostics.packs).toEqual(['mochi','test']);
 });
 it.each(['hit','death'])('starts the first active boss %s voice synchronously after roster preload',async phase=>{
  const e=new AudioEngine(()=>.5);await e.unlock();const settings=e.settings;
  await e.preloadVoices(['foe-0-yarn-giant']);expect(Context.latest.sources).toHaveLength(0);
  const fetched=vi.mocked(fetch).mock.calls.length;
  e.play(`voice.yarn-giant.${phase}`);
  expect(Context.latest.sources).toHaveLength(1);
  expect(Context.latest.sources[0]!.start).toHaveBeenCalledOnce();
  expect(vi.mocked(fetch).mock.calls).toHaveLength(fetched);
  expect(e.settings).toEqual(settings);expect(e.hits.at(-1)?.result).toBe('played');
 });
 it('preloads authored terminal packs without replacing them with fallback or another roster',async()=>{
  const m:AudioManifest={...fixture,packs:{...fixture.packs,hurt:{webm:'/hurt.webm',mp3:'/hurt.mp3'},fallen:{webm:'/fallen.webm',mp3:'/fallen.mp3'},inactive:{webm:'/inactive.webm',mp3:'/inactive.mp3'}},cues:{...fixture.cues,
   'voice.yarn-giant.hit':samples('voice').map(s=>({...s,pack:'hurt'})),
   'voice.yarn-giant.death':samples('voice').map(s=>({...s,pack:'fallen'})),
   'voice.soot.death':samples('voice').map(s=>({...s,pack:'inactive'}))}};
  vi.stubGlobal('fetch',vi.fn(async(url:string)=>url.endsWith('.json')?{ok:true,json:async()=>m}:{ok:true,arrayBuffer:async()=>new ArrayBuffer(8)}));
  const e=new AudioEngine();await e.unlock();await e.preloadVoices(['foe-0-yarn-giant']);
  expect(e.diagnostics.packs).toEqual(['hurt','fallen']);expect(Context.latest.sources).toHaveLength(0);
 });
 it('starts dawn on the boss bar clock and releases both music layers on navigation',async()=>{
  const m={...fixture,packs:{...fixture.packs,dawn:{webm:'/dawn.webm',mp3:'/dawn.mp3'}},cues:{...fixture.cues,
   'music.home':samples('music').map(s=>({...s,loop:true})),
   'music.boss':samples('music').map(s=>({...s,loop:true})),
   'music.boss.dawn':[{pack:'dawn',start:0,duration:30.72,bus:'music' as const,loop:true}]}};
  const fetcher=vi.fn(async(url:string)=>url.endsWith('.json')?{ok:true,json:async()=>m}:{ok:true,arrayBuffer:async()=>new ArrayBuffer(8)});
  vi.stubGlobal('fetch',fetcher);
  const e=new AudioEngine();await e.unlock();e.music('home');await flush();
  expect(e.diagnostics.packs).not.toContain('dawn');
  e.music('boss');await flush();
  const sources=Context.latest.sources.slice(-2);
  expect(sources.map(s=>s.start.mock.calls[0]?.[0])).toEqual([10,10]);
  expect(sources.every(s=>s.loop)).toBe(true);
  expect(e.hits.at(-1)?.id).toBe('music.boss.dawn');
  e.pause(true);expect(Context.latest.state).toBe('suspended');
  e.pause(false);e.music('home');await flush();expect(e.diagnostics.active).toBe(1);
  expect(e.diagnostics.voice).toBe(0);
 });
 it('cycles each pool without repeats across several cycles',()=>{
  const p=new VariantPools(()=>.99);const values=Array.from({length:25},()=>p.next('hit/body',[0,1,2,3,4,5]));
  expect(new Set(values)).toHaveLength(6);expect(values.every((v,i)=>i===0||v!==values[i-1])).toBe(true);
 });
 it('plays four audible roles with bounded jitter, micro offsets and role EQ',async()=>{
  const e=new AudioEngine(()=>.5);await e.unlock();e.play('hit.blunt');await flush();
  expect(e.diagnostics.sfx).toBe(4);expect(e.hits.at(-1)?.layers?.map(l=>l.offsetMs)).toEqual([0,7,18,23]);
  expect(Context.latest.filters.map(f=>[f.type,f.frequency.value])).toEqual(expect.arrayContaining([['lowshelf',1200],['lowshelf',180],['highpass',1800]]));
  expect(Context.latest.sources.map(s=>s.start.mock.calls[0]?.[0])).toEqual([10,10.007,10.018,10.023]);
 });
 it('keeps slow pitched interface layers inside 300 ms without shortening battle impacts',async()=>{
  const e=new AudioEngine(()=>0);await e.unlock();e.play('ui.click',{pitch:.5});await flush();
  const ui=Context.latest.sources.slice();expect(ui).toHaveLength(2);
  for(const source of ui){const [at,,seconds]=source.start.mock.calls[0]!;expect(at-10+seconds/source.playbackRate.value).toBeCloseTo(.3,6);}
  e.play('hit.blunt');await flush();
  for(const source of Context.latest.sources.slice(2))expect(source.start.mock.calls[0]?.[2]).toBe(.4);
 });
 it('starts decoded cues synchronously before later work in the rendering task',async()=>{
  const e=new AudioEngine(()=>.5);await e.unlock();e.play('hit.blunt');await flush();e.stop();
  Context.latest.currentTime+=1;const count=Context.latest.sources.length;
  e.play('hit.blunt');expect(Context.latest.sources).toHaveLength(count+4);
 });
 it('limits real source starts across buses and delayed layers without splitting a composite',async()=>{
  const e=new AudioEngine(()=>.5);await e.unlock();e.play('hit.blunt');await flush();e.stop();Context.latest.currentTime+=1;
  const before=Context.latest.sources.length;
  e.play('hit.blunt');e.play('hit.magic');e.play('ui.click');await flush();
  const burst=Context.latest.sources.slice(before);
  expect(burst).toHaveLength(6);expect(e.hits.some(h=>h.id==='hit.magic'&&h.result==='rate-limit')).toBe(true);
  Context.latest.currentTime+=.095;e.play('hit.magic');await flush();
  expect(Context.latest.sources).toHaveLength(before+6);
  Context.latest.currentTime+=.035;e.play('hit.magic');await flush();expect(Context.latest.sources).toHaveLength(before+10);
  const starts=Context.latest.sources.slice(before).map(s=>s.start.mock.calls[0]![0] as number).sort((a,b)=>a-b);
  for(const at of starts)expect(starts.filter(t=>t>=at&&t-at<.1-1e-9).length).toBeLessThanOrEqual(6);
 });
 it('restores nested dialog music while letting later navigation take precedence',async()=>{
  const music=samples('music').map(s=>({...s,loop:true}));
  const m={...fixture,cues:{...fixture.cues,'music.home':music,'music.forge':music,'music.battle':music}};
  vi.stubGlobal('fetch',vi.fn(async(url:string)=>url.endsWith('.json')?{ok:true,json:async()=>m}:{ok:true,arrayBuffer:async()=>new ArrayBuffer(8)}));
  const e=new AudioEngine();await e.unlock();e.music('home');await flush();
  const closeOuter=e.musicScope('forge'),closeInner=e.musicScope('forge');await flush();
  closeOuter();await flush();expect(e.hits.filter(h=>h.id.startsWith('music.')).at(-1)?.id).toBe('music.forge');
  closeInner();await flush();expect(e.hits.filter(h=>h.id.startsWith('music.')).at(-1)?.id).toBe('music.home');
  expect(Context.latest.filters.filter(f=>f.type==='highshelf').every(f=>f.gain.value===0)).toBe(true);
  const close=e.musicScope('forge');await flush();e.music('battle');await flush();close();await flush();
  expect(e.hits.filter(h=>h.id.startsWith('music.')).at(-1)?.id).toBe('music.battle');
  expect(Context.latest.filters.some(f=>f.type==='highshelf'&&f.gain.value<0)).toBe(true);
  const preferences=e.settings;e.stop();
  expect(Context.latest.filters.filter(f=>f.type==='highshelf').every(f=>f.gain.value===0)).toBe(true);
  expect(e.settings).toEqual(preferences);
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
 it('opens speech space for each scene and restores the menu filter after a boss',async()=>{
  const music=samples('music').map(s=>({...s,loop:true}));
  const m={...fixture,cues:{...fixture.cues,'music.battle':music,'music.boss':music,'music.home':music}};
  vi.stubGlobal('fetch',vi.fn(async(url:string)=>url.endsWith('.json')?{ok:true,json:async()=>m}:{ok:true,arrayBuffer:async()=>new ArrayBuffer(8)}));
  const e=new AudioEngine();await e.unlock();e.music('battle');await flush();
  const shelf=Context.latest.filters.find(f=>f.frequency.value===1200)!;
  expect(shelf.gain.value).toBe(0);
  e.play('voice.mochi.ult');await flush();expect(shelf.gain.value).toBe(-9);expect(e.hits.at(-1)?.layers?.[0]?.gainDb).toBe(5);
  Context.latest.sources.at(-1)!.onended!();expect(shelf.gain.value).toBe(0);
  expect(e.settings.music).toBe(.55);expect(e.diagnostics.voice).toBe(0);
  e.music('boss');await flush();Context.latest.currentTime+=8;
  e.play('voice.soot.ult');await flush();expect(shelf.gain.value).toBe(-8);expect(e.hits.at(-1)?.layers?.[0]?.gainDb).toBe(5);
  const body=Context.latest.filters.find(f=>f.type==='lowshelf'&&f.frequency.value===500)!;
  expect(body.gain.value).toBe(-6);
  expect(shelf.type).toBe('peaking');expect(shelf.frequency.value).toBe(1700);
  Context.latest.sources.at(-1)!.onended!();e.music('home');await flush();Context.latest.currentTime+=8;
  e.play('voice.mochi.ult');await flush();expect(shelf.gain.value).toBe(-9);expect(e.hits.at(-1)?.layers?.[0]?.gainDb).toBe(5);
  expect(shelf.type).toBe('lowshelf');expect(shelf.frequency.value).toBe(1200);
  expect(body.gain.value).toBe(0);
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
 it('does not restart an explicit line at the later fixed-beat charge fallback',async()=>{
  const clock=vi.spyOn(Date,'now').mockReturnValue(1000);
  try{
   const e=new AudioEngine();await e.unlock();e.play('voice.mochi.ult.charge');await flush();
   Context.latest.currentTime+=.6;clock.mockReturnValue(1600);e.play('ult.mochi.charge');await flush();
   expect(e.hits.filter(h=>h.id==='voice.mochi.ult.charge'&&h.result==='played')).toHaveLength(1);
   expect(e.hits.at(-1)?.result).toBe('duplicate');
   Context.latest.sources.at(-1)!.onended!();Context.latest.currentTime+=1;clock.mockReturnValue(2600);
   e.play('voice.mochi.ult.charge');await flush();
   expect(e.hits.filter(h=>h.id==='voice.mochi.ult.charge'&&h.result==='played')).toHaveLength(2);
  }finally{clock.mockRestore();}
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
