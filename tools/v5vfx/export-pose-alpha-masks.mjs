/** Read-only experiment: exact opacity masks for the current delivered/fallback art. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {gzipSync,brotliCompressSync} from 'node:zlib';
import {resolve} from 'node:path';
import {chromium,config,openFixture} from './browser-fixture.mjs';
import {runtimeEvidence} from './runtime-evidence.mjs';

const root=resolve(import.meta.dirname,'../..');
const out=resolve(process.env.CXV_ALPHA_OUT??resolve(root,'work/v5/CXV/films/V7-F-pose-alpha-mask'));
assert(out.startsWith(resolve(root,'work/v5/CXV')+'/'));assert(!existsSync(out));mkdirSync(out,{recursive:true});
const hash=b=>createHash('sha256').update(b).digest('hex');
const sizes=b=>({raw:b.length,gzip:gzipSync(b,{level:9}).length,brotli:brotliCompressSync(b).length});
const files=execFileSync('rg',['--files','apps/web/public/units','-g','manifest.json'],{cwd:root,encoding:'utf8'}).trim().split('\n').filter(p=>p.includes('/poses/')).sort();
const assets=files.map(file=>{const bytes=readFileSync(resolve(root,file));return{file,manifestSha256:hash(bytes),manifest:JSON.parse(bytes)};});
const report={utc:new Date().toISOString(),source:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),...runtimeEvidence(),viewport:{width:1280,height:720},method:'Fresh delivered and original opacity masks at alpha>=128; two-pixel metadata guard; exact bit roundtrip and source-byte SHA. Browser-only export, no production artifact edits, no FPS or judge acceptance.',assets:assets.map(({manifest,...r})=>({...r,unit:manifest.unit})),rows:[],pass:false};
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 const {page,errors,blockedRequests}=await openFixture(browser,config.fixtures.find(f=>f.id==='boss'),{fixedClock:false});report.url=page.url();report.browser=browser.version();
 const rows=await page.evaluate(async assets=>{
  cancelAnimationFrame(window.__depthScene.raf);
  const {loadPoseImage}=await import('/src/game/cardrpg/spine/pose-image-loader.ts');
  const sha=async b=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',b)),v=>v.toString(16).padStart(2,'0')).join('');
  const base64=bytes=>{let s='';for(let i=0;i<bytes.length;i+=8192)s+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(s);};
  const rows=[];
  for(const {manifest:m} of assets)for(const [key,frame] of Object.entries(m.poses)){
   const originalUrl=`/units/${m.unit}/poses/${frame.image}`;
   for(const mode of ['delivered','original']){
    const image=mode==='delivered'?await loadPoseImage(originalUrl,...m.canvas):await new Promise((ok,bad)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=bad;i.src=originalUrl;});
    const width=image.width,height=image.height,bounds=frame.opaqueBounds;
    if(width!==m.canvas[0]||height!==m.canvas[1])throw Error('Size mismatch');
    const valid=Array.isArray(bounds)&&bounds.length===4&&bounds.every(Number.isSafeInteger)&&bounds[0]>=0&&bounds[1]>=0&&bounds[2]>bounds[0]&&bounds[3]>bounds[1]&&bounds[2]<=width&&bounds[3]<=height;
    const region=valid?[Math.max(0,bounds[0]-2),Math.max(0,bounds[1]-2),Math.min(width,bounds[2]+2),Math.min(height,bounds[3]+2)]:[0,0,width,height];
    const [x,y,right,bottom]=region,readWidth=right-x,readHeight=bottom-y;
    const c=document.createElement('canvas');c.width=width;c.height=height;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);const full=ctx.getImageData(0,0,width,height).data;
    const crop=document.createElement('canvas');crop.width=readWidth;crop.height=readHeight;const cc=crop.getContext('2d',{willReadFrequently:true});cc.drawImage(image,x,y,readWidth,readHeight,0,0,readWidth,readHeight);const rgba=cc.getImageData(0,0,readWidth,readHeight).data;
    const packed=new Uint8Array(Math.ceil(readWidth*readHeight/8)),mask=new Uint8Array(readWidth*readHeight);let outside=0,painted=0,roundtrip=0,cropDifferences=0;
    for(let yy=0;yy<height;yy++)for(let xx=0;xx<width;xx++)if(full[(yy*width+xx)*4+3]>=128&&(xx<x||yy<y||xx>=right||yy>=bottom))outside++;
    for(let i=0;i<mask.length;i++){const on=rgba[i*4+3]>=128?1:0;mask[i]=on;if(on){packed[i>>3]|=1<<(i&7);painted++;}const xx=x+i%readWidth,yy=y+Math.floor(i/readWidth);if(on!==(full[(yy*width+xx)*4+3]>=128?1:0))cropDifferences++;}
    for(let i=0;i<mask.length;i++)if(((packed[i>>3]>>(i&7))&1)!==mask[i])roundtrip++;
    const url=image.currentSrc||image.src,response=await fetch(url);if(!response.ok)throw Error('Image bytes HTTP '+response.status);const bytes=await response.arrayBuffer();
    rows.push({unit:m.unit,key,mode,url,width,height,x,y,readWidth,readHeight,painted,outside,roundtrip,cropDifferences,imageBytes:bytes.byteLength,imageSha256:await sha(bytes),maskSha256:await sha(mask),packedSha256:await sha(packed),base64:base64(packed),utc:new Date().toISOString()});
   }
  }
  return rows;
 },assets);
 const byUrl={};
 for(const row of rows){
  const {base64,...meta}=row,packed=Buffer.from(base64,'base64');assert.equal(hash(packed),row.packedSha256);
  const name=`${row.unit}-${row.key}-${row.mode}.bin`;writeFileSync(resolve(out,name),packed);
  report.rows.push({...meta,packedFile:resolve(out,name),packedSizes:sizes(packed)});
  const url=new URL(row.url).pathname;
  if(byUrl[url])assert.equal(byUrl[url].imageSha256,row.imageSha256);
  byUrl[url]={width:row.width,height:row.height,x:row.x,y:row.y,readWidth:row.readWidth,readHeight:row.readHeight,imageSha256:row.imageSha256,base64};
 }
 const variants=[];
 for(let i=0;i<rows.length;i+=2){const a=rows[i],b=rows[i+1],aa=Buffer.from(a.base64,'base64'),bb=Buffer.from(b.base64,'base64');assert.equal(aa.length,bb.length);let differences=0;for(let j=0;j<a.readWidth*a.readHeight;j++)if(((aa[j>>3]>>(j&7))&1)!==((bb[j>>3]>>(j&7))&1))differences++;variants.push({unit:a.unit,key:a.key,thresholdDifferences:differences,exact:differences===0});}
 const body=Buffer.from(JSON.stringify(byUrl));writeFileSync(resolve(out,'masks.json'),body);
 const delivered=Object.fromEntries(Object.entries(byUrl).filter(([u])=>rows.some(r=>r.mode==='delivered'&&new URL(r.url).pathname===u)));
 report.variants=variants;report.packaging={uniqueUrls:Object.keys(byUrl).length,all:sizes(body),delivered:sizes(Buffer.from(JSON.stringify(delivered))),maskFile:resolve(out,'masks.json'),maskFileSha256:hash(body)};
 report.errors=errors;report.blockedRequests=blockedRequests;report.ended=new Date().toISOString();report.pass=rows.length===assets.length*10&&!errors.length&&rows.every(r=>r.outside===0&&r.roundtrip===0&&r.cropDifferences===0);
 writeFileSync(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({pass:report.pass,rows:rows.length,thresholdExact:variants.filter(v=>v.exact).length,packaging:report.packaging,errors,blockedRequests}));assert(report.pass);
}finally{await browser.close();}
