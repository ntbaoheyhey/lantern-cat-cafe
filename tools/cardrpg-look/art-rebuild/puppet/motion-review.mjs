// Soot authored follow-through: controlled stills plus natural x1 cast sampling.
import {chromium} from '../../../../apps/web/node_modules/@playwright/test/index.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createRequire} from 'node:module';
const sharp=createRequire('/Users/bao/tools/cardrpg-look/npm/package.json')('sharp');
const out=resolve(process.env.ART_OUT),before=resolve(process.env.ART_BEFORE),after=resolve(process.env.ART_ARTIFACT);
await mkdir(out,{recursive:true});const result={errors:[],stills:[],playback:[]},tiles=[];
const browser=await chromium.launch({channel:'chromium',args:['--use-angle=metal']});
try{
 for(const [version,artifact] of [['before',before],['after',after]]){
  const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});page.on('pageerror',e=>result.errors.push(String(e)));
  await page.goto('file://'+artifact+'?dev=1&a6=1');await page.waitForFunction(()=>window.__depthReview,null,{timeout:120000});
  await page.evaluate(()=>{const m=window.__depthReview;m.watchNow();m.paused=true;m.camera='wide';m.notify(false)});
  await page.waitForFunction(()=>window.__depthScene?.ready,null,{timeout:120000});
  await page.evaluate(()=>{const m=window.__depthReview;m.inspect('soot-2',0);m.galleryBattle.initial.gameplayA6=true;m.notify(false);});
  await page.waitForFunction(()=>window.__depthScene?.ready&&window.__depthReview.sceneReady);
  for(const [i,t] of [.18,.38,.60,.88].entries()){
   const state=await page.evaluate(t=>{const m=window.__depthReview,s=window.__depthScene;m.animationAt=m.plan.duration*t;m.notify(false);const v={...s.view(),fixedTime:11,paused:true};s.render(v,0);s.render(v,0);s.dirty=false;const actor=s.puppets.get(m.plan.actorId);return{angles:actor.model.children[0].children.filter(n=>n.name.startsWith('puppet_')).map(n=>[n.name,n.rotation.z]),faceHp:s.labelAudit.overlaps,bounds:s.audit(),a6Hud:document.querySelectorAll('.a6-hud-portrait').length};},t);
   result.stills.push({version,t,...state});
   tiles.push({input:await sharp(await page.screenshot()).resize(720,450).toBuffer(),left:i*720,top:version==='before'?30:510});
   tiles.push({input:Buffer.from(`<svg width="720" height="30"><text x="12" y="22" fill="#fff0d2" font-size="17">${version} · Soot cast ${Math.round(t*100)}%</text></svg>`),left:i*720,top:version==='before'?0:480});
  }
  for(const id of ['soot-1','soot-2','soot-4'])for(const reduced of [false,true]){
   const row=await page.evaluate(({id,reduced})=>new Promise(resolve=>{
    const m=window.__depthReview,s=window.__depthScene;m.state.settings.speed=1;m.gallerySpeed=1;m.state.settings.reducedMotion=reduced;m.inspect(id,0,true);m.galleryBattle.initial.gameplayA6=true;m.notify(false);
    const start=performance.now(),frames=[],samples=[];let previous=start,faceHp=0;
    const sample=now=>{if(!m.plan){const a=frames.slice(1).sort((x,y)=>x-y);resolve({id,reduced,seconds:(now-start)/1000,frames:frames.length,p95:a[Math.floor(a.length*.95)],samples,faceHp});return;}
     frames.push(now-previous);previous=now;const actor=s.puppets.get(m.plan.actorId),rig=actor.model.children[0];
     samples.push({progress:m.animationAt/m.plan.duration,prop:rig.getObjectByName('puppet_armR').rotation.z,tail:rig.getObjectByName('puppet_tail').rotation.z,head:rig.getObjectByName('puppet_head').rotation.z});faceHp=Math.max(faceHp,s.labelAudit.overlaps);requestAnimationFrame(sample);
    };requestAnimationFrame(sample);
   }),{id,reduced});result.playback.push({version,...row});
  }
  await page.close();
 }
 await sharp({create:{width:2880,height:960,channels:3,background:'#173039'}}).composite(tiles).webp({quality:87}).toFile(out+'/soot-follow-through.webp');
}finally{await browser.close();await writeFile(out+'/motion-review.json',JSON.stringify(result,null,2)+'\n');}
const failures=result.stills.filter(r=>r.faceHp||r.bounds.outside.length||r.a6Hud!==3).map(r=>r.version+'-'+r.t);
for(const r of result.playback){if(r.faceHp||r.reduced&&r.samples.some(s=>Math.max(Math.abs(s.prop),Math.abs(s.tail),Math.abs(s.head))>1e-8))failures.push(r.version+'-'+r.id+'-'+r.reduced);}
console.log(JSON.stringify({stills:result.stills.length,casts:result.playback.length,errors:result.errors,failures,p95:Math.max(...result.playback.map(r=>r.p95))}));if(result.errors.length||failures.length)process.exitCode=1;
