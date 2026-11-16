/** Controlled renderer stubs and real WebAudio starts; never product acceptance. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {resolve,relative} from 'node:path';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {prepareJourneyAudio,observeJourneyAudio} from './journey-observer.mjs';
import {prepareImpactObservation,evaluateImpactObservation} from './impact-observer.mjs';
const root=resolve(import.meta.dirname,'../../..'),attempt=process.argv[2];assert(/^\d+$/.test(attempt));
const output=resolve(root,'reports/v4-ship/S11/impact-observer-check-'+attempt+'.json');
assert(!existsSync(output)&&!existsSync(resolve(root,'STOP-V4SHIP')));
const require=createRequire(resolve(root,'apps/web/package.json')),{chromium}=require('@playwright/test');
const browser=await chromium.launch({headless:true,args:['--autoplay-policy=no-user-gesture-required']});
const report={at:new Date().toISOString(),scope:'Controlled renderer stubs with real silent WebAudio source starts; checks attribution only, no product-audio or rendered-art pass.',
 harnessSha256:createHash('sha256').update(readFileSync(import.meta.filename)).digest('hex'),
 observerSha256:createHash('sha256').update(readFileSync(resolve(import.meta.dirname,'impact-observer.mjs'))).digest('hex'),rows:[],pass:false};
const cases=['one contact once','shared plan across scenes','missing renderer submission','explicit audio rejection','late observer installation','rearm after scene deletion'];
try{for(const name of cases){
 const context=await browser.newContext(),page=await context.newPage();
 try{
  await prepareJourneyAudio(page);await prepareImpactObservation(page);
  await page.route('**/__impact-check',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><body><p>Impact observer fixture</p></body>'}));
  await page.goto('http://127.0.0.1:5995/__impact-check');
  await page.evaluate(async()=>{
   const ctx=new AudioContext();await ctx.resume();
   window.__thAudio={ctx,group:0,reject:false,
    play(id){void this.perform(id);},
    async perform(id){if(this.reject){this.record(id,'rate-limit');return;}this.start(id,this.ctx.createBuffer(1,480,this.ctx.sampleRate),{bus:'sfx',pack:'synthetic',duration:.01},0,1,1,0,'flat',++this.group);this.record(id,'played');},
    start(id,buffer){const source=this.ctx.createBufferSource();source.buffer=buffer;source.connect(this.ctx.destination);source.start(this.ctx.currentTime,0,.01);return source;},
    record(){},
   };
  });
  await observeJourneyAudio(page);
  await page.evaluate(async name=>{
   const plan={id:7,actorId:'party-mochi',skillId:'mochi-1',fixedTiming:true,ultimate:false,beats:[{start:0},{start:100},{start:350}],events:[{type:'action_start'}]};
   function makeScene(){
    const canvas=document.createElement('canvas');canvas.width=128;canvas.height=72;document.body.appendChild(canvas);
    let emitted=false;
    const scene={scene:{},camera:{},ready:true,renderer:{domElement:canvas,render(){}},audio:{send(event){window.__thAudio.play(event.cue);}},
     render(view){this.currentView=view;if(name!=='missing renderer submission')this.renderer.render(this.scene,this.camera);if(view.frame.elapsed>=350&&!emitted){emitted=true;this.audio.send({cue:'kit.holy.impact',at:.35,planId:7,actorId:'party-mochi',skillId:'mochi-1',role:'impact'});}}};
    const view=elapsed=>({actors:[{id:'party-mochi',side:'party',cardRpg:{cardId:'mochi'}}],frame:{plan,elapsed},paused:false});
    if(name==='late observer installation')scene.currentView=view(400);
    window.__depthScene=scene;
    scene.render(view(name==='late observer installation'?400:0));scene.render(view(350));scene.render(view(400));
   }
   if(name==='explicit audio rejection')window.__thAudio.reject=true;
   makeScene();
   if(name==='shared plan across scenes')makeScene();
   if(name==='rearm after scene deletion'){delete window.__depthScene;await new Promise(r=>setTimeout(r,100));makeScene();}
  },name);
  await page.waitForTimeout(50);
  const data=await page.evaluate(async()=>{clearInterval(window.__impactObserverTimer);await window.__thAudio.ctx.close();return {impact:window.__impactObservation,audio:window.__journeyAudio};});
  const result=evaluateImpactObservation(data.impact,data.audio),positive=['one contact once','shared plan across scenes','rearm after scene deletion'].includes(name);
  const expected=['shared plan across scenes','rearm after scene deletion'].includes(name)?2:1;
  const pass=result.observedImpactCoveragePass===positive&&result.expectedContacts===expected&&
   (name!=='missing renderer submission'||result.observedContacts===0)&&
   (name!=='explicit audio rejection'||result.rows[0].sourceStarts===0)&&
   (name!=='late observer installation'||!result.rows[0].checks.observedBeforeImpact)&&
   (!positive||new Set(result.rows.flatMap(r=>r.requestIds)).size===expected);
  report.rows.push({name,pass,result,data});
 }finally{await context.close();}
}report.pass=report.rows.length===cases.length&&report.rows.every(r=>r.pass);
}catch(error){report.failure=error.message.slice(0,300);}
finally{await browser.close();writeFileSync(output,JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify({output:relative(root,output),pass:report.pass,rows:report.rows.map(({name,pass})=>({name,pass})),failure:report.failure}));
if(!report.pass)process.exitCode=1;
