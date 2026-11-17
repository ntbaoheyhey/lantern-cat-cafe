/** Causal browser-only probe: freeze/resume RAF on the unchanged baseline artifact. */
import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {loadRules} from '../cardrpg-big/a4-load.mjs';
import {chromium,config,openFixture,runtimeEvidence,judgeUrl} from './production-candidate-fixture.mjs';
import {hash} from './victory-demand-source.mjs';
assert.equal(process.env.CXV_ARTIFACT_MODE,'baseline');
const out=resolve(process.env.CXV_CAPTURE_OUT);assert(!existsSync(resolve(out,'report.json')));await mkdir(out,{recursive:true});
const report={utc:new Date().toISOString(),url:judgeUrl,...runtimeEvidence(),viewport:{width:1280,height:720},method:'Unchanged baseline production artifact. Browser-only wrapper parks every RAF callback, later resumes those callbacks. Test whether page-idle composition can reproduce the original candidate PNG variant. Freezing all RAF is diagnostic only; not a production proposal or performance test.',captures:[],errors:[],pass:false};
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 const {page,errors,blockedRequests}=await openFixture(browser,config.fixtures.find(f=>f.id==='wave1'),{setupPage:page=>page.addInitScript(()=>{
  const request=window.requestAnimationFrame.bind(window),cancel=window.cancelAnimationFrame.bind(window);
  const a=globalThis.__cxvRafPause={frozen:false,parked:new Map(),calls:0,skipped:0};
  window.requestAnimationFrame=callback=>{let id;id=request(now=>{if(a.frozen){a.parked.set(id,callback);a.skipped++;}else{a.calls++;callback(now);}});return id;};
  window.cancelAnimationFrame=id=>{a.parked.delete(id);cancel(id);};
  a.resume=()=>{a.frozen=false;const callbacks=[...a.parked.values()];a.parked.clear();for(const callback of callbacks)request(callback);};
 })});
 const modules=await loadRules();let battle;
 try{const R=await modules.load('packages/game-rules/src/cardrpg/depth/index.ts');battle=await page.evaluate(()=>window.__depthReview.battle);R.playBattle(battle,'auto');}finally{await modules.vite.close();}
 await page.evaluate(battle=>{const m=window.__depthReview;m.state.settings.reducedMotion=true;m.tutorialBattle=battle;m.showResult();},battle);
 await page.waitForSelector('.b3-victory-crew[data-ready=true]');await page.waitForTimeout(2000);
 const cdp=await page.context().newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
 const capture=async name=>{
  const path=resolve(out,name+'.png'),crewPath=resolve(out,name+'-crew.png');await page.screenshot({path});await page.locator('.b3-victory-crew').screenshot({path:crewPath});
  const decode=path=>execFileSync('ffmpeg',['-v','error','-i',path,'-frames:v','1','-f','rawvideo','-pix_fmt','rgb24','pipe:1'],{maxBuffer:10_000_000});
  const state=await page.evaluate(()=>{const a=globalThis.__cxvRafPause,e=document.querySelector('.b3-victory-crew');return{frozen:a.frozen,calls:a.calls,parked:a.parked.size,skipped:a.skipped,ready:e.dataset.ready,drawn:e.dataset.drawn,rect:e.getBoundingClientRect().toJSON(),animations:document.getAnimations().length};});
  const row={name,path,crewPath,utc:new Date().toISOString(),sha256:hash(await readFile(path)),fullRgbSha256:hash(decode(path)),crewRgbSha256:hash(decode(crewPath)),state};report.captures.push(row);console.log(JSON.stringify({name,full:row.fullRgbSha256,crew:row.crewRgbSha256,state}));
 };
 await page.waitForTimeout(32000);await cdp.send('Emulation.setCPUThrottlingRate',{rate:1});await capture('active');
 for(const index of [1,2]){
  await page.evaluate(()=>globalThis.__cxvRafPause.frozen=true);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});await page.waitForTimeout(32000);
  await cdp.send('Emulation.setCPUThrottlingRate',{rate:1});await capture('frozen-'+index);assert(report.captures.at(-1).state.parked>0);
  await page.evaluate(()=>globalThis.__cxvRafPause.resume());await page.waitForTimeout(2000);await capture('resumed-'+index);
 }
 report.errors=errors;report.blockedRequests=blockedRequests;report.pass=!errors.length&&!blockedRequests.length;report.ended=new Date().toISOString();await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');assert(report.pass);
}finally{await browser.close();}
