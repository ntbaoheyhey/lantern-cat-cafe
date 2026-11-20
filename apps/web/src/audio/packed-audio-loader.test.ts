import {afterEach,describe,expect,it,vi} from 'vitest';
import {PackedAudioLoader,type AudioPackage} from './packed-audio-loader';

const group:AudioPackage={url:'/audio-delivery/test.json',integrity:'sha256-test',paths:['/audio/a.opus','/audio/b.opus']};
const body={version:1,files:{'/audio/a.opus':'AQID','/audio/b.opus':'BAUG'}};
afterEach(()=>{vi.unstubAllGlobals();vi.useRealTimers();});
describe('lossless audio transport',()=>{
 it('enables only complete existing preload groups and coalesces concurrent requests',async()=>{
  const fetcher=vi.fn(async()=>({ok:true,json:async()=>body}));vi.stubGlobal('fetch',fetcher);
  const loader=new PackedAudioLoader([group]),decode=vi.fn(async(bytes:ArrayBuffer)=>[...new Uint8Array(bytes)]);
  loader.allow([group.paths[0]!]);expect(await loader.decode(group.paths[0]!,decode)).toBeUndefined();expect(fetcher).not.toHaveBeenCalled();
  loader.allow(group.paths);
  expect(await Promise.all(group.paths.map(path=>loader.decode(path,decode)))).toEqual([[1,2,3],[4,5,6]]);
  expect(fetcher).toHaveBeenCalledTimes(1);expect(fetcher).toHaveBeenCalledWith(group.url,{integrity:group.integrity,signal:expect.any(AbortSignal)});
 });
 it('creates a fresh encoded buffer after a native-style consuming decoder',async()=>{
  vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,json:async()=>body})));
  const loader=new PackedAudioLoader([group]);loader.allow(group.paths);
  const decoded:ArrayBuffer[]=[];
  const decode=async(bytes:ArrayBuffer)=>{decoded.push(bytes);const value=[...new Uint8Array(bytes)];structuredClone(bytes,{transfer:[bytes]});return value;};
  expect(await loader.decode(group.paths[0]!,decode)).toEqual([1,2,3]);
  expect(await loader.decode(group.paths[0]!,decode)).toEqual([1,2,3]);
  expect(decoded[0]).not.toBe(decoded[1]);expect(decoded.map(bytes=>bytes.byteLength)).toEqual([0,0]);
 });
 it.each(['http','integrity','missing-entry','invalid-base64','decode'])('yields to the original source after %s failure',async failure=>{
  const fetcher=vi.fn(async()=>{
   if(failure==='integrity')throw Error('Integrity mismatch');
   return {ok:failure!=='http',json:async()=>failure==='missing-entry'?{version:1,files:{}}:failure==='invalid-base64'?{version:1,files:{...body.files,'/audio/a.opus':'%%%'}}:body};
  });vi.stubGlobal('fetch',fetcher);
  const loader=new PackedAudioLoader([group]);loader.allow(group.paths);
  const decode=async()=>{if(failure==='decode')throw Error('Decode failed');return true;};
  expect(await loader.decode(group.paths[0]!,decode)).toBeUndefined();
  expect(await loader.decode(group.paths[0]!,decode)).toBeUndefined();expect(fetcher).toHaveBeenCalledTimes(1);
 });
 it('aborts a stalled package and yields to original source loading',async()=>{
  vi.useFakeTimers();
  vi.stubGlobal('fetch',vi.fn((_url:string,options:RequestInit)=>new Promise((_resolve,reject)=>options.signal!.addEventListener('abort',()=>reject(Error('aborted'))))));
  const loader=new PackedAudioLoader([group],20);loader.allow(group.paths);
  const pending=loader.decode(group.paths[0]!,async()=>true);await vi.advanceTimersByTimeAsync(20);
  expect(await pending).toBeUndefined();
 });
});
