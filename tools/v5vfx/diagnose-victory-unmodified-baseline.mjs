/** Reproduce the original screenshot states with baseline scheduling and no early screenshot/layer instrumentation. */
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
const report={utc:new Date().toISOString(),url:judgeUrl,...runtimeEvidence(),viewport:{width:1280,height:720},method:'Six fresh reduced result pages from the unchanged baseline artifact in one browser. Same original2s settle/32s4x/capture ordering. No RAF wrapper, early screenshot, CSS override, source substitution, GPU readback, or LayerTree instrumentation. No performance claim.',captures:[],errors:[],blockedRequests:[],pass:false};
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 for(let trial=0;trial<6;trial++){
  const {page,errors,blockedRequests}=await openFixture(browser,config.fixtures.find(f=>f.id==='wave1'));
  const modules=await loadRules();let battle;
  try{const R=await modules.load('packages/game-rules/src/cardrpg/depth/index.ts');battle=await page.evaluate(()=>window.__depthReview.battle);R.playBattle(battle,'auto');}finally{await modules.vite.close();}
  await page.evaluate(battle=>{const m=window.__depthReview;m.state.settings.reducedMotion=true;m.tutorialBattle=battle;m.showResult();},battle);
  await page.waitForSelector('.b3-victory-crew[data-ready=true]');await page.waitForTimeout(2000);
  const cdp=await page.context().newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});await page.waitForTimeout(32000);await cdp.send('Emulation.setCPUThrottlingRate',{rate:1});
  const path=resolve(out,trial+'.png'),crewPath=resolve(out,trial+'-crew.png');await page.screenshot({path});await page.locator('.b3-victory-crew').screenshot({path:crewPath});
  const decode=path=>execFileSync('ffmpeg',['-v','error','-i',path,'-frames:v','1','-f','rawvideo','-pix_fmt','rgb24','pipe:1'],{maxBuffer:10_000_000});
  const state=await page.locator('.b3-victory-crew').evaluate(e=>({ready:e.dataset.ready,drawn:e.dataset.drawn,loadError:e.dataset.loadError,rect:e.getBoundingClientRect().toJSON(),animations:document.getAnimations().length}));assert.equal(state.ready,'true');assert.equal(state.drawn,'4');assert(!state.loadError);
  const row={trial,path,crewPath,utc:new Date().toISOString(),sha256:hash(await readFile(path)),fullRgbSha256:hash(decode(path)),crewRgbSha256:hash(decode(crewPath)),state,errors,blockedRequests};report.captures.push(row);report.errors.push(...errors);report.blockedRequests.push(...blockedRequests);await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(row));await page.close();
 }
 report.pass=report.captures.length===6&&!report.errors.length&&!report.blockedRequests.length;report.ended=new Date().toISOString();await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');assert(report.pass);
}finally{await browser.close();}
