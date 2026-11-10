// Continuous x1 gallery playback; diagnostic demonstration, not a natural battle.
import {chromium} from '../../../apps/web/node_modules/@playwright/test/index.mjs';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {open,apply} from '../skills-v5/full/harness.mjs';
const artifact=resolve(process.env.ART_ARTIFACT),out=resolve(process.env.ART_OUT),raw=`/tmp/cardrpg-v5full-vfx-film-${process.pid}`;
await mkdir(out,{recursive:true});await mkdir(raw,{recursive:true});
const frames=[],writes=[],errors=[],seen=[];
const browser=await chromium.launch({channel:'chromium',args:['--use-angle=metal']});
try{
 const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
 page.on('pageerror',e=>errors.push(String(e)));await open(page,artifact);
 const ids=['mochi-1','mochi-4','enemy:sock-skipper','enemy:teacup-healer'];
 for(const id of ids)await apply(page,{gallery:id,progress:0});
 await apply(page,{gallery:ids[0],progress:0});
 const cdp=await page.context().newCDPSession(page);
 cdp.on('Page.screencastFrame',e=>{const path=`${raw}/${String(frames.length).padStart(5,'0')}.jpg`;frames.push({path,at:e.metadata.timestamp});writes.push(writeFile(path,Buffer.from(e.data,'base64')));void cdp.send('Page.screencastFrameAck',{sessionId:e.sessionId}).catch(()=>{})});
 await cdp.send('Page.startScreencast',{format:'jpeg',quality:90,maxWidth:1440,maxHeight:900,everyNthFrame:2});
 for(const id of ids){
  await apply(page,{gallery:id,progress:0});
  seen.push(await page.evaluate(id=>{const m=window.__depthReview;m.gallerySpeed=1;m.inspect(id,0,true);return{id,speed:m.gallerySpeed,duration:m.plan.duration}},id));
  await page.waitForFunction(()=>!window.__depthReview.plan,null,{timeout:10000});await page.waitForTimeout(350);
 }
 await cdp.send('Page.stopScreencast');await Promise.all(writes);
 await writeFile(raw+'/frames.txt',frames.map((f,i)=>`file '${f.path}'\nduration ${Math.max(.001,i+1<frames.length?frames[i+1].at-f.at:.034)}`).join('\n')+`\nfile '${frames.at(-1).path}'\n`);
 const file=out+'/mochi-vfx-gallery.mp4';
 execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-f','concat','-safe','0','-i',raw+'/frames.txt','-vf','fps=30,format=yuv420p','-c:v','libx264','-preset','fast','-crf','24','-movflags','+faststart',file]);
 const bytes=await readFile(file),hash=b=>createHash('sha256').update(b).digest('hex');
 const result={method:'Four continuous native x1 gallery cues in the game renderer; actor arrangements change between cues. No injected animation ticks during playback. This is not a natural-battle/performance sample.',artifact,artifactSha256:hash(await readFile(artifact)),file,sha256:hash(bytes),bytes:bytes.length,frames:frames.length,seen,errors};
 await writeFile(out+'/film.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({file,frames:frames.length,seen,errors}));
}finally{await browser.close()}
