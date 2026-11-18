/** Native paint attribution only: ordinary baseline plus explicit reversible isolation controls. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {chromium,config,openFixture,runtimeEvidence,judgeUrl,waitForDecodedMediaFrame} from './media-production-fixture.mjs';
const root=resolve(import.meta.dirname,'../..'),out=resolve(process.env.CXV_CAPTURE_OUT??''),sha=b=>createHash('sha256').update(b).digest('hex');
assert.equal(process.env.CXV_MEDIA_CAT,'both');assert(out.startsWith(resolve(root,'work/v5/CXV')+'/'));assert(!existsSync(resolve(out,'report.json')));await mkdir(out,{recursive:true});
const buildPath=process.env.CXV_MEDIA_BUILD,build=JSON.parse(await readFile(buildPath)),verified=JSON.parse(await readFile(resolve(out,'artifact-verification.json')));
assert.equal(verified.indexSha256,build.indexSha256);assert.equal(verified.sourceCommit,build.sourceCommit);
const hiddenStyle='.b3-world { visibility: hidden !important; }';
const installIsolation=()=>{
 const s=window.__depthScene,original=s.postFx.render;
 globalThis.__cxvLabelIsolation={hidden:null,original};
 s.postFx.render=function(...args){
  const cat=globalThis.__cxvLabelIsolation.hidden,plane=cat?[...s.actors.values()].find(e=>e.asset===cat)?.actor?.designerMedia?.media.plane:null;
  if(cat&&!plane)throw Error('Missing diagnostic media plane '+cat);
  const visible=plane?.visible;if(plane)plane.visible=false;
  try{return original.apply(this,args);}finally{if(plane)plane.visible=visible;}
 };
};
const report={utc:new Date().toISOString(),url:judgeUrl,viewport:[1280,720],sourceCommit:build.sourceCommit,indexSha256:build.indexSha256,build:{path:buildPath,sha256:sha(await readFile(buildPath))},harnessSha256:sha(await readFile(import.meta.filename)),fixture:runtimeEvidence(),runtimeSourceSubstitutions:[],runtimeDiagnostic:{wrapperSha256:sha(installIsolation.toString()),hiddenLabelCss:hiddenStyle,hiddenLabelCssSha256:sha(hiddenStyle),scope:'Hide one media plane only during existing postFx draw;restore immediately. Hide DOM label paint only for marked screenshots. Never an application candidate.'},cases:[],errors:[],blockedRequests:[],pass:false};
const save=()=>writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');
const stop=()=>{for(const name of ['STOP-ALL','STOP-CXV'])assert(!existsSync('/Users/bao/taskbar-hero-mailbox/'+name),'STOP '+name);};
const sample=()=>{
 const s=window.__depthScene,m=window.__depthReview,canvas=s.renderer.domElement.getBoundingClientRect();
 const measure=node=>{if(!node||node.hidden)return null;const rr=[node,...node.querySelectorAll('*')].map(n=>n.getBoundingClientRect()).filter(r=>r.width&&r.height);if(!rr.length)return null;const x=Math.min(...rr.map(r=>r.left)),y=Math.min(...rr.map(r=>r.top));return{x,y,width:Math.max(...rr.map(r=>r.right))-x,height:Math.max(...rr.map(r=>r.bottom))-y};};
 return{url:location.href,screen:m.screen,paused:m.paused,plan:m.plan,battle:JSON.stringify(m.battle),sceneTime:s.time,renderTime:s.renderTime,host:canvas.toJSON(),media:Object.fromEntries(['mochi','clover'].map(cat=>{const actor=[...s.actors.values()].find(e=>e.asset===cat).actor,media=actor.designerMedia.media;return[cat,{state:{...media.state},decoded:window.__cxvMediaAudits[cat].decoded.at(-1),planeVisible:media.plane.visible,rootVisible:actor.root.visible,body:s.anchors.find(x=>x.id===cat)?.body,face:s.anchors.find(x=>x.id===cat)?.face}];})),labels:[...document.querySelectorAll('.b3-world')].map(node=>({id:node.dataset.actor,rect:measure(node),text:node.textContent,regions:Object.fromEntries([['hp','.b3-hp'],['rage','.b3-rage'],['name','.b3-world-name'],['status','.b3-marker-row']].map(([name,selector])=>[name,measure(node.querySelector(selector))]))})).filter(x=>x.rect)};
};
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
 for(const condition of [{mode:'normal',frame:0},{mode:'normal',frame:90},{mode:'normal',frame:180},{mode:'normal',frame:270},{mode:'reduced',frame:0}]){
  stop();const {page,errors,blockedRequests}=await openFixture(browser,config.fixtures.find(f=>f.id==='boss'));report.errors.push(...errors);report.blockedRequests.push(...blockedRequests);
  const reduced=condition.mode==='reduced',fixedTime=20+condition.frame/30+.25/30;
  await page.evaluate(reduced=>{const m=window.__depthReview,s=window.__depthScene;cancelAnimationFrame(s.raf);m.state.settings.reducedMotion=false;m.paused=true;m.notify(false);},reduced);
  await page.locator('.b3-wave-intro').waitFor({state:'hidden',timeout:5000});
  await page.evaluate(()=>{const s=window.__depthScene;cancelAnimationFrame(s.raf);s.render({...s.view(),fixedTime:21+.25/30,paused:true},0);});
  await waitForDecodedMediaFrame(page,{sourceFrame:30});
  await page.evaluate(reduced=>{window.__depthReview.state.settings.reducedMotion=reduced;},reduced);
  await page.evaluate(fixedTime=>{const s=window.__depthScene;cancelAnimationFrame(s.raf);s.render({...s.view(),fixedTime,paused:true},0);},fixedTime);
  await waitForDecodedMediaFrame(page,{sourceFrame:condition.frame,reduced});
  await page.evaluate(fixedTime=>{const s=window.__depthScene;cancelAnimationFrame(s.raf);s.render({...s.view(),fixedTime,paused:true},0);},fixedTime);
  const before=await page.evaluate(sample),entry={...condition,fixedTime,before,captures:[]};report.cases.push(entry);await save();
  assert(before.paused&&!before.plan);assert.equal(before.url,judgeUrl);
  for(const m of Object.values(before.media)){assert(m.state.ready&&!m.state.failure&&!m.state.disposed);assert(m.planeVisible&&m.rootVisible);assert(Math.abs(m.decoded.mediaTime-condition.frame/30)<1e-5);}
  await page.evaluate(installIsolation);
  const folder=resolve(out,condition.mode+'-'+condition.frame);await mkdir(folder,{recursive:true});
  for(const variant of ['baseline','baseline-repeat','labels-hidden','labels-hidden-repeat','without-mochi','without-clover','restored']){
   const hidden=variant.startsWith('without-')?variant.slice(8):null,hideLabels=variant.startsWith('labels-hidden')||hidden!==null;
   await page.evaluate(({fixedTime,hidden})=>{const s=window.__depthScene;cancelAnimationFrame(s.raf);window.__cxvLabelIsolation.hidden=hidden;s.render({...s.view(),fixedTime,paused:true},0);},{fixedTime,hidden});
   const path=resolve(folder,variant+'.png'),utc=new Date().toISOString(),beforeShot=await page.evaluate(sample);
   await page.screenshot({path,scale:'css',...(hideLabels?{style:hiddenStyle}:{})});
   const afterShot=await page.evaluate(sample),bytes=await readFile(path);entry.captures.push({variant,path,sha256:sha(bytes),utc,before:beforeShot,after:afterShot});await save();
   assert.equal(bytes.readUInt32BE(16),1280);assert.equal(bytes.readUInt32BE(20),720);
   for(const state of [beforeShot,afterShot]){
    assert.equal(state.battle,before.battle);assert.deepEqual(state.labels,before.labels);assert.equal(state.renderTime,fixedTime);
    for(const cat of ['mochi','clover']){assert.equal(state.media[cat].state.currentTime,before.media[cat].state.currentTime);assert.equal(state.media[cat].decoded.mediaTime,before.media[cat].decoded.mediaTime);assert(state.media[cat].planeVisible);}
   }
  }
  await page.evaluate(()=>{const s=window.__depthScene;s.postFx.render=window.__cxvLabelIsolation.original;delete window.__cxvLabelIsolation;});
  assert.deepEqual(errors,[]);assert.deepEqual(blockedRequests,[]);await page.close();await save();
 }
 assert.equal(runtimeEvidence().indexSha256,build.indexSha256);report.pass=true;
}catch(error){report.failure=error.stack;process.exitCode=1;}
finally{if(browser)await browser.close();report.finishedUTC=new Date().toISOString();await save();console.log(JSON.stringify({out,pass:report.pass,cases:report.cases.length,captures:report.cases.reduce((n,c)=>n+c.captures.length,0),failure:report.failure}));}
