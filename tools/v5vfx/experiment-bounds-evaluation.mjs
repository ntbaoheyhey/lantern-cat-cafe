/** Same-pose bounds evaluation: preserve arithmetic, compare packed positions. */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import ts from '../../apps/web/node_modules/typescript/lib/typescript.js';
import {chromium,config,openFixture} from './browser-fixture.mjs';
import {runtimeEvidence} from './runtime-evidence.mjs';
const out=resolve(process.env.CXV_CAPTURE_OUT??'work/v5/CXV/films/V7-F-bounds-evaluation');await mkdir(out,{recursive:true});
const baselineSourceRef=process.env.CXV_BOUNDS_SOURCE_REF??'ad293561dc9c10e45bef6b4604cdb480e80e0339';
const source=execFileSync('git',['show',baselineSourceRef+':apps/web/src/game/cardrpg/stage/opaque-pose-bounds.ts'],{encoding:'utf8'});
const original=`   for(let j=0;j<3;j++){
    const index=sample.ids[j]!,weight=sample.weights[j]!,px=positions.getX(index),py=positions.getY(index);
    x+=px*weight;y+=py*weight;z+=positions.getZ(index)*weight;visible ||=px!==0||py!==0;
   }`;
const packed=`   if(packed){
    const a=sample.ids[0]*3,b=sample.ids[1]*3,c=sample.ids[2]*3,u=sample.weights[0],v=sample.weights[1],w=sample.weights[2];
    const ax=packed[a]!,ay=packed[a+1]!,bx=packed[b]!,by=packed[b+1]!,cx=packed[c]!,cy=packed[c+1]!;
    x=ax*u+bx*v+cx*w;y=ay*u+by*v+cy*w;z=packed[a+2]!*u+packed[b+2]!*v+packed[c+2]!*w;
    visible=ax!==0||ay!==0||bx!==0||by!==0||cx!==0||cy!==0;
   }else{
${original}
   }`;
const anchor='  const m=mesh.matrixWorld.elements;';
assert(source.includes(original)&&source.includes(anchor),'Bounds evaluator changed; review experiment');
const candidate=source.replace(anchor,anchor+"\n  const packed=positions.itemSize===3&&!positions.normalized&&!('isInterleavedBufferAttribute' in positions)&&(positions.array instanceof Float32Array||positions.array instanceof Float64Array)?positions.array:null;").replace(original,packed);
const compile=s=>ts.transpileModule(s,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
const sources={original:compile(source),packed:compile(candidate)};
const report={utc:new Date().toISOString(),source:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),baselineSourceRef,...runtimeEvidence(),viewport:{width:1280,height:720},method:'Interleaved warmed contour evaluation on65original posed meshes at4xCPU. Twelve cycles per block,three blocks/mode after warmup; vary root rotation/translation percycle. Same arithmetic order with direct Float32position reads; original fallback remains. Excludes construction/GPU/frame timing; exact bounds required.',fixtures:[],errors:[]};
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 for(const id of ['wave3','boss']){
  const {page,errors}=await openFixture(browser,config.fixtures.find(f=>f.id===id),{fixedClock:false});report.url=page.url();
  const cdp=await page.context().newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
  const result=await page.evaluate(async({sources,id})=>{
   const T=await import('/node_modules/.vite/deps/three.js'),s=window.__depthScene;cancelAnimationFrame(s.raf);const cases=[],modules={};
   for(const [variant,source]of Object.entries(sources)){const url=URL.createObjectURL(new Blob([source],{type:'text/javascript'}));try{modules[variant]=await import(url);}finally{URL.revokeObjectURL(url);}}
   for(const [actorId,e]of s.actors){
    const d=e.craftPose?.drawing;if(!d)continue;
    for(const [key,clip,at]of [['K0','idle',0],['K1','attack',.1],['K2','attack',.4],['K5','ult',1.1],['K4','hurt',0]]){
     d.sample(clip,at,false,undefined,30);if(d.key!==key)throw Error('Unexpected pose '+d.key);
     const mesh=new T.Mesh(d.geometry.clone(),d.material.clone());cases.push({actorId,key,mesh});
    }
   }
   const run=(variant,block,cycles=12)=>{
    const bounds=[],measure=modules[variant].opaqueWorldBounds,start=performance.now();
    for(let cycle=0;cycle<cycles;cycle++)for(const {actorId,key,mesh}of cases){
     mesh.rotation.z=cycle*.013;mesh.position.set(cycle*.7,-cycle*.3,0);mesh.scale.set(cycle%2?-1.1:.9,.8,1);
     bounds.push({cycle,actorId,key,bounds:measure(mesh)});
    }
    return{variant,block,cycles,elapsedMs:performance.now()-start,bounds};
   };
   try{
    run('original',-1,3);run('packed',-1,3);const runs=[];
    for(let block=0;block<3;block++)for(const variant of block%2?['packed','original']:['original','packed'])runs.push(run(variant,block));
    const expected=JSON.stringify(runs[0].bounds),exact=runs.every(r=>JSON.stringify(r.bounds)===expected);
    const median=variant=>runs.filter(r=>r.variant===variant).map(r=>r.elapsedMs).sort((a,b)=>a-b)[1];
    return{id,cases:cases.length,samplesPerBlock:cases.length*12,exact,originalMedianMs:median('original'),packedMedianMs:median('packed'),runs};
   }finally{for(const {mesh}of cases){mesh.geometry.dispose();mesh.material.dispose();}}
  },{sources,id});
  report.fixtures.push(result);report.errors.push(...errors);await page.close();
 }
 report.pass=!report.errors.length&&report.fixtures.every(r=>r.exact);report.ended=new Date().toISOString();
 await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2));
 console.log(JSON.stringify({out,pass:report.pass,errors:report.errors,fixtures:report.fixtures.map(({runs,...r})=>r)}));assert(report.pass);
}finally{await browser.close();}
