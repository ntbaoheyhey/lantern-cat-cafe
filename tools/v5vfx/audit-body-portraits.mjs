/** Painted actor pixels beneath portrait rectangles, not just bounding boxes. */
import {chromium,config,openFixture} from './browser-fixture.mjs';
import {runtimeEvidence} from './runtime-evidence.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
const out=resolve(process.env.CXV_CAPTURE_OUT??'work/v5/CXV/films/V7-F-body-portraits');await mkdir(out,{recursive:true});
const report={utc:new Date().toISOString(),source:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),...runtimeEvidence(),viewport:{width:1280,height:720},method:'Render each current actor root alone into transparent1280x720 RGBA. Count alpha>127 and alpha>8 inside actual DOM portrait rectangles; retain pose/alpha/transform. This establishes painted footprint beneath HUD rectangles, not a claim every rectangle pixel is opaque. Whole-scene screenshot at worst sampled contact accompanies each case.',rows:[],errors:[]};
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 for(const id of ['wave3-idle','enemy:yarn-giant:basic','enemy:yarn-giant','panko-4']){
  const {page,errors}=await openFixture(browser,config.fixtures.find(f=>f.id===(id==='wave3-idle'?'wave3':'boss')),{fixedClock:false});report.url=page.url();
  if(id!=='wave3-idle'){
   await page.evaluate(async id=>{const {pilotFixture}=await import('/src/game/cardrpg/vfx-layered/fixture.ts');const {configureSequence}=await import('/src/game/cardrpg/battle-v3/sequence.ts');const f=pilotFixture(id),m=window.__depthReview;Object.assign(m,{galleryBattle:f.battle,plan:configureSequence(f.plan),animationAt:0,paused:true});m.notify(false);window.__depthScene.ensureActors(window.__depthScene.view());},id);
   await page.waitForFunction(()=>window.__depthScene.ready&&window.__depthScene.actors.size===window.__depthReview.battle.actors.length);
  }
  await page.locator('.b3-wave-intro').waitFor({state:'hidden',timeout:5000});
  const samples=id==='wave3-idle'?[0,200,400,600]:id.endsWith(':basic')?[0,200,350,470,650,799]:[0,400,800,1100,1280,1550,1760,2199];
  const rows=[];
  for(const ms of samples)rows.push(await page.evaluate(async({id,ms})=>{
   const T=await import('/node_modules/.vite/deps/three.js'),s=window.__depthScene,m=window.__depthReview;m.animationAt=ms;s.render({...s.view(),fixedTime:30+ms/1000,paused:true},0);
   const width=s.width,height=s.height,rect=s.renderer.domElement.getBoundingClientRect();
   const portraits=[...document.querySelectorAll('.b3-portrait')].map(n=>{const r=n.getBoundingClientRect();return{id:n.getAttribute('data-actor'),x:r.x-rect.x,y:r.y-rect.y,width:r.width,height:r.height}});
   const target=new T.WebGLRenderTarget(width,height,{depthBuffer:false}),data=new Uint8Array(width*height*4),visible=s.scene.children.map(n=>[n,n.visible]),color=s.renderer.getClearColor(new T.Color()),alpha=s.renderer.getClearAlpha(),background=s.scene.background,previous=s.renderer.getRenderTarget(),units=[];
   try{
    s.scene.background=null;s.renderer.setClearColor(0,0);s.renderer.setRenderTarget(target);
    for(const [actorId,e]of s.actors){
     for(const [n,v]of visible)n.visible=v&&n===e.actor.root;
     s.renderer.clear();s.renderer.render(s.scene,s.camera);s.renderer.readRenderTargetPixels(target,0,0,width,height,data);
     let painted=0,bottom=-1;
     for(let p=3;p<data.length;p+=4)if(data[p]>127){painted++;bottom=Math.max(bottom,height-1-Math.floor((p-3)/4/width));}
     const overlap=portraits.map(r=>{let solid=0,fringe=0,alphaArea=0;for(let y=Math.max(0,Math.floor(r.y));y<Math.min(height,Math.ceil(r.y+r.height));y++)for(let x=Math.max(0,Math.floor(r.x));x<Math.min(width,Math.ceil(r.x+r.width));x++){const a=data[((height-1-y)*width+x)*4+3];if(a>127)solid++;if(a>8)fringe++;alphaArea+=a/255;}return{portrait:r.id,solid,fringe,alphaArea};});
     units.push({id:actorId,asset:e.asset,painted,bottom,overlap,totalSolid:overlap.reduce((v,r)=>v+r.solid,0),totalFringe:overlap.reduce((v,r)=>v+r.fringe,0)});
    }
   }finally{s.renderer.setRenderTarget(previous);s.renderer.setClearColor(color,alpha);s.scene.background=background;for(const[n,v]of visible)n.visible=v;target.dispose();}
   s.render({...s.view(),fixedTime:30+ms/1000,paused:true},0);
   return{id,ms,portraits,units,totalSolid:units.reduce((v,u)=>v+u.totalSolid,0),totalFringe:units.reduce((v,u)=>v+u.totalFringe,0)};
  },{id,ms}));
  const worst=rows.reduce((a,b)=>b.totalSolid>a.totalSolid?b:a);
  await page.evaluate(ms=>{const s=window.__depthScene,m=window.__depthReview;m.animationAt=ms;s.render({...s.view(),fixedTime:30+ms/1000,paused:true},0);},worst.ms);
  const name=id.replaceAll(':','-');await page.screenshot({path:resolve(out,name+'.png')});
  execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-i',resolve(out,name+'.png'),'-vf','scale=1024:576','-frames:v','1','-q:v','3','-y',resolve(out,name+'.jpg')]);
  report.rows.push({id,samples:rows,worstMs:worst.ms,sheet:resolve(out,name+'.jpg')});report.errors.push(...errors);await page.close();
 }
 report.ended=new Date().toISOString();await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2));
 console.log(JSON.stringify({out,errors:report.errors,worst:report.rows.map(r=>({id:r.id,ms:r.worstMs,units:r.samples.find(s=>s.ms===r.worstMs).units.map(u=>({id:u.id,painted:u.painted,bottom:u.bottom,overlap:u.totalSolid,fringe:u.totalFringe}))}))}));
}finally{await browser.close();}
