/** Observe every ranged action through the real engine and shipping layered renderer. */
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
const folder=resolve(root,`work/v4ship-audio/ranged-class-playback-${attempt}`),output=resolve(root,`reports/v4-ship/S11/ranged-class-playback-${attempt}.json`),raw=output.replace('.json','.events.json.gz');assert(!existsSync(folder)&&!existsSync(output)&&!existsSync(raw)&&!existsSync(resolve(root,'STOP-V4SHIP')));mkdirSync(folder,{recursive:true});
const hash=b=>createHash('sha256').update(b).digest('hex'),signed=path=>({path,sha256:hash(readFileSync(resolve(root,path)))}),read=path=>JSON.parse(readFileSync(resolve(root,path))),signature=runtimeSignature(root);
const inventoryPath='reports/v4-ship/S11/ranged-class-inventory-1.json',inventory=read(inventoryPath),comparisonPath='reports/v4-ship/S11/ranged-flight-compare-1.json',comparison=read(comparisonPath),bakePath='reports/v4-ship/S11/ranged-class-bake-1.json',bake=read(bakePath),manifest=read('apps/web/public/audio/manifest.json');assert(comparison.selectedMethod&&bake.reconstructionPass);
for(const file of [...bake.files,bake.manifest,comparison.candidate])assert.equal(hash(readFileSync(resolve(root,file.path))),file.sha256);
const patch=read(comparison.candidate.path),fullManifest={...manifest,packs:{...manifest.packs,...patch.packs},designs:{...manifest.designs,...patch.designs}};
const require=createRequire(resolve(root,'apps/web/package.json')),{chromium}=require('@playwright/test'),browser=await chromium.launch({headless:true,args:['--autoplay-policy=no-user-gesture-required','--disable-background-timer-throttling','--disable-renderer-backgrounding']});
const rows=[],captures=[],errors=[],blocked=[];let failure;
const rolling=starts=>{const times=starts.map(s=>s.when).sort((a,b)=>a-b);let left=0,peak=0;for(let right=0;right<times.length;right++){while(times[right]-times[left]>=.1-1e-9)left++;peak=Math.max(peak,right-left+1);}return peak;};
try{
 for(const width of [1280,1440]){
  const height=width===1280?720:900,page=await browser.newPage({viewport:{width,height}}),capturePath=resolve(folder,`${width}x${height}.webm`);page.on('pageerror',e=>errors.push(String(e.message).slice(0,200)));
  await page.route('**/*',route=>{const u=new URL(route.request().url());if(u.hostname!=='127.0.0.1'||u.port!=='5995'){blocked.push(u.origin+u.pathname);return route.abort();}if(u.pathname==='/__ranged-class-playback')return route.fulfill({contentType:'text/html',body:`<!doctype html><title>Isolated ranged playback</title><style>body{margin:0}canvas{display:block}</style><canvas width="${width}" height="${height}"></canvas>`});if(u.pathname==='/audio/manifest.json')return route.fulfill({contentType:'application/json',body:JSON.stringify(fullManifest)});const file=bake.files.find(f=>u.pathname===`/audio/v4-ranged-impacts.${f.format}`);if(file)return route.fulfill({contentType:file.format==='webm'?'audio/webm':'audio/mpeg',body:readFileSync(resolve(root,file.path))});return route.continue();});
  await prepareJourneyAudio(page);await installOutputCapture(page,capturePath);await page.goto('http://127.0.0.1:5995/__ranged-class-playback');
  await page.evaluate(async()=>{const {LayeredVfx}=await import('/src/game/cardrpg/vfx-layered/player.ts');window.__rangedRenderer=new LayeredVfx(()=>undefined);await window.__rangedRenderer.ready;if(window.__rangedRenderer.stats.failed.length)throw Error('Published atlas load failed');});
  let captureStarted=false;
  for(const c of inventory.rows)for(const speed of [1,2,3])for(const speech of ['authored','clear-terminal-slot']){
   assert(!existsSync(resolve(root,'STOP-V4SHIP')));
   await page.evaluate(async owners=>{
    const {AudioEngine}=await import('/src/audio/engine.ts'),e=window.__thAudio=new AudioEngine(()=>.5);await e.unlock();await e.loadManifest();
    if(window.__rangedWarm){e.decoded=new Map(window.__rangedWarm);e.buffers=new Map([...window.__rangedWarm].map(([k,v])=>[k,Promise.resolve(v)]));}
    await e.preload('battle');await e.preloadVoices([...owners,'yarn-giant']);await e.buffer('v4-ranged-impacts',e.decodedManifest);window.__rangedWarm=new Map(e.decoded);
    window.__journeyAudio={controls:[],receipts:[],requests:[],starts:[],results:[],activeControl:null,activeReceipt:null};
   },[...new Set(inventory.rows.map(r=>r.owner))]);
   await observeJourneyAudio(page);if(!captureStarted){await page.evaluate(()=>window.__outputCapture.start());captureStarted=true;}
   const row=await page.evaluate(async({c,speed,speech,width,height})=>{
    const [{pilotFixture},{configureSequence},{audioTimeline},{project},{PAINT_TIMELINES},{resolveDesign}]=await Promise.all([import('/src/game/cardrpg/vfx-layered/fixture.ts'),import('/src/game/cardrpg/battle-v3/sequence.ts'),import('/src/game/cardrpg/battle-v3/audio-timeline.ts'),import('/src/game/cardrpg/depth/scene-actors.ts'),import('/src/game/cardrpg/vfx-layered/player.ts'),import('/src/audio/cues.ts')]);
    const fixture=pilotFixture(c.id),plan=configureSequence(fixture.plan),e=window.__thAudio,actors=project(fixture.battle),layered=window.__rangedRenderer,canvas=document.querySelector('canvas'),ctx=canvas.getContext('2d'),timeline=PAINT_TIMELINES.get(c.id),image=layered.images.get(c.id);
    const existing=audioTimeline(plan,plan.sequence),track=existing.filter(k=>(!c.hasFlight||k.role!=='movement')&&(speech==='authored'||k.role!=='voice')).map(k=>k.role==='impact'?{...k,cue:`kit.ranged-${c.element}.impact`}:speech==='clear-terminal-slot'&&k.role==='charge'?{...k,cue:`kit.${c.element}.charge`}:k);
    if(c.hasFlight)track.push({t:c.launchMs,cue:`kit.ranged-${c.element}.release`,role:'release',element:c.element},{t:c.travelMs,cue:`kit.ranged-${c.element}.travel`,role:'travel',element:c.element});
    track.push({t:c.impactMs,cue:'voice.yarn-giant.death',role:'terminal',element:c.element});track.sort((a,b)=>a.t-b.t||(a.role==='voice'?-1:b.role==='voice'?1:0));
    const view={actors,models:Object.fromEntries(actors.map(a=>[a.id,a.cardRpg.cardId])),rows:Object.fromEntries(fixture.battle.actors.map(a=>[a.id,a.row])),targetIds:plan.targetIds,legalIds:[],currentId:null,formationC2:true,reducedMotion:false,paused:false,boss:false,playbackSpeed:speed,frame:{plan,elapsed:0}};
    const paints=[],operations=[],ended=[],end=e.end,draw=ctx.drawImage;let origin,index=0,elapsed=0;
    e.end=function(p,stopped){if(!p.ended)ended.push({id:p.id,group:p.group,stopped:!!stopped,at:performance.now()});return end.apply(this,arguments);};e.speed(speed);
    ctx.drawImage=function(...args){const result=draw.apply(this,args);if(args.length===9&&image){const [sx,sy,sw,sh]=args.slice(1,5),layer=timeline.layers.find(l=>(l.flipbook?.regions??[l.region]).some(r=>r[0]+image.x===sx&&r[1]+image.y===sy&&r[2]===sw&&r[3]===sh));if(layer&&this.globalAlpha>0){const m=this.getTransform();paints.push({layer:layer.name,anchor:layer.anchor,elapsed,at:performance.now(),alpha:this.globalAlpha,x:m.e,y:m.f,visible:canvas.checkVisibility()});}}return result;};
    await new Promise(resolve=>requestAnimationFrame(function step(now){origin??=now;elapsed=(now-origin)*speed;view.frame.elapsed=elapsed;ctx.clearRect(0,0,width,height);layered.render(ctx,view,width,height);
     while(index<track.length&&track[index].t<=elapsed){const key=track[index++],request=window.__journeyAudio.requests.length,design=resolveDesign(key.cue,e.decodedManifest,key.element),expected=design?.baked?1:design?.layers.length??1;e.play(key.cue,{speed,element:key.element,...(key.role==='voice'?{priority:100}:key.role==='terminal'?{priority:80}:{})});operations.push({...key,request,expected,submittedMs:elapsed,at:performance.now()});}
     if(elapsed<plan.duration)requestAnimationFrame(step);else resolve();
    }));ctx.drawImage=draw;
    const deadline=performance.now()+6000;while(e.active.size&&performance.now()<deadline)await new Promise(r=>setTimeout(r,20));await new Promise(r=>setTimeout(r,100));
    const data={...window.__journeyAudio,ended,activeAtEnd:e.active.size};e.stop();await e.ctx.close();return {id:c.id,owner:c.owner,ultimate:c.ultimate,hasFlight:c.hasFlight,speed,speech,viewport:{width,height},operations,paints,data};
   },{c,speed,speech,width,height});
   row.events=row.operations.map(op=>({...op,starts:row.data.starts.filter(s=>s.request===op.request),results:row.data.results.filter(r=>r.request===op.request).map(r=>r.result)}));
   row.allSfx=row.events.filter(e=>!['voice','terminal'].includes(e.role)).every(e=>e.starts.length===e.expected&&e.results.includes('played'));row.authoredVoice=row.events.filter(e=>e.role==='voice').every(e=>e.starts.length===1);
   const terminal=row.events.find(e=>e.role==='terminal'),voiceRequests=row.data.requests.filter(r=>r.id.startsWith('voice.'));row.terminalPlayed=terminal.starts.length===1;row.terminalSuppression=row.terminalPlayed?[]:terminal.results;row.clearSlot=speech!=='clear-terminal-slot'||voiceRequests.length===1&&voiceRequests[0].id==='voice.yarn-giant.death';
   row.naturalCompletion=row.data.activeAtEnd===0&&row.data.ended.length===row.data.starts.length&&row.data.ended.every(e=>!e.stopped);row.peak=rolling(row.data.starts);
   const firstFlight=row.paints.find(p=>p.anchor==='flight'&&p.elapsed<c.impactMs),travel=row.paints.find(p=>p.anchor==='flight'&&p.elapsed>=c.travelMs&&p.elapsed<c.impactMs),contact=row.paints.find(p=>p.layer==='impact-burst'&&p.elapsed>=c.impactMs);
   row.paint={firstFlightMs:firstFlight?.elapsed??null,travelMs:travel?.elapsed??null,contactMs:contact?.elapsed??null,visible:row.paints.length>0&&row.paints.every(p=>p.visible),moving:new Set(row.paints.filter(p=>p.anchor==='flight'&&p.elapsed<c.impactMs).map(p=>`${p.x.toFixed(2)},${p.y.toFixed(2)}`)).size>1};
   row.outputEstimates=row.events.filter(e=>['release','travel','impact'].includes(e.role)).map(e=>{const s=e.starts[0],stamp=s?.outputTimestamp,paint=e.role==='release'?firstFlight:e.role==='travel'?travel:contact;return {role:e.role,estimatedStartMinusPaintMs:stamp?.contextTime>0&&paint?stamp.performanceTime+(s.when-stamp.contextTime)*1000-paint.at:null,requestMinusPaintMs:paint?e.at-paint.at:null};});
   row.admissionPass=row.allSfx&&row.authoredVoice&&row.naturalCompletion&&row.clearSlot&&row.peak<=6&&(speech!=='clear-terminal-slot'||row.terminalPlayed);
   row.paintPass=row.paint.visible&&contact!==undefined&&(c.hasFlight?!!firstFlight&&!!travel&&row.paint.moving:!firstFlight);rows.push(row);
   if(rows.length%6===0)console.log(JSON.stringify({cases:rows.length,id:c.id,viewport:width,admissionPassed:rows.filter(r=>r.admissionPass).length,paintPassed:rows.filter(r=>r.paintPass).length,lastPeak:row.peak}));
  }
  await page.evaluate(async()=>{await window.__outputCapture.stop();window.__rangedRenderer.dispose();});await page.close();
  const measured=spawnSync(process.env.V4_FFMPEG??'/opt/homebrew/opt/ffmpeg-full/bin/ffmpeg',['-hide_banner','-i',capturePath,'-af','loudnorm=I=-18:TP=-1:LRA=5:print_format=json','-f','null','-'],{encoding:'utf8'});assert.equal(measured.status,0);const levels=JSON.parse(measured.stderr.match(/\{\s*"input_i"[\s\S]*?\}/)[0]);captures.push({viewport:{width,height},...signed(relative(root,capturePath)),levels});
 }
}catch(error){failure=String(error.message).slice(0,300);}finally{await browser.close();}
assertUnchanged(root,signature);writeFileSync(raw,gzipSync(JSON.stringify(rows)));
const estimates=rows.flatMap(r=>r.outputEstimates).map(r=>r.estimatedStartMinusPaintMs).filter(n=>n!==null),pass=rows.length===168&&!failure&&!errors.length&&!blocked.length&&rows.every(r=>r.admissionPass&&r.paintPass);
const report={at:new Date().toISOString(),learn:'reports/v4-ship/LEARN/S11-ranged-audio.md',signature,inputs:[signed(inventoryPath),signed(comparisonPath),signed(bakePath)],harness:[signed(relative(root,import.meta.filename)),signed('tools/v4ship-lab/audio/journey-observer.mjs'),signed('scripts/audio/capture-page.mjs')],candidate:comparison.candidate,events:signed(relative(root,raw)),captures,summary:{cases:rows.length,admissionPassed:rows.filter(r=>r.admissionPass).length,paintPassed:rows.filter(r=>r.paintPass).length,clearTerminals:rows.filter(r=>r.speech==='clear-terminal-slot'&&r.terminalPlayed).length,peak:Math.max(...rows.map(r=>r.peak)),authoredTerminalSuppressions:rows.filter(r=>r.speech==='authored'&&!r.terminalPlayed).map(r=>({id:r.id,speed:r.speed,viewport:r.viewport,reasons:r.terminalSuppression})),maximumAbsoluteOutputStartEstimateMs:estimates.length?Math.max(...estimates.map(Math.abs)):null,estimatesOutside33ms:estimates.filter(n=>Math.abs(n)>33).length},pass,failure,errors,blocked,
 scope:'168 isolated legal action cases: all7ranged units/basic+ultimate,1x/2x/3x,authored/clear-terminal speech atbothshipping sizes. Real rAF, unchanged AudioEngine source admission, actual shipping LayeredVfx draw calls with production actor projection/layout fallback and unnormalized browser output capture. Harness dispatches the proposed audio track; production BattleAudio is not yet changed.',
 limits:['Isolated VFX canvas uses real published paintings and projected actors with fallback layout, not complete production scene bodies or neighbour actions.','All required packs are explicitly predecoded; production preload integration is still required.','Output captures contain isolated effects/voices without scene music; their loudness is diagnostic, not the full-mix gate.','Draw submission/output timestamps do not prove displayed pixels, physical onset or human listening. Authored terminal suppression remains explicit.'],runtimeChanged:false,physicalOnsetVerified:false,humanListeningVerified:false,overallAudioGatePass:false};
writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({output:relative(root,output),summary:report.summary,pass,failure,errors:errors.length}));if(!pass)process.exitCode=1;
