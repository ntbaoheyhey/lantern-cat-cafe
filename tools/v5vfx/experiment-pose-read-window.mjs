/** Verify delivered pose metadata, then measure cropped cold alpha contours. */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import ts from '../../apps/web/node_modules/typescript/lib/typescript.js';
import {chromium,config,openFixture} from './browser-fixture.mjs';
import {runtimeEvidence} from './runtime-evidence.mjs';
const out=resolve(process.env.CXV_CAPTURE_OUT??'work/v5/CXV/films/V7-F-pose-read-window');await mkdir(out,{recursive:true});
const padding=Number(process.env.CXV_POSE_READ_PADDING??2);assert(Number.isInteger(padding)&&padding>=0&&padding<=8);
// Keep the pre-crop implementation reproducible after runtime integration.
const baselineSourceRef=execFileSync('git',['rev-parse',process.env.CXV_POSE_BASE_REF??'5e576693210d4b1879d783a12c6c992909af313f'],{encoding:'utf8'}).trim();
const source=execFileSync('git',['show',baselineSourceRef+':apps/web/src/game/cardrpg/stage/opaque-pose-bounds.ts'],{encoding:'utf8'});
let candidate=source;
const replace=(from,to)=>{assert(candidate.includes(from),'Prototype anchor changed: '+from.slice(0,70));candidate=candidate.replace(from,to);};
replace('type Pixels={width:number;height:number;rgba:Uint8ClampedArray};','type Pixels={width:number;height:number;x:number;y:number;readWidth:number;readHeight:number;rgba:Uint8ClampedArray};');
replace('function pixels(texture:T.Texture):Pixels|undefined {','function pixels(texture:T.Texture,bounds?:readonly number[]):Pixels|undefined {');
replace(' canvas.width=source.width;canvas.height=source.height;',` const width=source.width,height=source.height;
 const valid=Array.isArray(bounds)&&bounds.length===4&&bounds.every(Number.isInteger)&&bounds[0]>=0&&bounds[1]>=0&&bounds[2]>bounds[0]&&bounds[3]>bounds[1]&&bounds[2]<=width&&bounds[3]<=height;
 const region=valid?[Math.max(0,bounds![0]!-${padding}),Math.max(0,bounds![1]!-${padding}),Math.min(width,bounds![2]!+${padding}),Math.min(height,bounds![3]!+${padding})]:[0,0,width,height],x=region[0]!,y=region[1]!,readWidth=region[2]!-x,readHeight=region[3]!-y;
 canvas.width=readWidth;canvas.height=readHeight;`);
