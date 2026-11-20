/** Exercise the installed BattleAudio scheduler, including mid-flight speed changes. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {gzipSync} from 'node:zlib';
import {prepareJourneyAudio,observeJourneyAudio} from './journey-observer.mjs';
import {installOutputCapture} from '../../../scripts/audio/capture-page.mjs';
import {runtimeSignature,assertUnchanged} from '../../../scripts/audio/runtime-signature.mjs';
const root=resolve(import.meta.dirname,'../../..'),attempt=process.argv[2];assert(/^\d+$/.test(attempt));
const folder=resolve(root,`work/v4ship-audio/ranged-runtime-playback-${attempt}`),output=resolve(root,`reports/v4-ship/S11/ranged-runtime-playback-${attempt}.json`),raw=output.replace('.json','.events.json.gz');
assert(!existsSync(folder)&&!existsSync(output)&&!existsSync(resolve(root,'STOP-V4SHIP')));mkdirSync(folder,{recursive:true});
const hash=b=>createHash('sha256').update(b).digest('hex'),signed=path=>({path,sha256:hash(readFileSync(resolve(root,path)))}),read=path=>JSON.parse(readFileSync(resolve(root,path)));
const signature=runtimeSignature(root),inventoryPath='reports/v4-ship/S11/ranged-class-inventory-1.json',inventory=read(inventoryPath);
const profiles=[{name:'fixed-1',from:1,to:1,phase:'launch'},{name:'fixed-2',from:2,to:2,phase:'launch'},{name:'fixed-3',from:3,to:3,phase:'launch'},{name:'accelerate-before-launch',from:1,to:3,phase:'before'},{name:'slow-during-flight',from:3,to:1,phase:'middle'},{name:'accelerate-after-launch',from:2,to:3,phase:'after'}];
const require=createRequire(resolve(root,'apps/web/package.json')),{chromium}=require('@playwright/test'),browser=await chromium.launch({headless:true}),rows=[],captures=[],errors=[],blocked=[];let failure;
try{
 for(const width of [1280,1440]){
  const height=width===1280?720:900,page=await browser.newPage({viewport:{width,height}}),capturePath=resolve(folder,`${width}x${height}.webm`);
  page.on('pageerror',e=>errors.push(String(e.message).slice(0,200)));
  await page.route('**/*',route=>{const u=new URL(route.request().url());if(u.hostname!=='127.0.0.1'||u.port!=='5995'){blocked.push(u.origin+u.pathname);return route.abort();}if(u.pathname==='/__ranged-runtime-playback')return route.fulfill({contentType:'text/html',body:`<!doctype html><title>Installed ranged scheduler</title><style>body{margin:0}canvas{display:block}</style><canvas width="${width}" height="${height}"></canvas>`});return route.continue();});
  await prepareJourneyAudio(page);await installOutputCapture(page,capturePath);await page.goto('http://127.0.0.1:5995/__ranged-runtime-playback');
  await page.evaluate(async()=>{const {LayeredVfx}=await import('/src/game/cardrpg/vfx-layered/player.ts');window.__rangedRenderer=new LayeredVfx(()=>undefined);await window.__rangedRenderer.ready;if(window.__rangedRenderer.stats.failed.length)throw Error('Published atlas load failed');});
  let captureStarted=false;
  for(const c of inventory.rows)for(const profile of profiles){
   assert(!existsSync(resolve(root,'STOP-V4SHIP')));
   const preload=await page.evaluate(async owners=>{
    const {AudioEngine}=await import('/src/audio/engine.ts'),e=window.__thAudio=new AudioEngine(()=>.5);await e.unlock();
    if(window.__rangedWarm){e.decoded=new Map(window.__rangedWarm);e.buffers=new Map([...window.__rangedWarm].map(([k,v])=>[k,Promise.resolve(v)]));}
    await e.preload('battle');await e.preloadVoices(owners);window.__rangedWarm=new Map(e.decoded);
    window.__journeyAudio={controls:[],receipts:[],requests:[],starts:[],results:[],activeControl:null,activeReceipt:null};
    return {rangedDecoded:e.decoded.has('v4-ranged-impacts'),active:e.active.size};
   },[...new Set(inventory.rows.map(r=>r.owner))]);
   assert(preload.rangedDecoded&&preload.active===0,'Normal battle preload must decode the ranged pack without playing');
   await observeJourneyAudio(page);if(!captureStarted){await page.evaluate(()=>window.__outputCapture.start());captureStarted=true;}
   const row=await page.evaluate(async({c,profile,width,height})=>{
    const [{pilotFixture},{configureSequence},{audioTimeline},{BattleAudio},{advanceBattleClock},{project},{PAINT_TIMELINES},{resolveDesign}]=await Promise.all([import('/src/game/cardrpg/vfx-layered/fixture.ts'),import('/src/game/cardrpg/battle-v3/sequence.ts'),import('/src/game/cardrpg/battle-v3/audio-timeline.ts'),import('/src/game/cardrpg/battle-v3/battle-audio.ts'),import('/src/game/cardrpg/battle-v3/final-hit.ts'),import('/src/game/cardrpg/depth/scene-actors.ts'),import('/src/game/cardrpg/vfx-layered/player.ts'),import('/src/audio/cues.ts')]);
    const fixture=pilotFixture(c.id),plan=configureSequence(fixture.plan),e=window.__thAudio,actors=project(fixture.battle),layered=window.__rangedRenderer,canvas=document.querySelector('canvas'),ctx=canvas.getContext('2d'),timeline=PAINT_TIMELINES.get(c.id),image=layered.images.get(c.id),track=audioTimeline(plan,plan.sequence);
    const launch=c.launchMs??800,switchAt=profile.phase==='before'?launch-35:profile.phase==='middle'?(launch+c.impactMs)/2:profile.phase==='after'?launch+1:launch;
    const view={battleKey:plan,actors,models:Object.fromEntries(actors.map(a=>[a.id,a.cardRpg.cardId])),rows:Object.fromEntries(fixture.battle.actors.map(a=>[a.id,a.row])),targetIds:plan.targetIds,legalIds:[],currentId:null,formationC2:true,reducedMotion:false,paused:false,boss:false,playbackSpeed:profile.from,frame:{plan,elapsed:0}};
    const paints=[],operations=[],ended=[],changes=[],ordinals=new Map(),end=e.end,draw=ctx.drawImage;let previous,elapsed=0,speed=profile.from;
    e.end=function(p,stopped){if(!p.ended)ended.push({id:p.id,group:p.group,stopped:!!stopped,at:performance.now()});return end.apply(this,arguments);};
    const audio=new BattleAudio((cue,options)=>{const event=audio.events.at(-1),key=track.find(k=>k.cue===cue),request=window.__journeyAudio.requests.length,design=resolveDesign(cue,e.decodedManifest,options?.element),expected=design?.baked?1:design?.layers.length??1;e.play(cue,options);operations.push({cue,role:event.role,t:key?.t??null,due:key?.role==='travel'?key.flightStart+(key.t-key.flightStart)/speed:key?.t??null,request,expected,speed,submittedMs:elapsed,at:performance.now()});});
    ctx.drawImage=function(...args){const result=draw.apply(this,args);if(args.length===9&&image){const [sx,sy,sw,sh]=args.slice(1,5),layer=timeline.layers.find(l=>(l.flipbook?.regions??[l.region]).some(r=>r[0]+image.x===sx&&r[1]+image.y===sy&&r[2]===sw&&r[3]===sh));if(layer&&this.globalAlpha>0){const recipient=ordinals.get(layer.name)??0;ordinals.set(layer.name,recipient+1);const m=this.getTransform();paints.push({layer:layer.name,recipient,anchor:layer.anchor,elapsed,at:performance.now(),alpha:this.globalAlpha,x:m.e,y:m.f,visible:canvas.checkVisibility()});}}return result;};
    await new Promise(resolve=>requestAnimationFrame(function step(now){
     if(previous!==undefined)elapsed=advanceBattleClock(plan,elapsed,Math.max(0,now-previous),false,speed);previous=now;
     const next=elapsed>=switchAt?profile.to:profile.from;if(next!==speed)changes.push({from:speed,to:next,elapsed,at:performance.now()});speed=next;e.speed(speed);view.playbackSpeed=speed;view.frame.elapsed=elapsed;
     ordinals.clear();ctx.clearRect(0,0,width,height);layered.render(ctx,view,width,height);audio.render(view);audio.render(view);
     if(elapsed<plan.duration)requestAnimationFrame(step);else resolve();
    }));ctx.drawImage=draw;
    const deadline=performance.now()+6000;while(e.active.size&&performance.now()<deadline)await new Promise(r=>setTimeout(r,20));await new Promise(r=>setTimeout(r,100));
    const data={...window.__journeyAudio,ended,activeAtEnd:e.active.size};e.stop();await e.ctx.close();return {id:c.id,owner:c.owner,ultimate:c.ultimate,hasFlight:c.hasFlight,profile,switchAt,changes,viewport:{width,height},track,operations,paints,data};
   },{c,profile,width,height});
   row.preload=preload;row.events=row.operations.map(o=>({...o,starts:row.data.starts.filter(s=>s.request===o.request),results:row.data.results.filter(r=>r.request===o.request).map(r=>r.result)}));
   row.sourcePass=row.events.every(o=>o.starts.length===o.expected&&o.results.includes('played'))&&row.operations.length===row.track.length;
   row.natural=row.data.activeAtEnd===0&&row.data.ended.length===row.data.starts.length&&row.data.ended.every(e=>!e.stopped);
   const times=row.data.starts.map(s=>Math.round(s.when*1e9));row.peak=times.reduce((p,t)=>Math.max(p,times.filter(x=>x>=t&&x<t+100000000).length),0);
   const before=row.paints.filter(p=>p.anchor==='flight'&&p.elapsed<c.impactMs),contact=row.paints.find(p=>p.layer==='impact-burst'&&p.elapsed>=c.impactMs),flight=row.events.filter(e=>e.role==='release'||e.role==='travel');
   row.travelBeforeContact=c.hasFlight?flight.length===2&&flight.every(e=>e.submittedMs<c.impactMs):flight.length===0;
   const moving=before.some(a=>row.paints.some(b=>b.anchor==='flight'&&b.layer===a.layer&&b.recipient===a.recipient&&b.elapsed>a.elapsed&&b.elapsed<=c.impactMs+150&&Math.hypot(b.x-a.x,b.y-a.y)>1));
   row.paintPass=!!contact&&row.paints.every(p=>p.visible)&&(c.hasFlight?before.length>0&&moving&&flight.every(e=>before.some(p=>p.elapsed===e.submittedMs)):before.length===0);
   row.outputEstimates=row.events.filter(e=>['release','travel','impact'].includes(e.role)).map(e=>{const s=e.starts[0],stamp=s?.outputTimestamp,paint=e.role==='impact'?contact:e.role==='release'?before[0]:before.find(p=>p.elapsed===e.submittedMs);return {role:e.role,estimatedStartMinusPaintMs:stamp?.contextTime>0&&paint?stamp.performanceTime+(s.when-stamp.contextTime)*1000-paint.at:null};});
   row.pass=row.sourcePass&&row.natural&&row.peak<=6&&row.travelBeforeContact&&row.paintPass&&(profile.from===profile.to||row.changes.length===1);rows.push(row);
   if(rows.length%6===0)console.log(JSON.stringify({cases:rows.length,id:c.id,viewport:width,passed:rows.filter(r=>r.pass).length,sourcePassed:rows.filter(r=>r.sourcePass).length,paintPassed:rows.filter(r=>r.paintPass).length,lastPeak:row.peak}));
  }
  await page.evaluate(async()=>{await window.__outputCapture.stop();window.__rangedRenderer.dispose();});await page.close();
  const measured=spawnSync(process.env.V4_FFMPEG??'/opt/homebrew/opt/ffmpeg-full/bin/ffmpeg',['-hide_banner','-i',capturePath,'-af','loudnorm=I=-18:TP=-1:LRA=5:print_format=json','-f','null','-'],{encoding:'utf8'});assert.equal(measured.status,0);const levels=JSON.parse(measured.stderr.match(/\{\s*"input_i"[\s\S]*?\}/)[0]);captures.push({viewport:{width,height},...signed(relative(root,capturePath)),levels});
 }
}catch(error){failure=String(error.message).slice(0,300);}finally{await browser.close();}
assertUnchanged(root,signature);writeFileSync(raw,gzipSync(JSON.stringify(rows)));
const estimates=rows.flatMap(r=>r.outputEstimates).map(r=>r.estimatedStartMinusPaintMs).filter(n=>n!==null),pass=rows.length===168&&!failure&&!errors.length&&!blocked.length&&rows.every(r=>r.pass);
const report={at:new Date().toISOString(),learn:'reports/v4-ship/LEARN/S11-ranged-audio.md',signature,inputs:[signed(inventoryPath)],harness:[signed(relative(root,import.meta.filename)),signed('tools/v4ship-lab/audio/journey-observer.mjs'),signed('scripts/audio/capture-page.mjs'),signed('scripts/audio/runtime-signature.mjs')],events:signed(relative(root,raw)),captures,summary:{cases:rows.length,passed:rows.filter(r=>r.pass).length,sourcePassed:rows.filter(r=>r.sourcePass).length,paintPassed:rows.filter(r=>r.paintPass).length,preContactPassed:rows.filter(r=>r.travelBeforeContact).length,peak:Math.max(...rows.map(r=>r.peak)),maximumAbsoluteOutputStartEstimateMs:estimates.length?Math.max(...estimates.map(Math.abs)):null,estimatesOutside33ms:estimates.filter(n=>Math.abs(n)>33).length},pass,failure,errors,blocked,
 scope:'Installed BattleAudio/AudioEngine and normal battle preload, all14legal ranged actions atbothsizes with3constant speeds and3mid-action changes, duplicate render calls, real rAF and shipping layered draw submissions. No injected cue track, manifest routing or direct private buffer preload.',
 limits:['Isolated VFX canvas and legal fixtures, not complete production scenes or terminal speech collisions.','Output capture lacks scene music; loudness is diagnostic only.','Draw submission and output timestamps do not prove displayed photons, physical onset or human listening.'],physicalOnsetVerified:false,humanListeningVerified:false,overallAudioGatePass:false};
writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({output:relative(root,output),summary:report.summary,pass,failure,errors:errors.length}));if(!pass)process.exitCode=1;
