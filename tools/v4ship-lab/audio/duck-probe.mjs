/** Causal diagnostic: observe the real gain while unrelated UI sources finish. */
import {writeFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {chromium} from '../../../scripts/v3feel/browser-fixture.mjs';
const root=resolve(import.meta.dirname,'../../..'),trial=process.argv[2];
if(!/^[a-z0-9-]+$/.test(trial))throw Error('Invalid trial');
const out=resolve(root,'reports/v4-ship/S5',trial+'.json');
if(existsSync(out))throw Error('Preserve previous evidence');
const browser=await chromium.launch({headless:true,args:['--autoplay-policy=no-user-gesture-required']});
try{
 const page=await browser.newPage();
 await page.route('**/__duck-probe',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><title>Duck recovery diagnostic</title>'}));
 await page.goto('http://127.0.0.1:5995/__duck-probe');
 const result=await page.evaluate(async()=>{
  const {AudioEngine}=await import('/src/audio/engine.ts'),e=new AudioEngine(()=>.5);
  await e.unlock();await e.preload('battle');await e.preloadVoices(['party-mochi']);
  const wait=ms=>new Promise(r=>setTimeout(r,ms)),samples=[],ramps=[];
  const original=e.duck.gain.linearRampToValueAtTime;
  e.duck.gain.linearRampToValueAtTime=function(value,at){ramps.push({value,at,now:e.ctx.currentTime});return original.call(this,value,at);};
  e.play('voice.mochi.ult.charge');
  const deadline=performance.now()+5000;
  while(!e.diagnostics.voice&&performance.now()<deadline)await wait(5);
  if(!e.diagnostics.voice)throw Error('Voice never started');
  while(e.diagnostics.voice&&performance.now()<deadline)await wait(5);
  if(e.diagnostics.voice)throw Error('Voice never ended');
  const ended=e.ctx.currentTime,timer=setInterval(()=>e.play('ui.click'),100);
  while(e.ctx.currentTime-ended<1){samples.push({after:e.ctx.currentTime-ended,gain:e.duck.gain.value});await wait(20);}
  clearInterval(timer);e.stop();await e.ctx.close();
  const recovery=samples.filter(s=>s.after>=.45);
  return {voiceEnded:ended,ramps,samples,minGainAfter450ms:Math.min(...recovery.map(s=>s.gain)),recoveryPass:recovery.every(s=>s.gain>=.995)};
 });
 writeFileSync(out,JSON.stringify({at:new Date().toISOString(),diagnostic:true,method:'Real AudioEngine, one full authored line followed by warmed UI clicks every100ms; inspect unchanged duck GainNode. No mix override.',...result},null,2)+'\n');
 console.log(JSON.stringify({trial,minGainAfter450ms:result.minGainAfter450ms,recoveryPass:result.recoveryPass,releaseRamps:result.ramps.filter(r=>r.value===1).length}));
}finally{await browser.close();}
