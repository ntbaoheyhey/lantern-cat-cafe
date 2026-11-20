/** Actual music bus plus full output across real application screen changes. */
import {createRequire} from 'node:module';
import {appendFileSync,writeFileSync,readFileSync,mkdirSync,rmSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {installOutputCapture} from './capture-page.mjs';
import {openAudioScreen} from './ui-fixtures.mjs';
const require=createRequire(new URL('../../apps/web/package.json',import.meta.url)),{chromium}=require('@playwright/test');
const B='reports/v3-shell/b2',raw='tmp/b2-mix/s6-continuity.webm',stem='tmp/b2-mix/s6-music.webm';mkdirSync('tmp/b2-mix',{recursive:true});
const browser=await chromium.launch({headless:true,args:['--autoplay-policy=no-user-gesture-required','--disable-background-timer-throttling']});
const p=await browser.newPage({viewport:{width:1280,height:720},reducedMotion:'reduce'}),errors=[],steps=[];
p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='warning'&&m.text().startsWith('Audio unavailable'))errors.push(m.text());});
try{
 await installOutputCapture(p,raw);writeFileSync(stem,Buffer.alloc(0));
 await p.exposeFunction('__saveMusic',bytes=>appendFileSync(stem,Buffer.from(bytes)));
 await openAudioScreen(p,'cafe-hub');await p.waitForTimeout(1800);
 await p.evaluate(()=>{
  const engine=window.__thAudio,destination=engine.duck.context.createMediaStreamDestination();
  // Observe the existing music-only node after ducking. It still connects to
  // the real master bus; this additional connection does not change playback.
  engine.duck.connect(destination);const recorder=new MediaRecorder(destination.stream,{mimeType:'audio/webm;codecs=opus',audioBitsPerSecond:128000});let pending=Promise.resolve();
  recorder.ondataavailable=event=>{pending=pending.then(async()=>{if(event.data.size)await window.__saveMusic(Array.from(new Uint8Array(await event.data.arrayBuffer())));});};
  window.__musicCapture={start(){recorder.start(500);},async stop(){await new Promise(resolve=>{recorder.onstop=resolve;recorder.stop();});await pending;engine.duck.disconnect(destination);}};
 });
 const start=await p.evaluate(()=>{window.__musicCapture.start();return window.__outputCapture.start();});
 const go=async(name,fn)=>{steps.push({name,atSeconds:Date.now()/1000-start});await fn();await p.waitForTimeout(1400);};
 const screen=name=>p.evaluate(name=>window.__depthReview.go(name),name);
 await go('home',async()=>{});
 for(const [name,id] of [['team','team'],['hero','collection'],['bag','inventory'],['invitations','gacha'],['map','map'],['settings','save']])await go(name,()=>screen(id));
 for(const name of ['season','economy'])await go(name,async()=>{await screen('hub');await p.evaluate(name=>window.dispatchEvent(new CustomEvent('shell:page',{detail:name})),name);await p.getByRole('button',{name:'Close page',exact:true}).click();});
 await go('battle',()=>p.evaluate(()=>{window.__depthReview.watchNow();window.__depthReview.fight();}));
 await p.waitForTimeout(2500);
 await go('home-return',()=>p.evaluate(()=>{window.__depthReview.leave();window.__depthReview.go('hub');}));
 await p.evaluate(async()=>{await window.__musicCapture.stop();await window.__outputCapture.stop();});
 const sign=path=>({path,sha256:createHash('sha256').update(readFileSync(path)).digest('hex')});
 const renders={};
 for(const [name,input] of [['output',raw],['music',stem]]){
  const path=`${B}/renders/s6-continuity-${name}.opus`;execFileSync('ffmpeg',['-v','error','-y','-i',input,'-c:a','copy',path]);rmSync(input);
  const result=execFileSync('ffmpeg',['-hide_banner','-i',path,'-af','silencedetect=noise=-50dB:d=0.001','-f','null','-'],{encoding:'utf8',stdio:['ignore','ignore','pipe']});
  renders[name]={...sign(path),analysis:result};
 }
 // ffmpeg writes analysis to stderr; spawnSync retains it without raw PCM.
 const {spawnSync}=await import('node:child_process');
 const analysis=spawnSync('ffmpeg',['-hide_banner','-i',renders.music.path,'-af','silencedetect=noise=-50dB:d=0.001','-f','null','-'],{encoding:'utf8'}).stderr;
 const gaps=[...analysis.matchAll(/silence_duration: ([\d.]+)/g)].map(m=>Number(m[1])*1000);
 const result={render:sign(renders.output.path),musicStem:sign(renders.music.path),steps,maxMusicGapMs:Math.max(0,...gaps),gapsMs:gaps,errors,method:'Production-default music node after ducking, before master, tapped without replacing output; identical real screen operations also recorded at master output. Longest sub -50 dBFS interval from ffmpeg; no normalization, trims or fabricated playback.'};
 writeFileSync(`${B}/UI-AUDIO-CONTINUITY.json`,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({maxMusicGapMs:result.maxMusicGapMs,steps:steps.length,errors}));
}finally{await browser.close();}
