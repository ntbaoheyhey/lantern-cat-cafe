/** Own production result gate: readiness, continuous media clock and reduced-frame redraw. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {chromium,config,openFixture,runtimeEvidence,judgeUrl} from './production-fixture.mjs';
import {loadRules} from '../cardrpg-big/a4-load.mjs';

const label=process.argv[2];assert(/^[a-z0-9-]+$/.test(label??''));
const base=resolve('work/v5/CXI/batch-m',label),build=JSON.parse(readFileSync(resolve(base,'build.json')));
const out=resolve(base,'victory-native');assert(!existsSync(out));mkdirSync(out);
const hash=b=>createHash('sha256').update(b).digest('hex');
assert.equal(build.indexSha256,runtimeEvidence().indexSha256);
const report={utc:new Date().toISOString(),url:judgeUrl,sourceCommit:build.sourceCommit,indexSha256:build.indexSha256,
 buildSha256:hash(readFileSync(resolve(base,'build.json'))),probeSha256:hash(readFileSync(import.meta.filename)),viewport:[1280,720],
 method:'Own fresh production pages and rule-resolved boss result. Observe native media without changing its clock or decoder. This is a result-scene gate, not natural-play or FPS acceptance.',runs:[],images:[],pass:false};
const save=()=>writeFileSync(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');save();
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 for(const reduced of [false,true]){
  const {page,errors,blockedRequests}=await openFixture(browser,config.fixtures.find(f=>f.id==='boss'),{setupPage:async p=>p.addInitScript(()=>{
   const create=document.createElement;globalThis.__cxiVideos=[];
   document.createElement=function(...args){const e=create.apply(this,args);if(String(args[0]).toLowerCase()==='video')globalThis.__cxiVideos.push(e);return e;};
  })});
  const run={mode:reduced?'reduced':'normal',errors,blockedRequests,samples:[]};report.runs.push(run);save();
  const modules=await loadRules();let battle;
  try{const R=await modules.load('packages/game-rules/src/cardrpg/depth/index.ts');battle=await page.evaluate(()=>window.__depthReview.battle);R.playBattle(battle,'auto');assert.equal(battle.result,'party');}
  finally{await modules.vite.close();}
  await page.evaluate(({battle,reduced})=>{globalThis.__cxiVictoryStart=globalThis.__cxiVideos.length;const m=window.__depthReview;m.state.settings.reducedMotion=reduced;m.tutorialBattle=battle;m.showResult();},{battle,reduced});
  const snapshot=()=>page.evaluate(()=>{
   const e=document.querySelector('.b3-victory-crew'),c=e?.querySelector('canvas');
   return {at:performance.now(),ready:e?.dataset.ready??null,loadError:e?.dataset.loadError??null,drawn:e?.dataset.drawn??null,
    canvas:c?{width:c.width,height:c.height,visibility:getComputedStyle(c).visibility}:null,
    videos:globalThis.__cxiVideos.slice(globalThis.__cxiVictoryStart).map(v=>({time:v.currentTime,paused:v.paused,seeking:v.seeking,readyState:v.readyState,error:v.error?.message??null,source:v.currentSrc,duration:v.duration}))};
  });
  await page.waitForFunction(()=>{const e=document.querySelector('.b3-victory-crew');return e?.dataset.ready==='true'||e?.dataset.loadError==='true';},null,{timeout:20000});
  run.initial=await snapshot();save();assert.equal(run.initial.ready,'true');assert.equal(run.initial.loadError,null);assert.equal(run.initial.drawn,'3');
  await page.waitForFunction(()=>{const v=globalThis.__cxiVideos.slice(globalThis.__cxiVictoryStart);return v.length===1&&v[0].readyState>=2&&!v[0].seeking;},null,{timeout:15000});
  const rules=await page.evaluate(()=>JSON.stringify(window.__depthReview.tutorialBattle));
  for(let i=0;i<(reduced?16:130);i++){await page.waitForTimeout(100);run.samples.push(await snapshot());}
  assert(run.samples.every(s=>s.ready==='true'&&s.loadError===null&&s.canvas?.visibility==='visible'&&s.videos.length===1&&s.videos[0].readyState>=2&&!s.videos[0].error));
  const times=run.samples.map(s=>s.videos[0].time),deltas=times.slice(1).map((t,i)=>t-times[i]);
  run.clock={min:Math.min(...times),max:Math.max(...times),wraps:deltas.filter(d=>d<-5).length,largestForward:Math.max(...deltas)};
  if(reduced){assert(run.samples.every(s=>s.videos[0].paused));assert(run.clock.max-run.clock.min<1/30);}
  else{assert(run.clock.max-run.clock.min>9);assert(run.clock.wraps>=1);assert(deltas.every(d=>d>=-.001||d<-5),'Media restarted on the shorter victory gesture');}
  run.rulesUnchanged=rules===await page.evaluate(()=>JSON.stringify(window.__depthReview.tutorialBattle));assert(run.rulesUnchanged);
  assert.deepEqual(errors,[]);assert.deepEqual(blockedRequests,[]);
  const png=await page.screenshot({scale:'css'}),metadata=await sharp(png).metadata();assert.equal(metadata.width,1280);assert.equal(metadata.height,720);
  const rawPath=resolve(out,run.mode+'.png');writeFileSync(rawPath,png);
  const preview=await sharp(png).resize(1024,576).png().toBuffer(),path=resolve(out,run.mode+'-1024.png');writeFileSync(path,preview);
  const stats=await sharp(preview).stats();assert(stats.channels.slice(0,3).some(c=>c.stdev>10));
  report.images.push({path,rawPath,sha256:hash(preview),rawSha256:hash(png),dimensions:[1024,576],url:page.url(),utc:new Date().toISOString(),channelStdev:stats.channels.map(c=>c.stdev),viewed:false});save();await page.close();
 }
 assert.equal(runtimeEvidence().indexSha256,report.indexSha256);report.pass=true;
}catch(error){report.error=String(error);throw error;}
finally{report.completedUTC=new Date().toISOString();save();await browser.close();}
console.log(JSON.stringify({pass:report.pass,runs:report.runs.map(r=>({mode:r.mode,clock:r.clock,samples:r.samples.length,rulesUnchanged:r.rulesUnchanged})),out}));
