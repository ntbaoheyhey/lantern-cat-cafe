/** Production Yarn contact/recovery and lower-field review. Paused fixtures, not gameplay. */
import assert from 'node:assert/strict';
import {chromium,config,openFixture,runtimeEvidence} from './production-fixture.mjs';
import {loadPilotFixtures} from './pilot-fixture.mjs';
import {mkdir,writeFile,access} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'../..'),label=process.argv[2];assert(/^[a-z0-9-]+$/.test(label??''));
const out=resolve(root,'work/v5/CXI/yarn',label),sharp=createRequire(resolve(root,'apps/web/package.json'))('sharp');
try{await access(out);throw Error('Use a fresh evidence directory');}catch(e){if(e.code!=='ENOENT')throw e;}await mkdir(out,{recursive:true});
const report={utc:new Date().toISOString(),sourceCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),...runtimeEvidence(),viewport:{width:1280,height:720},method:'Unchanged pilotFixture/configureSequence bundled in Node. Current production judge URL; paused ultimate contact/recovery and wave3 placement, not real gameplay or performance evidence.',rows:[],errors:[],complete:false};
const modules=await loadPilotFixtures(),fixture=modules.pilotFixture('enemy:yarn-giant'),plan=modules.configureSequence(fixture.plan);await modules.close();
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 const {page,errors,blockedRequests}=await openFixture(browser,config.fixtures.find(f=>f.id==='boss'));report.url=page.url();
 await page.evaluate(({battle,plan})=>{const m=window.__depthReview;Object.assign(m,{galleryBattle:battle,tutorialBattle:null,plan,animationAt:0,paused:true,sceneStarted:true});m.notify(false);},{battle:fixture.battle,plan});
 await page.waitForFunction(()=>window.__depthScene.ready&&window.__depthScene.actors.size===window.__depthReview.battle.actors.length);
 for(const reduced of [false,true]){
  const tiles=[],samples=[];
  for(const [i,ms] of [950,1100,1550,1760].entries()){
   samples.push(await page.evaluate(({ms,reduced})=>{const m=window.__depthReview,s=window.__depthScene;cancelAnimationFrame(s.raf);m.state.settings.reducedMotion=reduced;m.animationAt=ms;const v={...s.view(),frame:m.frame,fixedTime:20+ms/1000,paused:true,galleryPreview:true,reducedMotion:reduced};s.render(v,0);s.phaseNoticeAt=-100;s.render(v,0);const mesh=s.craftYarn.rear.children[0];return{ms,targets:[...new Set(m.plan.events.filter(e=>e.type==='damage').flatMap(e=>e.targetIds))],audit:structuredClone(s.craftYarn.audit),fan:{width:mesh.scale.x,height:Math.abs(mesh.scale.y),alpha:mesh.material.uniforms.uAlpha.value,visible:mesh.visible}};},{ms,reduced}));
   const p=resolve(out,`yarn-${reduced?'reduced':'normal'}-${i}.png`);await page.screenshot({path:p});tiles.push({input:await sharp(p).resize(512,288).toBuffer(),left:(i%2)*512,top:Math.floor(i/2)*288});
  }
  const sheet=resolve(out,`yarn-${reduced?'reduced':'normal'}-1024.jpg`);await sharp({create:{width:1024,height:576,channels:3,background:'#171326'}}).composite(tiles).jpeg({quality:84}).toFile(sheet);report.rows.push({reduced,samples,sheet});
 }
 report.errors.push(...errors,...blockedRequests);await page.close();
 const wave=await openFixture(browser,config.fixtures.find(f=>f.id==='wave3'));
 report.wave3=await wave.page.evaluate(()=>{const s=window.__depthScene;cancelAnimationFrame(s.raf);s.render({...s.view(),fixedTime:20,paused:true},0);s.phaseNoticeAt=-100;s.render({...s.view(),fixedTime:20,paused:true},0);const rect=s.renderer.domElement.getBoundingClientRect(),portraits=[...document.querySelectorAll('.b3-portrait')].map(e=>{const r=e.getBoundingClientRect();return{x:r.x-rect.x,y:r.y-rect.y,width:r.width,height:r.height}}),intersect=(a,b)=>Math.max(0,Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x))*Math.max(0,Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y));return{portraits,units:s.sizeAudit().units.map(u=>({...u,portraitOverlap:portraits.reduce((n,r)=>n+intersect(u.coreBox,r),0)}))};});
 await wave.page.screenshot({path:resolve(out,'wave3.png')});report.wave3.sheet=resolve(out,'wave3-1024.jpg');await sharp(resolve(out,'wave3.png')).resize(1024,576).jpeg({quality:84}).toFile(report.wave3.sheet);report.errors.push(...wave.errors,...wave.blockedRequests);assert.equal(report.errors.length,0);report.complete=true;
}finally{await browser.close();await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify({out,complete:report.complete,errors:report.errors}));
