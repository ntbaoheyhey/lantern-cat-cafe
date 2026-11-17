/** Asset gate for transparent outer mesh cells, including original fallback. */
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {chromium,config,openFixture} from './browser-fixture.mjs';
import {runtimeEvidence} from './runtime-evidence.mjs';
const out=resolve(process.env.CXV_CAPTURE_OUT??'work/v5/CXV/films/V7-F-mesh-outer-assets');await mkdir(out,{recursive:true});
const files=execFileSync('rg',['--files','apps/web/public/units','-g','manifest.json'],{encoding:'utf8'}).trim().split('\n').filter(p=>p.includes('/poses/')).sort(),assets=[];
for(const file of files){const bytes=await readFile(file),manifest=JSON.parse(bytes);assets.push({manifest,manifestSha256:createHash('sha256').update(bytes).digest('hex'),file});}
const report={utc:new Date().toISOString(),source:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),...runtimeEvidence(),viewport:{width:1280,height:720},paddingCells:2,method:'Read-only pixel gate over every current pose manifest, actual delivered image and direct original. Union all authored pose bounds, snap to original32grid and pad2cells. Every alpha>0pixel must fit the union; source dimensions must match the authored canvas. No runtime mutation, texture resampling or FPS claim',assets:assets.map(({manifest,...a})=>({...a,unit:manifest.unit})),rows:[],errors:[]};
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 const {page,errors}=await openFixture(browser,config.fixtures.find(f=>f.id==='boss'),{fixedClock:false});report.url=page.url();
 report.rows=await page.evaluate(async assets=>{
  cancelAnimationFrame(window.__depthScene.raf);const {loadPoseImage}=await import('/src/game/cardrpg/spine/pose-image-loader.ts'),rows=[];
  for(const {manifest:m}of assets)for(const [key,frame]of Object.entries(m.poses)){
   const originalUrl=`/units/${m.unit}/poses/${frame.image}`;
   for(const mode of ['delivered','original']){
    const image=mode==='delivered'?await loadPoseImage(originalUrl,...m.canvas):await new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=reject;image.src=originalUrl;});
    const width=image.width,height=image.height,bounds=frame.opaqueBounds;
    const dimensionsMatch=Array.isArray(m.canvas)&&m.canvas.length===2&&m.canvas.every(n=>Number.isSafeInteger(n)&&n>0)&&width===m.canvas[0]&&height===m.canvas[1];
    const valid=Array.isArray(bounds)&&bounds.length===4&&bounds.every(Number.isInteger)&&bounds[0]>=0&&bounds[1]>=0&&bounds[2]>bounds[0]&&bounds[3]>bounds[1]&&bounds[2]<=width&&bounds[3]<=height;
    const all=Object.values(m.poses).map(p=>p.opaqueBounds),allValid=all.every(b=>Array.isArray(b)&&b.length===4&&b.every(Number.isSafeInteger)&&b[0]>=0&&b[1]>=0&&b[2]>b[0]&&b[3]>b[1]&&b[2]<=m.canvas[0]&&b[3]<=m.canvas[1]);
    const cellX=m.canvas[0]/32,cellY=m.canvas[1]/32;
    const grid=allValid&&dimensionsMatch?[Math.max(0,Math.floor(Math.min(...all.map(b=>b[0]))/cellX)-2),Math.max(0,Math.floor(Math.min(...all.map(b=>b[1]))/cellY)-2),Math.min(32,Math.ceil(Math.max(...all.map(b=>b[2]))/cellX)+2),Math.min(32,Math.ceil(Math.max(...all.map(b=>b[3]))/cellY)+2)]:[0,0,32,32];
    const region=[Math.floor(grid[0]*cellX),Math.floor(grid[1]*cellY),Math.ceil(grid[2]*cellX),Math.ceil(grid[3]*cellY)];
    const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const c=canvas.getContext('2d',{willReadFrequently:true});c.drawImage(image,0,0);const rgba=c.getImageData(0,0,width,height).data;
    const [x0,y0,x1,y1]=region,crop=document.createElement('canvas');crop.width=x1-x0;crop.height=y1-y0;const cc=crop.getContext('2d',{willReadFrequently:true});cc.drawImage(image,x0,y0,crop.width,crop.height,0,0,crop.width,crop.height);const cropped=cc.getImageData(0,0,crop.width,crop.height).data;
    let outside=0,outsideDeclared=0,maskDifferences=0,painted=0;const alpha=new Uint8Array(width*height);
    for(let y=0;y<height;y++)for(let x=0;x<width;x++){
     const a=rgba[(y*width+x)*4+3];alpha[y*width+x]=a;if(a>0){painted++;if(!valid||x<bounds[0]||y<bounds[1]||x>=bounds[2]||y>=bounds[3])outsideDeclared++;}
     if(x<x0||y<y0||x>=x1||y>=y1){if(a>0)outside++;}
     else if((a>0)!==(cropped[((y-y0)*crop.width+x-x0)*4+3]>0))maskDifferences++;
    }
    const alphaSha256=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',alpha)),b=>b.toString(16).padStart(2,'0')).join('');
    rows.push({unit:m.unit,key,mode,url:image.currentSrc||image.src,width,height,canvas:m.canvas,dimensionsMatch,declared:bounds,valid,allValid,grid,vertices:(grid[2]-grid[0]+1)*(grid[3]-grid[1]+1),region,painted,outsideDeclared,outside,maskDifferences,alphaSha256,fullPixels:width*height,readPixels:crop.width*crop.height});
   }
  }
  return rows;
 },assets);
 report.errors=errors;report.ended=new Date().toISOString();report.expectedRows=assets.reduce((n,a)=>n+Object.keys(a.manifest.poses).length*2,0);report.pass=!errors.length&&report.rows.length===report.expectedRows&&report.rows.every(r=>r.dimensionsMatch&&r.outside===0&&r.maskDifferences===0);
 await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({out,pass:report.pass,assets:assets.length,rows:report.rows.length,outside:report.rows.reduce((n,r)=>n+r.outside,0),maskDifferences:report.rows.reduce((n,r)=>n+r.maskDifferences,0),errors}));assert(report.pass);
}finally{await browser.close();}
