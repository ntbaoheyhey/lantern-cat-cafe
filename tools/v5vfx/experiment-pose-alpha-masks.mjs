/** Preparation-inclusive isolated contour prototype; never edits application code. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {gzipSync,brotliCompressSync} from 'node:zlib';
import {resolve} from 'node:path';
import ts from '../../apps/web/node_modules/typescript/lib/typescript.js';
import {chromium,config,openFixture} from './browser-fixture.mjs';
import {runtimeEvidence} from './runtime-evidence.mjs';

const root=resolve(import.meta.dirname,'../..'),exportDir=resolve(root,'work/v5/CXV/films/V7-F-pose-alpha-mask');
const implementation=process.env.CXV_ALPHA_IMPL??'rgba';assert(['rgba','packed'].includes(implementation));
const out=resolve(process.env.CXV_ALPHA_EXPERIMENT_OUT??resolve(root,'work/v5/CXV/films/V7-F-pose-alpha-cold'));
assert(out.startsWith(resolve(root,'work/v5/CXV')+'/'));assert(!existsSync(out));mkdirSync(out,{recursive:true});
const hash=b=>createHash('sha256').update(b).digest('hex');
const exported=JSON.parse(readFileSync(resolve(exportDir,'report.json')));assert(exported.pass);
const maskBytes=readFileSync(resolve(exportDir,'masks.json'));assert.equal(hash(maskBytes),exported.packaging.maskFileSha256);
const allMasks=JSON.parse(maskBytes),selected=Object.fromEntries(Object.entries(allMasks).filter(([url])=>/\/(mochi\/poses\/K[12]|binding-thread\/poses\/K4|yarn-giant\/poses\/K4)\.(avif|webp)$/.test(url)));
assert.equal(Object.keys(selected).length,8);
for(const [url,entry] of Object.entries(selected))assert.equal(hash(readFileSync(resolve(root,'apps/web/public'+url))),entry.imageSha256);
const source=readFileSync(resolve(root,'apps/web/src/game/cardrpg/stage/opaque-pose-bounds.ts'),'utf8');
const anchor=' canvas.width=readWidth;canvas.height=readHeight;';assert(source.includes(anchor));
const maskHook=` const entry=MASKS[new URL(source.currentSrc||source.src,location.href).pathname];
 if(entry&&entry.width===width&&entry.height===height&&entry.x===x&&entry.y===y&&entry.readWidth===readWidth&&entry.readHeight===readHeight){
  try{
   const packed=atob(entry.base64);
   if(packed.length===Math.ceil(readWidth*readHeight/8)){
    ${implementation==='rgba'?'const rgba=new Uint8ClampedArray(readWidth*readHeight*4); for(let i=0;i<readWidth*readHeight;i++)if(packed.charCodeAt(i>>3)&(1<<(i&7)))rgba[i*4+3]=255; const data={width,height,x,y,readWidth,readHeight,rgba};':'const mask=new Uint8Array(packed.length);for(let i=0;i<packed.length;i++)mask[i]=packed.charCodeAt(i);const data={width,height,x,y,readWidth,readHeight,rgba:new Uint8ClampedArray(0),mask};'}
    textures.set(texture,data);return data;
   }
  }catch{/* Preserve the ordinary canvas path for malformed encoded data. */}
 }
