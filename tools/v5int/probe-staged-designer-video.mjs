/** Isolated delivery research. Does not load or modify the game candidate. */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile, writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';

const root=resolve(import.meta.dirname,'../..');
const folder=resolve(root,process.argv[2]??'work/v5/CXI/batch-m/staged-video-study-r1');
const req=createRequire(resolve(root,'apps/web/package.json'));
const {chromium,webkit}=req('@playwright/test');
const remux=JSON.parse(await readFile(resolve(folder,'remux.json'),'utf8'));
const sha=b=>createHash('sha256').update(b).digest('hex');
const harnessBytes=await readFile(import.meta.filename),harnessSha256=sha(harnessBytes);
const harnessSnapshot=resolve(folder,`harness-${harnessSha256}.mjs`);await writeFile(harnessSnapshot,harnessBytes);
const assets=new Map(), specs=[];
for(const cat of remux.cats){
 const trial=cat.trials.find(t=>t.name==='empty');
 assert(trial.packetPayloadsExact&&Math.abs(trial.maxPtsDelta-2/30)<.000002);
 const original=await readFile(cat.source),data=await readFile(trial.path);
 assert.equal(sha(original),cat.sourceSha256);assert.equal(sha(data),trial.sha256);
 assets.set(`/${cat.cat}/native.mp4`,original);
 const moofs=trial.boxes.filter(b=>b.type==='moof');
 const init=data.subarray(0,moofs[0].offset);assets.set(`/${cat.cat}/init.mp4`,init);
 const segments=moofs.map((box,i)=>{
  const mdat=trial.boxes.find(b=>b.offset===box.offset+box.size);assert.equal(mdat.type,'mdat');
  const bytes=data.subarray(box.offset,mdat.offset+mdat.size),url=`/${cat.cat}/${i}.m4s`;
  assets.set(url,bytes);return {url,bytes:bytes.length,start:i?250/30:0,end:i?10:250/30};
 });
 specs.push({cat:cat.cat,source:cat.source,sourceSha256:cat.sourceSha256,mime:`video/mp4; codecs="avc1.6400${cat.cat==='mochi'?'28':'1f'}"`,
  native:`/${cat.cat}/native.mp4`,nativeBytes:original.length,init:`/${cat.cat}/init.mp4`,initBytes:init.length,segments,timestampOffset:0});
}
const requests=[];
// A controlled local link: 250,000 body bytes/s per request, 80ms initial delay.
// This is an isolated comparison, not the project's cold transfer budget gate.
const server=createServer((request,response)=>{
 const u=new URL(request.url,'http://127.0.0.1:6308');
 if(u.pathname==='/'){response.writeHead(200,{'Content-Type':'text/html','Cache-Control':'no-store'});response.end('<!doctype html><title>Isolated designer delivery study</title>');return;}
 const data=assets.get(u.pathname);if(!data){response.writeHead(404);response.end();return;}
 let start=0,end=data.length-1,status=200;
 const range=/^bytes=(\d+)-(\d*)$/.exec(request.headers.range??'');
 if(range){start=Number(range[1]);end=range[2]?Math.min(end,Number(range[2])):end;status=206;}
 if(start>end||start>=data.length){response.writeHead(416,{'Content-Range':`bytes */${data.length}`});response.end();return;}
 const row={case:u.searchParams.get('case'),baseline:u.searchParams.has('baseline'),url:u.pathname,range:request.headers.range??null,start,end,status,sent:0,complete:false,utc:new Date().toISOString()};requests.push(row);
 response.writeHead(status,{'Content-Type':'video/mp4','Cache-Control':'no-store','Accept-Ranges':'bytes','Content-Length':end-start+1,...(status===206?{'Content-Range':`bytes ${start}-${end}/${data.length}`}:{})});
 let offset=start,timer;
 const send=()=>{if(response.destroyed)return;const next=Math.min(end+1,offset+16384);response.write(data.subarray(offset,next));row.sent+=next-offset;offset=next;if(offset>end){row.complete=true;response.end();}else timer=setTimeout(send,16384/250000*1000);};
 timer=setTimeout(send,80);response.on('close',()=>clearTimeout(timer));
});
await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(6308,'127.0.0.1',resolve);});
const report={utc:new Date().toISOString(),studyOnly:true,gameCandidateUnchanged:true,viewport:{width:1280,height:720},sourceBuild:remux.sourceBuild,
 harnessSha256,harnessSnapshot,remuxPath:resolve(folder,'remux.json'),remuxSha256:sha(await readFile(resolve(folder,'remux.json'))),
 methodology:'Isolated native/video-MSE comparison, 250000B/s per HTTP request and 80ms initial delay. Server body counts exclude response headers. Byte counters include full completed requests before ready, and actual partial sent bytes. No cold-game budget pass is inferred.',
 specs,rows:[],requests,complete:false};
