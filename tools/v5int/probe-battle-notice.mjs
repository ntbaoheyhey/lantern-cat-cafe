/** Independent native production check of recovery-notice geometry and controls. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {chromium,config,openFixture,runtimeEvidence,judgeUrl} from './production-fixture.mjs';
const label=process.argv[2];assert(/^[a-z0-9-]+$/.test(label??''));const out=resolve('work/v5/CXI/notice',label);assert(!existsSync(out));await mkdir(out,{recursive:true});
const hash=b=>createHash('sha256').update(b).digest('hex'),long='Some painted battle resources could not be loaded. The scene will keep your paused battle and its current turn while you check the connection. Resource: '+ 'native-atlas-recovery-token-'.repeat(9);
const report={utc:new Date().toISOString(),url:judgeUrl,source:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),...runtimeEvidence(),toolSha256:hash(await readFile(import.meta.filename)),viewport:{width:1280,height:720},method:'Own native production boss fixture, both motion modes; real WEBGL_lose_context events and unmodified app notice. Prime actual guide/menu clicks before loaded baseline, then repeat during loss. Measure short/long text intersections and HUD hit targets; require preserved rules and exact restored full RGB. Long resource message is synthetic; no performance/incidence claim.',runs:[],captures:[],complete:false};
const save=()=>writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');await save();
async function controls(page){await page.getByRole('button',{name:'Read battle guide',exact:true}).click();await page.locator('dialog[open]').waitFor();await page.getByRole('button',{name:'Close guide',exact:true}).click();await page.locator('dialog[open]').waitFor({state:'hidden'});await page.getByRole('button',{name:'More battle options',exact:true}).click();await page.locator('.b3-menu').waitFor();await page.keyboard.press('Escape');await page.locator('.b3-menu').waitFor({state:'hidden'});}
const state=page=>page.evaluate(()=>{const m=window.__depthReview;return{battle:JSON.stringify(m.battle),plan:JSON.stringify(m.plan),age:m.animationAt,paused:m.paused};});
async function capture(page,name,preview){const rawPath=resolve(out,name+'.png');await page.screenshot({path:rawPath});const{data,info}=await sharp(rawPath).removeAlpha().raw().toBuffer({resolveWithObject:true});assert(info.width===1280&&info.height===720);const row={rawPath,rgbSha256:hash(data),utc:new Date().toISOString()};if(preview){const path=resolve(out,name+'-1024.jpg');await sharp(rawPath).resize(1024,576).jpeg({quality:92}).toFile(path);const stats=await sharp(path).stats();assert(stats.channels.every(c=>c.stdev>10));Object.assign(row,{path,sha256:hash(await readFile(path)),dimensions:[1024,576],stdev:stats.channels.map(c=>c.stdev)});report.captures.push(row);await save();}return row;}
async function geometry(page){return page.evaluate(()=>{
 const visible=e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>0&&r.height>0&&s.display!=='none'&&s.visibility!=='hidden';},rect=e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};},span=document.querySelector('.dp-scene-error > span');if(!span)throw Error('Missing native notice span');
 const range=document.createRange();range.selectNodeContents(span);const glyphs=[...range.getClientRects()].filter(r=>r.width&&r.height).map(r=>({x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height}));
 const cover=[...document.querySelectorAll('.b3-top,.b3-bottom,.b3-world,.b3-boss,.b3-total,.b3-menu,.b3-skip-plate')].filter(visible).map(e=>({className:e.className,rect:rect(e)}));const intersections=[];
 for(const g of glyphs)for(const c of cover){const b=c.rect,w=Math.max(0,Math.min(g.right,b.right)-Math.max(g.x,b.x)),h=Math.max(0,Math.min(g.bottom,b.bottom)-Math.max(g.y,b.y));if(w*h>0)intersections.push({className:c.className,area:w*h});}
 const targets=[...document.querySelectorAll('.b3-hud button:not(:disabled),.th-audio button:not(:disabled)')].filter(visible).map(e=>{const r=e.getBoundingClientRect();return{label:e.getAttribute('aria-label')??e.textContent,rect:rect(e),hit:e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))};});
 return{text:span.textContent,rect:rect(span),glyphs,intersections,targets,color:getComputedStyle(span).color,background:getComputedStyle(span.parentElement).backgroundColor};
});}
function verifyGeometry(g){assert(g.glyphs.length>0);assert.deepEqual(g.intersections,[]);assert(g.targets.length>=6&&g.targets.every(x=>x.hit));for(const r of g.glyphs)assert(r.x>=0&&r.y>=0&&r.right<=1280&&r.bottom<=720);}
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 for(const reduced of [false,true]){
  const mode=reduced?'reduced':'normal',{page,errors,blockedRequests}=await openFixture(browser,config.fixtures.find(f=>f.id==='boss'));page.setDefaultTimeout(15000);await page.locator('.b3-wave-intro').waitFor({state:'hidden'});await controls(page);
  await page.evaluate(reduced=>{const s=window.__depthScene,m=window.__depthReview;m.state.settings.reducedMotion=reduced;m.paused=true;m.notify(false);for(const a of document.getAnimations())a.pause();s.time=20.3;s.phaseNoticeAt=-100;s.dirty=true;const gl=s.renderer.getContext(),ext=gl.getExtension('WEBGL_lose_context');if(!ext)throw Error('No loss extension');window.__cxiNotice={gl,ext};s.raf=requestAnimationFrame(s.loop);},reduced);
  await page.waitForTimeout(400);const rules=await state(page),loaded=await capture(page,mode+'-loaded',false);assert(rules.paused);
  await page.evaluate(()=>window.__cxiNotice.ext.loseContext());await page.waitForFunction(()=>window.__cxiNotice.gl.isContextLost()&&window.__depthReview.sceneError);await page.waitForTimeout(200);
  const short=await geometry(page);verifyGeometry(short);await controls(page);await capture(page,mode+'-short',true);assert.deepEqual(await state(page),rules);
  await page.evaluate(()=>window.__cxiNotice.ext.restoreContext());await page.waitForFunction(()=>!window.__cxiNotice.gl.isContextLost()&&!window.__depthReview.sceneError);await page.waitForTimeout(400);const restored=await capture(page,mode+'-restored',false);assert.equal(restored.rgbSha256,loaded.rgbSha256);assert.deepEqual(await state(page),rules);
  await page.evaluate(()=>window.__cxiNotice.ext.loseContext());await page.waitForFunction(()=>window.__cxiNotice.gl.isContextLost());await page.evaluate(long=>window.__depthScene.reportFailure(long),long);await page.waitForTimeout(200);const wrapped=await geometry(page);verifyGeometry(wrapped);assert(wrapped.glyphs.length>1);await capture(page,mode+'-long',true);
  await page.evaluate(()=>window.__cxiNotice.ext.restoreContext());await page.waitForFunction(()=>!window.__cxiNotice.gl.isContextLost()&&!window.__depthScene.restoringContext);assert.equal(await page.evaluate(()=>window.__depthReview.sceneError),long);assert.deepEqual(await state(page),rules);await page.evaluate(()=>window.__depthScene.reportFailure(''));await page.waitForSelector('.dp-scene-error',{state:'hidden'});
  assert.deepEqual(errors,[]);assert.deepEqual(blockedRequests,[]);report.runs.push({mode,short,wrapped,loaded,restored,exactRestoredRgb:true,retainedResourceError:true,rulesUnchanged:true,guideAndMenuClicks:true,errors,blockedRequests});await save();await page.close();
 }report.complete=true;
}catch(error){report.failure=error.stack;process.exitCode=1;}
finally{await browser.close();report.finishedUtc=new Date().toISOString();await save();console.log(JSON.stringify({out,complete:report.complete,failure:report.failure}));}
