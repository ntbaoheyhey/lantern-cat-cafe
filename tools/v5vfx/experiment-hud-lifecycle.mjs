/** Same-value consecutive hits, expiry, external text repair and HUD remount parity. */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {chromium,config,openFixture} from './browser-fixture.mjs';
import {runtimeEvidence} from './runtime-evidence.mjs';
import {installHudGeometryOverride} from './hud-geometry-override.mjs';
const out=resolve(process.env.CXV_CAPTURE_OUT??'work/v5/CXV/films/V7-F-hud-lifecycle');
await mkdir(out,{recursive:true});
const native=process.env.CXV_HUD_NATIVE==='1',report={utc:new Date().toISOString(),source:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),...runtimeEvidence(),viewport:{width:1280,height:720},native,method:'Synthetic actual HUD state transitions at controlled wall clock: repeated same-value damage plans, expiry/re-entry, changed amount, external DOM correction and component remount. No timing/model change; no production acceptance.',modes:[],errors:[]};
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 for(const mode of native?['native']:['baseline','text']){
  let override;
  const {page,errors}=await openFixture(browser,config.fixtures.find(f=>f.id==='boss'),{setupPage:mode==='native'?undefined:async p=>{override=await installHudGeometryOverride(p,{mode,audit:false});}});
  report.url=page.url();const rows=[];
  const snap=async name=>{await page.clock.runFor(34);rows.push(await page.evaluate(name=>{const n=document.querySelector('.b3-total');cancelAnimationFrame(window.__depthScene?.raf);return{name,hidden:n.hidden,text:n.querySelector('b').textContent,label:n.getAttribute('aria-label'),outputs:document.querySelectorAll('.b3-total').length};},name));};
  await page.evaluate(async()=>{
   const {pilotFixture}=await import('/src/game/cardrpg/vfx-layered/fixture.ts'),{configureSequence}=await import('/src/game/cardrpg/battle-v3/sequence.ts');
   const f=pilotFixture('soot-4'),m=window.__depthReview;
   globalThis.__cxvHudBattle=f.battle;globalThis.__cxvHudPlan=configureSequence(f.plan);
   const plan=structuredClone(globalThis.__cxvHudPlan);plan.events=plan.events.map(e=>e.type==='damage'?{...e,amount:17}:e);
   Object.assign(m,{galleryBattle:f.battle,plan,animationAt:0,paused:true,watching:true});m.notify(false);
  });
  await snap('before-hit');
  await page.evaluate(()=>{window.__depthReview.animationAt=1100;});
  await snap('first-hit');
  await page.clock.runFor(500);await snap('first-hold');
  await page.evaluate(()=>{const m=window.__depthReview;m.plan=structuredClone(m.plan);});
  await snap('same-amount-new-plan');
  await page.clock.runFor(600);await snap('new-plan-extends-expiry');
  await page.clock.runFor(500);await snap('expired');
  await page.evaluate(()=>{const m=window.__depthReview;m.plan=structuredClone(m.plan);});
  await snap('same-amount-after-expiry');
  await page.evaluate(()=>{const m=window.__depthReview;m.plan=structuredClone(m.plan);m.plan.events=m.plan.events.map(e=>e.type==='damage'?{...e,amount:23}:e);});
  await snap('changed-amount');
  await page.evaluate(()=>{document.querySelector('.b3-total b').textContent='999999';});
  await snap('repairs-current-dom');
  await page.evaluate(()=>{const m=window.__depthReview;m.galleryBattle=null;m.watching=false;m.plan=null;m.notify(false);});
  await page.clock.runFor(34);
  assert.equal(await page.locator('.b3-total').count(),0,'HUD must unmount');
  await page.evaluate(()=>{const m=window.__depthReview;m.galleryBattle=globalThis.__cxvHudBattle;m.watching=true;m.plan=null;m.notify(false);});
  await snap('remounted-empty');
  await page.evaluate(()=>{const m=window.__depthReview;m.plan=structuredClone(globalThis.__cxvHudPlan);m.animationAt=1100;});
  await snap('remounted-hit');
  report.modes.push({mode,override,rows});report.errors.push(...errors);await page.close();
 }
 for(const mode of report.modes){
  const rows=Object.fromEntries(mode.rows.map(r=>[r.name,r]));
  assert(rows['before-hit'].hidden&&rows.expired.hidden&&rows['remounted-empty'].hidden);
  for(const name of ['first-hit','first-hold','same-amount-new-plan','new-plan-extends-expiry','same-amount-after-expiry','changed-amount','repairs-current-dom','remounted-hit'])assert(!rows[name].hidden,name);
  assert.equal(rows['first-hit'].text,'51');assert.equal(rows['changed-amount'].text,'69');assert.equal(rows['repairs-current-dom'].text,'69');
  assert(mode.rows.every(r=>r.outputs===1&&r.label==='Total skill damage'));
 }
 if(!native)assert.deepEqual(report.modes[0].rows,report.modes[1].rows);
 report.pass=!report.errors.length;
}catch(e){report.pass=false;report.error=String(e);}
finally{await browser.close();report.identityAfter=runtimeEvidence();report.ended=new Date().toISOString();await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({out,pass:report.pass,error:report.error,errors:report.errors,states:report.modes.map(m=>({mode:m.mode,rows:m.rows}))}));if(!report.pass)process.exitCode=1;}
