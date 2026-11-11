// Spool Ram: paired action poses, foot contacts, horn socket and natural x1 playback.
import {chromium} from '../../../../apps/web/node_modules/@playwright/test/index.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createRequire} from 'node:module';
const sharp=createRequire('/Users/bao/tools/cardrpg-look/npm/package.json')('sharp');
const out=resolve(process.env.ART_OUT),before=resolve(process.env.ART_BEFORE),after=resolve(process.env.ART_ARTIFACT);
await mkdir(out,{recursive:true});
const result={method:'Fixed-time paired action poses at both sizes; then natural x1 basic/signature casts with reduced motion. Foot drift is relative to the moving actor, not the stage.',errors:[],stills:[],playback:[]},tiles=[];
const browser=await chromium.launch({channel:'chromium',args:['--use-angle=metal']});
try{
 for(const [version,artifact] of [['before',before],['after',after]]){
  const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});page.on('pageerror',e=>result.errors.push(String(e)));
  await page.goto('file://'+artifact+'?dev=1&a6=1');await page.waitForFunction(()=>window.__depthReview,null,{timeout:120000});
  await page.evaluate(()=>{const m=window.__depthReview;m.watchNow();m.paused=true;m.camera='wide';m.notify(false)});
  await page.waitForFunction(()=>window.__depthScene?.ready,null,{timeout:120000});
  for(const [viewportIndex,[width,height]] of [[1440,900],[1280,720]].entries()){
   await page.setViewportSize({width,height});
   await page.evaluate(()=>{const m=window.__depthReview;m.inspect('enemy:spool-ram:basic',0);m.galleryBattle.initial.gameplayA6=true;m.notify(false);});
   await page.waitForFunction(({width,height})=>{const m=window.__depthReview,s=window.__depthScene;return s?.ready&&m.sceneReady&&s.width===width&&s.height===height-230&&s.puppets.get(m.plan.actorId)?.asset==='spool-ram';},{width,height});
   for(const [i,t] of [.18,.38,.52,.88].entries()){
    const state=await page.evaluate(t=>{
     const m=window.__depthReview,s=window.__depthScene;m.animationAt=m.plan.duration*t;m.notify(false);
     const v={...s.view(),fixedTime:11,paused:true};s.render(v,0);s.render(v,0);s.dirty=false;
     const actor=s.puppets.get(m.plan.actorId),model=actor.model,rig=model.children[0],data=model.userData.paintedRig,footDrifts=[];
     for(const part of ['armL','armR','footL','footR']){
      const layer=rig.getObjectByName('puppet_'+part),spec=data.layers.find(l=>l.part===part),[px,py]=spec.pivot,[x,y,w,h]=spec.rect,width=data.height*data.aspect;
      const contact=[(x+w/2-px)*width,(py-y-h)*data.height];
      const actual=layer.localToWorld(s.effectProp.clone().set(...contact,0));
      const target=model.localToWorld(s.effectProp.clone().set((x+w/2-.5)*width,(1-y-h)*data.height+rig.userData.restY,spec.depth));
      footDrifts.push({part,error:actual.distanceTo(target)});
     }
     const socket=model.getObjectByName(actor.role+'_socket_mainHand'),origin=socket.getWorldPosition(s.effectProp.clone());
     return{angles:rig.children.filter(n=>n.name.startsWith('puppet_')).map(n=>[n.name,n.rotation.z]),footDrifts,socketError:s.cardEffects.propOrigin?.distanceTo(origin),faceHp:s.labelAudit.overlaps,bounds:s.audit(),a6Hud:document.querySelectorAll('.a6-hud-portrait').length};
    },t);
    result.stills.push({version,t,width,height,...state});
    const screenshot=await page.screenshot();
    // Full-size comparisons stay local; compact contact sheet enters Git.
    await sharp(screenshot).webp({quality:84}).toFile(out+'/'+version+'-'+width+'-'+Math.round(t*100)+'.webp');
    const row=(version==='before'?0:2)+viewportIndex,top=row*300;
    tiles.push({input:await sharp(screenshot).resize(440,275,{fit:'contain',background:'#173039'}).toBuffer(),left:i*440,top:top+25});
    tiles.push({input:Buffer.from(`<svg width="440" height="25"><text x="10" y="18" fill="#fff0d2" font-size="14">${version} · ${width} · ram ${Math.round(t*100)}%</text></svg>`),left:i*440,top});
   }
  }
  await page.setViewportSize({width:1440,height:900});
  for(const id of ['enemy:spool-ram:basic','enemy:spool-ram'])for(const reduced of [false,true]){
   const row=await page.evaluate(({id,reduced})=>new Promise(resolve=>{
    const m=window.__depthReview,s=window.__depthScene;m.state.settings.speed=1;m.gallerySpeed=1;m.state.settings.reducedMotion=reduced;m.inspect(id,0,true);m.galleryBattle.initial.gameplayA6=true;m.notify(false);
    const start=performance.now(),frames=[],samples=[];let previous=start,faceHp=0;
    const sample=now=>{
     if(!m.plan){const a=frames.slice(1).sort((x,y)=>x-y);resolve({id,reduced,seconds:(now-start)/1000,frames:frames.length,p95:a[Math.floor(a.length*.95)],samples,faceHp});return;}
     frames.push(now-previous);previous=now;const actor=s.puppets.get(m.plan.actorId),rig=actor.model.children[0];
     samples.push({progress:m.animationAt/m.plan.duration,prop:rig.getObjectByName('puppet_armR').rotation.z,tail:rig.getObjectByName('puppet_tail').rotation.z,head:rig.getObjectByName('puppet_head').rotation.z});
     faceHp=Math.max(faceHp,s.labelAudit.overlaps);requestAnimationFrame(sample);
    };requestAnimationFrame(sample);
   }),{id,reduced});result.playback.push({version,...row});
  }
  await page.close();
 }
 await sharp({create:{width:1760,height:1200,channels:3,background:'#173039'}}).composite(tiles).webp({quality:85}).toFile(out+'/spool-ram-follow-through.webp');
}finally{await browser.close();await writeFile(out+'/motion-review.json',JSON.stringify(result,null,2)+'\n');}
const failures=result.stills.filter(r=>r.faceHp||r.bounds.outside.length||r.a6Hud!==3||r.socketError===undefined||r.socketError>.001||r.version==='after'&&r.footDrifts.some(f=>f.error>1e-5)).map(r=>r.version+'-'+r.width+'-'+r.t);
for(const r of result.playback)if(r.faceHp||r.reduced&&r.samples.some(s=>Math.max(Math.abs(s.prop),Math.abs(s.tail),Math.abs(s.head))>1e-8))failures.push(r.version+'-'+r.id+'-'+r.reduced);
console.log(JSON.stringify({stills:result.stills.length,casts:result.playback.length,errors:result.errors,failures,p95:Math.max(...result.playback.map(r=>r.p95))}));if(result.errors.length||failures.length)process.exitCode=1;
