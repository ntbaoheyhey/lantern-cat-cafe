import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {DesignerIdleMedia,type DesignerIdleManifest} from './designer-idle-loader';
import {DesignerIdleActorMedia} from './designer-idle-actor-loader';

class Video extends EventTarget {
 videoWidth=624;videoHeight=520;duration=10;currentTime=0;paused=true;seeking=false;readyState=4;
 playbackRate=1;error=null;src='';muted=true;playsInline=true;loop=true;preload='';crossOrigin='';
 callbacks=new Map<number,VideoFrameRequestCallback>();nextCallback=0;
 play=vi.fn(()=>{this.paused=false;return Promise.resolve();});
 pause=vi.fn(()=>{this.paused=true;});
 load=vi.fn();remove=vi.fn();removeAttribute=vi.fn();
 requestVideoFrameCallback=(callback:VideoFrameRequestCallback)=>{const id=++this.nextCallback;this.callbacks.set(id,callback);return id;};
 cancelVideoFrameCallback=(id:number)=>{this.callbacks.delete(id);};
 presentFrame(mediaTime=this.currentTime){
  const pending=[...this.callbacks];this.callbacks.clear();
  for(const [,callback]of pending)callback(0,{mediaTime} as VideoFrameCallbackMetadata);
 }
}
const mediaInstances:DesignerIdleMedia[]=[];
let video:Video;
const clock=(worldTime=2)=>({worldTime,paused:false,fixedTime:false,frozen:false});
const manifest=(id:'mochi'|'clover'='mochi'):DesignerIdleManifest=>({
 version:1,id,format:'h264-ycrcb-alpha-four-plane',video:`/units/${id}/designer-idle-ab.mp4`,poster:`/units/${id}/designer-idle-cd.webp`,
 width:312,height:260,opaqueHeight:256,foot:[165,258],duration:10,fps:30,frames:300,sourceSha256:'a'.repeat(64),videoSha256:'b'.repeat(64),posterSha256:'c'.repeat(64),videoBytes:931787,
 sockets:Object.fromEntries(['root','hip','head','hp-anchor','vfx-origin','main-hand','off-hand'].map(k=>[k,[165,200]])),
});
function create(id:'mochi'|'clover'='mochi'){
 const media=new DesignerIdleMedia(manifest(id),{} as HTMLImageElement);mediaInstances.push(media);return media;
}
async function prepared(id:'mochi'|'clover'='mochi'){
 const media=create(id);video.dispatchEvent(new Event('loadeddata'));video.presentFrame();expect(await media.ready).toBe(true);return media;
}
beforeEach(()=>{
 vi.useFakeTimers();video=new Video();
 const pixels=new Uint8ClampedArray(16*16*4);pixels[4]=255;
 const document=Object.assign(new EventTarget(),{hidden:false,createElement:(tag:string)=>tag==='video'?video:{width:0,height:0,getContext:()=>({drawImage:vi.fn(),getImageData:()=>({data:pixels})})}});
 vi.stubGlobal('document',document);vi.stubGlobal('requestAnimationFrame',vi.fn(()=>1));vi.stubGlobal('cancelAnimationFrame',vi.fn());
});
afterEach(()=>{for(const media of mediaInstances.splice(0))media.dispose();vi.useRealTimers();vi.unstubAllGlobals();});

it.each(['mochi','clover'] as const)('stops prepared %s between scene samples and resumes only on an active clock',async id=>{
 const media=await prepared(id);media.sample(clock(3),false);expect(video.paused).toBe(false);
 const texture=media.material.map,at=video.currentTime;
 new DesignerIdleActorMedia(media).setSuspended(true);
 media.sample(clock(8),false);await vi.advanceTimersByTimeAsync(6000);
 expect(media.state).toMatchObject({ready:true,suspended:true,paused:true,currentTime:at,failure:undefined});
 expect(media.material.map).toBe(texture);
 media.setSuspended(false);expect(video.paused).toBe(true);
 media.sample({...clock(8),paused:true},false);expect(video.paused).toBe(true);
 media.sample(clock(8),false);expect(video.paused).toBe(false);expect(video.currentTime).toBe(8);
});

it('defers an unloaded suspended actor without expiring first-frame readiness',async()=>{
 const media=create();media.setSuspended(true);video.dispatchEvent(new Event('loadeddata'));
 await vi.advanceTimersByTimeAsync(6000);expect(video.play).not.toHaveBeenCalled();expect(media.failure).toBeUndefined();
 media.setSuspended(false);expect(video.play).toHaveBeenCalledOnce();video.presentFrame();expect(await media.ready).toBe(true);
});

