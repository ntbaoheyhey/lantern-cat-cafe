/** Real speed-one play through a natural result; seeded fixture, not account progression. */
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
const local=process.env.CXV_FULL_LOCAL==='1';
const fixturePath=process.env.CXV_FULL_FIXTURE??(local?'./production-candidate-fixture.mjs':'/Users/bao/taskbar-hero-chain/tools/v5int/production-fixture.mjs');
const {chromium,config,openFixture,runtimeEvidence,judgeUrl}=await import(fixturePath);
const root=resolve(import.meta.dirname,'../..');
const cpuRate=Number(process.env.CXV_FULL_CPU_RATE??1);assert([1,4].includes(cpuRate),'Full-battle CPU rate must be1 or4');
const desktopDpr=Number(process.env.CXV_FULL_DPR??1);assert([1,1.5,2].includes(desktopDpr)&&(!process.env.CXV_FULL_DPR||local),'Explicit desktop density is local-only');
const liveDensity=process.env.CXV_FULL_DENSITY_TRANSITIONS==='1';assert(!liveDensity||(local&&desktopDpr===2),'Live density transitions require the local DPR2 artifact');
const densitySequence=liveDensity?[{at:15000,ratio:1},{at:45000,ratio:1.5},{at:75000,ratio:2}]:[];
const resultDensity=process.env.CXV_FULL_RESULT_DENSITY==='1';assert(!resultDensity||liveDensity);
const out=resolve(process.env.CXV_CAPTURE_OUT??resolve(root,'work/v5/CXV/films/V7-F-full-battle-judge'));
assert(out.startsWith(resolve(root,'work/v5/CXV')+'/'));assert(!existsSync(resolve(out,'report.json')),'Preserve earlier evidence');
await mkdir(out,{recursive:true});
const hash=data=>createHash('sha256').update(data).digest('hex');
const stop=()=>{for(const name of ['STOP-ALL','STOP-CXV'])assert(!existsSync('/Users/bao/taskbar-hero-mailbox/'+name),'STOP: '+name);};
const board=await readFile('/Users/bao/taskbar-hero-mailbox/BOARD.md','utf8');
const artifactIdentity=runtimeEvidence();
const servedSource=local?artifactIdentity.buildSource:(process.env.CXV_SERVED_SOURCE??board.match(/Currently served candidate:([a-f0-9]{40})/)?.[1]);
const expectedIndex=local?artifactIdentity.indexSha256:(process.env.CXV_EXPECTED_INDEX??board.match(/Currently served candidate:[^\n]*index:([a-f0-9]{64})/)?.[1]);
assert(/^[a-f0-9]{40}$/.test(servedSource)&&/^[a-f0-9]{64}$/.test(expectedIndex),'Explicit valid production source/index identity required');
assert.equal(runtimeEvidence().indexSha256,expectedIndex);
const report={utc:new Date().toISOString(),source:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),servedSource,indexSha256:expectedIndex,
 harnessSha256:hash(await readFile(import.meta.filename)),productionFixtureSha256:hash(await readFile(local?resolve(root,'tools/v5vfx/production-candidate-fixture.mjs'):fixturePath)),local,artifactIdentity,
 url:judgeUrl,viewport:{width:1280,height:720},method:'Seeded level6 boss encounter, then uninterrupted normal rule-selected model/scene RAF at speed1 until natural result. Normal and reduced motion start from the same battle. No rule fast-forward, fixed-clock seek, HP/charge changes, plan replacement or result injection after setup. Captures add overhead; frame timings are descriptive only, not an optimization comparison. Fixture setup is not ordinary account progression.',runs:[],errors:[],pass:false};
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
report.cpuRate=cpuRate;report.browser=browser.version();report.hardware=execFileSync('sysctl',['-n','machdep.cpu.brand_string'],{encoding:'utf8'}).trim();
report.deviceScaleFactor=desktopDpr;
if(liveDensity){report.densitySequence=densitySequence;report.method+=' Live CDP density changes2->1->1.5->2 at15/45/75s with unchanged1280x720CSS;no model mutation. Captures use the same CDP session at CSS scale1/liveDPR to preserve the override.';}
if(resultDensity){report.victoryDensitySequence=[1,2];report.method+=' After natural victory, density changes2->1->2; synthetic events on original resolution MediaQueryLists exercise reduced invalidation. This is not physical monitor event-delivery coverage.';}
report.method+=' CPU throttling'+cpuRate+'x begins after fixture loading;4x is a host-relative stress diagnostic,not a calibrated laptop or cold-page benchmark.';
const save=()=>writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');
let active;
const persistTimeline=async(page,dir)=>{
 const data=await page.evaluate(()=>{const d=globalThis.__cxvFull,m=window.__depthReview;if(d){d.scene.render=d.render;d.scene.beforeFrame=d.beforeFrame;}if(m){m.paused=true;m.notify(false);}return{elapsedMs:d?performance.now()-d.start:null,frames:d?.frames??[],plans:d?.plans??[],log:m?.battle?.log,mediaAudit:globalThis.__cxvMediaAudit??null};});
 await writeFile(resolve(dir,'timeline.json'),JSON.stringify(data));return data;
};
try{
 for(const reduced of [false,true]){
  stop();const mode=reduced?'reduced':'normal',dir=resolve(out,mode);await mkdir(dir,{recursive:true});
  const {page,errors,blockedRequests}=await openFixture(browser,config.fixtures.find(f=>f.id==='boss'),{deviceScaleFactor:desktopDpr,setupPage:resultDensity?async p=>p.addInitScript(()=>{const original=window.matchMedia;globalThis.__cxvResolutionQueries=[];window.matchMedia=function(query){const media=original.call(this,query);if(query.startsWith('(resolution:'))globalThis.__cxvResolutionQueries.push(media);return media;};}):undefined});
  assert.equal(page.url(),judgeUrl);const identity=runtimeEvidence();
  const cdp=await page.context().newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:cpuRate});
  if(liveDensity)await cdp.send('Emulation.setDeviceMetricsOverride',{width:1280,height:720,deviceScaleFactor:desktopDpr,mobile:false});
  await page.evaluate(reduced=>{const m=window.__depthReview;m.state.settings.reducedMotion=reduced;m.notify(false);},reduced);
  await page.locator('.b3-wave-intro').waitFor({state:'hidden',timeout:5000});
  const initial=await page.evaluate(()=>{const m=window.__depthReview;return{battle:structuredClone(m.battle),speed:m.state.settings.speed,reduced:m.state.settings.reducedMotion};});
  const run={mode,utc:new Date().toISOString(),identity,initialBattleSha256:hash(JSON.stringify(initial.battle)),speed:initial.speed,captures:[],errors,blockedRequests};
  active={page,run,dir};report.runs.push(run);await save();
  if(liveDensity)run.densityTransitions=[];
  if(resultDensity)run.victoryDensityTransitions=[];
  if(process.env.CXV_FULL_DPR)run.desktopDensity=await(await import('./desktop-density.mjs')).desktopDensity(page,desktopDpr);
  assert.equal(initial.speed,1);await writeFile(resolve(dir,'initial.json'),JSON.stringify(initial,null,2));
  const snapshot=()=>page.evaluate(()=>{
   const m=window.__depthReview,s=window.__depthScene;
   return{wallMs:globalThis.__cxvFull?performance.now()-globalThis.__cxvFull.start:0,devicePixelRatio,screen:m.screen,result:m.battle?.result??null,round:m.battle?.round,age:m.animationAt,
    plan:m.plan?{actor:m.plan.actorId,skill:m.plan.skillId,ultimate:m.plan.ultimate,duration:m.plan.duration,contact:m.plan.contact,leadIn:m.plan.speechLeadInMs??null}:null,
    actors:m.battle?.actors.map(a=>({id:a.id,catalogId:a.catalogId,side:a.side,hp:a.hp,shield:a.shield,statuses:a.statuses})),
    scene:s?{ready:s.ready,stats:s.stats,bodyFx:s.bodyFx?.audit,cinema:s.cinema?.audit,bossPhase:s.bossPhase?.audit,boxes:[...s.bodyBoxes],anchors:s.anchors}:null,
    crew:[...document.querySelectorAll('.b3-victory-crew')].map(e=>({ready:e.dataset.ready,drawn:e.dataset.drawn,loadError:e.dataset.loadError,confetti:e.querySelectorAll('.b3-confetti').length,rect:e.getBoundingClientRect().toJSON(),width:e.clientWidth,height:e.clientHeight,canvas:{width:e.querySelector('canvas')?.width??0,height:e.querySelector('canvas')?.height??0}}))};
  });
  active.snapshot=snapshot;
  const capture=async reason=>{const before=await snapshot(),path=resolve(dir,`${String(run.captures.length).padStart(2,'0')}-${reason}.png`),utc=new Date().toISOString();
   if(liveDensity){const bytes=Buffer.from((await cdp.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false,clip:{x:0,y:0,width:1280,height:720,scale:1/before.devicePixelRatio}})).data,'base64');assert.equal(bytes.readUInt32BE(16),1280);assert.equal(bytes.readUInt32BE(20),720);await writeFile(path,bytes);}else await page.screenshot({path,scale:'css'});
   const after=await snapshot();if(liveDensity)assert.equal(after.devicePixelRatio,before.devicePixelRatio);run.captures.push({reason,path,utc,before,after});};
  await capture('opening');
  await page.evaluate(()=>{
   const s=window.__depthScene,m=window.__depthReview,render=s.render,beforeFrame=s.beforeFrame,seen=new Set(),captured=new Set();
   const data=globalThis.__cxvFull={start:performance.now(),frames:[],plans:[],signals:[],last:0,rafNow:0,final:null,render,beforeFrame,scene:s};
   s.beforeFrame=function(now){data.rafNow=now;return beforeFrame?.call(this,now);};
   s.render=function(...args){
    const at=performance.now(),value=render.apply(this,args),wallMs=at-data.start;
    data.frames.push({wallMs,frameMs:data.last?data.rafNow-data.last:0,cpuMs:performance.now()-at,calls:s.stats.calls,textures:s.stats.textures});data.last=data.rafNow;
    const p=m.plan;
    if(p&&!seen.has(p)){seen.add(p);data.plans.push({wallMs,actorId:p.actorId,skillId:p.skillId,ultimate:p.ultimate,duration:p.duration,contact:p.contact,leadIn:p.speechLeadInMs??null,fixedTiming:p.fixedTiming??false,events:p.events,round:m.battle?.round});}
    if(p?.ultimate&&m.animationAt>=1050&&m.animationAt<=1500){const key='ultimate-'+p.actorId;if(!captured.has(key)){captured.add(key);data.signals.push(key);}}
    if(wallMs>3000&&!captured.has('status')&&m.battle?.actors.some(a=>a.statuses.length)){captured.add('status');data.signals.push('status');}
    return value;
   };
   cancelAnimationFrame(s.raf);m.paused=false;m.notify(false);s.raf=requestAnimationFrame(s.loop);
  });
  const deadline=Date.now()+180000;let reachedResult=false;
  while(Date.now()<deadline){
   stop();const state=await page.evaluate(()=>({wallMs:performance.now()-globalThis.__cxvFull.start,screen:window.__depthReview.screen,signal:globalThis.__cxvFull.signals.shift(),result:window.__depthReview.battle?.result}));
   const change=liveDensity?densitySequence[run.densityTransitions.length]:null;
   if(change&&state.wallMs>=change.at){
    const before=await snapshot();await cdp.send('Emulation.setDeviceMetricsOverride',{width:1280,height:720,deviceScaleFactor:change.ratio,mobile:false});
    await page.waitForFunction(r=>devicePixelRatio===r&&window.__depthScene?.renderer.getPixelRatio()===r,change.ratio,{timeout:5000});
    const density=await(await import('./desktop-density.mjs')).desktopDensity(page,change.ratio),after=await snapshot();for(const b of Object.values(density.composer))assert.deepEqual(b,density.drawingBuffer);
    run.densityTransitions.push({scheduledMs:change.at,ratio:change.ratio,before,after,density});
   }
   if(state.signal&&run.captures.length<6)await capture(state.signal);
   if(state.screen==='result'){reachedResult=true;break;}
   await page.waitForTimeout(150);
  }
  run.reachedResult=reachedResult;run.final=await snapshot();
  if(liveDensity)assert.equal(run.densityTransitions.length,3,'Battle must exercise all three density changes');
  if(reachedResult){
   await page.waitForSelector('.c2-result');
   if(run.final.result==='party')await page.waitForSelector('.b3-victory-crew[data-ready=true]',{timeout:60000});
   await capture('result-ready');
   if(resultDensity){
    assert.equal(run.final.result,'party');
    for(const ratio of report.victoryDensitySequence){
     const before=await snapshot();await cdp.send('Emulation.setDeviceMetricsOverride',{width:1280,height:720,deviceScaleFactor:ratio,mobile:false});
     await page.evaluate(()=>{const query=globalThis.__cxvResolutionQueries.at(-1);if(!query)throw Error('Native victory density query missing');query.dispatchEvent(new Event('change'));});
     await page.waitForFunction(r=>{const e=document.querySelector('.b3-victory-crew'),c=e?.querySelector('canvas'),scale=Math.min(r,1.5);return devicePixelRatio===r&&c?.width===Math.floor(e.clientWidth*scale)&&c?.height===Math.floor(e.clientHeight*scale);},ratio,{timeout:5000});
     const after=await snapshot();assert.deepEqual(after.crew[0].rect,before.crew[0].rect);assert.deepEqual(after.actors,before.actors);run.victoryDensityTransitions.push({ratio,before,after});
    }
   }
   await page.waitForTimeout(700);await capture('result-later');
  }else await capture('timeout');
  const data=await persistTimeline(page,dir);
  const stats=values=>{const a=values.filter(Number.isFinite).sort((a,b)=>a-b);return{samples:a.length,median:a[Math.floor(a.length*.5)],p95:a[Math.floor(a.length*.95)],max:a.at(-1)};};
  run.elapsedMs=data.elapsedMs;run.frameMs=stats(data.frames.map(f=>f.frameMs).filter(f=>f>0));run.renderCpuMs=stats(data.frames.map(f=>f.cpuMs));
  run.presentations=data.plans.length;run.actions=data.plans.filter(p=>p.events.some(e=>e.type==='action_start'||e.type==='charge')).length;
  run.ultimates=data.plans.filter(p=>p.ultimate).map(({events,...p})=>p);run.logEvents=data.log?.length;
  run.identityAfter=runtimeEvidence();run.ended=new Date().toISOString();
  if(run.identityAfter.indexSha256!==identity.indexSha256)errors.push('Served artifact changed during natural battle');
  if(!reachedResult)errors.push('Natural battle did not reach result within180s');
  report.errors.push(...errors);await save();active=undefined;
  console.log(JSON.stringify({mode,elapsedMs:run.elapsedMs,result:run.final.result,captures:run.captures.length,actions:run.actions,ultimates:run.ultimates.length,errors}));await page.close();
 }
 report.initialBattleEqual=report.runs[0].initialBattleSha256===report.runs[1].initialBattleSha256;
 report.finalResultEqual=report.runs[0].final.result===report.runs[1].final.result;
 report.ended=new Date().toISOString();report.pass=report.initialBattleEqual&&report.finalResultEqual&&!report.errors.length&&report.runs.every(r=>r.reachedResult&&!r.blockedRequests.length);
 await save();if(!report.pass)process.exitCode=1;
}catch(error){
 report.errors.push(String(error));
 if(active){
  active.run.failure=String(error);active.run.ended=new Date().toISOString();
  try{active.run.final=await active.snapshot?.();await persistTimeline(active.page,active.dir);active.run.timelinePersisted=true;}catch(persistenceError){active.run.persistenceError=String(persistenceError);}
 }
 await save();throw error;
}finally{await browser.close();}