`;
const compile=s=>ts.transpileModule(s,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
let candidate=source.replace(anchor,maskHook+anchor);
if(implementation==='packed'){
 assert(candidate.includes('rgba:Uint8ClampedArray};'));
 candidate=candidate.replace('rgba:Uint8ClampedArray};','rgba:Uint8ClampedArray;mask?:Uint8Array};').replace('const {width,height,rgba}=data','const {width,height,rgba,mask}=data');
 const test='if(rgba[((y-data.y)*data.readWidth+x-data.x)*4+3]!<128)continue;';assert.equal(candidate.split(test).length,3);
 candidate=candidate.replaceAll(test,'const pixel=(y-data.y)*data.readWidth+x-data.x;if(mask?!(mask[pixel>>3]!&(1<<(pixel&7))):rgba[pixel*4+3]!<128)continue;');
}
const build=masks=>compile('const MASKS:Record<string,any>='+JSON.stringify(masks)+';\n'+candidate);
const sources={baseline:compile(source),mask:build(selected),missing:build({}),wrongSize:build(Object.fromEntries(Object.entries(selected).map(([u,m])=>[u,{...m,width:m.width+1}]))),truncated:build(Object.fromEntries(Object.entries(selected).map(([u,m])=>[u,{...m,base64:'AA=='}])))};
for(const [mode,code] of Object.entries(sources))writeFileSync(resolve(out,mode+'.mjs'),code);
const packed=Buffer.from(JSON.stringify(selected));
const report={utc:new Date().toISOString(),source:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),...runtimeEvidence(),viewport:{width:1280,height:720},method:'Fresh module caches in alternating isolated bounds runs; module parse/import measured separately and included in total. Mask atob and RGBA expansion remain in cold bounds work. Same posed geometry, threshold and contour algorithm. Eight exact URL variants cover four first-contact sources including original fallback. Source file bytes reverified before prototype; this is not a production asset-integrity design or general FPS result.',exportReportSha256:hash(readFileSync(resolve(exportDir,'report.json'))),selected:Object.keys(selected),packaging:{raw:packed.length,gzip:gzipSync(packed,{level:9}).length,brotli:brotliCompressSync(packed).length},sources:Object.fromEntries(Object.entries(sources).map(([mode,code])=>[mode,{path:resolve(out,mode+'.mjs'),sha256:hash(code),bytes:Buffer.byteLength(code)}])),fixtures:[],pass:false};
report.implementation=implementation;if(implementation==='packed')report.method=report.method.replace('Mask atob and RGBA expansion','Mask atob and packed-byte initialization');
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 for(const fixture of ['wave3','boss']){
  const {page,errors,blockedRequests}=await openFixture(browser,config.fixtures.find(f=>f.id===fixture),{fixedClock:false});
  const cdp=await page.context().newCDPSession(page),runs=[];
  for(const rate of [1,4]){
   await cdp.send('Emulation.setCPUThrottlingRate',{rate});
   const result=await page.evaluate(async({sources,fixture,rate})=>{
    const T=await import('/node_modules/.vite/deps/three.js'),s=window.__depthScene;cancelAnimationFrame(s.raf);
    const cases=[];
    for(const [actorId,e] of s.actors){const d=e.craftPose?.drawing;if(!d)continue;
     for(const [key,clip,at] of [['K0','idle',0],['K1','attack',.1],['K2','attack',.4],['K5','ult',1.1],['K4','hurt',0]]){
      d.sample(clip,at,false,undefined,30);e.actor.root.updateMatrixWorld(true);if(d.key!==key)throw Error('Pose mismatch');
      const mesh=new T.Mesh(d.geometry.clone(),d.material.clone());mesh.matrixAutoUpdate=false;mesh.matrix.copy(d.matrixWorld);mesh.userData.opaquePixelBounds=d.set.manifest.poses[key].opaqueBounds;cases.push({actorId,key,mesh});
     }
    }
    const original=CanvasRenderingContext2D.prototype.getImageData;let reads=0,pixels=0;
    CanvasRenderingContext2D.prototype.getImageData=function(...args){reads++;pixels+=args[2]*args[3];return original.apply(this,args);};
    const run=async(mode,block)=>{
     const url=URL.createObjectURL(new Blob([sources[mode]+`\n// ${fixture} ${rate} ${mode} ${block}`],{type:'text/javascript'}));
     try{const start=performance.now(),{opaqueWorldBounds}=await import(url),ready=performance.now();reads=pixels=0;
      const bounds=cases.map(({actorId,key,mesh})=>({actorId,key,bounds:opaqueWorldBounds(mesh)})),end=performance.now();
      return{mode,block,setupMs:ready-start,boundsMs:end-ready,totalMs:end-start,reads,readPixels:pixels,bounds};
     }finally{URL.revokeObjectURL(url);}
    };
    const runs=[],fallbacks=[];
    try{
     await run('baseline',-1);await run('mask',-1);
     for(let block=0;block<7;block++)for(const mode of block%2?['mask','baseline']:['baseline','mask'])runs.push(await run(mode,block));
     for(const mode of ['missing','wrongSize','truncated'])fallbacks.push(await run(mode,0));
     const ref=JSON.stringify(runs[0].bounds),exact=[...runs,...fallbacks].every(r=>JSON.stringify(r.bounds)===ref);
     const median=(mode,key)=>runs.filter(r=>r.mode===mode).map(r=>r[key]).sort((a,b)=>a-b)[3];
     return{rate,cases:cases.length,exact,runs,fallbacks,medians:Object.fromEntries(['baseline','mask'].map(mode=>[mode,Object.fromEntries(['setupMs','boundsMs','totalMs','reads','readPixels'].map(k=>[k,median(mode,k)]))]))};
    }finally{CanvasRenderingContext2D.prototype.getImageData=original;for(const {mesh} of cases){mesh.geometry.dispose();mesh.material.dispose();}}
   },{sources,fixture,rate});
   runs.push(result);
  }
  report.fixtures.push({fixture,url:page.url(),runs,errors,blockedRequests});await page.close();
 }
 report.ended=new Date().toISOString();report.pass=report.fixtures.every(f=>!f.errors.length&&f.runs.every(r=>r.exact&&r.fallbacks.every(x=>x.reads===r.medians.baseline.reads)));
 writeFileSync(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({pass:report.pass,packaging:report.packaging,fixtures:report.fixtures.map(f=>({fixture:f.fixture,runs:f.runs.map(r=>({rate:r.rate,exact:r.exact,cases:r.cases,medians:r.medians})),errors:f.errors}))}));assert(report.pass);
}finally{await browser.close();}
