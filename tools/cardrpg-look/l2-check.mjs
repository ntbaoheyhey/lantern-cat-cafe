// Touched groups only: real battle HUD/cameras and stage lifetime. No timings.
import { chromium } from '../../apps/web/node_modules/@playwright/test/index.mjs';
import { readFile, writeFile, mkdir, mkdtemp, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { withTimingLock } from './lock.mjs';
const out = process.env.LOOK_OUT || 'reports/cardrpg-look/validation/l2/functional';
await mkdir(out,{recursive:true});
const bytes=await readFile('docs/cardrpg-look/index.html'),tmp=await mkdtemp('/tmp/cardrpg-look-l2-');
await writeFile(`${tmp}/index.html`,bytes);
const receipt={sha256:createHash('sha256').update(bytes).digest('hex'),method:'Real battle entry and camera selects; fixed idle at3.2s for framing. Actual disposed resources counted when leaving the table. No frame timing from screenshots.',rows:[]};
try{for(const [width,height] of [[1024,600],[1280,720],[1440,900]])await withTimingLock(`LOOK L2 battle ${width}`,async()=>{
 const browser=await chromium.launch({channel:'chromium',args:['--use-angle=metal']});
 const errors=[],requests=[];
 try{
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:2});
  page.on('pageerror',error=>errors.push(String(error)));
  page.on('request',request=>{if(/^https?:/.test(request.url()))requests.push(request.url())});
  await page.goto(`file://${tmp}/index.html`);
  await page.getByRole('button',{name:'Watch a battle now',exact:true}).click();
  await page.getByRole('button',{name:'Pause',exact:true}).click();
  await page.waitForFunction(()=>window.__depthScene?.ready,null,{timeout:120000});
  const frames=[];
  for(const preset of ['close','wide','far']){
   await page.getByLabel('Camera preset',{exact:true}).selectOption(preset);
   const detail=await page.evaluate(()=>{
    const s=window.__depthScene,v={...s.view(),frame:null,fixedTime:3.2,paused:true};s.render(v,0);s.dirty=false;
    const c=s.renderer.domElement.getBoundingClientRect(),actors=[];
    for(const p of s.puppets.values()){
     let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
     p.model.updateMatrixWorld(true);p.model.traverse(o=>{if(!o.isMesh||!o.visible)return;o.geometry.computeBoundingBox();const b=o.geometry.boundingBox;
      for(const x of [b.min.x,b.max.x])for(const y of [b.min.y,b.max.y])for(const z of [b.min.z,b.max.z]){
       const v=s.camera.position.clone().set(x,y,z).applyMatrix4(o.matrixWorld).project(s.camera);
       minX=Math.min(minX,v.x);maxX=Math.max(maxX,v.x);minY=Math.min(minY,v.y);maxY=Math.max(maxY,v.y);
      }
     });actors.push({id:p.asset,bounds:[minX,minY,maxX,maxY],contactY:p.shadow.getWorldPosition(s.camera.position.clone()).y});
    }
    const sample=(time,reduced)=>{s.stage.userData.animateLook(time,reduced);return s.stage.children.filter(o=>o.isPoints).map(o=>o.material.uniforms.time.value).concat(s.stage.children.filter(o=>o.isPointLight).map(o=>o.intensity))};
    const calm0=sample(1,true),calm1=sample(9,true),moving=sample(9,false);sample(3.2,false);
    const token=getComputedStyle(document.documentElement).getPropertyValue('--look-panel').trim();
    const background=getComputedStyle(document.querySelector('.dp-battle-top')).backgroundColor;
    return {stage:s.stage.name,atelier:s.stage.userData.lookV2,fov:s.camera.fov,actors,calm0,calm1,moving,background,token,canvas:{x:c.x,y:c.y,width:c.width,height:c.height},overflow:document.documentElement.scrollWidth>innerWidth+1,stats:{...s.stats}};
   });
   const file=`${width}x${height}-${preset}.png`;await page.screenshot({path:`${out}/${file}`});
   frames.push({preset,file,...detail});
   assert.equal(detail.atelier,true);assert.equal(detail.overflow,false);
   assert.deepEqual(detail.calm0,detail.calm1);assert.notDeepEqual(detail.calm0,detail.moving);
   assert.equal(detail.background,'rgb(35, 62, 70)');
   assert.ok(detail.stats.calls<=250);assert.ok(detail.stats.triangles<=150000);
   for(const actor of detail.actors){assert.ok(Math.abs(actor.contactY-.044)<1e-6);assert.ok(actor.bounds.every(v=>Number.isFinite(v)&&Math.abs(v)<.98),`${width}/${preset}/${actor.id} clipped: ${actor.bounds}`)}
  }
  assert.ok(frames[0].fov<frames[1].fov&&frames[1].fov<frames[2].fov);
  await page.evaluate(()=>{
   const s=window.__depthScene;window.__lookPreviousScene=s;
   const resources=new Set(s.stage.userData.ownedTextures);
   s.stage.traverse(o=>{if(o.geometry)resources.add(o.geometry);if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material])resources.add(m)});
   window.__lookDisposed={expected:resources.size,actual:0};for(const r of resources)r.addEventListener('dispose',()=>window.__lookDisposed.actual++);
  });
  await page.getByRole('button',{name:'Leave table',exact:true}).click();
  await page.waitForFunction(()=>window.__lookPreviousScene.disposed);
  const disposal=await page.evaluate(()=>({...window.__lookDisposed,oldDisposed:window.__lookPreviousScene.disposed}));
  assert.equal(disposal.actual,disposal.expected);assert.equal(disposal.oldDisposed,true);
  assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);
  receipt.rows.push({width,height,frames,disposal,errors,requests});
  await writeFile(`${out}/checks.json`,JSON.stringify(receipt,null,2)+'\n');
  console.log(JSON.stringify({width,cameras:3,disposal,errors}));
 }finally{await browser.close()}
});}finally{await rm(tmp,{recursive:true});await writeFile(`${out}/checks.json`,JSON.stringify(receipt,null,2)+'\n')}
