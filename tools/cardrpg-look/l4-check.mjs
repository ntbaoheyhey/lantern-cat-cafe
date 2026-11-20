// Phase-specific real GPU ownership, light ablation and quality-switch checks.
import {chromium} from '../../apps/web/node_modules/@playwright/test/index.mjs';
import {readFile,writeFile,mkdir,mkdtemp,rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {withTimingLock} from './lock.mjs';
const out=process.env.LOOK_OUT||'reports/cardrpg-look/validation/l4/effects';
await mkdir(out,{recursive:true});
const bytes=await readFile(process.env.BIG_ARTIFACT||'docs/cardrpg-look/index.html');
const tmp=await mkdtemp('/tmp/cardrpg-look-l4-check-');await writeFile(`${tmp}/index.html`,bytes);
const result={sha256:createHash('sha256').update(bytes).digest('hex'),
 method:'One battle, six target/tier actions. Same decoded pixels for active vs light-disabled floor ablation; fixed-root ownership, GPU counts after loading and teardown. Not cast timing or final20-battle lifecycle.',rows:[],errors:[]};
try{await withTimingLock('LOOK L4 six VFX tier/resource actions',async()=>{
 const browser=await chromium.launch({channel:'chromium',args:['--use-angle=metal']});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});
  page.on('pageerror',e=>result.errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')result.errors.push(m.text())});
  await page.goto(`file://${tmp}/index.html`);await page.getByRole('button',{name:'Watch a battle now',exact:true}).click();
  await page.getByRole('button',{name:'Pause',exact:true}).click();
  await page.waitForFunction(()=>window.__depthScene?.ready,null,{timeout:120000});
  for(const [id,quality] of [['mochi-4','high'],['soot-3','high'],['clover-4','medium'],['soot-3','low'],['mochi-4','low'],['clover-4','high']]){
   await page.evaluate(id=>window.__depthReview.inspect(id,0),id);
   await page.waitForFunction(()=>window.__depthReview.battle.actors.every(a=>window.__depthScene.puppets.get(a.id)?.asset===a.catalogId));
   const row=await page.evaluate(({id,quality})=>{
    const s=window.__depthScene,m=window.__depthReview,e=s.cardEffects,look=e.look;
    const owner=e.root.parent;let removals=0;const removed=()=>removals++;e.root.addEventListener('removed',removed);
    const programsBefore=new Set(s.renderer.info.programs.map(p=>p.id));
    m.animationAt=m.plan.duration*.76;s.post.setQuality(quality);
    const render=()=>{s.render({...s.view(),quality,frame:m.frame,fixedTime:10});s.dirty=false;};
    render();const inventory=()=>({textures:s.renderer.info.memory.textures,geometries:s.renderer.info.memory.geometries,programs:s.renderer.info.programs.length});
    const initial=inventory();for(let i=0;i<24;i++)render();const final=inventory();
    const rgba=()=>{const gl=s.renderer.getContext(),p=new Uint8Array(s.renderer.domElement.width*s.renderer.domElement.height*4);gl.readPixels(0,0,s.renderer.domElement.width,s.renderer.domElement.height,gl.RGBA,gl.UNSIGNED_BYTE,p);return p;};
    const active=rgba(),powers=look.lights.map(l=>l.intensity);e.setLightsEnabled(false);render();const noLight=rgba();e.setLightsEnabled(true);render();
    const masks=e.protectedFaces.slice(0,e.material.uniforms.protectedCount.value).map(f=>f.toArray());
    const width=s.renderer.domElement.width,height=s.renderer.domElement.height;
    let floorChanged=0,faceAbove8=0,facePixels=0,peakDelta=0;
    for(let y=0;y<height;y++)for(let x=0;x<width;x++){
     const p=(y*width+x)*4,d=Math.max(Math.abs(active[p]-noLight[p]),Math.abs(active[p+1]-noLight[p+1]),Math.abs(active[p+2]-noLight[p+2]));
     peakDelta=Math.max(peakDelta,d);const face=masks.some(([cx,cy,rx,ry])=>((x/width-cx)/rx)**2+((y/height-cy)/ry)**2<.64);
     if(face){facePixels++;if(d>8)faceAbove8++;}else if(d>8)floorChanged++;
    }
    const newPrograms=s.renderer.info.programs.filter(p=>!programsBefore.has(p.id)).map(p=>{
     const objects=[];for(const root of [s.scene,e.root])root.traverse(o=>{for(const material of Array.isArray(o.material)?o.material:o.material?[o.material]:[]){
      if([...s.renderer.properties.get(material).programs?.values()??[]].some(value=>value===p))objects.push({object:o.name||o.type,material:material.name||material.type});
     }});return{id:p.id,name:p.name,objects};
    });
    e.root.removeEventListener('removed',removed);
    return{id,quality,initial,final,powers,floorChanged,faceAbove8,facePixels,peakDelta,
     fixedOwner:e.root.parent===owner&&owner===s.post.effectScene,removals,autoClear:s.renderer.autoClear,newPrograms,stats:{...s.stats}};
   },{id,quality});
   result.rows.push(row);await page.screenshot({path:`${out}/${id}-${quality}.png`});
   assert.deepEqual(row.initial,row.final);assert.equal(row.fixedOwner,true);assert.equal(row.removals,0);assert.equal(row.autoClear,true);
   assert.deepEqual(row.newPrograms,[],'Quality switches must use programs prepared during loading');
   assert(row.stats.calls<=250&&row.stats.triangles<=150000);assert(row.floorChanged>0,'Pooled lights must actually illuminate the scene');
   assert(row.faceAbove8/Math.max(1,row.facePixels)<=.01,'Light must preserve the inner faces');console.log(JSON.stringify(row));
  }
  result.disposal=await page.evaluate(async()=>{
   const s=window.__depthScene,e=s.cardEffects,look=e.look,resources=new Set([...s.geometryOwned,...s.materialOwned]);
   s.spells.root.traverse(o=>{if(o.geometry)resources.add(o.geometry);for(const r of Array.isArray(o.material)?o.material:o.material?[o.material]:[])resources.add(r)});
   for(const r of s.spells.shapes.values())resources.add(r);
   for(const r of look.textures.values())resources.add(r);for(const r of look.materials.values())resources.add(r);
   for(const p of e.pools.values())resources.add(p.mesh.geometry);resources.add(e.material);
   const counts=new Map([...resources].map(r=>[r,0]));for(const r of resources)r.addEventListener('dispose',()=>counts.set(r,counts.get(r)+1));
   s.dispose();await s.warming;await new Promise(resolve=>setTimeout(resolve,0));
   return{resources:resources.size,prewarmedMaterials:s.materialOwned.size,released:[...counts.values()].filter(n=>n===1).length,
    duplicates:[...counts.values()].filter(n=>n>1).length,lightsDetached:look.lights.every(l=>!l.parent),rootDetached:!e.root.parent};
  });
  assert.equal(result.disposal.resources,result.disposal.released);assert.equal(result.disposal.duplicates,0);
  assert.equal(result.disposal.lightsDetached,true);assert.equal(result.disposal.rootDetached,true);assert.deepEqual(result.errors,[]);
 }finally{await browser.close();await writeFile(`${out}/checks.json`,JSON.stringify(result,null,2)+'\n');}
});}finally{await rm(tmp,{recursive:true});}
