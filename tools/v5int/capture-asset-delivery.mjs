/** Fresh desktop production art review: no generated art or gameplay claims. */
import assert from 'node:assert/strict';
import {mkdir,writeFile,access} from 'node:fs/promises';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import sharp from 'sharp';
import {chromium,config,openFixture,runtimeEvidence,judgeUrl} from './production-fixture.mjs';
import {loadPilotFixtures} from './pilot-fixture.mjs';
const root=resolve(import.meta.dirname,'../..'),label=process.argv[2];assert(/^[a-z0-9-]+$/.test(label??''));
const out=resolve(root,'work/v5/CXI/asset-review',label);
try{await access(out);throw Error('Preserve existing captures');}catch(e){if(e.code!=='ENOENT')throw e;}await mkdir(out,{recursive:true});
const report={utc:new Date().toISOString(),sourceCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),...runtimeEvidence(),url:judgeUrl,viewport:{width:1280,height:720},method:'Current production application, original pilot fixtures at deterministic action times. Home with same four-hero fixture account. No public writes or ordinary gameplay/transaction claim.',rows:[],errors:[],complete:false};
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']}),modules=await loadPilotFixtures();
try{
 const {page,errors,blockedRequests}=await openFixture(browser,config.fixtures.find(f=>f.id==='boss'));
 for(const owner of ['mochi','soot','clover','panko']){
  const tiles=[],samples=[];
  for(const [actionIndex,number]of [1,4].entries()){
   const id=`${owner}-${number}`,fixture=modules.pilotFixture(id),plan=modules.configureSequence(fixture.plan);
   await page.evaluate(({battle,plan,id})=>{const m=window.__depthReview;Object.assign(m,{galleryBattle:battle,tutorialBattle:null,plan,galleryId:id,animationAt:0,paused:true,sceneStarted:true,labOpen:false,screen:'map'});m.notify(false);},{battle:fixture.battle,plan,id});
   await page.waitForFunction(()=>window.__depthScene?.ready&&window.__depthScene.actors.size===window.__depthReview.battle.actors.length,null,{timeout:90000});
   const contact=plan.beats[2].start;
   for(const [i,ms]of [Math.max(0,contact-140),contact+90,contact+240].entries()){
    const stats=await page.evaluate(ms=>{const s=window.__depthScene,m=window.__depthReview;cancelAnimationFrame(s.raf);m.animationAt=ms;s.phaseNoticeAt=-100;s.render({...s.view(),fixedTime:20+ms/1000,paused:true},0);return {stats:s.stats,boxes:[...s.bodyBoxes]};},ms);
    const path=resolve(out,`${id}-${i}.png`);await page.screenshot({path});samples.push({id,ms,contact,path,...stats});
    tiles.push({input:await sharp(path).resize(320,180).toBuffer(),left:i*320,top:actionIndex*180});
   }
  }
  const sheet=resolve(out,owner+'-960.jpg');await sharp({create:{width:960,height:360,channels:3,background:'#171326'}}).composite(tiles).jpeg({quality:88}).toFile(sheet);report.rows.push({owner,samples,sheet});
 }
 await page.evaluate(()=>{const m=window.__depthReview;Object.assign(m,{galleryBattle:null,tutorialBattle:null,plan:null,galleryId:null,watching:false,paused:true,sceneStarted:false,screen:'hub'});m.notify(false);});
 await page.locator('.uv-home-crew img').first().waitFor({state:'visible'});
 await page.evaluate(async()=>{await Promise.all([...document.querySelectorAll('.uv-home-crew img')].map(image=>image.decode()));for(const a of document.getAnimations())a.pause();});
 report.home=await page.locator('.uv-home-crew img').evaluateAll(images=>images.map(image=>({src:image.currentSrc,naturalWidth:image.naturalWidth,naturalHeight:image.naturalHeight,box:image.getBoundingClientRect().toJSON()})));
 await page.screenshot({path:resolve(out,'home.png')});report.homeSheet=resolve(out,'home-1024.jpg');await sharp(resolve(out,'home.png')).resize(1024,576).jpeg({quality:88}).toFile(report.homeSheet);
 report.errors.push(...errors,...blockedRequests);assert.equal(report.errors.length,0);assert.equal(page.url(),judgeUrl);report.complete=true;
}catch(e){report.failure=String(e.stack);throw e;}finally{await browser.close();await modules.close();await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify({complete:report.complete,errors:report.errors,portraits:report.home,report:resolve(out,'report.json')}));
