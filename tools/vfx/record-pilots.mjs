/** Record the actual rendered canvases without navigation frames or recorder startup. */
import {createRequire} from 'node:module';import {resolve} from 'node:path';import {writeFile} from 'node:fs/promises';import {execFileSync} from 'node:child_process';
const root=process.cwd(),require=createRequire(resolve(root,'apps/web/package.json')),{chromium}=require('@playwright/test'),out='/Users/bao/art/vfx-2026-11-12/review';
const browser=await chromium.launch(),page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});
try{
 await page.goto((process.env.C2_URL??'http://127.0.0.1:5970')+'/@fs'+resolve(root,'tools/vfx/preview.html'));await page.waitForFunction(()=>window.vfxPreview?.scene.ready);
 for(const id of ['mochi-1','mochi-4','enemy:yarn-giant'])for(const before of [true,false]){
  await page.evaluate(async({id,before})=>{const g=window.vfxPreview;g.setManual(true);g.choose(id);g.setBefore(before);await g.scene.effects.ready;g.sample(0);},{id,before});await page.waitForFunction(()=>window.vfxPreview.scene.ready);
  const bytes=await page.evaluate(async id=>{
   const g=window.vfxPreview,host=document.querySelector('#stage'),canvas=document.createElement('canvas');canvas.width=host.clientWidth;canvas.height=host.clientHeight;
   const ctx=canvas.getContext('2d'),stream=canvas.captureStream(0),track=stream.getVideoTracks()[0],recorder=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp9',videoBitsPerSecond:3_000_000}),parts=[];
   recorder.ondataavailable=e=>parts.push(e.data);const stopped=new Promise(resolve=>recorder.onstop=resolve);recorder.start();
   let begin=0,lastCycle=0;const span=g.fixture.plan.duration+600;
   await new Promise(resolve=>{function frame(now){if(!begin)begin=now;const elapsed=now-begin,cycle=Math.floor(elapsed/span);if(cycle>lastCycle&&cycle<2){g.choose(id);lastCycle=cycle;}g.sample(elapsed%span);
    ctx.clearRect(0,0,canvas.width,canvas.height);for(const c of host.querySelectorAll('canvas'))if(!c.hidden)ctx.drawImage(c,0,0,canvas.width,canvas.height);
    const cutin=document.querySelector('#cutin');if(!cutin.hidden){const box=cutin.getBoundingClientRect(),h=host.getBoundingClientRect();ctx.fillStyle='#4c332aee';ctx.beginPath();ctx.roundRect(box.left-h.left,box.top-h.top,box.width,box.height,30);ctx.fill();const p=document.querySelector('#portrait');ctx.drawImage(p,box.left-h.left+8,box.top-h.top+4,90,90);ctx.fillStyle='#f7e6c7';ctx.font='30px Georgia';ctx.fillText('Warm shelter',box.left-h.left+114,box.top-h.top+58);}
    track.requestFrame();if(elapsed<span*2)requestAnimationFrame(frame);else resolve();}requestAnimationFrame(frame);});
   recorder.stop();await stopped;track.stop();return Array.from(new Uint8Array(await new Blob(parts,{type:'video/webm'}).arrayBuffer()));
  },id);
  const stem=resolve(out,id.replaceAll(':','-')+'-'+(before?'before':'after')),raw=stem+'-canvas.webm';await writeFile(raw,Buffer.from(bytes));
  execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-i',raw,'-vf','scale=960:408','-an','-c:v','libx264','-preset','fast','-crf','23','-pix_fmt','yuv420p','-movflags','+faststart',stem+'.mp4']);
  if(!before)execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-i',stem+'.mp4','-vf','fps=8,scale=320:136,tile=4x3','-frames:v','1',resolve(out,id.replaceAll(':','-')+'-film.png')]);
  console.log(id,before?'before':'after',bytes.length);
 }
}finally{await browser.close();}
