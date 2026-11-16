/** Separate cold/warm and adversarial source-budget diagnostic. No acceptance mix. */
import {mkdirSync,writeFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {chromium} from '../../../scripts/v3feel/browser-fixture.mjs';
const root=resolve(import.meta.dirname,'../../..'),trial=process.argv[2]??'engine-probe-1';
if(!/^[a-z0-9-]+$/.test(trial))throw Error('Invalid trial');
const out=resolve(root,'reports/v4-ship/S5',trial+'.json');if(existsSync(out))throw Error('Preserve earlier evidence');
mkdirSync(resolve(root,'reports/v4-ship/S5'),{recursive:true});
const browser=await chromium.launch({headless:true,args:['--autoplay-policy=no-user-gesture-required']});
const rows=[];
try{for(const mode of ['cold','preloaded']){
 const page=await browser.newPage();
 await page.route('**/__audio-probe',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><title>Isolated audio diagnostic</title>'}));
 await page.goto('http://127.0.0.1:5995/__audio-probe');
 const row=await page.evaluate(async mode=>{
  const {AudioEngine}=await import('/src/audio/engine.ts');
  const e=new AudioEngine(()=>.5);await e.unlock();const starts=[],requests=[];
  const original=e.start;
  e.start=function(id,buffer,sample,priority,rate,volume,delay,eq,group){
   const result=original.apply(this,arguments);
   starts.push({id,bus:sample.bus,group,when:this.ctx.currentTime+delay,seconds:sample.duration/(rate*(sample.bus==='sfx'?this.rate:1)),performanceMs:performance.now()});return result;
  };
  const started=performance.now();if(mode==='preloaded')await e.preload('battle');const preloadMs=performance.now()-started;
  const request=performance.now();requests.push({id:'kit.holy.impact',performanceMs:request});e.play('kit.holy.impact');
  while(!starts.length)await new Promise(r=>setTimeout(r,5));
  const firstLatencyMs=starts[0].performanceMs-request;
  e.stop();await new Promise(r=>setTimeout(r,130));
  // Each unique composite is first warmed, then requested in one burst.
  const cues=['kit.holy.impact','kit.ember.impact','kit.heavy.impact','kit.garden.impact','ui.click','ui.tab','tx.confirmed'];
  for(const id of cues){e.play(id);await new Promise(r=>setTimeout(r,150));e.stop();}
  starts.length=0;
  for(const id of cues)e.play(id);
  await new Promise(r=>setTimeout(r,200));
  const burst=starts.slice().sort((a,b)=>a.when-b.when);let max=0;
  for(const s of burst)max=Math.max(max,burst.filter(t=>t.when>=s.when&&t.when-s.when<.1-1e-9).length);
  const hits=e.hits.slice(-cues.length),resources=performance.getEntriesByType('resource').filter(r=>r.name.includes('/audio/')).map(r=>({path:new URL(r.name).pathname,bytes:r.encodedBodySize}));
  e.stop();await e.ctx.close();return {mode,preloadMs,firstLatencyMs,burstMaxStartsPer100ms:max,burst,hits,resources};
 },mode);
 rows.push(row);await page.close();
 console.log(JSON.stringify({...row,burst:row.burst.length,hits:undefined,resources:undefined}));
}}finally{await browser.close();}
writeFileSync(out,JSON.stringify({at:new Date().toISOString(),diagnostic:true,method:'Isolated real AudioEngine, cold versus selective preload, then simultaneous distinct warmed cues; never acceptance gameplay. Actual start groups; no audio alterations.',rows},null,2)+'\n');
