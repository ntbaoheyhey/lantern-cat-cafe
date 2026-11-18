/** Isolated codec study. No application routes/assets, no gameplay acceptance. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile,writeFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {createServer} from 'node:http';
import {resolve,sep} from 'node:path';
const root=resolve(import.meta.dirname,'../..'),base=resolve(root,'work/v5/CXI/batch-m/experiments');
const require=createRequire(resolve(root,'apps/web/package.json'));
const engines=require('@playwright/test');
const variant=process.argv[2]??'untagged';assert(/^[a-z0-9-]+$/.test(variant));
const server=createServer(async(req,res)=>{try{
 const relative=decodeURIComponent(new URL(req.url,'http://localhost').pathname).slice(1);
 if(!relative){res.setHeader('content-type','text/html');res.end('<!doctype html><title>Batch M codec study</title>');return;}
 const path=resolve(base,relative);assert(path.startsWith(base+sep));const data=await readFile(path);
 res.setHeader('content-type','video/mp4');res.setHeader('accept-ranges','bytes');
 const range=req.headers.range?.match(/bytes=(\d+)-(\d*)/);
 if(range){const start=+range[1],end=range[2]?Math.min(+range[2],data.length-1):data.length-1;res.statusCode=206;res.setHeader('content-range',`bytes ${start}-${end}/${data.length}`);res.setHeader('content-length',end-start+1);res.end(data.subarray(start,end+1));}
 else{res.setHeader('content-length',data.length);res.end(data);}
 }catch(e){res.statusCode=404;res.end(String(e));}});
await new Promise(r=>server.listen(6308,'127.0.0.1',r));
const report={utc:new Date().toISOString(),variant,purpose:'Standalone native codec/alpha packing experiment; not gameplay or final browser support certification',viewport:[1280,720],runs:[]};
try{
 for(const name of ['chromium','webkit','firefox']){
  if(!existsSync(engines[name].executablePath())){report.runs.push({engine:name,available:false});continue;}
  const browser=await engines[name].launch({headless:true,...(name==='chromium'?{args:['--use-angle=metal']}: {})});
  try{const page=await browser.newPage({viewport:{width:1280,height:720}});await page.goto('http://127.0.0.1:6308/');
   for(const cat of ['mochi','clover']){
    const row=await page.evaluate(async ({cat,variant})=>{
     const timeout=(promise,ms)=>Promise.race([promise,new Promise((_,reject)=>setTimeout(()=>reject(Error('video timeout')),ms))]);
     const v=document.createElement('video');v.muted=true;v.playsInline=true;v.loop=true;v.preload='auto';document.body.append(v);
     const ready=new Promise((r,j)=>{v.addEventListener('loadeddata',r,{once:true});v.addEventListener('error',()=>j(Error(String(v.error?.code))),{once:true});});
     const started=performance.now();v.src=`/${cat}-384/premul-mask-256-crf28${variant==='untagged'?'':'-'+variant}.mp4`;await timeout(ready,10000);
     const loadMs=performance.now()-started,w=v.videoWidth,h=v.videoHeight/2;
     const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h*2;const ctx=canvas.getContext('2d',{willReadFrequently:true});
     const samples=[];
     for(const seconds of [0,1,5,9.95]){
      if(seconds>0){const seek=new Promise(r=>v.addEventListener('seeked',r,{once:true}));v.currentTime=seconds;await timeout(seek,5000);}
      ctx.drawImage(v,0,0);const packed=ctx.getImageData(0,0,w,h*2).data;
      let clear=0,opaque=0,sum=0;const points=[];
      for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4,a=packed[(h*w+y*w+x)*4]/255;if(a<.01)clear++;if(a>.99)opaque++;sum+=a;
       if((x===0&&y===0)||(x===Math.floor(w/2)&&y===Math.floor(h/2)))points.push({xy:[x,y],premul:Array.from(packed.slice(i,i+3)),alpha:a,overWhite:Array.from(packed.slice(i,i+3)).map(c=>Math.min(255,c+255*(1-a)))});
      }
      samples.push({seconds,actual:v.currentTime,clear,opaque,alphaMean:sum/(w*h),points});
     }
     const startTime=v.currentTime,times=[];let callbacks=0;
     const cb=(_now,meta)=>{times.push(meta.mediaTime);callbacks++;if(callbacks<40)v.requestVideoFrameCallback(cb);};
     if(v.requestVideoFrameCallback)v.requestVideoFrameCallback(cb);
     await timeout(v.play(),5000);await new Promise(r=>setTimeout(r,700));v.pause();
     const endTime=v.currentTime,quality=v.getVideoPlaybackQuality?.();v.removeAttribute('src');v.load();v.remove();
     return {cat,ua:navigator.userAgent,loadMs,dimensions:[w,h*2],samples,startTime,endTime,loopWrapped:endTime<startTime,callbacks,times,quality:quality?{total:quality.totalVideoFrames,dropped:quality.droppedVideoFrames}:null};
    },{cat,variant});report.runs.push({engine:name,version:browser.version(),available:true,...row});
   }
  }catch(error){report.runs.push({engine:name,error:String(error)});}finally{await browser.close();}
 }
 await writeFile(resolve(root,`reports/v5/CXI/evidence/v8-m-codec-browser${variant==='untagged'?'':'-'+variant}.json`),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({variant,runs:report.runs.map(({engine,version,cat,error,available,samples,loopWrapped})=>({engine,version,cat,error,available,loopWrapped,center:samples?.map(s=>s.points[1])}))}));
}finally{await new Promise(r=>server.close(r));}
