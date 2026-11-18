/** Native GPU-loss visibility diagnostic; original artifact and rule-resolved result. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {root,appRoot,require} from './build-hud-production.mjs';
import {hash} from './victory-demand-source.mjs';
import {loadRules} from '../cardrpg-big/a4-load.mjs';

const production=resolve(process.env.CXV_CONTEXT_PRODUCTION??resolve(root,'work/v5/CXV/films/V7-E-victory-density-native-production'));
const out=resolve(process.env.CXV_CONTEXT_OUT??resolve(root,'work/v5/CXV/films/V7-E-victory-context-loss'));
const hideLost=process.env.CXV_CONTEXT_HIDE_LOST==='1';
assert(out.startsWith(resolve(root,'work/v5/CXV')+'/'));assert(!existsSync(out));
const built=JSON.parse(await readFile(resolve(production,'build.json'))),artifact=built.artifacts.find(a=>a.mode==='native');
assert.equal(artifact.transformed,0);assert.equal(built.runtimePatchSha256,hash(''));
for(const file of artifact.files)assert.equal(hash(await readFile(resolve(artifact.dist,file.path))),file.sha256);
await mkdir(out,{recursive:true});
process.env.CXV_PRODUCTION_OUT=production;process.env.CXV_ARTIFACT_MODE='native';
const {chromium,config,openFixture,runtimeEvidence,judgeUrl}=await import('./production-candidate-fixture.mjs');
const {preview}=await import(require.resolve('vite'));
const server=await preview({root:appRoot,configFile:false,envDir:false,logLevel:'error',build:{outDir:artifact.dist},preview:{host:'127.0.0.1',port:6312,strictPort:true}});
const report={utc:new Date().toISOString(),source:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),...runtimeEvidence(),url:judgeUrl,viewport:{width:1280,height:720},
 method:'Untransformed production. Actual rules resolve a seeded wave1 battle before result mount. Native WEBGL_lose_context extension loses/restores the result canvas; real events and computed original fallback visibility measured. CSS animations paused for captures. Failure injection is not hardware incidence or a performance comparison.',hideLost,toolSnapshots:[],runs:[],captures:[],pass:false};
if(hideLost)report.method+=' During loss only, diagnostic DOM control sets data-ready=false and hides the lost canvas to test original fallback occlusion; both values are restored before native recovery.';
for(const name of ['probe-victory-context-loss.mjs','production-candidate-fixture.mjs']){const bytes=await readFile(resolve(root,'tools/v5vfx',name));await writeFile(resolve(out,name),bytes);report.toolSnapshots.push({name,sha256:hash(bytes)});}
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 for(const reduced of [false,true]){
  const mode=reduced?'reduced':'normal',dir=resolve(out,mode);await mkdir(dir,{recursive:true});
  const {page,errors,blockedRequests}=await openFixture(browser,config.fixtures.find(f=>f.id==='wave1'));
  const modules=await loadRules();let battle;
  try{const R=await modules.load('packages/game-rules/src/cardrpg/depth/index.ts');battle=await page.evaluate(()=>window.__depthReview.battle);R.playBattle(battle,'auto');}finally{await modules.vite.close();}
  await page.addStyleTag({content:'*,*::before,*::after{animation:none!important;transition:none!important}'});
  await page.evaluate(({battle,reduced})=>{const m=window.__depthReview;m.state.settings.reducedMotion=reduced;m.tutorialBattle=battle;m.showResult();},{battle,reduced});
  await page.waitForSelector('.b3-victory-crew[data-ready=true]');await page.waitForTimeout(500);
  await page.evaluate(()=>{
   const canvas=document.querySelector('.b3-victory-crew>canvas'),gl=canvas.getContext('webgl2'),extension=gl.getExtension('WEBGL_lose_context');
   if(!extension)throw new Error('Native WEBGL_lose_context unavailable');
   const audit=globalThis.__cxvContextLoss={canvas,gl,extension,lost:0,restored:0,draws:0};
   canvas.addEventListener('webglcontextlost',()=>audit.lost++);canvas.addEventListener('webglcontextrestored',()=>audit.restored++);
   for(const method of ['drawElements','drawArrays']){const original=gl[method];gl[method]=function(...args){audit.draws++;return original.apply(this,args);};}
  });
  const state=()=>page.evaluate(()=>{
   const e=document.querySelector('.b3-victory-crew'),a=globalThis.__cxvContextLoss,f=e.querySelector('.b3-victory-fallback'),s=getComputedStyle(f);
   return{ready:e.dataset.ready??null,drawn:e.dataset.drawn??null,loadError:e.dataset.loadError??null,rect:e.getBoundingClientRect().toJSON(),
    canvas:{width:a.canvas.width,height:a.canvas.height},canvasVisibility:getComputedStyle(a.canvas).visibility,connected:a.canvas.isConnected,contextLost:a.gl.isContextLost(),lostEvents:a.lost,restoredEvents:a.restored,draws:a.draws,
    fallbackVisible:s.visibility==='visible'&&s.display!=='none'&&Number(s.opacity)>0,images:[...f.querySelectorAll('img')].map(i=>({complete:i.complete,width:i.naturalWidth,height:i.naturalHeight})),
    result:window.__depthReview.battle.result,actors:window.__depthReview.battle.actors.map(x=>({id:x.id,hp:x.hp}))};
  });
  const capture=async name=>{const before=await state(),path=resolve(dir,name+'.png');await page.screenshot({path});const bytes=await readFile(path);assert.equal(bytes.readUInt32BE(16),1280);assert.equal(bytes.readUInt32BE(20),720);
   const after=await state(),row={mode,name,path,utc:new Date().toISOString(),sha256:hash(bytes),before,after};report.captures.push(row);return row;};
  const loaded=await capture('loaded');assert(!loaded.after.contextLost&&!loaded.after.fallbackVisible);assert(loaded.after.images.length===4&&loaded.after.images.every(i=>i.complete&&i.width>0));
  await page.evaluate(()=>globalThis.__cxvContextLoss.extension.loseContext());
  await page.waitForFunction(()=>globalThis.__cxvContextLoss.lost===1&&globalThis.__cxvContextLoss.gl.isContextLost());
  if(hideLost)await page.evaluate(()=>{const a=globalThis.__cxvContextLoss;a.canvas.style.visibility='hidden';document.querySelector('.b3-victory-crew').dataset.ready='false';});
  await page.waitForTimeout(300);const lost=await capture('lost');assert(lost.after.contextLost);
  assert.deepEqual(lost.after.rect,loaded.after.rect);assert.deepEqual(lost.after.actors,loaded.after.actors);
  await page.evaluate(()=>globalThis.__cxvContextLoss.extension.restoreContext());
  await page.waitForFunction(()=>globalThis.__cxvContextLoss.restored===1&&!globalThis.__cxvContextLoss.gl.isContextLost());
  if(hideLost)await page.evaluate(()=>{const a=globalThis.__cxvContextLoss;a.canvas.style.visibility='';document.querySelector('.b3-victory-crew').dataset.ready='true';});
  await page.waitForTimeout(500);const restored=await capture('restored');
  assert(!restored.after.contextLost&&!restored.after.fallbackVisible);assert.equal(restored.after.ready,'true');assert(restored.after.draws>lost.after.draws);
  assert.deepEqual(restored.after.rect,loaded.after.rect);assert.deepEqual(restored.after.canvas,loaded.after.canvas);assert.deepEqual(restored.after.actors,loaded.after.actors);
  const run={mode,loaded:loaded.after,lost:lost.after,restored:restored.after,blankDuringLoss:lost.after.contextLost&&!lost.after.fallbackVisible,errors,blockedRequests};
  assert.deepEqual(errors,[]);assert.deepEqual(blockedRequests,[]);report.runs.push(run);
  await page.close();await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');
 }
 report.reproduced=report.runs.every(r=>r.blankDuringLoss);report.pass=true;report.ended=new Date().toISOString();
 await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({out,pass:report.pass,reproduced:report.reproduced,runs:report.runs.map(r=>({mode:r.mode,blankDuringLoss:r.blankDuringLoss,lostEvents:r.lost.lostEvents,restoredEvents:r.restored.restoredEvents}))}));
}finally{await browser.close();await new Promise(resolve=>server.httpServer.close(resolve));}
