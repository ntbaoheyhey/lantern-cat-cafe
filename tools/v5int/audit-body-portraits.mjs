/** Painted actor pixels beneath portrait rectangles, not just bounding boxes. */
import assert from 'node:assert/strict';
import {chromium,config,openFixture,runtimeEvidence} from './production-fixture.mjs';
import {loadPilotFixtures} from './pilot-fixture.mjs';
import {existsSync} from 'node:fs';
import {mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
const label=process.argv[2];assert(/^[a-z0-9-]+$/.test(label??''));
const out=resolve('work/v5/CXI/body-portraits',label);assert(!existsSync(out),'Use a fresh evidence label');await mkdir(out,{recursive:true});
const pilots=await loadPilotFixtures();
const report={utc:new Date().toISOString(),source:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),...runtimeEvidence(),viewport:{width:1280,height:720},method:'Render each current actor root alone into transparent1280x720 RGBA. Count alpha>127 and alpha>8 inside actual DOM portrait rectangles; retain pose/alpha/transform. This establishes painted footprint beneath HUD rectangles, not a claim every rectangle pixel is opaque. Whole-scene screenshot at worst sampled contact accompanies each case.',rows:[],errors:[]};
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 for(const id of ['wave3-idle','enemy:yarn-giant:basic','enemy:yarn-giant','panko-4']){
  const {page,errors,blockedRequests}=await openFixture(browser,config.fixtures.find(f=>f.id===(id==='wave3-idle'?'wave3':'boss')),{});report.url=page.url();
  if(id!=='wave3-idle'){
   const f=pilots.pilotFixture(id);await page.evaluate(({battle,plan})=>{const m=window.__depthReview;Object.assign(m,{galleryBattle:battle,tutorialBattle:null,plan,animationAt:0,paused:true});m.notify(false);window.__depthScene.ensureActors(window.__depthScene.view());},{battle:f.battle,plan:pilots.configureSequence(f.plan)});
   await page.waitForFunction(()=>window.__depthScene.ready&&window.__depthScene.actors.size===window.__depthReview.battle.actors.length);
  }
  await page.locator('.b3-wave-intro').waitFor({state:'hidden',timeout:5000});
  const samples=id==='wave3-idle'?[0,200,400,600]:id.endsWith(':basic')?[0,200,350,470,650,799]:[0,400,800,1100,1280,1550,1760,2199];
  const rows=[];
  for(const ms of samples)rows.push(await page.evaluate(async({id,ms})=>{
   const s=window.__depthScene,m=window.__depthReview;cancelAnimationFrame(s.raf);m.animationAt=ms;s.phaseNoticeAt=-100;s.render({...s.view(),fixedTime:30+ms/1000,paused:true},0);
   const width=s.width,height=s.height,rect=s.renderer.domElement.getBoundingClientRect();
   const portraits=[...document.querySelectorAll('.b3-portrait')].map(n=>{const r=n.getBoundingClientRect();return{id:n.getAttribute('data-actor'),x:r.x-rect.x,y:r.y-rect.y,width:r.width,height:r.height}});
   const data=new Uint8Array(width*height*4),visible=s.scene.children.map(n=>[n,n.visible]),color=s.renderer.getClearColor([...s.actors.values()].find(e=>e.craftPose?.drawing).craftPose.drawing.material.color.clone()),alpha=s.renderer.getClearAlpha(),background=s.scene.background,units=[],gl=s.renderer.getContext();
   try{
    s.scene.background=null;s.renderer.setClearColor(0,0);
    for(const [actorId,e]of s.actors){
     for(const [n,v]of visible)n.visible=v&&n===e.actor.root;
     s.renderer.clear();s.renderer.render(s.scene,s.camera);gl.readPixels(0,0,width,height,gl.RGBA,gl.UNSIGNED_BYTE,data);
     let painted=0,bottom=-1;
     for(let p=3;p<data.length;p+=4)if(data[p]>127){painted++;bottom=Math.max(bottom,height-1-Math.floor((p-3)/4/width));}
     const overlap=portraits.map(r=>{let solid=0,fringe=0,alphaArea=0;for(let y=Math.max(0,Math.floor(r.y));y<Math.min(height,Math.ceil(r.y+r.height));y++)for(let x=Math.max(0,Math.floor(r.x));x<Math.min(width,Math.ceil(r.x+r.width));x++){const a=data[((height-1-y)*width+x)*4+3];if(a>127)solid++;if(a>8)fringe++;alphaArea+=a/255;}return{portrait:r.id,solid,fringe,alphaArea};});
     units.push({id:actorId,asset:e.asset,painted,bottom,overlap,totalSolid:overlap.reduce((v,r)=>v+r.solid,0),totalFringe:overlap.reduce((v,r)=>v+r.fringe,0)});
    }
   }finally{s.renderer.setClearColor(color,alpha);s.scene.background=background;for(const[n,v]of visible)n.visible=v;}
   s.phaseNoticeAt=-100;s.render({...s.view(),fixedTime:30+ms/1000,paused:true},0);
   return{id,ms,portraits,units,totalSolid:units.reduce((v,u)=>v+u.totalSolid,0),totalFringe:units.reduce((v,u)=>v+u.totalFringe,0)};
  },{id,ms}));
  const worst=rows.reduce((a,b)=>b.totalSolid>a.totalSolid?b:a);
  const captureMs=worst.totalSolid?worst.ms:({'enemy:yarn-giant:basic':350,'enemy:yarn-giant':1280}[id]??0);
  await page.evaluate(ms=>{const s=window.__depthScene,m=window.__depthReview;m.animationAt=ms;s.phaseNoticeAt=-100;s.render({...s.view(),fixedTime:30+ms/1000,paused:true},0);},captureMs);
  const name=id.replaceAll(':','-');await page.screenshot({path:resolve(out,name+'.png')});
  execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-i',resolve(out,name+'.png'),'-vf','scale=1024:576','-frames:v','1','-q:v','3','-y',resolve(out,name+'.jpg')]);
  report.rows.push({id,samples:rows,worstMs:worst.ms,captureMs,sheet:resolve(out,name+'.jpg')});report.errors.push(...errors,...blockedRequests);assert.equal(report.errors.length,0);await page.close();
 }
 report.pass=report.rows.every(r=>r.samples.every(s=>s.totalSolid===0&&s.totalFringe===0&&s.units.every(u=>u.painted>0)));report.complete=true;report.ended=new Date().toISOString();await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2));
 console.log(JSON.stringify({out,errors:report.errors,worst:report.rows.map(r=>({id:r.id,ms:r.worstMs,units:r.samples.find(s=>s.ms===r.worstMs).units.map(u=>({id:u.id,painted:u.painted,bottom:u.bottom,overlap:u.totalSolid,fringe:u.totalFringe}))}))}));
}finally{await browser.close();await pilots.close();}
