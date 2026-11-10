// Crumb Sentinel: shield brace, gauntlet jab and planted boots; paired views and natural x1 playback.
import {chromium} from '../../../../apps/web/node_modules/@playwright/test/index.mjs';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createRequire} from 'node:module';
const sharp=createRequire('/Users/bao/tools/cardrpg-look/npm/package.json')('sharp');
const out=resolve(process.env.ART_OUT),before=resolve(process.env.ART_BEFORE),after=resolve(process.env.ART_ARTIFACT);
await mkdir(out,{recursive:true});
const result={method:'Fixed-time paired action poses at both sizes; then natural x1 basic/signature casts with reduced motion. The complete original shield braces while the gauntlet jabs; chest and tabard stay rigid, with a quiet lid/face and planted boots. Six source layers repaired; no new art.',errors:[],stills:[],playback:[]},tiles=[];
async function addTile(screenshot,state){
 const {version,width,height,t}=state,viewportIndex=width===1440?0:1,i=[.18,.46,.52,.88].indexOf(t);
 const row=(version==='before'?0:2)+viewportIndex,top=row*330;
 const box=state.bounds.units.find(u=>u.id===state.actorId).box;
 const left=Math.max(0,Math.floor(box.x+state.canvas.x-16)),clipTop=Math.max(0,Math.floor(box.y+state.canvas.y-16));
 const crop={left,top:clipTop,width:Math.min(width-left,Math.ceil(box.width+32)),height:Math.min(height-clipTop,Math.ceil(box.height+32))};
 tiles.push({input:await sharp(screenshot).extract(crop).resize(280,305,{fit:'contain',background:'#173039'}).toBuffer(),left:i*280,top:top+25});
 tiles.push({input:Buffer.from(`<svg width="280" height="25"><text x="10" y="18" fill="#fff0d2" font-size="14">${version} · ${width} · Crumb Sentinel ${Math.round(t*100)}%</text></svg>`),left:i*280,top});
}
const reuse=process.env.ART_REUSE_BEFORE;
if(reuse){
 const saved=JSON.parse(await readFile(resolve(reuse,'motion-review.json'),'utf8'));
 result.stills.push(...saved.stills.filter(r=>r.version==='before'));result.playback.push(...saved.playback.filter(r=>r.version==='before'));result.reusedBefore=resolve(reuse);
 for(const state of result.stills)await addTile(resolve(reuse,'before-'+state.width+'-'+Math.round(state.t*100)+'.webp'),state);
}
const browser=await chromium.launch({channel:'chromium',args:['--use-angle=metal']});
try{
 for(const [version,artifact] of [['before',before],['after',after]].filter(([version])=>!reuse||version!=='before')){
  const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});page.on('pageerror',e=>result.errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')result.errors.push(m.text());});
  await page.goto('file://'+artifact+'?dev=1&a6=1');await page.waitForFunction(()=>window.__depthReview,null,{timeout:120000});
  await page.evaluate(()=>{const m=window.__depthReview;m.watchNow();m.paused=true;m.camera='wide';m.notify(false)});
  await page.waitForFunction(()=>window.__depthScene?.ready,null,{timeout:120000});
  for(const [viewportIndex,[width,height]] of [[1440,900],[1280,720]].entries()){
   await page.setViewportSize({width,height});
   await page.evaluate(()=>{const m=window.__depthReview;m.inspect('enemy:crumb-sentinel:basic',0);m.galleryBattle.initial.gameplayA6=true;m.notify(false);});
   await page.waitForFunction(({width,height})=>{const m=window.__depthReview,s=window.__depthScene;return s?.ready&&m.sceneReady&&s.width===width&&s.height===height-230&&s.puppets.get(m.plan.actorId)?.asset==='crumb-sentinel';},{width,height});
   for(const [i,t] of [.18,.46,.52,.88].entries()){
    const state=await page.evaluate(t=>{
     const m=window.__depthReview,s=window.__depthScene;m.animationAt=m.plan.duration*t;m.notify(false);
     const v={...s.view(),fixedTime:11,paused:true};s.render(v,0);s.render(v,0);s.dirty=false;
     const actor=s.puppets.get(m.plan.actorId),model=actor.model,rig=model.children[0];
     const footDrift=Math.max(...['footL','footR'].map(part=>{const layer=rig.getObjectByName('puppet_'+part),point=s.effectProp.clone().set(...layer.userData.puppetContact,0),expected=point.clone().add(point.clone().fromArray(layer.userData.puppetRest));return point.clone().applyMatrix4(layer.matrix).multiply(rig.scale).applyEuler(rig.rotation).distanceTo(expected);}));
     const socket=model.getObjectByName(actor.role+'_socket_mainHand'),origin=socket.getWorldPosition(s.effectProp.clone());
     const socketTravel=socket.position.clone().applyEuler(socket.parent.rotation).sub(socket.position).toArray();
     const shield=model.getObjectByName(actor.role+'_socket_offHand'),palmTravel=shield.position.clone().applyEuler(shield.parent.rotation).sub(shield.position).toArray();return{palmTravel,offhandParent:shield.parent.name,socketTravel,footDrift,scale:rig.scale.toArray(),angles:rig.children.filter(n=>n.name.startsWith('puppet_')).map(n=>[n.name,n.rotation.z]),actorId:m.plan.actorId,canvas:s.renderer.domElement.getBoundingClientRect().toJSON(),socketError:s.cardEffects.propOrigin?.distanceTo(origin),faceHp:s.labelAudit.overlaps,bounds:s.audit(),a6Hud:document.querySelectorAll('.a6-hud-portrait').length};
    },t);
    result.stills.push({version,t,width,height,...state});
    const screenshot=await page.screenshot();
    // Full-size comparisons stay local; compact contact sheet enters Git.
    await sharp(screenshot).webp({quality:84}).toFile(out+'/'+version+'-'+width+'-'+Math.round(t*100)+'.webp');
    await addTile(screenshot,{...state,version,width,height,t});
   }
  }
  await page.setViewportSize({width:1440,height:900});
  for(const id of ['enemy:crumb-sentinel:basic','enemy:crumb-sentinel'])for(const reduced of [false,true]){
   const row=await page.evaluate(({id,reduced})=>new Promise(resolve=>{
    const m=window.__depthReview,s=window.__depthScene;m.state.settings.speed=1;m.gallerySpeed=1;m.state.settings.reducedMotion=reduced;m.inspect(id,0,true);m.galleryBattle.initial.gameplayA6=true;m.notify(false);
    const start=performance.now(),frames=[],samples=[];let previous=start,faceHp=0;
    const sample=now=>{
     if(!m.plan){const a=frames.slice(1).sort((x,y)=>x-y);resolve({id,reduced,seconds:(now-start)/1000,frames:frames.length,p95:a[Math.floor(a.length*.95)],samples,faceHp});return;}
     frames.push(now-previous);previous=now;const actor=s.puppets.get(m.plan.actorId),rig=actor.model.children[0];
     const footDrift=Math.max(...['footL','footR'].map(part=>{const layer=rig.getObjectByName('puppet_'+part),point=s.effectProp.clone().set(...layer.userData.puppetContact,0),expected=point.clone().add(point.clone().fromArray(layer.userData.puppetRest));return point.clone().applyMatrix4(layer.matrix).multiply(rig.scale).applyEuler(rig.rotation).distanceTo(expected);}));
     samples.push({footDrift,scale:rig.scale.toArray(),offhand:rig.getObjectByName('puppet_armL').rotation.z,progress:m.animationAt/m.plan.duration,prop:rig.getObjectByName('puppet_armR').rotation.z,head:rig.getObjectByName('puppet_head').rotation.z,lean:rig.rotation.z});
     faceHp=Math.max(faceHp,s.labelAudit.overlaps);requestAnimationFrame(sample);
    };requestAnimationFrame(sample);
   }),{id,reduced});result.playback.push({version,...row});
  }
  await page.close();
 }
 await sharp({create:{width:1120,height:1320,channels:3,background:'#173039'}}).composite(tiles).webp({quality:85}).toFile(out+'/crumb-sentinel-shield-brace.webp');
}finally{await browser.close();await writeFile(out+'/motion-review.json',JSON.stringify(result,null,2)+'\n');}
const failures=result.stills.filter(r=>r.faceHp||r.bounds.outside.length||r.a6Hud!==3||r.socketError===undefined||r.socketError>.001||r.version==='after'&&(r.footDrift>1e-8||r.t===.52&&(r.socketTravel[0]>-.04||r.palmTravel[0]>-.04))).map(r=>r.version+'-'+r.width+'-'+r.t);
for(const r of result.playback)if(r.faceHp||r.reduced&&r.samples.some(s=>Math.max(Math.abs(s.prop),Math.abs(s.head),Math.abs(s.offhand),Math.abs(s.lean))>1e-8))failures.push(r.version+'-'+r.id+'-'+r.reduced);
for(const r of result.playback)if(r.version==='after'&&!r.reduced&&r.samples.some(s=>s.footDrift>1e-8||Math.abs(s.head)>.02||Math.abs(s.lean)>.01))failures.push(r.id+'-foot-or-face-drift');
console.log(JSON.stringify({stills:result.stills.length,casts:result.playback.length,errors:result.errors,failures,p95:Math.max(...result.playback.map(r=>r.p95))}));if(result.errors.length||failures.length)process.exitCode=1;
