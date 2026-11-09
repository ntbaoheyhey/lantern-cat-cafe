import {chromium} from '../../../apps/web/node_modules/@playwright/test/index.mjs';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {withTimingLock} from '../lock.mjs';
const out='reports/cardrpg-look/skills-v5/videos';await mkdir(out,{recursive:true});const rows=[];
for(const [name,artifact]of [['before','/tmp/cardrpg-v5look-before.html'],['after','docs/cardrpg-look/v5-v0.html']])await withTimingLock(`V5LOOK twenty-second ${name} continuous fight`,async()=>{
 const raw=`/tmp/cardrpg-v5look-video-${name}`;await mkdir(raw,{recursive:true});const browser=await chromium.launch({channel:'chromium',args:['--use-angle=metal']});const frames=[],writes=[],errors=[];
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});page.on('pageerror',e=>errors.push(String(e)));await page.goto('file://'+resolve(artifact));await page.waitForFunction(()=>window.__depthReview);
  await page.evaluate(()=>{const m=window.__depthReview;m.watchNow();m.paused=true;m.camera='wide';m.state.settings.speed=1;m.notify(false)});
  await page.waitForFunction(()=>window.__depthScene?.ready,null,{timeout:120000});
  const initial=await page.evaluate(()=>JSON.stringify(window.__depthReview.battle.initial));
  const cdp=await page.context().newCDPSession(page);
  cdp.on('Page.screencastFrame',event=>{const path=`${raw}/${String(frames.length).padStart(5,'0')}.jpg`;frames.push({path,at:event.metadata.timestamp});writes.push(writeFile(path,Buffer.from(event.data,'base64')));void cdp.send('Page.screencastFrameAck',{sessionId:event.sessionId}).catch(()=>{});});
  await page.evaluate(()=>{const m=window.__depthReview;m.paused=false;m.notify(false)});
  await cdp.send('Page.startScreencast',{format:'jpeg',quality:86,maxWidth:1440,maxHeight:900,everyNthFrame:2});await page.waitForTimeout(20050);await cdp.send('Page.stopScreencast');await Promise.all(writes);
  const choices=await page.evaluate(()=>window.__depthReview.battle.choices.length);
  const concat=frames.map((f,i)=>`file '${f.path}'\nduration ${Math.max(.001,i+1<frames.length?frames[i+1].at-f.at:Math.max(.034,20-(f.at-frames[0].at)))}`).join('\n')+`\nfile '${frames.at(-1).path}'\n`;
  await writeFile(`${raw}/frames.txt`,concat);
  const file=`${out}/${name}-20s.mp4`;
  execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-f','concat','-safe','0','-i',`${raw}/frames.txt`,'-t','20','-vf','fps=30,format=yuv420p','-c:v','libx264','-preset','fast','-crf','24','-movflags','+faststart',file]);
  execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-i',file,'-vf','fps=1/4,scale=480:-1,tile=3x2','-frames:v','1',`${out}/${name}-samples.png`]);
  const bytes=await readFile(file),probe=JSON.parse(execFileSync('ffprobe',['-v','error','-show_entries','stream=codec_name,width,height,nb_frames:format=duration','-of','json',file],{encoding:'utf8'}));
  rows.push({name,file,sha256:createHash('sha256').update(bytes).digest('hex'),bytes:bytes.length,artifact:resolve(artifact),artifactSha256:createHash('sha256').update(await readFile(artifact)).digest('hex'),initialSha256:createHash('sha256').update(initial).digest('hex'),capturedFrames:frames.length,choices,probe,errors});console.log(JSON.stringify(rows.at(-1)));
 }finally{await browser.close()}
});
await writeFile(`${out}/checks.json`,JSON.stringify({method:'Headless CDP screencast, actual natural x1 playback, same watchNow fixture/camera B; first continuous20s, no edits/cuts/tick injection. Wall timestamps converted to30fps H.264. Recording is not the performance probe.',sameInitial:rows[0].initialSha256===rows[1].initialSha256,rows},null,2));
