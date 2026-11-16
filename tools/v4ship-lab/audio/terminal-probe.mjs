/** Compare unchanged roster warmup against explicit resolved terminal-cue warmup. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {resolve,relative} from 'node:path';
import {existsSync,writeFileSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const root=resolve(import.meta.dirname,'../../..'),attempt=process.argv[2];assert(/^\d+$/.test(attempt));
const out=resolve(root,`reports/v4-ship/S11/audio-terminal-probe-${attempt}.json`);assert(!existsSync(out));
const require=createRequire(resolve(root,'apps/web/package.json')),{chromium}=require('@playwright/test');
const browser=await chromium.launch({headless:true,args:['--autoplay-policy=no-user-gesture-required']});
const report={at:new Date().toISOString(),diagnostic:true,method:'Four prespecified paired fresh contexts. Real AudioEngine and source.start arguments; same voice variant; no gain, timing or manifest changes. Experimental warmup calls the existing buffer loader before play. Not endurance or physical-onset evidence.',runtime:['apps/web/src/audio/engine.ts','apps/web/src/audio/cues.ts','apps/web/public/audio/manifest.json'].map(path=>({path,sha256:createHash('sha256').update(readFileSync(resolve(root,path))).digest('hex')})),rows:[]};
try{for(let pair=1;pair<=4;pair++)for(const mode of ['roster-only','roster-and-terminal']){
 assert(!existsSync(resolve(root,'STOP-V4SHIP')));
 const context=await browser.newContext(),page=await context.newPage();
 try{
 await page.route('**/__terminal-probe',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><title>Terminal voice timing diagnostic</title>'}));
 await page.goto('http://127.0.0.1:5995/__terminal-probe');
 const row=await page.evaluate(async mode=>{
  const {AudioEngine}=await import('/src/audio/engine.ts'),{resolveCue}=await import('/src/audio/cues.ts');
  const e=new AudioEngine(()=>.5);await e.unlock();await e.preload('boss');await e.preloadVoices(['party-mochi','foe-0-yarn-giant']);
  const id='voice.yarn-giant.death',m=await e.loadManifest(),samples=resolveCue(id,m),packs=[...new Set(samples.map(s=>s.pack))];
  const before=e.diagnostics.packs,begin=performance.now();
  if(mode==='roster-and-terminal')await Promise.all(packs.map(p=>e.buffer(p,m)));
  const warmupMs=performance.now()-begin;
  await new Promise(r=>setTimeout(r,80));
  const starts=[],original=AudioBufferSourceNode.prototype.start;
  AudioBufferSourceNode.prototype.start=function(when,offset,duration){starts.push({when,offset,duration,performanceMs:performance.now(),contextTime:e.ctx.currentTime,output:e.ctx.getOutputTimestamp()});return original.apply(this,arguments);};
  const request={performanceMs:performance.now(),contextTime:e.ctx.currentTime};
  try{e.play(id);const limit=performance.now()+5000;while(!starts.length&&performance.now()<limit)await new Promise(r=>setTimeout(r,5));if(!starts.length)throw Error('No terminal source start');}
  finally{AudioBufferSourceNode.prototype.start=original;}
  const start=starts[0],estimatedOnsetMs=start.output.contextTime>0?start.output.performanceTime+(start.when-start.output.contextTime)*1000-request.performanceMs:null;
  const resources=performance.getEntriesByType('resource').filter(r=>r.name.includes('/audio/')).map(r=>({path:new URL(r.name).pathname,bytes:r.encodedBodySize}));
  const result={mode,id,packs,preloadedBefore:before,warmupMs,request,starts,requestToStartCallMs:start.performanceMs-request.performanceMs,scheduleDelayMs:(start.when-request.contextTime)*1000,estimatedOnsetMs,resources,hits:e.hits};
  e.stop();await e.ctx.close();return result;
 },mode);report.rows.push({pair,...row});console.log(JSON.stringify({pair,mode,warmupMs:row.warmupMs,requestToStartCallMs:row.requestToStartCallMs,estimatedOnsetMs:row.estimatedOnsetMs}));
 }finally{await context.close();}
}report.complete=report.rows.length===8;
}catch(e){report.failure=e.message.slice(0,300);}
finally{await browser.close();writeFileSync(out,JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify({output:relative(root,out),complete:report.complete,failure:report.failure}));if(!report.complete)process.exitCode=1;
