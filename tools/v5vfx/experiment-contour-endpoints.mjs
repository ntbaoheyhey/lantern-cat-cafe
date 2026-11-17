/** Compare full-row and endpoint-only contour construction without changing the app. */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import ts from '../../apps/web/node_modules/typescript/lib/typescript.js';
import {chromium,config,openFixture} from './browser-fixture.mjs';
import {runtimeEvidence} from './runtime-evidence.mjs';
const out=resolve(process.env.CXV_CAPTURE_OUT??'work/v5/CXV/films/V7-F-contour-endpoints-experiment');await mkdir(out,{recursive:true});
const baselineSourceRef=process.env.CXV_CONTOUR_SOURCE_REF??'e58ef974c029a98f72f468f143709a860a83fc60';
const source=execFileSync('git',['show',baselineSourceRef+':apps/web/src/game/cardrpg/stage/opaque-pose-bounds.ts'],{encoding:'utf8'});
const full=`    if(left<0)left=x;right=x;
   }
   if(left>=0){edge.push([left+.5,y+.5]);if(right!==left)edge.push([right+.5,y+.5]);}`;
const endpoints=`    left=x;break;
   }
   if(left<0)continue;
   right=left;
   for(let x=x1;x>left;x--){
    if(rgba[(y*width+x)*4+3]!<128)continue;
    const px=x+.5-c[0],u=(bcY*px+cbX*py)/denominator,v=(caY*px+acX*py)/denominator;
    if(u<-.000001||v<-.000001||1-u-v<-.000001)continue;
    right=x;break;
   }
   edge.push([left+.5,y+.5]);if(right!==left)edge.push([right+.5,y+.5]);`;
assert(source.includes(full),'Original scan changed; review prototype before running');
const compile=s=>ts.transpileModule(s,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
const rowSort=" points.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);\n";
assert(source.includes(rowSort),'Hull sort changed; review row-order prototype');
const sources={full:compile(source),endpoints:compile(source.replace(full,endpoints)),rowHull:compile(source.replace(full,endpoints).replace(rowSort,''))};
const report={utc:new Date().toISOString(),source:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),baselineSourceRef,...runtimeEvidence(),viewport:{width:1280,height:720},method:'Same browser/loaded original drawings; fresh contour module caches per block. Cold construction of cloned posed meshes at4xCPU; interleaved three blocks per variant after one warmup. Includes canvas pixel readback and instrumentation, excludes pose sampling, cloning and GPU drawing. Compare exact bounds, no FPS inference.',fixtures:[],errors:[]};
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 for(const id of ['wave3','boss']){
  const {page,errors}=await openFixture(browser,config.fixtures.find(f=>f.id===id),{fixedClock:false});report.url=page.url();
  const cdp=await page.context().newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
  const result=await page.evaluate(async({sources,id})=>{
   const T=await import('/node_modules/.vite/deps/three.js'),s=window.__depthScene;
   cancelAnimationFrame(s.raf);const cases=[];
   for(const [actorId,e]of s.actors){
    const d=e.craftPose?.drawing;if(!d)continue;
    for(const [key,clip,at]of [['K0','idle',0],['K1','attack',.1],['K2','attack',.4],['K5','ult',1.1],['K4','hurt',0]]){
     d.sample(clip,at,false,undefined,30);e.actor.root.updateMatrixWorld(true);
     if(d.key!==key)throw Error('Unexpected pose '+d.key+' for '+key);
     const mesh=new T.Mesh(d.geometry.clone(),d.material.clone());mesh.matrixAutoUpdate=false;mesh.matrix.copy(d.matrixWorld);
     cases.push({actorId,key,mesh});
    }
   }
   const runs=[],read=CanvasRenderingContext2D.prototype.getImageData;let reads=0,readbackMs=0;
   CanvasRenderingContext2D.prototype.getImageData=function(...args){reads++;const start=performance.now();try{return read.apply(this,args);}finally{readbackMs+=performance.now()-start;}};
   const run=async(variant,block)=>{
    const url=URL.createObjectURL(new Blob([sources[variant]+`\n// block ${block} ${variant}`],{type:'text/javascript'}));
    try{
     const {opaqueWorldBounds}=await import(url);reads=0;readbackMs=0;const start=performance.now();
     const bounds=cases.map(({actorId,key,mesh})=>({actorId,key,bounds:opaqueWorldBounds(mesh)}));
     return{variant,block,elapsedMs:performance.now()-start,readbacks:reads,readbackMs,bounds};
    }finally{URL.revokeObjectURL(url);}
   };
   try{
    for(const variant of ['full','endpoints','rowHull'])await run(variant,-1);
    for(let block=0;block<3;block++)for(const variant of block%2?['rowHull','endpoints','full']:['full','endpoints','rowHull'])runs.push(await run(variant,block));
    const expected=JSON.stringify(runs[0].bounds),exact=runs.every(r=>JSON.stringify(r.bounds)===expected);
    const median=variant=>runs.filter(r=>r.variant===variant).map(r=>r.elapsedMs).sort((a,b)=>a-b)[1];
    return{id,cases:cases.length,exact,fullMedianMs:median('full'),endpointsMedianMs:median('endpoints'),rowHullMedianMs:median('rowHull'),runs};
   }finally{CanvasRenderingContext2D.prototype.getImageData=read;for(const {mesh}of cases){mesh.geometry.dispose();mesh.material.dispose();}}
  },{sources,id});
  report.fixtures.push(result);report.errors.push(...errors);await page.close();
 }
 report.pass=!report.errors.length&&report.fixtures.every(r=>r.exact);report.ended=new Date().toISOString();
 await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2));
 console.log(JSON.stringify({out,pass:report.pass,errors:report.errors,fixtures:report.fixtures.map(({runs,...r})=>r)}));assert(report.pass);
}finally{await browser.close();}
