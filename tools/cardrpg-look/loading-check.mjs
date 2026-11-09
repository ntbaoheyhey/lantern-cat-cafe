// Six real renderer cancellations, including construction, post, stage and decoration.
import { chromium } from '../../apps/web/node_modules/@playwright/test/index.mjs';
import { readFile, writeFile, mkdir, mkdtemp, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { withTimingLock } from './lock.mjs';
const out=process.env.LOOK_OUT||'reports/cardrpg-look/validation/l3/cancellation';await mkdir(out,{recursive:true});
const bytes=await readFile('docs/cardrpg-look/index.html'),tmp=await mkdtemp('/tmp/cardrpg-look-cancel-');await writeFile(`${tmp}/index.html`,bytes);
const receipt={sha256:createHash('sha256').update(bytes).digest('hex'),method:'Independent real TurnScene instances; cancel at six loading boundaries, wait for asynchronous cleanup, count owned resource dispose events. Not a heap/lifecycle or timing acceptance.',rows:[]};
try{await withTimingLock('LOOK L3 six loading cancellations',async()=>{
 const browser=await chromium.launch({channel:'chromium',args:['--use-angle=metal']});const errors=[];
 try{
  const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});
  page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await page.goto(`file://${tmp}/index.html`);await page.getByRole('button',{name:'Review studio',exact:true}).click();
  await page.waitForFunction(()=>window.__depthScene?.ready,null,{timeout:120000});
  for(const [look,boundary] of [[true,'immediate'],[true,'post'],[true,'stage'],[false,'immediate'],[false,'stage'],[false,'decorating']]){
   const row=await page.evaluate(async({look,boundary})=>{
    const source=window.__depthScene,original=window.__LOOK_V2__,host=document.createElement('div');
    host.style.cssText='position:fixed;left:-2000px;top:0;width:640px;height:400px';document.body.append(host);
    const failures=[],view={...source.view(),actors:[],warmModelIds:[],paused:true,suspended:true};
    window.__LOOK_V2__=look;const s=new source.constructor(host,()=>view,()=>{},()=>{},e=>failures.push(e));
    let rendererDisposed=0,contextLost=0;
    const dispose=s.renderer.dispose.bind(s.renderer),lose=s.renderer.forceContextLoss.bind(s.renderer);
    s.renderer.dispose=()=>{rendererDisposed++;dispose()};s.renderer.forceContextLoss=()=>{contextLost++;lose()};
    const reached=()=>boundary==='immediate'||(boundary==='post'?!!s.post:boundary==='stage'?s.stage.children.length>0:!!s.stage.getObjectByName('chapter-1-scenery'));
    const start=performance.now();while(!reached()&&performance.now()-start<60000)await new Promise(requestAnimationFrame);
    const atBoundary=reached(),resources=new Set([...s.geometryOwned,...s.materialOwned,...s.stageTextures]);
    for(const r of [s.glow,s.contactTexture,s.blobMaterial,s.lookEnvironment])if(r)resources.add(r);
    const collect=object=>{if(!object)return;for(const r of Object.values(object))if(r?.isWebGLRenderTarget||r?.isTexture||r?.isMaterial)resources.add(r)};
    collect(s.post);collect(s.post?.smaa);for(const r of s.post?.luts??[])resources.add(r);
    // THREE.Sprite.geometry is a module-wide shared quad, not a scene-owned allocation.
    s.stage.traverse(o=>{if(o.geometry&&!o.isSprite)resources.add(o.geometry);if(o.material)for(const r of Array.isArray(o.material)?o.material:[o.material])resources.add(r)});
    const stageNames=new Map();s.stage.traverse(o=>{if(o.geometry)stageNames.set(o.geometry,o.name||o.type)});
    const counts=new Map([...resources].map(r=>[r,0]));for(const r of resources)r.addEventListener('dispose',()=>counts.set(r,counts.get(r)+1));
    s.dispose();await s.warming;await new Promise(resolve=>setTimeout(resolve,0));
    const unreleased=[...counts].filter(([,n])=>n===0).map(([r])=>({type:r.type??r.constructor.name,name:r.name,uuid:r.uuid,postKeys:Object.entries(s.post??{}).filter(([,v])=>v===r).map(([k])=>k),stageName:stageNames.get(r),sceneKeys:Object.entries(s).filter(([,v])=>v===r).map(([k])=>k),vertices:r.attributes?.position?.count}));
    const result={look,boundary,atBoundary,resources:resources.size,released:[...counts.values()].filter(n=>n>0).length,unreleased,rendererDisposed,contextLost,canvasRemoved:!s.renderer.domElement.isConnected,failures};
    host.remove();window.__LOOK_V2__=original;return result;
   },{look,boundary});
   receipt.rows.push(row);await writeFile(`${out}/checks.json`,JSON.stringify({...receipt,errors},null,2)+'\n');
   assert.equal(row.atBoundary,true);assert.equal(row.rendererDisposed,1);assert.equal(row.contextLost,1);assert.equal(row.canvasRemoved,true);assert.equal(row.released,row.resources);assert.deepEqual(row.failures,[]);console.log(JSON.stringify(row));
  }assert.deepEqual(errors,[]);
 }finally{await browser.close();await writeFile(`${out}/checks.json`,JSON.stringify({...receipt,errors},null,2)+'\n')}
});}finally{await rm(tmp,{recursive:true})}
