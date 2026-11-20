/** Retest isolated flight playback with a genuinely clear terminal voice slot; preserve original failure. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import {prepareJourneyAudio,observeJourneyAudio} from './journey-observer.mjs';
import {runtimeSignature,assertUnchanged} from '../../../scripts/audio/runtime-signature.mjs';
const root=resolve(import.meta.dirname,'../../..'),attempt=process.argv[2];assert(/^\d+$/.test(attempt));
const output=resolve(root,`reports/v4-ship/S11/ranged-playback-clear-probe-${attempt}.json`),raw=output.replace('.json','.events.json.gz'),folder=resolve(root,`work/v4ship-audio/ranged-playback-clear-probe-${attempt}`);
assert(!existsSync(output)&&!existsSync(raw)&&!existsSync(folder)&&!existsSync(resolve(root,'STOP-V4SHIP')));mkdirSync(folder,{recursive:true});
const hash=b=>createHash('sha256').update(b).digest('hex'),signed=path=>({path,sha256:hash(readFileSync(resolve(root,path)))}),read=path=>JSON.parse(readFileSync(resolve(root,path)));
const packagePath='reports/v4-ship/S11/ranged-codec-package-1.json',prepared=read(packagePath),patch=read(prepared.manifest.path),manifest=read('apps/web/public/audio/manifest.json'),signature=runtimeSignature(root);
for(const s of [...prepared.files,prepared.manifest,prepared.licenses])assert.equal(hash(readFileSync(resolve(root,s.path))),s.sha256);
const designs={...patch.designs};
for(const element of ['ember','heavy']){
 const base=manifest.designs[`kit.${element}.impact`];
 const launch=structuredClone(manifest.designs[element==='ember'?'kit.heavy.charge':'kit.magic.release'].layers[0]);
 launch.role='launch';launch.offsetMs=0;launch.gainDb=-13;launch.eq=element==='ember'?'high-pass-80':'flat';launch.variants=launch.variants.map(v=>({...v,duration:Math.min(v.duration,.04),variantId:v.variantId+'/ranged-launch-40ms'}));
 const travel=structuredClone(manifest.designs['kit.magic.release'].layers.find(l=>l.role==='foley'));
 travel.role='travel';travel.offsetMs=0;travel.gainDb=-15;travel.eq='high-pass-80';travel.variants=travel.variants.map(v=>({...v,start:v.start+.035,duration:.025,variantId:v.variantId+'/ranged-travel-35-60ms'}));
 for(const [phase,layer] of [['release',launch],['travel',travel]])designs[`kit.ranged-${element}.${phase}`]={bus:'sfx',layers:[layer],pitchRange:base.pitchRange,gainRange:[-1,1],cooldownMs:0,priority:50};
}
const fullManifest={...manifest,packs:{...manifest.packs,...patch.packs},designs:{...manifest.designs,...designs}};
const candidatePath=resolve(folder,'manifest-patch.json');writeFileSync(candidatePath,JSON.stringify({...patch,designs},null,2)+'\n');
const timingPath='reports/v4-ship/S11/ranged-timing-comparison-1.json',timing=read(timingPath),cases=[...new Map(timing.rows.map(r=>[r.owner+':'+r.ultimate,{owner:r.owner,ultimate:r.ultimate,launchMs:r.scheduleMs.retimedFlight,impactMs:r.unchangedImpactMs}])).values()];assert.equal(cases.length,4);
const require=createRequire(resolve(root,'apps/web/package.json')),{chromium}=require('@playwright/test');
const browser=await chromium.launch({headless:true,args:['--autoplay-policy=no-user-gesture-required']}),rows=[],errors=[];let failure;
try{
 const page=await browser.newPage();page.on('pageerror',e=>errors.push(String(e.message).slice(0,200)));
 await page.route('**/*',route=>{
  const u=new URL(route.request().url());if(u.hostname!=='127.0.0.1'||u.port!=='5995')return route.abort();
  if(u.pathname==='/__ranged-playback')return route.fulfill({contentType:'text/html',body:'<!doctype html><title>Ranged playback preparation</title>'});
  if(u.pathname==='/audio/manifest.json')return route.fulfill({contentType:'application/json',body:JSON.stringify(fullManifest)});
  const file=prepared.files.find(f=>u.pathname===`/audio/v4-ranged-impacts.${f.format}`);if(file)return route.fulfill({contentType:file.format==='webm'?'audio/webm':'audio/mpeg',body:readFileSync(resolve(root,file.path))});
  return route.continue();
 });
 await prepareJourneyAudio(page);await page.goto('http://127.0.0.1:5995/__ranged-playback');
 for(const c of cases)for(const speed of [1,2,3])for(const speech of ['authored','clear-terminal-slot'])for(const impact of ['four-source','baked-single']){
  assert(!existsSync(resolve(root,'STOP-V4SHIP')));
  await page.evaluate(async()=>{
   const {AudioEngine}=await import('/src/audio/engine.ts');const e=window.__thAudio=new AudioEngine(()=>.5);await e.unlock();
   const m=await e.loadManifest();if(window.__warmRangedBuffers)e.decoded=new Map(window.__warmRangedBuffers);
   await e.preload('battle');await e.preloadVoices(['soot','binding-thread','yarn-giant']);await e.buffer('v4-ranged-impacts',m);window.__warmRangedBuffers=new Map(e.decoded);
   window.__journeyAudio={controls:[],receipts:[],requests:[],starts:[],results:[],activeControl:null,activeReceipt:null};
  });
  await observeJourneyAudio(page);
  const row=await page.evaluate(async({c,speed,speech,impact})=>{
   const {pilotFixture}=await import('/src/game/cardrpg/vfx-layered/fixture.ts'),{configureSequence}=await import('/src/game/cardrpg/battle-v3/sequence.ts'),{audioTimeline}=await import('/src/game/cardrpg/battle-v3/audio-timeline.ts');
   const id=c.owner==='soot'?`soot-${c.ultimate?4:1}`:`enemy:binding-thread${c.ultimate?'':':basic'}`,plan=configureSequence(pilotFixture(id).plan),e=window.__thAudio,element=c.owner==='soot'?'ember':'heavy';
   const existing=audioTimeline(plan,plan.sequence),track=existing.filter(k=>k.role!=='movement'&&k.role!=='impact'&&(speech==='authored'||k.role!=='voice')).map(k=>speech==='clear-terminal-slot'&&k.role==='charge'?{...k,cue:`kit.${element}.charge`}:k);
   track.push({t:c.launchMs,cue:`kit.ranged-${element}.release`,role:'release',element},{t:(c.launchMs+c.impactMs)/2,cue:`kit.ranged-${element}.travel`,role:'travel',element},{t:c.impactMs,cue:impact==='baked-single'?`kit.ranged-${element}.impact`:`kit.${element}.impact`,role:'impact',element},{t:c.impactMs,cue:'voice.yarn-giant.death',role:'terminal',element});
   track.sort((a,b)=>a.t-b.t||(a.role==='voice'?-1:b.role==='voice'?1:0));e.speed(speed);
   const operations=[],ended=[],end=e.end;
   e.end=function(p,stopped){if(!p.ended)ended.push({id:p.id,group:p.group,stopped:!!stopped,at:performance.now()});return end.apply(this,arguments);};
   let origin,at=0,index=0;
   await new Promise(resolve=>requestAnimationFrame(function step(now){
    origin??=now;at=(now-origin)*speed;
    while(index<track.length&&track[index].t<=at){const key=track[index++],before=window.__journeyAudio.requests.length;const options={speed,element,...(key.role==='voice'?{priority:100}:key.role==='terminal'?{priority:80}:{})};e.play(key.cue,options);operations.push({...key,request:before,submittedMs:at,wallMs:now-origin});}
    if(at<plan.duration)requestAnimationFrame(step);else resolve();
   }));
   const deadline=performance.now()+5000;while(e.active.size&&performance.now()<deadline)await new Promise(r=>setTimeout(r,20));
   const data={...window.__journeyAudio,ended,activeAtEnd:e.active.size};e.stop();await e.ctx.close();
   return {...c,speed,speech,impact,operations,data};
  },{c,speed,speech,impact});
  const starts=[...row.data.starts].sort((a,b)=>a.when-b.when);let left=0,peak=0;
  for(let right=0;right<starts.length;right++){while(starts[right].when-starts[left].when>=.1-1e-9)left++;peak=Math.max(peak,right-left+1);}
  row.peak=peak;row.events=row.operations.map(op=>({...op,starts:row.data.starts.filter(s=>s.request===op.request),results:row.data.results.filter(r=>r.request===op.request).map(r=>r.result)}));
  row.weaponPass=row.events.filter(e=>['release','travel','impact'].includes(e.role)).every(e=>e.starts.length===(e.role==='impact'&&impact==='four-source'?4:1));
  row.terminalPlayed=row.events.find(e=>e.role==='terminal').starts.length===1;row.sourceBudgetPass=peak<=6;rows.push(row);
  console.log(JSON.stringify({case:rows.length,owner:c.owner,ultimate:c.ultimate,speed,speech,impact,peak,weaponPass:row.weaponPass,terminalPlayed:row.terminalPlayed,drops:row.events.filter(e=>!e.starts.length).map(e=>({role:e.role,results:e.results}))}));
 }
}catch(e){failure=String(e.message).slice(0,300);}finally{await browser.close();}
assertUnchanged(root,signature);const bytes=gzipSync(JSON.stringify(rows));writeFileSync(raw,bytes);
const selected=rows.filter(r=>r.impact==='baked-single'),summary=['four-source','baked-single'].map(impact=>({impact,speeds:[1,2,3].map(speed=>{const r=rows.filter(r=>r.impact===impact&&r.speed===speed),clear=r.filter(r=>r.speech==='clear-terminal-slot');return {speed,cases:r.length,weaponPass:r.filter(r=>r.weaponPass).length,clearTerminalCases:clear.length,clearTerminalPlayed:clear.filter(r=>r.terminalPlayed).length,peak:Math.max(...r.map(r=>r.peak))};})}));
const pass=rows.length===48&&!failure&&!errors.length&&selected.every(r=>r.weaponPass&&r.sourceBudgetPass&&(r.speech!=='clear-terminal-slot'||r.terminalPlayed));
const report={at:new Date().toISOString(),learn:'reports/v4-ship/LEARN/S11-ranged-audio.md',signature,inputs:[signed(packagePath),signed(timingPath)],harness:[signed(relative(root,import.meta.filename)),signed('tools/v4ship-lab/audio/journey-observer.mjs')],candidate:signed(relative(root,candidatePath)),events:signed(relative(root,raw)),summary,pass,failure,errors,
 scope:'48isolated actual AudioEngine/source.start cases using proposed manifest routes, real requestAnimationFrame and unchanged source admission. Fresh engine per case with decoded buffer reuse. Four observed fixed actions, three speeds, four-source/baked impact, authored speech and an explicitly clear terminal slot. No source clocks or admission methods replaced.',
 limits:['Clear terminal-slot cases omit the authored voice and use its identical kit charge SFX to avoid the automatic ult charge voice fallback. Authored cases retain the original voice, fallback and priority/cadence; all suppression remains reported.','Only Soot/Binding Thread actions are represented. Neighbouring actions, scene beds, UI and other ranged classes require later coverage.','This is source playback telemetry, not output capture, viewed flight paint, human listening or physical onset. No published assets or runtime changed.'],runtimeChanged:false,physicalOnsetVerified:false,humanListeningVerified:false,overallAudioGatePass:false};
writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({output:relative(root,output),pass,summary,failure}));if(!pass)process.exitCode=1;
