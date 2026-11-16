/** A/B diagnostic edits affect this browser only. Capture actual Web Audio output. */
import {mkdirSync,writeFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {chromium,config,openFixture} from '../../../scripts/v3feel/browser-fixture.mjs';
import {installOutputCapture} from '../../../scripts/audio/capture-page.mjs';
const root=resolve(import.meta.dirname,'../../..'),out=resolve(root,process.env.V4_AUDIO_PROBE_OUTPUT??'reports/v4-ship/S5'),raw=resolve(root,process.env.V4_AUDIO_PROBE_RAW??resolve(out,'raw'));mkdirSync(out,{recursive:true});mkdirSync(raw,{recursive:true});
if(existsSync(resolve(out,'mix-probe.json')))throw Error('Preserve the prior comparison; choose V4_AUDIO_PROBE_OUTPUT');
const seconds=Number(process.env.V4_AUDIO_PROBE_SECONDS??60);
const variants=process.env.V4_AUDIO_PROBE_VARIANTS?JSON.parse(process.env.V4_AUDIO_PROBE_VARIANTS):process.env.V4_AUDIO_PROBE_CENTER==='1'?[{id:'current',bedDb:0,trimDb:0,duckDb:8,attack:.12},{id:'quiet-center',bedDb:-6,trimDb:-1.5,duckDb:8,attack:.04}]:[{id:'current',bedDb:0,trimDb:0,duckDb:8,attack:.12},{id:'bed-minus6',bedDb:-6,trimDb:-3,duckDb:8,attack:.04},{id:'bed-minus10',bedDb:-10,trimDb:0,duckDb:6,attack:.02}],rows=[];
const fixtureId=process.env.V4_AUDIO_PROBE_FIXTURE??'boss';
const browser=await chromium.launch({headless:true,args:['--use-angle=metal','--autoplay-policy=no-user-gesture-required','--disable-background-timer-throttling']});
try{for(const variant of variants){
 const path=resolve(raw,variant.id+'.webm');
 const {page,errors}=await openFixture(browser,config.fixtures.find(f=>f.id===fixtureId),{url:'http://127.0.0.1:5995',fixedClock:false,setupPage:p=>installOutputCapture(p,path)});
 await page.evaluate(async({v,fixtureId})=>{
  const a=window.__thAudio;await a.unlock();await a.preload('battle');a.music(fixtureId==='boss'?'boss':'battle');
  if(v.poolSeed!==undefined){const {VariantPools}=await import('/src/audio/variants.ts');let state=v.poolSeed;const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};a.random=random;a.pools=new VariantPools(random);}
  await new Promise(r=>setTimeout(r,600));
  a.setBus('music',a.settings.music*10**(v.bedDb/20));
  if(v.voiceDb)a.buses.get('voice').gain.setValueAtTime(a.settings.voice*10**(v.voiceDb/20),a.ctx.currentTime);
  if(v.voiceToneDb)a.tones.get('voice').gain.setValueAtTime(a.tones.get('voice').gain.value+v.voiceToneDb,a.ctx.currentTime);
  const now=a.ctx.currentTime;a.mixTrim.gain.cancelScheduledValues(now);a.mixTrim.gain.setValueAtTime(a.mixTrim.gain.value*10**(v.trimDb/20),now);
  if(v.duckDb!==undefined)a.duckMusic=()=>{a.makeSpeechSpace();a.ducked=true;const p=a.duck.gain,t=a.ctx.currentTime;p.cancelScheduledValues(t);p.setValueAtTime(p.value,t);p.linearRampToValueAtTime(10**(-v.duckDb/20),t+v.attack);};
  window.__mixProbe={start:await window.__outputCapture.start(),voices:[]};
  a.hits.length=0;const s=window.__depthScene,m=window.__depthReview;s.last=0;s.raf=requestAnimationFrame(s.loop);m.nextStepAt=0;m.paused=false;m.notify(false);
  window.__mixTimer=setInterval(()=>window.__mixProbe.voices.push({...a.diagnostics,packs:undefined,at:Date.now()}),100);
 },{v:variant,fixtureId});
 for(let elapsed=0;elapsed<seconds;elapsed+=15){if(existsSync(resolve(root,'STOP-V4SHIP')))throw Error('STOP-V4SHIP');await page.waitForTimeout(Math.min(15,seconds-elapsed)*1000);console.log(`${variant.id} ${Math.min(elapsed+15,seconds)}/${seconds}s`);}
 const data=await page.evaluate(async()=>{window.__depthReview.paused=true;clearInterval(window.__mixTimer);await window.__outputCapture.stop();return {...window.__mixProbe,hits:window.__thAudio.hits};});
 await page.close();
 const measured=spawnSync('ffmpeg',['-hide_banner','-i',path,'-af','loudnorm=I=-23:TP=-1:LRA=11:print_format=json','-f','null','-'],{encoding:'utf8'});
 const l=JSON.parse(measured.stderr.match(/\{\s*"input_i"[\s\S]*?\}/)?.[0]??'{}');
 rows.push({variant,seconds,integratedLufs:Number(l.input_i),lra:Number(l.input_lra),truePeakDbTP:Number(l.input_tp),maxSources:Math.max(...data.voices.map(r=>r.active)),maxSpeech:Math.max(...data.voices.map(r=>r.voice)),errors,hits:data.hits.length});
 writeFileSync(resolve(out,'mix-probe.json'),JSON.stringify({at:new Date().toISOString(),fixtureId,method:'Actual rules fixture output; browser-only bus and duck changes; no normalization. Short diagnostic windows, not 30-minute standards compliance.',rows},null,2)+'\n');
 writeFileSync(resolve(raw,variant.id+'-events.json'),JSON.stringify(data));console.log(JSON.stringify(rows.at(-1)));
}}finally{await browser.close();}
