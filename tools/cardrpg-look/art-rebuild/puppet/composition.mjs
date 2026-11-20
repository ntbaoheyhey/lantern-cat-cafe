// Compare real A6 canvas framing; inspect ultimate push-in and reduced motion.
import {chromium} from '../../../../apps/web/node_modules/@playwright/test/index.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {apply,audit} from '../../skills-v5/full/harness.mjs';
const sharp=createRequire('/Users/bao/tools/cardrpg-look/npm/package.json')('sharp');
const out=resolve(process.env.ART_OUT),artifact=resolve(process.env.ART_ARTIFACT);
await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chromium',args:['--use-angle=metal']});
const result={errors:[],rows:[]};
try{
 const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
 page.on('pageerror',e=>result.errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')result.errors.push(m.text());});
 await page.goto('file://'+artifact+'?dev=1&a6=1');await page.waitForFunction(()=>window.__depthReview,null,{timeout:120000});
 await page.evaluate(()=>{const m=window.__depthReview;m.watchNow();m.paused=true;m.camera='wide';m.notify(false);});
 await page.waitForFunction(()=>window.__depthScene?.ready,null,{timeout:120000});
 for(const [name,gallery] of [['normal','mochi-1'],['boss','enemy:yarn-giant']]){
  await apply(page,{gallery,progress:-1});
  for(const [width,height] of [[1440,900],[1280,720]]){
   await page.setViewportSize({width,height});await page.waitForTimeout(100);
   await page.evaluate(async()=>{const m=window.__depthReview,s=window.__depthScene;m.plan=null;m.notify(false);await new Promise(requestAnimationFrame);s.render({...s.view(),fixedTime:3.2,paused:true},0);s.render({...s.view(),fixedTime:3.2,paused:true},0);s.dirty=false;});
   const scene=await page.evaluate(()=>({pipeline:window.__LOOK_ART_PIPELINE__,art:window.__LOOK_ART__,a6:window.__depthReview.a6Mode,bounds:window.__depthScene.audit(),labels:window.__depthScene.labelAudit,camera:{position:window.__depthScene.camera.position.toArray(),zoom:window.__depthScene.camera.zoom,fov:window.__depthScene.camera.fov}}));
   if(!scene.a6||scene.pipeline!=='puppet'||scene.art!=='v3')throw Error('Composition review requires A6 shell and illustrated v3 pipeline');
   result.rows.push({name,width,height,...scene,ui:await page.evaluate(audit)});
   await sharp(await page.screenshot()).webp({quality:89}).toFile(`${out}/${name}-${width}.webp`);
  }
 }
 await page.setViewportSize({width:1440,height:900});await apply(page,{gallery:'mochi-4',progress:.5});
 const camera=await page.evaluate(()=>{const s=window.__depthScene,v={...s.view(),fixedTime:3.2,paused:true};const sample=(reducedMotion,frame)=>{s.render({...v,reducedMotion,frame},0);return{position:s.camera.position.toArray(),zoom:s.camera.zoom,fov:s.camera.fov}};const reduced=sample(true,v.frame),idle=sample(true,null),ultimate=sample(false,v.frame);return {idle,reduced,ultimate,frameShake:v.frame?.shake,ultimateFlag:v.frame?.plan.ultimate};});
 result.camera=camera;
 if(!camera.ultimateFlag||camera.ultimate.zoom<=camera.idle.zoom)throw Error('Ultimate push-in missing');
 if(JSON.stringify(camera.idle)!==JSON.stringify(camera.reduced))throw Error('Reduced motion camera moved');
 await sharp(await page.screenshot()).webp({quality:87}).toFile(out+'/ultimate-push.webp');
 await apply(page,{gallery:'soot-4',progress:.5});
 result.impact=await page.evaluate(()=>{
  const m=window.__depthReview,s=window.__depthScene,b=m.plan.beats.find(b=>b.kind==='impact');m.animationAt=b.start+b.duration*.4;
  const v={...s.view(),fixedTime:3.2,paused:true},sample=frame=>{s.render({...v,frame},0);return s.camera.position.toArray();};
  const still=sample({...v.frame,shake:0}),shaken=sample(v.frame);
  s.render({...v,reducedMotion:true},0);const reduced=s.camera.position.toArray();
  return {shake:v.frame.shake,still,shaken,reduced};
 });
 if(result.impact.shake<=0||JSON.stringify(result.impact.still)===JSON.stringify(result.impact.shaken))throw Error('Impact shake missing');

}finally{await browser.close();await writeFile(out+'/composition.json',JSON.stringify(result,null,2)+'\n');}
console.log(JSON.stringify({errors:result.errors,rows:result.rows.map(r=>({name:r.name,width:r.width,outside:r.bounds.outside,faceHp:r.labels.overlaps,ui:r.ui.overlaps.length,unitHeights:r.bounds.units.map(u=>[u.id,Math.round(u.box.height/r.bounds.height*100)])})),camera:result.camera}));
if(result.errors.length||result.rows.some(r=>r.bounds.outside.length||r.labels.overlaps||r.ui.overlaps.length))process.exitCode=1;
