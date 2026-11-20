/** Exercise the default production bundle with the existing deterministic fixtures. */
import {chromium,config,openFixture} from '../../../scripts/v3feel/browser-fixture.mjs';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {existsSync} from 'node:fs';
const out='reports/v4-art/REVIEW/activation/r1';
const attempt=process.argv[2]??'r2',receipt=`${out}/production-smoke-${attempt}.json`;
if(existsSync(receipt))throw Error('Preserve every smoke attempt');
const validation=JSON.parse(await readFile(`${out}/validation.json`,'utf8'));
if(!validation.pass)throw Error('Regression/build must pass first');
for(const [path,hash]of Object.entries(validation.runtimeSourceHashes)){
 if(createHash('sha256').update(await readFile(path)).digest('hex')!==hash)throw Error(`Changed source: ${path}`);
}
const report={started:new Date().toISOString(),url:'http://127.0.0.1:5991/?demo=1&squad=1&cardrpg2=1&a6=1',
 scope:'Actual default production bundle. Native entry uses UI clicks with no dev/craft flag. Fixture cases add dev=1 solely to expose the existing model handle; craft has no flag override. Fixture data comes from the existing dev helper. Runtime observations are not film acceptance or an integrated SHIP journey.',
 runtimeSourceHashes:validation.runtimeSourceHashes,fixtures:[],complete:false,pass:false};
