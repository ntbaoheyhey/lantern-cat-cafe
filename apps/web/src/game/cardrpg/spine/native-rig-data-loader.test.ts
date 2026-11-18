import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {afterEach,expect,it,vi} from 'vitest';
import manifest from './native-rig-data-manifest-loader.json';
import {decodeNativeRigData} from './native-rig-data-codec';

const read=(path:string)=>readFileSync(new URL('../../../../public'+path,import.meta.url),'utf8');
const parse=(path:string)=>JSON.parse(read(path));
const ids=Object.keys(manifest.units) as (keyof typeof manifest.units)[];
const dictionary=parse(manifest.shared.url);
const original=(id:string)=>parse(`/units/${id}/rig.json`);
const json=(data:unknown)=>new Response(JSON.stringify(data),{headers:{'Content-Type':'application/json'}});
afterEach(()=>{vi.unstubAllGlobals();vi.useRealTimers();vi.resetModules();});

it.each(ids)('preserves every value, field and distinct container in %s',id=>{
 const encoded=parse(manifest.units[id].url),decoded=decodeNativeRigData(encoded,dictionary,id),expected=original(id);
 expect(decoded).toEqual(expected);expect(JSON.stringify(decoded)).toBe(JSON.stringify(expected));
 const seen=new WeakSet<object>();
 function visit(value:unknown){if(value===null||typeof value!=='object')return;expect(seen.has(value)).toBe(false);seen.add(value);Object.values(value).forEach(visit);}
 visit(decoded);
 for(const delivery of [manifest.shared,manifest.units[id]])expect('sha256-'+createHash('sha256').update(read(delivery.url)).digest('base64')).toBe(delivery.integrity);
 expect(createHash('sha256').update(read(`/units/${id}/rig.json`)).digest('hex')).toBe(manifest.units[id].sourceSha256);
});

it('rejects mixed identities, invalid references and cyclic dictionaries',()=>{
 const unit=parse(manifest.units['needle-moth'].url);
 expect(()=>decodeNativeRigData(unit,dictionary,'kettle-knight')).toThrow('identity');
 for(const ref of [-1,1.5,dictionary.entries.length])expect(()=>decodeNativeRigData({...unit,data:{$:ref}},dictionary,'needle-moth')).toThrow('reference');
 expect(()=>decodeNativeRigData({...unit,data:{$:0}},{version:1,entries:[{$:0}]},'needle-moth')).toThrow('reference');
 expect(()=>decodeNativeRigData({...unit,version:2},dictionary,'needle-moth')).toThrow('identity');
});

it('shares one pinned dictionary across concurrent enemies',async()=>{
 const fetcher=vi.fn(async(path:string,options?:RequestInit)=>{
  expect(options?.integrity).toMatch(/^sha256-/);expect(options?.signal).toBeInstanceOf(AbortSignal);return new Response(read(path));
 });vi.stubGlobal('fetch',fetcher);
 const {loadNativeRigData}=await import('./native-rig-data-loader');
 const result=await Promise.all(ids.map(id=>loadNativeRigData(id,true)));
 result.forEach((data,i)=>expect(data).toEqual(original(ids[i]!)));
 expect(fetcher.mock.calls.filter(([path])=>path===manifest.shared.url)).toHaveLength(1);
 expect(fetcher).toHaveBeenCalledTimes(11);
});

it('keeps direct previews and unknown units on the original request path',async()=>{
 const fetcher=vi.fn(async()=>json(original('needle-moth')));vi.stubGlobal('fetch',fetcher);
 const {loadNativeRigData}=await import('./native-rig-data-loader');
 await loadNativeRigData('needle-moth');await loadNativeRigData('unlisted-unit',true);await loadNativeRigData('toString',true);
 expect(fetcher.mock.calls).toEqual([['/units/needle-moth/rig.json'],['/units/unlisted-unit/rig.json'],['/units/toString/rig.json']]);
});

it.each(['http','integrity','invalid-json','invalid-shape'])('recovers the full original after a packed %s failure',async failure=>{
 const path=manifest.units['needle-moth'].url;
 const fetcher=vi.fn(async(url:string)=>{
  if(url===path){if(failure==='http')return new Response('',{status:503});if(failure==='integrity')throw TypeError('integrity mismatch');if(failure==='invalid-json')return new Response('{');return json({version:1,id:'needle-moth',data:{$:99999}});}
  return new Response(read(url));
 });vi.stubGlobal('fetch',fetcher);
 const {loadNativeRigData}=await import('./native-rig-data-loader');
 expect(await loadNativeRigData('needle-moth',true)).toEqual(original('needle-moth'));
 expect(fetcher).toHaveBeenCalledWith('/units/needle-moth/rig.json');
});

it('retries a failed shared dictionary on a later load',async()=>{
 let reject=true;const fetcher=vi.fn(async(url:string)=>{
  if(url===manifest.shared.url&&reject){reject=false;throw TypeError('network unavailable');}return new Response(read(url));
 });vi.stubGlobal('fetch',fetcher);
 const {loadNativeRigData}=await import('./native-rig-data-loader');
 expect(await loadNativeRigData('needle-moth',true)).toEqual(original('needle-moth'));
 expect(await loadNativeRigData('teacup-healer',true)).toEqual(original('teacup-healer'));
 expect(fetcher.mock.calls.filter(([path])=>path===manifest.shared.url)).toHaveLength(2);
 expect(fetcher.mock.calls.filter(([path])=>path.endsWith('/rig.json'))).toEqual([['/units/needle-moth/rig.json']]);
});

it('bounds a stalled delivery and then loads the original',async()=>{
 vi.useFakeTimers();
 const fetcher=vi.fn((url:string,options?:RequestInit)=>{
  if(url===manifest.units['needle-moth'].url)return new Promise<Response>((_,reject)=>options!.signal!.addEventListener('abort',()=>reject(new DOMException('aborted','AbortError')),{once:true}));
  return Promise.resolve(new Response(read(url)));
 });vi.stubGlobal('fetch',fetcher);
 const {loadNativeRigData}=await import('./native-rig-data-loader'),pending=loadNativeRigData('needle-moth',true);
 await vi.advanceTimersByTimeAsync(2000);
 expect(await pending).toEqual(original('needle-moth'));expect(fetcher).toHaveBeenCalledWith('/units/needle-moth/rig.json');
});

it('retains the original HTTP error when both paths fail',async()=>{
 vi.stubGlobal('fetch',vi.fn(async()=>new Response('',{status:404})));
 const {loadNativeRigData}=await import('./native-rig-data-loader');
 await expect(loadNativeRigData('needle-moth',true)).rejects.toThrow('Native rig needle-moth: HTTP 404');
});
