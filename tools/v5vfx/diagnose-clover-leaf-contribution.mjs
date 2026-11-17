/** Attribute an invisible particle to the actual effect pass without changing application source. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {chromium,config,openFixture} from './browser-fixture.mjs';
import {runtimeEvidence} from './runtime-evidence.mjs';
const root=resolve(import.meta.dirname,'../..'),out=resolve(root,'work/v5/CXV/films/V7-D-clover-leaf/contribution');
assert(!existsSync(out));await mkdir(out,{recursive:true});
const manifest=JSON.parse(await readFile(resolve(root,'work/v5/CXV/films/V7-D-clover-leaf/asset.json'))),bytes=await readFile(manifest.asset);
const hash=x=>createHash('sha256').update(x).digest('hex');assert.equal(hash(bytes),manifest.sha256);
const source=await readFile(new URL(import.meta.url));await writeFile(resolve(out,'diagnose-clover-leaf-contribution.mjs'),source);
const report={utc:new Date().toISOString(),source:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),...runtimeEvidence(),assetSha256:manifest.sha256,harnessSha256:hash(source),method:'Fixed-time browser diagnostic: compare unprotected canvas, immediate protected canvas and final scene canvas. Wrappers observe original calls; no mask or timing changes. This is not a performance benchmark.',cases:[]};
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 const {page,errors,blockedRequests}=await openFixture(browser,config.fixtures.find(f=>f.id==='boss'),{fixedClock:false});report.url=page.url();
 await page.route('**/__cxv_leaf_probe.webp',route=>route.fulfill({body:bytes,contentType:'image/webp'}));
 await page.evaluate(async()=>{
  const registry=await import('/src/game/cardrpg/spine/vfx-registry.ts'),image=new Image();image.src='/__cxv_leaf_probe.webp';await image.decode();
  if(!registry.registerV5Texture('cxv-clover-leaf',{image,width:128,height:128,cols:1,rows:1,frameMs:50,blend:'normal'}))throw Error('Texture invalid');
  const s=window.__depthScene,e=s.effects,protect=e.protect,clear=e.clearFrame,c=window.__cxvLeafContribution={registry,protectCalls:0,clearCalls:0};
  const pixels=()=>e.canvas.getContext('2d').getImageData(0,0,e.canvas.width,e.canvas.height).data;
  e.protect=function(ctx,...args){if(ctx.canvas!==e.canvas)return protect.call(this,ctx,...args);c.protectCalls++;c.pre=pixels();const r=protect.call(this,ctx,...args);c.post=pixels();return r;};
  e.clearFrame=function(...args){c.clearCalls++;return clear.apply(this,args);};
 });
 for(const reduced of [false,true])for(const id of ['clover-1','clover-4']){
  await page.evaluate(async({id,reduced})=>{
   const {pilotFixture}=await import('/src/game/cardrpg/vfx-layered/fixture.ts'),{configureSequence}=await import('/src/game/cardrpg/battle-v3/sequence.ts');
   const f=pilotFixture(id),m=window.__depthReview,s=window.__depthScene,c=window.__cxvLeafContribution;c.original=c.registry.V5_SKILL_TIMELINES.get(id);
   m.galleryBattle=f.battle;m.plan=configureSequence(f.plan);m.galleryId=id;m.animationAt=0;m.paused=true;m.sceneStarted=true;m.labOpen=false;m.state.settings.reducedMotion=reduced;m.notify(false);cancelAnimationFrame(s.raf);s.ensureActors(s.view());
  },{id,reduced});
  await page.waitForFunction(()=>window.__depthScene.ready&&window.__depthScene.actors.size===window.__depthReview.battle.actors.length);
  const result=await page.evaluate(({id,reduced})=>{
   const s=window.__depthScene,e=s.effects,c=window.__cxvLeafContribution,m=window.__depthReview,variants={};
   m.animationAt=id==='clover-1'?470:1220;const read=()=>e.canvas.getContext('2d').getImageData(0,0,e.canvas.width,e.canvas.height).data;
   for(const variant of ['baseline','candidate']){
    const t=variant==='baseline'?c.original:{...c.original,layers:c.original.layers.map(l=>l.id==='motes'?{...l,texture:'cxv-clover-leaf'}:l)};c.registry.V5_SKILL_TIMELINES.set(id,t);
    s.render({...s.view(),fixedTime:20+m.animationAt/1000,paused:true},0);c.protectCalls=0;c.clearCalls=0;c.pre=c.post=null;
    s.render({...s.view(),fixedTime:20+m.animationAt/1000,paused:true},0);
    variants[variant]={pre:c.pre,post:c.post,final:read(),protectCalls:c.protectCalls,clearCalls:c.clearCalls};
   }
   const compare=(a,b)=>{if(!a||!b)return null;let pixels=0,max=0;for(let i=0;i<a.length;i+=4){let v=0;for(let k=0;k<4;k++)v=Math.max(v,Math.abs(a[i+k]-b[i+k]));pixels+=v>0;max=Math.max(max,v);}return{pixels,maxChannel:max};};
   c.registry.V5_SKILL_TIMELINES.set(id,c.original);
   return{id,reduced,ms:m.animationAt,width:e.canvas.width,height:e.canvas.height,preProtection:compare(variants.baseline.pre,variants.candidate.pre),postProtection:compare(variants.baseline.post,variants.candidate.post),finalCanvas:compare(variants.baseline.final,variants.candidate.final),calls:Object.fromEntries(Object.entries(variants).map(([k,v])=>[k,{protect:v.protectCalls,clear:v.clearCalls}]))};
  },{id,reduced});report.cases.push(result);
 }
 report.errors=errors;report.blockedRequests=blockedRequests;assert(!errors.length);assert(blockedRequests.every(r=>r.url==='https://fonts.googleapis.com/css2'&&r.type==='stylesheet'));report.pass=true;
}catch(error){report.pass=false;report.error=String(error);process.exitCode=1;}finally{await browser.close();report.ended=new Date().toISOString();await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify(report));
