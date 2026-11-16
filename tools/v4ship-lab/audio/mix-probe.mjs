/** A/B diagnostic edits affect this browser only. Capture actual Web Audio output. */
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {chromium,config,openFixture} from '../../../scripts/v3feel/browser-fixture.mjs';
import {installOutputCapture} from '../../../scripts/audio/capture-page.mjs';
const root=resolve(import.meta.dirname,'../../..'),out=resolve(root,'reports/v4-ship/S5'),raw=resolve(out,'raw');mkdirSync(raw,{recursive:true});
const variants=[{id:'current',bedDb:0,trimDb:0,duckDb:8,attack:.12},{id:'bed-minus6',bedDb:-6,trimDb:-3,duckDb:8,attack:.04},{id:'bed-minus10',bedDb:-10,trimDb:0,duckDb:6,attack:.02}],rows=[];
const browser=await chromium.launch({headless:true,args:['--use-angle=metal','--autoplay-policy=no-user-gesture-required','--disable-background-timer-throttling']});
try{for(const variant of variants){
 const path=resolve(raw,variant.id+'.webm');
 const {page,errors}=await openFixture(browser,config.fixtures.find(f=>f.id==='boss'),{url:'http://127.0.0.1:5995',fixedClock:false,setupPage:p=>installOutputCapture(p,path)});
 await page.evaluate(async v=>{
  const a=window.__thAudio;await a.unlock();await a.preload('battle');a.music('boss');
  await new Promise(r=>setTimeout(r,600));
  a.setBus('music',a.settings.music*10**(v.bedDb/20));
  const now=a.ctx.currentTime;a.mixTrim.gain.cancelScheduledValues(now);a.mixTrim.gain.setValueAtTime(a.mixTrim.gain.value*10**(v.trimDb/20),now);
  a.duckMusic=()=>{a.makeSpeechSpace();const p=a.duck.gain,t=a.ctx.currentTime;p.cancelScheduledValues(t);p.setValueAtTime(p.value,t);p.linearRampToValueAtTime(10**(-v.duckDb/20),t+v.attack);};
  window.__mixProbe={start:await window.__outputCapture.start(),voices:[]};
  a.hits.length=0;const s=window.__depthScene,m=window.__depthReview;s.last=0;s.raf=requestAnimationFrame(s.loop);m.nextStepAt=0;m.paused=false;m.notify(false);
  window.__mixTimer=setInterval(()=>window.__mixProbe.voices.push({...a.diagnostics,packs:undefined,at:Date.now()}),100);
 },variant);
 for(let n=0;n<4;n++){await page.waitForTimeout(15000);console.log(`${variant.id} ${(n+1)*15}/60s`);}
 const data=await page.evaluate(async()=>{window.__depthReview.paused=true;clearInterval(window.__mixTimer);await window.__outputCapture.stop();return {...window.__mixProbe,hits:window.__thAudio.hits};});
 await page.close();
 const measured=spawnSync('ffmpeg',['-hide_banner','-i',path,'-af','loudnorm=I=-23:TP=-1:LRA=11:print_format=json','-f','null','-'],{encoding:'utf8'});
 const l=JSON.parse(measured.stderr.match(/\{\s*"input_i"[\s\S]*?\}/)?.[0]??'{}');
 rows.push({variant,seconds:60,integratedLufs:Number(l.input_i),lra:Number(l.input_lra),truePeakDbTP:Number(l.input_tp),maxSources:Math.max(...data.voices.map(r=>r.active)),maxSpeech:Math.max(...data.voices.map(r=>r.voice)),errors,hits:data.hits.length});
 writeFileSync(resolve(out,'mix-probe.json'),JSON.stringify({at:new Date().toISOString(),method:'Actual boss fixture output; browser-only bus and duck changes; no normalization. Exploratory 60-second windows, not 30-minute standards compliance.',rows},null,2)+'\n');
 writeFileSync(resolve(raw,variant.id+'-events.json'),JSON.stringify(data));console.log(JSON.stringify(rows.at(-1)));
}}finally{await browser.close();}