await mkdir(`${out}/raw`,{recursive:true});
const save=()=>writeFile(receipt,JSON.stringify(report,null,2)+'\n');
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
async function productionPage(fixtureData,failPose=false){
 const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1}),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.addInitScript(()=>{localStorage.setItem('lantern.entered.v3','1');localStorage.setItem('lantern.coach.v3',JSON.stringify({disabled:true}));});
 await page.route('**/*',route=>['127.0.0.1','localhost'].includes(new URL(route.request().url()).hostname)?route.continue():route.abort());
 if(failPose)await page.route('**/units/mochi/poses/K2.webp',route=>route.abort());
 await page.goto(report.url+(fixtureData?'&dev=1':''));
 if(!fixtureData)return {page,errors};
 await page.waitForFunction(()=>window.__depthReview,null,{timeout:90000});
 await page.evaluate(({state,battle})=>{
  const m=window.__depthReview;m.state=state;
  Object.assign(m,{tutorialBattle:battle,galleryBattle:null,replay:null,plan:null,roundPlan:null,watching:true,paused:true,sceneStarted:true,screen:'map'});m.notify(false);
 },fixtureData);
 return {page,errors};
}
try{
 const native=await productionPage();
 await native.page.locator('button.uv-patrol').click();
 await native.page.locator('button.c2-fight').click();
 await native.page.waitForFunction(()=>window.__depthScene?.ready&&!document.querySelector('.dp-loading'),null,{timeout:90000});
 report.nativeEntry=await native.page.evaluate(()=>{
  const s=window.__depthScene,box=s.renderer.domElement.getBoundingClientRect();
  return {url:location.href,reviewHandle:!!window.__depthReview,ready:s.ready,canvasVisible:box.width>0&&box.height>0,
   overlays:document.querySelectorAll('.dp-loading').length,actors:[...s.actors.values()].map(e=>({asset:e.asset,drawn:!!e.craftPose})),effects:Object.keys(s.craftEffects.effects)};
 });
 report.nativeEntry.errors=native.errors;await save();await native.page.close();console.log('native-entry',JSON.stringify(report.nativeEntry));
 let firstFixture;
 for(const fixture of config.fixtures){
  const source=await openFixture(browser,fixture);
  const data=await source.page.evaluate(()=>({state:window.__depthReview.state,battle:window.__v3a2.initial}));
  await source.page.close();firstFixture??=data;
  const {page,errors}=await productionPage(data);
  await page.waitForFunction(()=>window.__depthScene?.ready&&window.__depthReview.sceneReady&&!document.querySelector('.dp-loading'),null,{timeout:90000});
  const observed=await page.evaluate(()=>{
   const s=window.__depthScene,m=window.__depthReview;cancelAnimationFrame(s.raf);
   const owners=['mochi','soot','clover','panko','binding-thread','teacup-healer','needle-moth','yarn-giant'];
   const actors=[...s.actors].map(([id,e])=>({id,asset:e.asset,source:e.actor.source,drawn:!!e.craftPose}));
   const canvas=s.renderer.domElement,box=canvas.getBoundingClientRect();
   const ready={scene:s.ready,model:m.sceneReady,error:m.sceneError,overlays:document.querySelectorAll('.dp-loading').length,
    canvasVisible:box.width>0&&box.height>0&&getComputedStyle(canvas).visibility==='visible'};
   const effects=Object.keys(s.craftEffects.effects),actions=[],seen=new Set();
   for(let i=0;i<160;i++){
    m.paused=false;if(!m.plan)m.step();if(!m.plan)break;
    const plan=m.plan,entry=s.actors.get(plan.actorId),asset=entry?.asset,key=`${asset}:${plan.ultimate}`;
    if(owners.includes(asset)&&!seen.has(key)){
     seen.add(key);m.paused=true;const samples=[];
     for(const ms of (plan.ultimate?[0,300,800,1100,1500,2199,2200]:[0,200,350,440,799,800])){
      m.animationAt=ms;s.render({...s.view(),fixedTime:20+ms/1000,paused:true},0);
      const motion=s.motionAudit.find(row=>row.id===plan.actorId);
      samples.push({ms,drawing:entry.craftPose?.drawing.key,motion,camera:s.audit().camera});
     }
     actions.push({asset,ultimate:plan.ultimate,duration:plan.duration,impact:plan.beats[2].start,samples});
    }
    m.paused=false;let ticks=0;while(m.plan&&ticks++<40)m.tick(100);
   }
   m.paused=true;
   const resources=performance.getEntriesByType('resource').map(r=>({url:new URL(r.name).pathname,transfer:r.transferSize,encoded:r.encodedBodySize}));
   return {ready,actors,effects,actions,resources};
  });
  report.fixtures.push({id:fixture.id,errors,...observed});await save();
  await page.screenshot({path:`${out}/raw/production-${attempt}-${fixture.id}.png`});await page.close();
  console.log(fixture.id,JSON.stringify({ready:observed.ready,drawn:observed.actors.filter(a=>a.drawn).map(a=>a.asset),actions:observed.actions.length,errors}));
 }
 const {page,errors}=await productionPage(firstFixture,true);
 await page.waitForFunction(()=>window.__depthReview?.sceneError,null,{timeout:90000});
 report.missingPose=await page.evaluate(()=>({ready:window.__depthScene?.ready,error:window.__depthReview.sceneError,overlay:document.querySelector('.dp-loading')?.textContent}));
 report.missingPose.errors=errors;await page.close();
 report.complete=true;
 report.pass=report.nativeEntry.ready&&report.nativeEntry.canvasVisible&&report.nativeEntry.overlays===0&&!report.nativeEntry.reviewHandle&&report.nativeEntry.errors.length===0
  &&report.fixtures.every(f=>f.ready.scene&&f.ready.model&&f.ready.canvasVisible&&!f.ready.error&&f.ready.overlays===0&&f.errors.length===0&&f.actors.every(a=>!['mochi','soot','clover','panko','binding-thread','teacup-healer','needle-moth','yarn-giant'].includes(a.asset)||a.drawn))
  &&!report.missingPose.ready&&report.missingPose.error.includes('mochi')&&!!report.missingPose.overlay;
}catch(error){report.failure=String(error);console.error(error);process.exitCode=1;}
finally{report.finished=new Date().toISOString();await save();await browser.close();}
if(!report.pass)process.exitCode=1;