const debug=process.env.CXI_STAGED_DEBUG==='1';
const output=process.env.CXI_STAGED_OUTPUT??(debug?'browser-debug.json':'browser.json');assert(/^[a-z0-9-]+\.json$/.test(output));
const save=()=>writeFile(resolve(folder,output),JSON.stringify(report,null,2)+'\n');
try{
 for(const [engine,type] of [['chromium',chromium],['webkit',webkit]]){
  if(process.env.CXI_STAGED_ENGINE&&process.env.CXI_STAGED_ENGINE!==engine)continue;
  const browser=await type.launch({headless:true,...(engine==='chromium'?{args:['--use-angle=metal']}: {})});
  try{
   for(const spec of specs)for(const run of [{mode:'native-auto',phase:5.133333333333333},{mode:'native-metadata',phase:5.133333333333333},... [.5,5.133333333333333,9.5].map(phase=>({mode:'mse',phase}))]){
    if(debug&&(engine!=='chromium'||spec.cat!=='mochi'||run.mode!=='mse'||run.phase!==.5))continue;
    if(process.env.CXI_STAGED_CAT&&spec.cat!==process.env.CXI_STAGED_CAT)continue;
    if(process.env.CXI_STAGED_PHASE&&(run.mode!=='mse'||run.phase!==Number(process.env.CXI_STAGED_PHASE)))continue;
    const id=`${engine}-${spec.cat}-${run.mode}-${run.phase}`,row={id,engine,version:browser.version(),...run,cat:spec.cat,errors:[]};
    report.rows.push(row);const context=await browser.newContext({viewport:report.viewport,serviceWorkers:'block'}),page=await context.newPage();
    page.on('pageerror',e=>row.errors.push(String(e)));await page.goto('http://127.0.0.1:6308/');
    await page.exposeFunction('bodyCount',(excludeBaseline=false)=>requests.filter(r=>r.case===id&&(!excludeBaseline||!r.baseline)).reduce((s,r)=>s+r.sent,0));
    try{
     row.result=await page.evaluate(async ({spec,run,id})=>{
      const sleep=ms=>new Promise(r=>setTimeout(r,ms));
      const timeout=(p,label,ms=15000)=>Promise.race([p,new Promise((_,reject)=>setTimeout(()=>reject(Error(label)),ms))]);
      const once=(el,event)=>timeout(new Promise((resolve,reject)=>{el.addEventListener(event,resolve,{once:true});el.addEventListener('error',()=>reject(Error(`${event}: ${el.error?.message??'error'}`)),{once:true});}),event);
      const url=path=>path+'?case='+encodeURIComponent(id),t0=performance.now();
      const video=document.createElement('video');video.muted=true;video.playsInline=true;video.loop=true;video.preload=run.mode==='native-metadata'?'metadata':'auto';document.body.append(video);
      const events=[];for(const event of ['waiting','stalled','playing','seeking','seeked','ended','error'])video.addEventListener(event,()=>events.push({event,at:performance.now()-t0,time:video.currentTime,error:video.error?.message}));
      window.study={video,events,callbacks:[]};
      const buffers=()=>Array.from({length:video.buffered.length},(_,i)=>[video.buffered.start(i),video.buffered.end(i)]);
      const frame=async(target,v=video)=>{
       v.pause();let callback;
       const seek=async position=>{const settled=once(v,'seeked');await timeout(new Promise(resolve=>{
        const tick=(_,metadata)=>{window.study.callbacks.push({target:position,mediaTime:metadata.mediaTime,currentTime:v.currentTime});if(Math.abs(metadata.mediaTime-position)<=1/30+.000002){callback=metadata;resolve();}else v.requestVideoFrameCallback(tick);};
        v.requestVideoFrameCallback(tick);v.currentTime=position;
       }),'decoded frame '+position);await settled;await new Promise(requestAnimationFrame);};
       // WebKit need not emit a fresh callback when seeking to the displayed frame.
       // Force a real, buffered neighbor before re-observing the same target.
       if(v.readyState>=2&&Math.abs(v.currentTime-target)<1/120)await seek(target>=.1?target-2/30:target+2/30);
       await seek(target);const canvas=document.createElement('canvas');canvas.width=v.videoWidth;canvas.height=v.videoHeight;
       const c=canvas.getContext('2d',{willReadFrequently:true});c.drawImage(v,0,0);const pixels=c.getImageData(0,0,canvas.width,canvas.height).data;
       const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',pixels)),b=>b.toString(16).padStart(2,'0')).join('');
       return {target,mediaTime:callback.mediaTime,presentedFrames:callback.presentedFrames,currentTime:v.currentTime,width:canvas.width,height:canvas.height,sha256:hash};
      };
      const support={canPlay:video.canPlayType(spec.mime),mse:Boolean(window.MediaSource?.isTypeSupported(spec.mime)),managed:Boolean(window.ManagedMediaSource?.isTypeSupported(spec.mime))};
      let source,buffer,add,loaded=new Set();
      if(run.mode==='mse'){
       if(!support.mse)return {support,unsupported:true};
       source=new MediaSource();window.study.source=source;const opened=once(source,'sourceopen');video.src=URL.createObjectURL(source);await opened;
       buffer=source.addSourceBuffer(spec.mime);window.study.buffer=buffer;buffer.timestampOffset=spec.timestampOffset;
       const append=async path=>{const r=await fetch(url(path));if(!r.ok)throw Error('HTTP '+r.status);const bytes=await r.arrayBuffer();const done=once(buffer,'updateend');buffer.appendBuffer(bytes);await done;};
       await append(spec.init);source.duration=10;
       add=async i=>{if(!loaded.has(i)){await append(spec.segments[i].url);loaded.add(i);}};
       await add(run.phase>=250/30?1:0);
      }else{const ready=once(video,'loadeddata');video.src=url(spec.native);video.load();await ready;}
      const initial=await frame(run.phase),firstFrameMs=performance.now()-t0,firstBodyBytes=await window.bodyCount(),initialBuffered=buffers();
      if(run.mode==='mse'){for(let i=0;i<spec.segments.length;i++)await add(i);source.endOfStream();}
      const samples=[];
      // Baseline comparisons use a distinct native element; its bytes remain counted.
      const baseline=document.createElement('video');baseline.muted=true;baseline.playsInline=true;baseline.preload='auto';document.body.append(baseline);
      const ready=once(baseline,'loadeddata');baseline.src=url(spec.native)+'&baseline=1';baseline.load();await ready;
      for(const target of [.5,5.133333333333333,9.5]){
       const a=await frame(target),b=await frame(target,baseline);samples.push({delivered:a,baseline:b,exact:a.sha256===b.sha256,frameDelta:a.mediaTime-b.mediaTime});
      }
      baseline.pause();baseline.removeAttribute('src');baseline.load();baseline.remove();
      let loop=null;
      if(run.mode==='mse'&&run.phase===9.5){
       await frame(9.5);const start=performance.now(),times=[],eventsStart=events.length;let live=true;
       const tick=(_,m)=>{times.push({wall:performance.now()-start,time:m.mediaTime});if(live)video.requestVideoFrameCallback(tick);};video.requestVideoFrameCallback(tick);await video.play();await sleep(11500);live=false;video.pause();
       loop={wallMs:performance.now()-start,callbacks:times.length,wraps:times.slice(1).filter((x,i)=>x.time<times[i].time-.5).length,maxCallbackGapMs:Math.max(0,...times.slice(1).map((x,i)=>x.wall-times[i].wall)),events:events.slice(eventsStart),times};
      }
      const final={support,initial,firstFrameMs,firstBodyBytes,initialBuffered,samples,loop,events,duration:video.duration,finalBuffered:buffers(),deliveredBodyBytes:await window.bodyCount(true),totalBodyBytesIncludingBaseline:await window.bodyCount()};
      video.pause();video.removeAttribute('src');video.load();return final;
     },{spec,run,id});
    }catch(error){row.failure=String(error);row.debug=await page.evaluate(()=>{const s=window.study,v=s?.video,b=s?.buffer;return {events:s?.events,callbacks:s?.callbacks,currentTime:v?.currentTime,duration:v?.duration,readyState:v?.readyState,seeking:v?.seeking,paused:v?.paused,error:v?.error?.message,source:s?.source?.readyState,timestampOffset:b?.timestampOffset,buffered:b?Array.from({length:b.buffered.length},(_,i)=>[b.buffered.start(i),b.buffered.end(i)]):null};}).catch(()=>null);}
    finally{await context.close();await save();}
    console.log(JSON.stringify({id,failure:row.failure,firstBody:row.result?.firstBodyBytes,pixelExact:row.result?.samples?.every(x=>x.exact),loopWraps:row.result?.loop?.wraps}));
   }
  }finally{await browser.close();}
 }
 report.complete=true;
}finally{server.closeAllConnections();await new Promise(r=>server.close(r));await save();}
