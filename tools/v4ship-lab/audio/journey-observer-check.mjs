/** Independent browser-event fixtures reject double-crediting nearby receipts. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {resolve,relative} from 'node:path';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {prepareJourneyAudio,observeJourneyAudio,evaluateJourneyAudio} from './journey-observer.mjs';
const root=resolve(import.meta.dirname,'../../..'),attempt=process.argv[2];assert(/^\d+$/.test(attempt));
const output=resolve(root,`reports/v4-ship/S11/audio-journey-observer-check-${attempt}.json`);assert(!existsSync(output));
const require=createRequire(resolve(root,'apps/web/package.json')),{chromium}=require('@playwright/test');
const browser=await chromium.launch({headless:true,args:['--autoplay-policy=no-user-gesture-required']});
const report={at:new Date().toISOString(),scope:'Independent causal attribution fixtures with real WebAudio source starts and silent synthetic buffers; no product-audio pass.',observerSha256:createHash('sha256').update(readFileSync(resolve(import.meta.dirname,'journey-observer.mjs'))).digest('hex'),rows:[],pass:false};
try{for(const name of ['native click','two distinct receipts','one omitted chime','explicit rate limit','ambiguous asynchronous same cue']){
 const context=await browser.newContext(),page=await context.newPage();
 try{
  await prepareJourneyAudio(page);
  await page.route('**/__observer-check',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><button>Primary action</button>'}));
  await page.goto('http://127.0.0.1:5995/__observer-check');
  await page.evaluate(async()=>{
   const ctx=new AudioContext();await ctx.resume();
   window.__thAudio={ctx,group:0,defer:false,reject:false,
    play(id){void this.perform(id);},
    async perform(id){if(this.defer)await new Promise(r=>setTimeout(r,10));if(this.reject){this.record(id,'rate-limit');return;}this.start(id,this.ctx.createBuffer(1,480,this.ctx.sampleRate),{bus:id.startsWith('ui.')?'ui':'sfx',pack:'synthetic',duration:.01},0,1,1,0,'flat',++this.group);this.record(id,'played');},
    start(id,buffer,sample){const source=this.ctx.createBufferSource();source.buffer=buffer;source.connect(this.ctx.destination);source.start(this.ctx.currentTime,0,.01);return source;},
    record(){},
   };
  });
  await observeJourneyAudio(page);
  if(name==='native click'){
   await page.evaluate(()=>document.addEventListener('click',()=>window.__thAudio.play('ui.click'),true));
   await page.getByRole('button',{name:'Primary action'}).click();
  }else await page.evaluate(name=>{
   const receipt=id=>window.dispatchEvent(new CustomEvent('chain:receipt',{detail:{hash:id,action:'Fixture receipt',confirmedAt:Date.now()}}));
   const audio=window.__thAudio;
   if(name==='explicit rate limit')audio.reject=true;
   if(name==='ambiguous asynchronous same cue')audio.defer=true;
   receipt('first');if(name!=='one omitted chime')audio.play('tx.confirmed');
   if(name!=='explicit rate limit'){receipt('second');audio.play('tx.confirmed');}
  },name);
  await page.waitForTimeout(100);
  const data=await page.evaluate(async()=>{await window.__thAudio.ctx.close();return window.__journeyAudio;}),analysis=evaluateJourneyAudio(data);
  let pass=false;
  if(name==='native click')pass=analysis.controls.length===1&&analysis.controls[0].pass;
  if(name==='two distinct receipts')pass=analysis.receipts.length===2&&analysis.receipts.every(r=>r.pass)&&new Set(data.starts.map(s=>s.request)).size===2;
  if(name==='one omitted chime')pass=analysis.receipts.length===2&&!analysis.receipts[0].pass&&analysis.receipts[1].pass;
  if(name==='explicit rate limit')pass=analysis.receipts.length===1&&!analysis.receipts[0].pass&&analysis.receipts[0].requests[0]?.results.includes('rate-limit');
  if(name==='ambiguous asynchronous same cue')pass=analysis.unattributedTransientStarts>0&&!analysis.receipts.every(r=>r.pass);
  report.rows.push({name,pass,data,analysis});
 }finally{await context.close();}
}report.pass=report.rows.length===5&&report.rows.every(r=>r.pass);
}catch(error){report.failure=error.message.slice(0,300);}
finally{await browser.close();writeFileSync(output,JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify({output:relative(root,output),pass:report.pass,rows:report.rows.map(({name,pass})=>({name,pass})),failure:report.failure}));if(!report.pass)process.exitCode=1;