it('ignores an interrupted play rejection even if the scene has already resumed',async()=>{
 const media=await prepared();let reject!:(reason:Error)=>void;
 video.play.mockImplementationOnce(()=>{video.paused=false;return new Promise<void>((_,no)=>{reject=no;});});
 media.sample(clock(),false);media.setSuspended(true);media.setSuspended(false);media.sample(clock(4),false);
 reject(new DOMException('Interrupted by pause','AbortError'));await vi.advanceTimersByTimeAsync(0);
 expect(media.failure).toBeUndefined();expect(media.state.ready).toBe(true);expect(video.paused).toBe(false);
});

it('pauses a late play resolution after suspension',async()=>{
 const media=await prepared();let resolve!:()=>void;
 video.play.mockImplementationOnce(()=>{video.paused=false;return new Promise<void>(yes=>{resolve=yes;});});
 media.sample(clock(),false);media.setSuspended(true);
 video.paused=false;resolve();await vi.advanceTimersByTimeAsync(0);
 expect(video.paused).toBe(true);expect(media.failure).toBeUndefined();
});

it('keeps an accepted first frame when its bootstrap play is interrupted by the initial pause',async()=>{
 let reject!:(reason:Error)=>void;
 video.play.mockImplementationOnce(()=>{video.paused=false;return new Promise<void>((_,no)=>{reject=no;});});
 const media=create();video.dispatchEvent(new Event('loadeddata'));video.presentFrame();expect(await media.ready).toBe(true);
 reject(new DOMException('First frame paused','AbortError'));await vi.advanceTimersByTimeAsync(0);
 expect(media.failure).toBeUndefined();expect(media.state.ready).toBe(true);expect(video.paused).toBe(true);
});

it('retains the poster fallback for a real active playback rejection',async()=>{
 const media=await prepared();video.play.mockRejectedValueOnce(new Error('Decoder unavailable'));
 media.sample(clock(),false);await vi.advanceTimersByTimeAsync(0);
 expect(media.failure).toContain('Decoder unavailable');expect(media.material.map).toBe(media.posterTexture);
});

it('keeps reduced motion static after resuming and ignores post-disposal resumes',async()=>{
 const media=await prepared();media.sample(clock(),false);media.setSuspended(true);media.setSuspended(false);
 media.sample(clock(7),true);expect(video.currentTime).toBe(0);expect(video.paused).toBe(true);
 media.dispose();const calls=video.play.mock.calls.length;media.setSuspended(false);media.sample(clock(),false);
 expect(video.play).toHaveBeenCalledTimes(calls);expect(media.state.disposed).toBe(true);
});

it('keeps the presented phase until a callback even when seeked arrives first',async()=>{
 const media=await prepared(),frames:number[]=[];media.onFrame=()=>frames.push(media.sourceFrame);
 video.currentTime=4;video.presentFrame(2.5);expect(media.sourceFrame).toBe(75);
 media.sample({...clock(8),paused:true,fixedTime:true},false);
 video.dispatchEvent(new Event('seeked'));
 expect(video.currentTime).toBe(8);expect(media.sourceFrame).toBe(75);expect(frames).toEqual([75]);
 video.presentFrame(8);expect(media.sourceFrame).toBe(240);expect(frames).toEqual([75,240]);
});

it('retains decoded phase through reduced-motion seeking, suspension and loop wrap',async()=>{
 const media=await prepared();video.currentTime=9.98;video.presentFrame(9.966667);
 expect(media.sourceFrame).toBe(299);media.sample(clock(7),true);
 expect(video.currentTime).toBe(0);expect(media.sourceFrame).toBe(299);
 video.presentFrame(0);expect(media.sourceFrame).toBe(0);
 media.setSuspended(true);video.currentTime=4;video.presentFrame(4);expect(media.sourceFrame).toBe(0);
 media.setSuspended(false);video.presentFrame(4);expect(media.sourceFrame).toBe(120);
 video.presentFrame(10);expect(media.sourceFrame).toBe(0);
});

it('keeps an explicit clock fallback when native frame callbacks are unavailable',async()=>{
 Reflect.deleteProperty(video,'requestVideoFrameCallback');
 const media=create();video.dispatchEvent(new Event('loadeddata'));video.currentTime=2.5;
 video.dispatchEvent(new Event('seeked'));expect(await media.ready).toBe(true);
 expect(media.state).toMatchObject({sourceFrame:75,presentedTime:2.5,presentationClock:'clock-fallback'});
});
