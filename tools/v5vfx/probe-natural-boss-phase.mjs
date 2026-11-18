/** Observe the real phase renderer through natural actions; no scene replacement or clock seeks. */
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {chromium,config,openFixture,runtimeEvidence,judgeUrl} from './media-production-fixture.mjs';
const out=resolve(process.env.CXV_CAPTURE_OUT);
assert(out.startsWith('/Users/bao/taskbar-hero-cardrpg-a6/work/v5/CXV/'));
assert(!existsSync(out),'Preserve every earlier observation');await mkdir(out,{recursive:true});
const hash=data=>createHash('sha256').update(data).digest('hex');
const report={utc:new Date().toISOString(),url:judgeUrl,viewport:{width:1280,height:720},identity:runtimeEvidence(),harnessSha256:hash(await readFile(import.meta.filename)),runtimePatchSha256:null,method:'Natural 1x boss opening on a fresh page per motion preference. After seeded setup, observe the existing BossPhase renderer, plans and rules for24s without changing time or application functions. No images or performance conclusion.',runs:[],pass:false};
const save=()=>writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 for(const reduced of [false,true]){
  const {page,errors,blockedRequests}=await openFixture(browser,config.fixtures.find(f=>f.id==='boss'));
  const run={mode:reduced?'reduced':'normal',errors,blockedRequests};report.runs.push(run);await save();
  await page.evaluate(reduced=>{const m=window.__depthReview;m.state.settings.reducedMotion=reduced;m.notify(false);},reduced);
  await page.locator('.b3-wave-intro').waitFor({state:'hidden',timeout:5000});
  run.initial=await page.evaluate(()=>structuredClone(window.__depthReview.battle));
  await page.evaluate(()=>{
   const s=window.__depthScene,m=window.__depthReview;
   const data=globalThis.__cxvPhaseProbe={start:performance.now(),rows:[],plans:[],seen:new Set(),done:false};
   const observe=()=>{
    const wallMs=performance.now()-data.start,view=s.view(),frame=view.frame,p=frame?.plan;
    if(p&&!data.seen.has(p)){data.seen.add(p);data.plans.push({wallMs,actorId:p.actorId,skillId:p.skillId,ultimate:p.ultimate,duration:p.duration,events:p.events});}
    if(wallMs>=15000&&wallMs<=23000)data.rows.push({wallMs,sceneTime:s.time,phase:{...s.bossPhase.audit},phaseHidden:s.bossPhase.canvas.hidden,bossPhases:view.bossPhases,plan:p?{actorId:p.actorId,skillId:p.skillId,ultimate:p.ultimate,elapsed:frame.elapsed,duration:p.duration}:null,cinematic:{...s.cinematic},actors:m.battle.actors.map(a=>({id:a.id,hp:a.hp,shield:a.shield})),phaseBounds:[...s.bodyBoxes]});
    if(wallMs<24000)requestAnimationFrame(observe);else data.done=true;
   };
   m.paused=false;m.notify(false);s.raf=requestAnimationFrame(s.loop);requestAnimationFrame(observe);
  });
  await page.waitForFunction(()=>globalThis.__cxvPhaseProbe?.done,null,{timeout:35000});
  Object.assign(run,await page.evaluate(()=>{const d=globalThis.__cxvPhaseProbe,m=window.__depthReview;m.paused=true;m.notify(false);return{rows:d.rows,plans:d.plans,log:structuredClone(m.battle.log),endedUTC:new Date().toISOString()};}));
  run.overlap=run.rows.filter(r=>r.plan?.skillId==='mochi-4'&&r.phase.visible);
  run.contactOverlap=run.overlap.filter(r=>r.plan.elapsed>=1000&&r.plan.elapsed<=1200).map(r=>({wallMs:r.wallMs,phase:r.phase,elapsed:r.plan.elapsed}));
  await save();assert.equal(errors.length,0);assert.equal(blockedRequests.length,0);
  console.log(JSON.stringify({mode:run.mode,rows:run.rows.length,overlap:run.overlap.length,contactOverlap:run.contactOverlap.length}));await page.close();
 }
 report.initialEqual=JSON.stringify(report.runs[0].initial)===JSON.stringify(report.runs[1].initial);
 report.pass=report.initialEqual&&report.runs.every(r=>r.rows.length>400&&r.plans.some(p=>p.skillId==='mochi-4'));
 assert(report.pass);report.endedUTC=new Date().toISOString();await save();
}catch(error){report.error=String(error.stack??error);await save();throw error;}finally{await browser.close();}
