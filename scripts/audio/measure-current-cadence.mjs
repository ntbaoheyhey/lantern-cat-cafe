/** Repeat the original S4 stage-1/replay fixture on the current integrated runtime. */
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import {runtimeSignature,assertUnchanged} from './runtime-signature.mjs';
const require=createRequire(new URL('../../apps/web/package.json',import.meta.url));
const {chromium}=require('@playwright/test');
const root=process.env.AUDIO_RUNTIME_ROOT,url=process.env.AUDIO_URL;
if(!root||!url)throw Error('Specify the current runtime root and URL');
const base='reports/v3-shell/b2/polish/P2',sources=runtimeSignature(root);
const sign=path=>({path,sha256:createHash('sha256').update(readFileSync(path)).digest('hex')});
const browser=await chromium.launch({headless:true,args:['--autoplay-policy=no-user-gesture-required','--disable-background-timer-throttling','--disable-renderer-backgrounding']});
const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
try{
 await page.addInitScript(()=>localStorage.setItem('lantern.coach.v3',JSON.stringify({disabled:true})));
 await page.goto(url+'/?demo=1&squad=1&turn3d=1&cardrpg2=1&a6=1&formationc2=1');
 await page.getByRole('button',{name:'Play free',exact:true}).click();await page.waitForFunction(()=>window.__depthReview);
 await page.evaluate(async()=>{const a=window.__thAudio;await a.unlock();await a.preload('battle');a.mute(false);a.music('battle');window.__depthReview.watchNow();});
 await page.waitForTimeout(5000);
 const start=Date.now();
 await page.evaluate(()=>{
  window.__thAudio.hits.length=0;window.__cadence={restarts:0,frames:0,battleFrames:0};
  window.__cadenceTimer=setInterval(()=>{const m=window.__depthReview,s=window.__cadence;s.frames++;if(m.showBattle)s.battleFrames++;if(m.screen==='result'){if(m.replay)m.finish();m.replayLast();s.restarts++;window.__thAudio.music('battle');}},100);
 });
 await page.waitForTimeout(180000);
 const durationSeconds=(Date.now()-start)/1000;
 const data=await page.evaluate(()=>{clearInterval(window.__cadenceTimer);return {hits:window.__thAudio.hits,stats:window.__cadence,screen:window.__depthReview.screen};});
 assertUnchanged(root,sources);
 const log=base+'/current-cadence-runtime.json.gz';writeFileSync(log,gzipSync(JSON.stringify(data)));
 const voices=data.hits.filter(h=>h.id.startsWith('voice.')&&h.result==='played');
 const intervals=voices.slice(1).map((h,i)=>(h.at-voices[i].at)/1000).sort((a,b)=>a-b);
 const result={at:new Date().toISOString(),runtimeRoot:root,runtimeSources:sources,durationSeconds,voiceStarts:voices.length,medianVoiceIntervalSeconds:intervals[Math.floor(intervals.length/2)],intervalsSeconds:intervals,errors,stats:data.stats,log:sign(log),method:'Original S4 fixture from measure-battle.mjs: default stage-1 watchNow battle then replay, five-second pre-roll, no roster, seed, supplies or currency injection. All played voice-source starts, including charge/release. Current A battle plus B audio, no source edits.'};
 writeFileSync(base+'/current-cadence.json',JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify({durationSeconds,voices:voices.length,median:result.medianVoiceIntervalSeconds,errors}));
}finally{await browser.close();}
