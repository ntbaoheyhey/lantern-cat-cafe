/** Real UI auto-battle; paired 180 s Chrome traces, with the actual mute setting. */
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'../..'),dir=resolve(root,'reports/v3-shell/b2');
const require=createRequire(resolve(root,'apps/web/package.json')),{chromium}=require('@playwright/test');
const seconds=Number(process.env.AUDIO_SECONDS??180),prefix=process.env.AUDIO_TRIAL??'s3';
const browser=await chromium.launch({headless:true,args:['--autoplay-policy=no-user-gesture-required','--disable-background-timer-throttling','--disable-renderer-backgrounding']});
const signed=path=>({path,sha256:createHash('sha256').update(readFileSync(resolve(root,path))).digest('hex')});
const sources=['apps/web/src/audio/engine.ts','apps/web/src/audio/cues.ts','apps/web/src/audio/events.ts','apps/web/public/audio/manifest.json'].map(signed);
const measures=[];
try{
 for(const muted of [true,false]){
  const name=muted?'muted':'audio',context=await browser.newContext({viewport:{width:1280,height:720}}),page=await context.newPage();const errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='warning'&&m.text().startsWith('Audio unavailable'))errors.push(m.text());});
  await page.addInitScript(()=>localStorage.setItem('lantern.coach.v3',JSON.stringify({disabled:true})));
  await page.goto('http://127.0.0.1:5994/?demo=1&squad=1&turn3d=1&cardrpg2=1&a6=1&formationc2=1');
  await page.getByRole('button',{name:'Play free',exact:true}).click();await page.waitForFunction(()=>window.__depthReview);
  await page.evaluate(async muted=>{const a=window.__thAudio;await a.unlock();await a.preload('battle');a.mute(muted);a.music('battle');window.__depthReview.watchNow();},muted);
  await page.waitForTimeout(5000);
  const cdp=await context.newCDPSession(page);await cdp.send('Performance.enable');
  const getMetrics=async()=>Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(r=>[r.name,r.value]));
  const complete=new Promise(r=>cdp.once('Tracing.tracingComplete',r));
  await cdp.send('Tracing.start',{categories:'devtools.timeline,disabled-by-default-devtools.timeline,blink.user_timing',transferMode:'ReturnAsStream'});
  const before=await getMetrics();
  await page.evaluate(()=>{
   window.__thAudio.hits.length=0;window.__audioTrial={restarts:0,frames:0,battleFrames:0,maximumSfx:0,maximumVoice:0};
   window.__audioTrialTimer=setInterval(()=>{const m=window.__depthReview,s=window.__audioTrial,a=window.__thAudio;s.frames++;if(m.showBattle)s.battleFrames++;const d=a.diagnostics;s.maximumSfx=Math.max(s.maximumSfx,d.sfx);s.maximumVoice=Math.max(s.maximumVoice,d.voice);
    if(m.screen==='result'){if(m.replay)m.finish();m.replayLast();s.restarts++;a.music('battle');}
   },100);
  });
  for(let elapsed=0;elapsed<seconds;elapsed+=15){await page.waitForTimeout(Math.min(15,seconds-elapsed)*1000);console.log(`${prefix} ${name}: ${Math.min(elapsed+15,seconds)}/${seconds}s`);}
  const after=await getMetrics();await cdp.send('Tracing.end');const {stream}=await complete;
  const parts=[];while(true){const chunk=await cdp.send('IO.read',{handle:stream});parts.push(chunk.data);if(chunk.eof)break;}await cdp.send('IO.close',{handle:stream});
  const tracePath=`reports/v3-shell/b2/tests/${prefix}-${name}-trace.json.gz`;writeFileSync(resolve(root,tracePath),gzipSync(parts.join('')));
  const data=await page.evaluate(()=>{clearInterval(window.__audioTrialTimer);return {hits:window.__thAudio.hits,stats:window.__audioTrial,screen:window.__depthReview.screen,choices:window.__depthReview.battle?.choices.length};});
  const logPath=`reports/v3-shell/b2/tests/${prefix}-${name}-battle.json.gz`;writeFileSync(resolve(root,logPath),gzipSync(JSON.stringify(data)));
  const durationSeconds=after.Timestamp-before.Timestamp,taskSeconds=after.TaskDuration-before.TaskDuration;
  measures.push({name,muted,durationSeconds,taskSeconds,scriptSeconds:after.ScriptDuration-before.ScriptDuration,layoutSeconds:after.LayoutDuration-before.LayoutDuration,trace:signed(tracePath),log:signed(logPath),stats:data.stats,errors});
  if(!muted){
   const seen=new Map(),repeats=[];let layeredPlays=0,layerChoices=0;
   for(const h of data.hits.filter(h=>h.result==='played'&&!h.id.startsWith('voice.'))){
    if(!h.layers)continue;layeredPlays++;
    for(const l of h.layers){const key=h.id+'/'+l.role;if(seen.get(key)===l.variantId)repeats.push({key,at:h.at,variant:l.variantId});seen.set(key,l.variantId);layerChoices++;}
   }
   const voices=data.hits.filter(h=>h.id.startsWith('voice.')&&h.result==='played');const intervals=voices.slice(1).map((h,i)=>(h.at-voices[i].at)/1000).sort((a,b)=>a-b);
   const battle={durationSeconds,played:data.hits.filter(h=>h.result==='played').length,layeredPlays,layerChoices,consecutiveVariantRepeats:repeats.length,repeats,maxSfxConcurrency:Math.max(data.stats.maximumSfx,...data.hits.map(h=>h.sfx??0)),maxVoiceConcurrency:Math.max(data.stats.maximumVoice,...data.hits.map(h=>h.voice??0)),medianVoiceIntervalSeconds:intervals[Math.floor(intervals.length/2)],results:Object.fromEntries([...new Set(data.hits.map(h=>h.result))].map(k=>[k,data.hits.filter(h=>h.result===k).length])),errors,log:signed(logPath),scenario:'Actual stage-1 auto battle followed by its recorded replay. Existing battle adapter; no A-owned file modified.',variantScope:'Every layered SFX/UI cue. Legacy unlayered voice identity is replaced and measured in S4.',stats:data.stats};
   writeFileSync(resolve(dir,'AUDIO-BATTLE.json'),JSON.stringify(battle,null,2)+'\n');
  }
  console.log(JSON.stringify(measures.at(-1)));await context.close();
 }
 const [muted,audio]=measures;
 for(const source of sources)if(signed(source.path).sha256!==source.sha256)throw new Error('Measured source changed during the paired trial: '+source.path);
 const result={sources,addedMainThreadPercent:(audio.taskSeconds-muted.taskSeconds)/muted.taskSeconds*100,addedWallTimePercent:(audio.taskSeconds-muted.taskSeconds)/Math.min(audio.durationSeconds,muted.durationSeconds)*100,method:'CDP Performance.TaskDuration, paired warm real UI at 1280x720, same initial battle and replay, true mute skips transient scheduling. Percentage is relative to muted main-thread time, not wall time. Traces preserved as gzip JSON. Source hashes are identical before and after the paired trial.',traces:measures.map(r=>({...r.trace,durationSeconds:r.durationSeconds})),runs:measures};
 writeFileSync(resolve(dir,'AUDIO-PERFORMANCE.json'),JSON.stringify(result,null,2)+'\n');console.log('CPU comparison',result.addedMainThreadPercent);
}finally{await browser.close();}
