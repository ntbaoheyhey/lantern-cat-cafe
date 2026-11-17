/** Pixel alpha of isolated Yarn VFX, plus body/portrait geometry at the desktop judge size. */
import {chromium,config,openFixture} from './browser-fixture.mjs';
import {runtimeEvidence} from './runtime-evidence.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
const out=resolve(process.env.CXV_CAPTURE_OUT??'work/v5/CXV/films/V7-F-coverage');await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
const report={utc:new Date().toISOString(),source:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),...runtimeEvidence(),method:'Original1280x720 stage. Yarn-only RGBA render target: alpha>.5 projected footprint, not an occlusion claim because rear effects are behind units. Actual body/portrait intersection reported separately.',rows:[],errors:[]};
try{
 const {page,errors}=await openFixture(browser,config.fixtures.find(f=>f.id==='boss'),{fixedClock:false});report.url=page.url();
 for(const id of ['enemy:yarn-giant','enemy:yarn-giant:basic']){
  await page.evaluate(async id=>{const {pilotFixture}=await import('/src/game/cardrpg/vfx-layered/fixture.ts');const {configureSequence}=await import('/src/game/cardrpg/battle-v3/sequence.ts');const f=pilotFixture(id),m=window.__depthReview;m.galleryBattle=f.battle;m.plan=configureSequence(f.plan);m.animationAt=0;m.notify(false);window.__depthScene.ensureActors(window.__depthScene.view());},id);
  await page.waitForFunction(()=>window.__depthScene.ready&&window.__depthScene.actors.size===window.__depthReview.battle.actors.length);
  for(const ms of id.endsWith(':basic')?[350,470,799]:[1100,1280,1550,1760])report.rows.push(await page.evaluate(async({id,ms})=>{
   const T=await import('/node_modules/.vite/deps/three.js');const s=window.__depthScene,m=window.__depthReview;m.animationAt=ms;s.render({...s.view(),fixedTime:30+ms/1000,paused:true},0);
   const width=s.width,height=s.height,rect=s.renderer.domElement.getBoundingClientRect(),units=s.sizeAudit().units,portraits=[...document.querySelectorAll('.b3-portrait')].map(n=>{const r=n.getBoundingClientRect();return{x:r.x-rect.x,y:r.y-rect.y,width:r.width,height:r.height}});
   const target=new T.WebGLRenderTarget(width,height,{depthBuffer:false}),data=new Uint8Array(width*height*4),visible=s.scene.children.map(n=>[n,n.visible]),keep=new Set([s.craftYarn.ground,s.craftYarn.rear,s.craftYarn.front]),color=s.renderer.getClearColor(new T.Color()),alpha=s.renderer.getClearAlpha(),background=s.scene.background,previous=s.renderer.getRenderTarget();
   try{for(const [n]of visible)if(!keep.has(n))n.visible=false;s.scene.background=null;s.renderer.setClearColor(0,0);s.renderer.setRenderTarget(target);s.renderer.clear();s.renderer.render(s.scene,s.camera);s.renderer.readRenderTargetPixels(target,0,0,width,height,data);}finally{s.renderer.setRenderTarget(previous);s.renderer.setClearColor(color,alpha);s.scene.background=background;for(const[n,v]of visible)n.visible=v;target.dispose();}
   const covered=(r,ellipse=false)=>{let tested=0,hit=0;for(let y=Math.max(0,Math.floor(r.y));y<Math.min(height,Math.ceil(r.y+r.height));y++)for(let x=Math.max(0,Math.floor(r.x));x<Math.min(width,Math.ceil(r.x+r.width));x++){if(ellipse&&Math.pow((x-r.x-r.width/2)/(r.width/2),2)+Math.pow((y-r.y-r.height/2)/(r.height/2),2)>1)continue;tested++;if(data[((height-1-y)*width+x)*4+3]>127)hit++;}return{tested,hit,ratio:tested?hit/tested:0}};
   const intersect=(a,b)=>Math.max(0,Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x))*Math.max(0,Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y));
   return{id,ms,targets:[...new Set(m.plan.events.filter(e=>e.type==='damage').flatMap(e=>e.targetIds))],socketError:s.craftYarn.audit.socketError,paint:covered({x:0,y:0,width,height}),portraits:portraits.map(r=>({rect:r,paint:covered(r)})),units:units.map(u=>({id:u.id,box:u.coreBox,face:u.faceBox,facePaint:covered(u.faceBox,true),portraitOverlap:portraits.reduce((v,r)=>v+intersect(u.coreBox,r),0)}))};
  },{id,ms}));
 }
 report.errors.push(...errors);await page.close();
 const wave=await openFixture(browser,config.fixtures.find(f=>f.id==='wave3'),{fixedClock:false});
 report.wave3=await wave.page.evaluate(()=>{const s=window.__depthScene;s.render({...s.view(),fixedTime:20,paused:true},0);const rect=s.renderer.domElement.getBoundingClientRect();return{units:s.sizeAudit().units,portraits:[...document.querySelectorAll('.b3-portrait')].map(e=>{const r=e.getBoundingClientRect();return{x:r.x-rect.x,y:r.y-rect.y,width:r.width,height:r.height}})}});
 await wave.page.screenshot({path:resolve(out,'wave3.png')});report.errors.push(...wave.errors);
 await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({out,errors:report.errors}));
}finally{await browser.close();}