replace(' context.drawImage(source,0,0);',' context.drawImage(source,x,y,readWidth,readHeight,0,0,readWidth,readHeight);');
replace(' const data={width:canvas.width,height:canvas.height,rgba:context.getImageData(0,0,canvas.width,canvas.height).data};',' const data={width,height,x,y,readWidth,readHeight,rgba:context.getImageData(0,0,readWidth,readHeight).data};');
replace(' const data=pixels(texture);if(!data)return [];',' const data=pixels(texture,mesh.userData.opaquePixelBounds);if(!data)return [];');
replace('const x0=Math.max(0,Math.floor(Math.min(a[0],b[0],c[0]))),x1=Math.min(width-1,Math.ceil(Math.max(a[0],b[0],c[0])));','const x0=Math.max(data.x,Math.floor(Math.min(a[0],b[0],c[0]))),x1=Math.min(data.x+data.readWidth-1,Math.ceil(Math.max(a[0],b[0],c[0])));');
replace('const y0=Math.max(0,Math.floor(Math.min(a[1],b[1],c[1]))),y1=Math.min(height-1,Math.ceil(Math.max(a[1],b[1],c[1])))','const y0=Math.max(data.y,Math.floor(Math.min(a[1],b[1],c[1]))),y1=Math.min(data.y+data.readHeight-1,Math.ceil(Math.max(a[1],b[1],c[1])))');
assert(candidate.split('rgba[(y*width+x)*4+3]').length===3,'Expected both endpoint alpha checks');
candidate=candidate.replaceAll('rgba[(y*width+x)*4+3]','rgba[((y-data.y)*data.readWidth+x-data.x)*4+3]');
const compile=s=>ts.transpileModule(s,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
const sources={full:compile(source),cropped:compile(candidate)};
const report={utc:new Date().toISOString(),source:baselineSourceRef,...runtimeEvidence(),padding,viewport:{width:1280,height:720},method:'Actual delivered alpha>=128 must fit existing pose metadata plus the recorded guard band before any cropped measurement. Fresh contour caches per block, five alternating blocks/mode at4xCPU after warmup. Same posed meshes; compare exact world bounds. Includes cold readback/contour work, excludes pose sampling/GPU/frame timing. No runtime change.',fixtures:[],errors:[]};
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 for(const id of ['wave3','boss']){
  const {page,errors}=await openFixture(browser,config.fixtures.find(f=>f.id===id),{fixedClock:false});report.url=page.url();
  const cdp=await page.context().newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
  const result=await page.evaluate(async({sources,id,padding})=>{
   const T=await import('/node_modules/.vite/deps/three.js'),s=window.__depthScene;cancelAnimationFrame(s.raf);
   const cases=[],pixelProof=[],verified=new Set();
   for(const [actorId,e]of s.actors){
    const d=e.craftPose?.drawing;if(!d)continue;
    for(const [key,clip,at]of [['K0','idle',0],['K1','attack',.1],['K2','attack',.4],['K5','ult',1.1],['K4','hurt',0]]){
     d.sample(clip,at,false,undefined,30);e.actor.root.updateMatrixWorld(true);if(d.key!==key)throw Error('Unexpected pose '+d.key);
     const bounds=d.set.manifest.poses[key].opaqueBounds,texture=d.material.map;
     if(!verified.has(texture)){
      verified.add(texture);const image=texture.image,canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;
      const context=canvas.getContext('2d',{willReadFrequently:true});context.drawImage(image,0,0);const rgba=context.getImageData(0,0,canvas.width,canvas.height).data;
      const region=bounds?[Math.max(0,bounds[0]-padding),Math.max(0,bounds[1]-padding),Math.min(image.width,bounds[2]+padding),Math.min(image.height,bounds[3]+padding)]:[0,0,image.width,image.height];
      let painted=0,outside=0,outsideDeclared=0,x0=image.width,y0=image.height,x1=0,y1=0;
      for(let y=0;y<image.height;y++)for(let x=0;x<image.width;x++)if(rgba[(y*image.width+x)*4+3]>=128){
       painted++;x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x+1);y1=Math.max(y1,y+1);
       if(!bounds||x<bounds[0]||y<bounds[1]||x>=bounds[2]||y>=bounds[3])outsideDeclared++;
       if(x<region[0]||y<region[1]||x>=region[2]||y>=region[3])outside++;
      }
      pixelProof.push({actorId,asset:e.asset,key,width:image.width,height:image.height,declared:bounds,region,measured:[x0,y0,x1,y1],painted,outsideDeclared,outside});
     }
     const mesh=new T.Mesh(d.geometry.clone(),d.material.clone());mesh.matrixAutoUpdate=false;mesh.matrix.copy(d.matrixWorld);mesh.userData.opaquePixelBounds=bounds;
     cases.push({actorId,key,mesh});
    }
   }
   const runs=[],read=CanvasRenderingContext2D.prototype.getImageData;let reads=0,readPixels=0,readbackMs=0;
   CanvasRenderingContext2D.prototype.getImageData=function(...args){reads++;readPixels+=args[2]*args[3];const at=performance.now();try{return read.apply(this,args);}finally{readbackMs+=performance.now()-at;}};
   const run=async(variant,block)=>{
    const url=URL.createObjectURL(new Blob([sources[variant]+`\n// ${variant} ${block}`],{type:'text/javascript'}));
    try{
     const {opaqueWorldBounds}=await import(url);reads=readPixels=readbackMs=0;const at=performance.now();
     const bounds=cases.map(({actorId,key,mesh})=>({actorId,key,bounds:opaqueWorldBounds(mesh)}));
     return{variant,block,elapsedMs:performance.now()-at,readbacks:reads,readPixels,readbackMs,bounds};
    }finally{URL.revokeObjectURL(url);}
   };
   try{
    if(pixelProof.some(p=>p.outside))return{id,cases:cases.length,pixelProof,exact:false,reason:'Declared bounds exclude delivered painted pixels',runs};
    await run('full',-1);await run('cropped',-1);
    for(let block=0;block<5;block++)for(const variant of block%2?['cropped','full']:['full','cropped'])runs.push(await run(variant,block));
    const reference=JSON.stringify(runs[0].bounds),exact=runs.every(r=>JSON.stringify(r.bounds)===reference);
    const median=variant=>runs.filter(r=>r.variant===variant).map(r=>r.elapsedMs).sort((a,b)=>a-b)[2];
    return{id,cases:cases.length,pixelProof,exact,fullMedianMs:median('full'),croppedMedianMs:median('cropped'),runs};
   }finally{CanvasRenderingContext2D.prototype.getImageData=read;for(const{mesh}of cases){mesh.geometry.dispose();mesh.material.dispose();}}
  },{sources,id,padding});
  report.fixtures.push(result);report.errors.push(...errors);await page.close();
 }
 report.pass=!report.errors.length&&report.fixtures.every(f=>f.exact);report.ended=new Date().toISOString();
 await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({out,pass:report.pass,errors:report.errors,fixtures:report.fixtures.map(({runs,pixelProof,...f})=>({...f,verifiedImages:pixelProof.length,outside:pixelProof.reduce((n,p)=>n+p.outside,0),reads:runs.slice(0,2).map(r=>({variant:r.variant,readPixels:r.readPixels,readbackMs:r.readbackMs}))}))}));assert(report.pass);
}finally{await browser.close();}
