// Six real L4 cancellations across effect decoding, pool allocation and GPU warmup.
import { chromium } from '../../apps/web/node_modules/@playwright/test/index.mjs';
import { readFile, writeFile, mkdir, mkdtemp, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { withTimingLock } from './lock.mjs';
const out=process.env.LOOK_OUT||'reports/cardrpg-look/validation/l4/cancellation';await mkdir(out,{recursive:true});
const bytes=await readFile(process.env.BIG_ARTIFACT||'docs/cardrpg-look/index.html'),tmp=await mkdtemp('/tmp/cardrpg-look-cancel-');await writeFile(`${tmp}/index.html`,bytes);
const receipt={sha256:createHash('sha256').update(bytes).digest('hex'),method:'Independent real TurnScene instances; cancel at six loading boundaries, wait for asynchronous cleanup, count owned resource dispose events. Not a heap/lifecycle or timing acceptance.',rows:[]};
try{await withTimingLock('LOOK L4 six effect loading cancellations',async()=>{
 const browser=await chromium.launch({channel:'chromium',args:['--use-angle=metal']});const errors=[];
 try{
  const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});
  page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await page.goto(`file://${tmp}/index.html`);await page.getByRole('button',{name:'Review studio',exact:true}).click();
  await page.waitForFunction(()=>window.__depthScene?.ready,null,{timeout:120000});
  for(const [look,boundary] of [[true,'effects'],[true,'atlas'],[true,'pool'],[true,'warm'],[true,'ready'],[false,'effects']]){
   const row=await page.evaluate(async({look,boundary})=>{
    const source=window.__depthScene,original=window.__LOOK_V2__,host=document.createElement('div');
    host.style.cssText='position:fixed;left:-2000px;top:0;width:640px;height:400px';document.body.append(host);
    const failures=[],view={...source.view(),actors:[],warmModelIds:[],autoBattle:true,paused:true,suspended:true};
    window.__LOOK_V2__=look;const s=new source.constructor(host,()=>view,()=>{},()=>{},e=>failures.push(e));
    let rendererDisposed=0,contextLost=0;
    const dispose=s.renderer.dispose.bind(s.renderer),lose=s.renderer.forceContextLoss.bind(s.renderer);
    s.renderer.dispose=()=>{rendererDisposed++;dispose()};s.renderer.forceContextLoss=()=>{contextLost++;lose()};
    const uploadedAtlases=()=>[...s.cardEffects?.look?.textures.values()??[]].filter(t=>s.renderer.properties.get(t).__webglTexture).length;
    const reached=()=>boundary==='effects'?!!s.cardEffects:boundary==='atlas'?(s.cardEffects?.look?.textures.size??0)>0:boundary==='pool'?(s.cardEffects?.pools.size??0)>0:boundary==='warm'?uploadedAtlases()>0:!!s.ready;
    const start=performance.now();while(!reached()&&performance.now()-start<60000)await new Promise(requestAnimationFrame);
    const atBoundary=reached(),boundaryState={ready:s.ready,atlases:s.cardEffects?.look?.textures.size??0,pools:s.cardEffects?.pools.size??0,uploadedAtlases:uploadedAtlases()},resources=new Set([...s.geometryOwned,...s.materialOwned,...s.stageTextures]);
    for(const r of [s.glow,s.contactTexture,s.blobMaterial,s.lookEnvironment])if(r)resources.add(r);
    const collect=object=>{if(!object)return;for(const r of Object.values(object))if(r?.isWebGLRenderTarget||r?.isTexture||r?.isMaterial)resources.add(r)};
    collect(s.post);collect(s.post?.smaa);for(const r of s.post?.luts??[])resources.add(r);
    collect(s.cardEffects);for(const r of s.cardEffects?.look?.textures.values()??[])resources.add(r);for(const r of s.cardEffects?.look?.materials.values()??[])resources.add(r);
    s.spells?.root.traverse(o=>{if(o.geometry)resources.add(o.geometry);for(const r of Array.isArray(o.material)?o.material:o.material?[o.material]:[])resources.add(r)});
    for(const r of s.spells?.shapes.values()??[])resources.add(r);
    for(const pool of s.cardEffects?.pools.values()??[]){resources.add(pool.mesh.geometry);resources.add(pool.mesh.material);}
    // THREE.Sprite.geometry is a module-wide shared quad, not a scene-owned allocation.
    s.stage.traverse(o=>{if(o.geometry&&!o.isSprite)resources.add(o.geometry);if(o.material)for(const r of Array.isArray(o.material)?o.material:[o.material])resources.add(r)});
    const stageNames=new Map();s.stage.traverse(o=>{if(o.geometry)stageNames.set(o.geometry,o.name||o.type)});
    const counts=new Map([...resources].map(r=>[r,0]));for(const r of resources)r.addEventListener('dispose',()=>counts.set(r,counts.get(r)+1));
    s.dispose();await s.warming;await new Promise(resolve=>setTimeout(resolve,0));
    const unreleased=[...counts].filter(([,n])=>n===0).map(([r])=>({type:r.type??r.constructor.name,name:r.name,uuid:r.uuid,postKeys:Object.entries(s.post??{}).filter(([,v])=>v===r).map(([k])=>k),stageName:stageNames.get(r),sceneKeys:Object.entries(s).filter(([,v])=>v===r).map(([k])=>k),vertices:r.attributes?.position?.count}));
    const result={look,boundary,atBoundary,boundaryState,resources:resources.size,released:[...counts.values()].filter(n=>n===1).length,duplicates:[...counts.values()].filter(n=>n>1).length,unreleased,rendererDisposed,contextLost,canvasRemoved:!s.renderer.domElement.isConnected,effectRootDetached:!s.cardEffects?.root.parent,effectLightsDetached:(s.cardEffects?.look?.lights??[]).every(light=>!light.parent),failures};
    host.remove();window.__LOOK_V2__=original;return result;
   },{look,boundary});
   receipt.rows.push(row);await writeFile(`${out}/checks.json`,JSON.stringify({...receipt,errors},null,2)+'\n');
   assert.equal(row.atBoundary,true);assert.equal(row.rendererDisposed,1);assert.equal(row.contextLost,1);assert.equal(row.canvasRemoved,true);assert.equal(row.released,row.resources);assert.equal(row.duplicates,0);assert.deepEqual(row.failures,[]);assert.equal(row.effectRootDetached,true);assert.equal(row.effectLightsDetached,true);console.log(JSON.stringify(row));
  }assert.deepEqual(errors,[]);
 }finally{await browser.close();await writeFile(`${out}/checks.json`,JSON.stringify({...receipt,errors},null,2)+'\n')}
});}finally{await rm(tmp,{recursive:true})}
