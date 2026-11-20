// Component ablations share one immutable geometry/frame. Capture work is not timing evidence.
import { chromium } from '../../apps/web/node_modules/@playwright/test/index.mjs';
import { readFile, writeFile, mkdir, mkdtemp, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { withTimingLock } from './lock.mjs';
const out=process.env.LOOK_OUT||'reports/cardrpg-look/validation/l3/post';
await mkdir(out,{recursive:true});
const bytes=await readFile('docs/cardrpg-look/index.html'),tmp=await mkdtemp('/tmp/cardrpg-look-post-');
await writeFile(`${tmp}/index.html`,bytes);
const receipt={sha256:createHash('sha256').update(bytes).digest('hex'),method:'Fixed gallery scene at3.2s, component ablation, projected inner-face ellipses reuse F4 mask definition. Rendering/captures are not timing measurements.',rows:[]};
try{for(const quality of ['high','medium','low'])await withTimingLock(`LOOK L3 post ${quality}`,async()=>{
 const browser=await chromium.launch({channel:'chromium',args:['--use-angle=metal']});const errors=[];
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:2});
  page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await page.goto(`file://${tmp}/index.html`);
  await page.getByRole('button',{name:'Review studio',exact:true}).click();
  await page.waitForFunction(()=>window.__depthScene?.ready||window.__b2Gallery?.sceneError,null,{timeout:120000});
  assert.equal(await page.evaluate(()=>window.__b2Gallery.sceneError),'');
  await page.evaluate(quality=>{const m=window.__b2Gallery;m.camera='wide';m.state.settings.quality=quality;m.inspect('soot-4',.46);},quality);
  await page.waitForFunction(()=>{const s=window.__depthScene,m=window.__b2Gallery;return m.battle.actors.every(a=>s.puppets.get(a.id)?.asset===a.catalogId)});
  const row=await page.evaluate(quality=>{
   const s=window.__depthScene;s.post.setQuality(quality);
   const v={...s.view(),fixedTime:3.2,paused:true,quality,autoQuality:false};
   s.render(v,0);s.dirty=false;
   const u=s.post.final.uniforms;
   const memory=()=>({textures:s.renderer.info.memory.textures,geometries:s.renderer.info.memory.geometries,programs:s.renderer.info.programs.length});
   const initial=memory(),images={};
   const capture=()=>{s.renderer.info.reset();s.post.render(s.scene,s.camera,(v.frame?.shake??0)*.35,v.frame?.progress??0,v.frame?.color??'#ffe6d2',false);return s.renderer.domElement.toDataURL('image/png')};
   images.full=capture();
   for(const component of ['bloom','focus','occlusion']){const saved=u[component].value;u[component].value=0;images[component+'Off']=capture();u[component].value=saved;}
   for(const q of ['low','medium','high',quality]){s.post.setQuality(q);capture();}
   const final=memory();capture();
   return {quality,images,initial,final,masks:u.protectedFaces.value.slice(0,u.protectedCount.value).map(v=>v.toArray()),stats:{calls:s.renderer.info.render.calls,triangles:s.renderer.info.render.triangles},width:s.renderer.domElement.width,height:s.renderer.domElement.height};
  },quality);
  for(const [key,data] of Object.entries(row.images)){const file=`${quality}-${key}.png`;await writeFile(`${out}/${file}`,Buffer.from(data.split(',')[1],'base64'));row.images[key]=file;}
  await page.screenshot({path:`${out}/${quality}-hud.png`});
  assert.deepEqual(row.final,row.initial,'Quality switch allocated a GPU resource/program after warmup');
  assert.ok(row.stats.calls<=250);assert.ok(row.stats.triangles<=150000);assert.ok(row.masks.length>=3);assert.deepEqual(errors,[]);
  receipt.rows.push({...row,errors});await writeFile(`${out}/checks.json`,JSON.stringify(receipt,null,2)+'\n');
  console.log(JSON.stringify({quality,initial:row.initial,final:row.final,faces:row.masks.length,errors}));
 }finally{await browser.close()}
});}finally{await rm(tmp,{recursive:true});await writeFile(`${out}/checks.json`,JSON.stringify(receipt,null,2)+'\n')}
