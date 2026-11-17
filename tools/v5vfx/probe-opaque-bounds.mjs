/** Exact frozen pose bounds and isolated GPU pixels for contour optimizations. */
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {chromium,config,openFixture} from './browser-fixture.mjs';
import {runtimeEvidence} from './runtime-evidence.mjs';
const out=resolve(process.env.CXV_CAPTURE_OUT??'work/v5/CXV/films/V7-F-opaque-probe');await mkdir(out,{recursive:true});
const report={utc:new Date().toISOString(),source:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),...runtimeEvidence(),viewport:{width:1280,height:720},method:'Frozen original drawn K0/K1/K2/K5/K4 at two life clocks. Exact world opacity bounds and SHA256 of isolated1280x720 GPU RGBA. Diagnostic pose sampling, not ordinary gameplay.',rows:[],errors:[]};
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 for(const id of ['wave3','boss']){
  const {page,errors}=await openFixture(browser,config.fixtures.find(f=>f.id===id),{fixedClock:false});report.url=page.url();
  const rows=await page.evaluate(async id=>{
   const T=await import('/node_modules/.vite/deps/three.js');
   const {opaqueWorldBounds}=await import('/src/game/cardrpg/stage/opaque-pose-bounds.ts');
   const s=window.__depthScene,m=window.__depthReview,rows=[];
   m.plan=null;m.animationAt=0;s.render({...s.view(),frame:null,fixedTime:30,paused:true,galleryPreview:true},0);
   const scene=new T.Scene(),target=new T.WebGLRenderTarget(1280,720,{depthBuffer:false}),data=new Uint8Array(1280*720*4);
   const clear=s.renderer.getClearColor(new T.Color()),alpha=s.renderer.getClearAlpha(),previous=s.renderer.getRenderTarget();
   try{
    s.renderer.setRenderTarget(target);s.renderer.setClearColor(0,0);
    for(const [actorId,e]of s.actors){
     const d=e.craftPose?.drawing;if(!d)continue;
     for(const clock of [30,30.6])for(const [key,clip,at]of [['K0','idle',0],['K1','attack',.1],['K2','attack',.4],['K5','ult',1.1],['K4','hurt',0]]){
      d.sample(clip,at,false,undefined,clock);e.actor.root.updateMatrixWorld(true);assertKey();
      function assertKey(){if(d.key!==key)throw Error('Unexpected drawing '+d.key+' for '+key);}
      const bounds=opaqueWorldBounds(e.actor.root);
      const mesh=new T.Mesh(d.geometry,d.material);mesh.matrixAutoUpdate=false;mesh.matrix.copy(d.matrixWorld);mesh.frustumCulled=false;scene.add(mesh);
      s.renderer.clear();s.renderer.render(scene,s.camera);s.renderer.readRenderTargetPixels(target,0,0,1280,720,data);scene.remove(mesh);
      const pixelSha256=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',data)),b=>b.toString(16).padStart(2,'0')).join('');
      rows.push({fixture:id,actorId,asset:e.asset,key,clock,bounds,pixelSha256});
     }
    }
   }finally{s.renderer.setRenderTarget(previous);s.renderer.setClearColor(clear,alpha);target.dispose();}
   return rows;
  },id);
  report.rows.push(...rows);report.errors.push(...errors);await page.close();
 }
 const sortRows=rows=>rows.sort((a,b)=>JSON.stringify([a.fixture,a.actorId,a.key,a.clock]).localeCompare(JSON.stringify([b.fixture,b.actorId,b.key,b.clock])));
 sortRows(report.rows);
 if(process.env.CXV_COMPARE){
  const baseline=JSON.parse(await readFile(resolve(process.env.CXV_COMPARE),'utf8'));sortRows(baseline.rows);
  report.differences=report.rows.flatMap((row,i)=>JSON.stringify(row)===JSON.stringify(baseline.rows[i])?[]:[{index:i,actual:row,expected:baseline.rows[i]}]);
  if(report.differences.length)report.errors.push(`${report.differences.length} pose differences from baseline`);else report.exactMatchTo=resolve(process.env.CXV_COMPARE);
 }
 report.pass=report.rows.length>=40&&!report.errors.length;report.ended=new Date().toISOString();
 await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({out,pass:report.pass,rows:report.rows.length,exactMatchTo:report.exactMatchTo,errors:report.errors}));assert(report.pass);
}finally{await browser.close();}
