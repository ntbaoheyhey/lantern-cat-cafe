import { chromium } from '../../../../apps/web/node_modules/@playwright/test/index.mjs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
const artifact=process.env.V5_ARTIFACT,out=process.env.V5_OUT,raw='/tmp/cardrpg-v5full-video-reel';
await mkdir(out,{recursive:true});await mkdir(raw,{recursive:true});
const browser=await chromium.launch({channel:'chromium',args:['--use-angle=metal']});
const frames=[],writes=[],errors=[];
try {
 const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
 page.on('pageerror',e=>errors.push(String(e)));
 await page.goto('file://'+artifact+'?dev=1');await page.waitForFunction(()=>window.__depthReview);
 const cats=['mochi','soot','clover','panko','mallow','sorrel','biscuit','inkcap','cinnamon','brioche','velvet','marigold'];
 // Warm the actual gallery models before recording; this is not a timing sample.
 for(const cat of cats){
  await page.evaluate(cat=>window.__depthReview.inspect(cat+'-4',0,false),cat);
  await page.waitForFunction(()=>window.__depthScene?.ready,null,{timeout:120000});
  await page.waitForFunction(()=>window.__depthReview.battle.actors.every(a=>window.__depthScene.puppets.get(a.id)?.asset===a.catalogId));
 }
 await page.evaluate(()=>window.__depthReview.closeGallery());
 await page.getByRole('button',{name:'Skills V5 guide',exact:true}).click();
 const cdp=await page.context().newCDPSession(page);
 cdp.on('Page.screencastFrame',e=>{const path=`${raw}/${String(frames.length).padStart(5,'0')}.jpg`;frames.push({path,at:e.metadata.timestamp});writes.push(writeFile(path,Buffer.from(e.data,'base64')));void cdp.send('Page.screencastFrameAck',{sessionId:e.sessionId}).catch(()=>{});});
 await cdp.send('Page.startScreencast',{format:'jpeg',quality:88,maxWidth:1440,maxHeight:900,everyNthFrame:2});
 await page.evaluate(()=>{window.__reelSeen=[];const tick=()=>{const m=window.__depthReview;if(m.plan&&!window.__reelSeen.some(r=>r.id===m.galleryId))window.__reelSeen.push({id:m.galleryId,speed:m.gallerySpeed,duration:m.plan.duration,at:performance.now()});window.__reelRaf=requestAnimationFrame(tick)};window.__reelRaf=requestAnimationFrame(tick)});
 await page.getByRole('button',{name:'Play 20 second skill reel',exact:true}).click();
 await page.waitForTimeout(20050);
 await cdp.send('Page.stopScreencast');await Promise.all(writes);
 const observed=await page.evaluate(()=>{cancelAnimationFrame(window.__reelRaf);return {cues:window.__reelSeen,complete:document.querySelector('[data-skill-reel]')?.getAttribute('data-skill-reel')}});
 await writeFile(raw+'/frames.txt',frames.map((f,i)=>`file '${f.path}'\nduration ${Math.max(.001,i+1<frames.length?frames[i+1].at-f.at:.034)}`).join('\n')+`\nfile '${frames.at(-1).path}'\n`);
 const file=out+'/skill-reel-20s.mp4';execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-f','concat','-safe','0','-i',raw+'/frames.txt','-t','20','-vf','fps=30,format=yuv420p','-c:v','libx264','-preset','fast','-crf','28','-maxrate','700k','-bufsize','1400k','-movflags','+faststart',file]);
 const bytes=await readFile(file),probe=JSON.parse(execFileSync('ffprobe',['-v','error','-show_entries','stream=codec_name,width,height,nb_frames:format=duration','-of','json',file],{encoding:'utf8'}));
 const result={method:'Actual guide button, twelve natural-speed gallery ultimates, continuous capture; models prewarmed before recording, labelled gallery. No fixture tick injection or cuts.',artifact,artifactSha256:createHash('sha256').update(await readFile(artifact)).digest('hex'),sha256:createHash('sha256').update(bytes).digest('hex'),bytes:bytes.length,probe,observed,allTwelve:observed.cues.length===12&&observed.cues.every(c=>c.speed===1),capturedFrames:frames.length,errors};
 await writeFile(out+'/skill-reel.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{await browser.close()}
