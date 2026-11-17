/** Asset gate for two-pixel guarded alpha reads, including original fallback. */
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {chromium,config,openFixture} from './browser-fixture.mjs';
import {runtimeEvidence} from './runtime-evidence.mjs';
const out=resolve(process.env.CXV_CAPTURE_OUT??'work/v5/CXV/films/V7-F-pose-window-assets');await mkdir(out,{recursive:true});
const files=execFileSync('rg',['--files','apps/web/public/units','-g','manifest.json'],{encoding:'utf8'}).trim().split('\n').filter(p=>p.includes('/poses/')).sort(),assets=[];
for(const file of files){const bytes=await readFile(file),manifest=JSON.parse(bytes);assets.push({manifest,manifestSha256:createHash('sha256').update(bytes).digest('hex'),file});}
const report={utc:new Date().toISOString(),source:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),...runtimeEvidence(),viewport:{width:1280,height:720},padding:2,method:'Read-only pixel gate over every current pose manifest. Check both actual CXI loader delivery and direct original WebP fallback. All alpha>=128 must fit the guarded metadata rectangle, and a1:1 cropped canvas read must preserve every mask pixel. No UI acceptance or timing claim.',assets:assets.map(({manifest,...a})=>({...a,unit:manifest.unit})),rows:[],errors:[]};
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
    const valid=Array.isArray(bounds)&&bounds.length===4&&bounds.every(Number.isInteger)&&bounds[0]>=0&&bounds[1]>=0&&bounds[2]>bounds[0]&&bounds[3]>bounds[1]&&bounds[2]<=width&&bounds[3]<=height;
    const region=valid?[Math.max(0,bounds[0]-2),Math.max(0,bounds[1]-2),Math.min(width,bounds[2]+2),Math.min(height,bounds[3]+2)]:[0,0,width,height];
    const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const c=canvas.getContext('2d',{willReadFrequently:true});c.drawImage(image,0,0);const rgba=c.getImageData(0,0,width,height).data;
    const [x0,y0,x1,y1]=region,crop=document.createElement('canvas');crop.width=x1-x0;crop.height=y1-y0;const cc=crop.getContext('2d',{willReadFrequently:true});cc.drawImage(image,x0,y0,crop.width,crop.height,0,0,crop.width,crop.height);const cropped=cc.getImageData(0,0,crop.width,crop.height).data;
    let outside=0,outsideDeclared=0,maskDifferences=0,painted=0;const alpha=new Uint8Array(width*height);
    for(let y=0;y<height;y++)for(let x=0;x<width;x++){
     const a=rgba[(y*width+x)*4+3];alpha[y*width+x]=a;if(a>=128){painted++;if(!valid||x<bounds[0]||y<bounds[1]||x>=bounds[2]||y>=bounds[3])outsideDeclared++;}
     if(x<x0||y<y0||x>=x1||y>=y1){if(a>=128)outside++;}
     else if((a>=128)!==(cropped[((y-y0)*crop.width+x-x0)*4+3]>=128))maskDifferences++;
    }
    const alphaSha256=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',alpha)),b=>b.toString(16).padStart(2,'0')).join('');
    rows.push({unit:m.unit,key,mode,url:image.currentSrc||image.src,width,height,declared:bounds,valid,region,painted,outsideDeclared,outside,maskDifferences,alphaSha256,fullPixels:width*height,readPixels:crop.width*crop.height});
   }
  }
  return rows;
 },assets);
 report.errors=errors;report.ended=new Date().toISOString();report.pass=!errors.length&&report.rows.length>0&&report.rows.every(r=>r.outside===0&&r.maskDifferences===0);
 await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({out,pass:report.pass,assets:assets.length,rows:report.rows.length,outside:report.rows.reduce((n,r)=>n+r.outside,0),maskDifferences:report.rows.reduce((n,r)=>n+r.maskDifferences,0),errors}));assert(report.pass);
}finally{await browser.close();}
