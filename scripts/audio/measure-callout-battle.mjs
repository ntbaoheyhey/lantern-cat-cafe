/** Three minutes of real auto battle/replay, validating every ultimate sync. */
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'../..'),dir=resolve(root,'reports/v3-shell/b2');
const require=createRequire(resolve(root,'apps/web/package.json')),{chromium}=require('@playwright/test');
const signed=path=>({path,sha256:createHash('sha256').update(readFileSync(resolve(root,path))).digest('hex')});
const seconds=Number(process.env.AUDIO_SECONDS??180),prefix=process.env.AUDIO_TRIAL??'v-final';
const browser=await chromium.launch({headless:true,args:['--autoplay-policy=no-user-gesture-required','--disable-background-timer-throttling','--disable-renderer-backgrounding']});
try{
 const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='warning'&&m.text().startsWith('Audio unavailable'))errors.push(m.text());});
 await page.addInitScript(()=>localStorage.setItem('lantern.coach.v3',JSON.stringify({disabled:true})));
 await page.goto('http://127.0.0.1:5994/?demo=1&squad=1&turn3d=1&cardrpg2=1&a6=1&formationc2=1');
 await page.getByRole('button',{name:'Play free',exact:true}).click();await page.waitForFunction(()=>window.__depthReview);
 await page.evaluate(async()=>{
  const a=window.__thAudio;await a.unlock();await a.preload('battle');a.music('battle');a.hits.length=0;
  window.__calloutTrial={maximumVoice:0,maximumSfx:0,replays:0,start:Date.now()};window.__depthReview.watchNow();
  window.__calloutTimer=setInterval(()=>{
   const m=window.__depthReview,s=window.__calloutTrial,d=a.diagnostics;s.maximumVoice=Math.max(s.maximumVoice,d.voice);s.maximumSfx=Math.max(s.maximumSfx,d.sfx);
   if(m.screen==='result'){if(m.replay)m.finish();m.replayLast();s.replays++;a.music('battle');}
  },50);
 });
 for(let elapsed=0;elapsed<seconds;elapsed+=15){await page.waitForTimeout(Math.min(15,seconds-elapsed)*1000);console.log(`${prefix}: ${Math.min(elapsed+15,seconds)}/${seconds}s`);}
 // A cast just before the boundary still has time to decode its lazy sprite.
 await page.waitForTimeout(1500);
 const data=await page.evaluate(()=>{clearInterval(window.__calloutTimer);return {hits:window.__thAudio.hits,stats:window.__calloutTrial,end:Date.now()};});
 const casts=data.hits.filter(h=>h.result==='cast'&&/^ult\..+\.(charge|release)$/.test(h.id)&&h.at<data.end-1500);
 const unused=data.hits.filter(h=>h.result==='played'&&/^voice\..+\.ult\.(charge|release)$/.test(h.id));
 const comparisons=casts.map(c=>{
  const [,unit,phase]=/^ult\.(.+)\.(charge|release)$/.exec(c.id),cue=`voice.${unit}.ult.${phase}`;
  const voice=unused.filter(h=>h.id===cue&&h.at>=c.at-100&&h.at<c.at+1500).sort((a,b)=>Math.abs(a.at-c.at)-Math.abs(b.at-c.at))[0];
  if(voice)unused.splice(unused.indexOf(voice),1);
  return {cast:c,voice,missing:!voice,ducked:voice?.duckDb===-8};
 });
 const logPath=`reports/v3-shell/b2/tests/${prefix}-battle.json.gz`;
 writeFileSync(resolve(root,logPath),gzipSync(JSON.stringify({...data,errors,comparisons})));
 const result={durationSeconds:(data.end-data.stats.start-1500)/1000,ultimateCasts:comparisons.length,
  chargeCasts:casts.filter(c=>c.id.endsWith('.charge')).length,releaseCasts:casts.filter(c=>c.id.endsWith('.release')).length,
  missing:comparisons.filter(c=>c.missing).length,duckedCasts:comparisons.filter(c=>c.ducked).length,
  maxVoiceConcurrency:data.stats.maximumVoice,maxSfxConcurrency:data.stats.maximumSfx,errors,log:signed(logPath),
  misses:comparisons.filter(c=>c.missing),method:'Actual browser auto battle/replay; no synthetic casts. Each engine-observed charge/release request must have its own matching played line, with -8 dB duck scheduled. At most one voice.'};
 writeFileSync(resolve(dir,'VOICE-CALLOUTS-BATTLE.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
 if(result.missing||errors.length||!casts.length||result.maxVoiceConcurrency>1)process.exitCode=1;
}finally{await browser.close();}
