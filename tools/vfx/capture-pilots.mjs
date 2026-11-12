import {createRequire} from 'node:module';
import {mkdir,readFile,rename,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
const root=process.cwd(),require=createRequire(resolve(root,'apps/web/package.json')),{chromium}=require('@playwright/test');
const out=resolve(process.env.VFX_SOURCE??'/Users/bao/art/vfx-2026-11-12','review'),base=process.env.C2_URL??'http://127.0.0.1:5970';
await mkdir(out,{recursive:true});const browser=await chromium.launch({headless:true}),results=[],errors=[];
const ids=['mochi-1','mochi-4','enemy:yarn-giant'];
try{
 for(const id of ids){
  const slug=id.replaceAll(':','-'),context=await browser.newContext({viewport:{width:1280,height:720},deviceScaleFactor:1});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/@fs'+resolve(root,'tools/vfx/preview.html'));
  await page.waitForFunction(()=>window.vfxPreview?.scene.ready);
  await page.evaluate(async id=>{const g=window.vfxPreview;g.setManual(true);g.choose(id);await g.scene.effects.ready;},id);
  await page.waitForFunction(()=>window.vfxPreview.scene.ready);
  const metadata=await page.evaluate(()=>{const g=window.vfxPreview;g.sample(0);return {duration:g.fixture.plan.duration,impact:g.fixture.plan.beats[2].start,targets:g.fixture.plan.targetIds,events:g.fixture.plan.events,actorId:g.fixture.plan.actorId,actors:g.view.actors.map(a=>({id:a.id,side:a.side})),anchors:Object.fromEntries(g.view.actors.map(a=>[a.id,Object.fromEntries(['feet','head','vfxOrigin','mainHand'].map(socket=>[socket,g.scene.socket(a.id,socket)]))]))};});
  await page.locator('#stage').screenshot({path:resolve(out,slug+'-backdrop.png')});
  for(const offset of [-140,0,35,140,350]){
   await page.evaluate(at=>window.vfxPreview.sample(at),Math.max(0,metadata.impact+offset));await page.screenshot({path:resolve(out,`${slug}-${offset}.png`)});
  }
  await page.evaluate(()=>{const g=window.vfxPreview;g.setReduced(true);g.sample(g.fixture.plan.beats[2].start+35);});await page.screenshot({path:resolve(out,slug+'-reduced.png')});
  await context.close();
  for(const before of [true,false]){
   const context=await browser.newContext({viewport:{width:1280,height:720},deviceScaleFactor:1,recordVideo:{dir:out,size:{width:1280,height:720}}}),page=await context.newPage();
   page.on('pageerror',e=>errors.push(e.message));await page.goto(base+'/@fs'+resolve(root,'tools/vfx/preview.html'));
   await page.waitForFunction(()=>window.vfxPreview?.scene.ready);
   await page.evaluate(async({id,before})=>{const g=window.vfxPreview;g.setManual(true);g.choose(id);g.setBefore(before);await g.scene.effects.ready;g.sample(0);},{id,before});
   await page.waitForFunction(()=>window.vfxPreview.scene.ready);
   const playback=await page.evaluate(async()=>{
    const g=window.vfxPreview,frames=[],span=g.fixture.plan.duration+600;g.sample(0);const started=performance.now();let previous=started;
    await new Promise(resolve=>{function tick(now){frames.push(now-previous);previous=now;const elapsed=now-started;g.sample(elapsed%span);if(elapsed<span*3)requestAnimationFrame(tick);else resolve();}requestAnimationFrame(tick);});
    return {frames:frames.slice(2),render:g.measurements.slice(-180),layers:g.scene.effects.layered.stats.failed,events:g.scene.eventAudit};
   });
   const video=page.video();await page.close();await context.close();const raw=resolve(out,`${slug}-${before?'before':'after'}.webm`);await rename(await video.path(),raw);
   const duration=Number(execFileSync('ffprobe',['-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',raw],{encoding:'utf8'}));
   execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-ss',String(Math.max(0,duration-(metadata.duration+600)*3/1000)),'-i',raw,'-vf','crop=1280:544:0:64,scale=960:408','-an','-c:v','libx264','-preset','fast','-crf','23','-pix_fmt','yuv420p','-movflags','+faststart',resolve(out,`${slug}-${before?'before':'after'}.mp4`)]);
   const sorted=playback.frames.toSorted((a,b)=>a-b),render=playback.render.toSorted((a,b)=>a-b);
   metadata[before?'before':'after']={fps:1000/(playback.frames.reduce((s,x)=>s+x,0)/playback.frames.length),frameP95:sorted[Math.floor(sorted.length*.95)],renderP95:render[Math.floor(render.length*.95)],failed:playback.layers,hitEvents:playback.events.filter(e=>e.name==='hit').length};
  }
  results.push({id,...metadata});console.log(id,metadata.after);
 }
 if(errors.length)throw Error(JSON.stringify(errors));
}finally{await browser.close();await writeFile(resolve(out,'capture.json'),JSON.stringify({results,errors},null,2));}
