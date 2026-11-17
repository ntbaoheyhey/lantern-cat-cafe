/** Fresh controlled experiment: approved pixels with and without their DOM blend passes. */
import {chromium, config, openFixture} from './browser-fixture.mjs';
import {runtimeEvidence} from './runtime-evidence.mjs';
import {mkdir, writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
const out=resolve(process.env.CXV_PROBE_OUT??'work/v5/CXV/films/V-B-probe');
await mkdir(out,{recursive:true});
const report={started:new Date().toISOString(),sourceCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),...runtimeEvidence(),rows:[]};
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 const {page,errors}=await openFixture(browser,config.fixtures.find(f=>f.id==='boss'),{url:process.env.CXV_URL??'http://127.0.0.1:6310',fixedClock:false});
 report.url=page.url();
 for(const owner of ['mochi','soot','clover','panko']){
  await page.evaluate(async owner=>{
   const {pilotFixture}=await import('/src/game/cardrpg/vfx-layered/fixture.ts');
   const {configureSequence}=await import('/src/game/cardrpg/battle-v3/sequence.ts');
   const f=pilotFixture(owner+'-4',false,false),m=window.__depthReview,s=window.__depthScene;
   m.galleryBattle=f.battle;m.plan=configureSequence(f.plan);m.galleryId=owner+'-4';m.animationAt=1280;m.paused=true;m.labOpen=false;m.sceneStarted=true;
   m.state.settings.reducedMotion=false;m.notify(false);cancelAnimationFrame(s.raf);s.ensureActors(s.view());
  },owner);
  await page.waitForFunction(()=>window.__depthScene.ready&&window.__depthScene.actors.size===window.__depthReview.battle.actors.length);
  const audit=await page.evaluate(async owner=>{
   const s=window.__depthScene,m=window.__depthReview;
   const {getV5Timeline,getV5Texture}=await import('/src/game/cardrpg/spine/vfx-registry.ts');
   m.animationAt=1280;cancelAnimationFrame(s.raf);s.render({...s.view(),fixedTime:21.28,paused:true},0);
   return {timeline:structuredClone(s.effects.timeline.audit),decoded:getV5Timeline(owner+'-4').layers.filter(l=>l.texture).map(l=>({id:l.id,key:l.texture,decoded:!!getV5Texture(l.texture)})),passes:s.effects.blendLayers.passes.map(p=>{
    const d=p.context.getImageData(0,0,p.canvas.width,p.canvas.height).data;let alphaPixels=0;for(let i=3;i<d.length;i+=4)if(d[i]>5)alphaPixels++;
    return {blend:p.blend,active:p.active,alphaPixels,mix:getComputedStyle(p.canvas).mixBlendMode};
   })};
  },owner);
  const withBlend=await page.screenshot({path:resolve(out,owner+'-with.png')});
  await page.evaluate(()=>window.__depthScene.effects.blendLayers.passes.forEach(p=>p.canvas.style.visibility='hidden'));
  const withoutBlend=await page.screenshot({path:resolve(out,owner+'-without.png')});
  const difference=await page.evaluate(async urls=>{
   const pixels=[];for(const url of urls){const img=new Image();img.src=url;await img.decode();const c=document.createElement('canvas');c.width=img.width;c.height=img.height;const x=c.getContext('2d');x.drawImage(img,0,0);pixels.push(x.getImageData(0,0,c.width,c.height).data);}
   let changed=0,max=0,total=0;for(let i=0;i<pixels[0].length;i+=4){const d=Math.max(...[0,1,2].map(k=>Math.abs(pixels[0][i+k]-pixels[1][i+k])));if(d>2)changed++;max=Math.max(max,d);total+=d;}return {changedPixels:changed,maxChannelDifference:max,totalDifference:total};
  },[withBlend,withoutBlend].map(b=>'data:image/png;base64,'+b.toString('base64')));
  await page.evaluate(()=>window.__depthScene.effects.blendLayers.passes.forEach(p=>p.canvas.style.visibility=''));
  report.rows.push({owner,...audit,difference});
 }
 report.errors=errors;
}finally{await browser.close();report.finished=new Date().toISOString();await writeFile(resolve(out,'probe.json'),JSON.stringify(report,null,2));}
console.log(JSON.stringify({out,errors:report.errors,rows:report.rows.map(r=>({owner:r.owner,textured:r.timeline.textured,passes:r.passes,difference:r.difference}))}));
