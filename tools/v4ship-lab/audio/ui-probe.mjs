/** Measure actual browser source durations for every primary feedback/receipt cue. */
import {existsSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {chromium} from '../../../scripts/v3feel/browser-fixture.mjs';
const out=resolve('reports/v4-ship/S5',process.argv[2]??'ui-duration-1.json');
if(existsSync(out))throw Error('Preserve previous UI measurement');
const browser=await chromium.launch({headless:true,args:['--autoplay-policy=no-user-gesture-required']});
try{
 const page=await browser.newPage();
 await page.route('**/__audio-probe',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><title>Audio duration diagnostic</title>'}));
 await page.goto('http://127.0.0.1:5995/__audio-probe');
 const rows=await page.evaluate(async()=>{
  const {AudioEngine}=await import('/src/audio/engine.ts'),{UI_FEEDBACK_CUES}=await import('/src/audio/feedback.ts');
  const e=new AudioEngine(()=>.5);await e.unlock();await e.preload('home');
  const create=e.ctx.createBufferSource,rows=[];let sources=[];
  e.ctx.createBufferSource=function(){const s=create.call(this),start=s.start;s.start=function(when,offset,duration){sources.push({when,offset,bufferSeconds:duration,rate:this.playbackRate.value,loop:this.loop});return start.apply(this,arguments);};return s;};
  for(const pitch of [1,.25])for(const cue of [...UI_FEEDBACK_CUES,'tx.wallet','tx.pending','tx.confirmed','tx.failed']){
   sources=[];const before=e.hits.length;e.play(cue,{pitch});await new Promise(r=>setTimeout(r,350));
   const durationMs=sources.length?(Math.max(...sources.map(s=>s.when+s.bufferSeconds/s.rate))-Math.min(...sources.map(s=>s.when)))*1000:null;
   rows.push({cue,pitch,durationMs,sources:sources.slice(),results:e.hits.slice(before).map(h=>h.result),pass:!!sources.length&&sources.every(s=>!s.loop)&&durationMs<=300+1e-6});
  }
  e.stop();await e.ctx.close();return rows;
 });
 const report={at:new Date().toISOString(),method:'Real browser source.start durations for all thirteen semantic UI cues and four transaction cues, normal and slowest supported pitch; existing release envelope retained. Isolated diagnostic, not journey evidence.',rows,pass:rows.length===34&&rows.every(r=>r.pass)};
 writeFileSync(out,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({rows:rows.length,pass:report.pass,maxMs:Math.max(...rows.map(r=>r.durationMs)),failures:rows.filter(r=>!r.pass)}));
 if(!report.pass)process.exitCode=1;
}finally{await browser.close();}
