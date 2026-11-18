/** Independently recompute the lane's 65-frame Clover seam measurements; no image views. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
const root='/Users/bao/taskbar-hero-chain';
const require=createRequire(`${root}/apps/web/package.json`),sharp=require('sharp');
const deliveryPath='/Users/bao/taskbar-hero-cardrpg-a6/reports/v5/CXV/M-clover-art-production-R2.json';
const delivery=JSON.parse(await readFile(deliveryPath,'utf8'));
const sha=b=>createHash('sha256').update(b).digest('hex');
const checked=new Map();
async function verify(p,hash){const b=await readFile(p);assert.equal(sha(b),hash,p);checked.set(p,hash);return b;}
const raw=JSON.parse(await verify(delivery.raw.path,delivery.raw.sha256));
const metrics=JSON.parse(await verify(delivery.pairMetrics.path,delivery.pairMetrics.sha256));
const keyed=await verify(delivery.keyedMatteSource.path,delivery.keyedMatteSource.sha256);
await verify(delivery.sourceFilm.path,delivery.sourceFilm.sha256);
await verify(raw.build.path,raw.build.sha256);
for(const image of delivery.reviewImages)await verify(image.path,image.sha256);
assert.equal(raw.captures.length,65);assert.equal(raw.rows.length,65);
assert.deepEqual(raw.runtimeSourceSubstitutions,[]);assert.equal(raw.errors.length,0);
assert.equal(raw.runtimePatchSha256,sha(''));
const pixels=new Map();
for(const capture of raw.captures){
 const bytes=await verify(capture.path,capture.sha256);
 const {data,info}=await sharp(bytes).removeAlpha().raw().toBuffer({resolveWithObject:true});
 assert.equal(info.width,1280);assert.equal(info.height,720);assert.equal(info.channels,3);
 pixels.set(capture.frame,data);
}
const mae=(a,b,region)=>{const [left,top,width,height]=region;let sum=0;for(let y=top;y<top+height;y++)for(let x=left;x<left+width;x++)for(let c=0;c<3;c++){const i=(y*1280+x)*3+c;sum+=Math.abs(a[i]-b[i]);}return sum/(width*height*3);};
const reproduced=[];
for(const row of metrics.rows){
 assert.equal(row.after,row.before+1);const got={};
 for(const [key,rect]of Object.entries(metrics.regions)){got[key]=mae(pixels.get(row.before),pixels.get(row.after),rect);assert.ok(Math.abs(got[key]-row.rgbMAE[key])<1e-12,`${row.before} ${key}`);}
 reproduced.push({...row,rgbMAE:got});
}
assert.equal(reproduced.length,60);
const median=a=>{const x=[...a].sort((a,b)=>a-b),i=(x.length-1)/2;return(x[Math.floor(i)]+x[Math.ceil(i)])/2;};
const seam=reproduced.find(r=>r.before===299),ordinary=reproduced.filter(r=>!r.seam);
const recomputed=Object.fromEntries(Object.keys(metrics.regions).map(k=>[k,{seamRGBMAE:seam.rgbMAE[k],ordinaryMedianRGBMAE:median(ordinary.map(r=>r.rgbMAE[k]))}]));
for(const [k,v]of Object.entries(recomputed)){assert.ok(Math.abs(v.seamRGBMAE-delivery.seamMetrics[k].seamRGBMAE)<1e-12);assert.ok(Math.abs(v.ordinaryMedianRGBMAE-delivery.seamMetrics[k].ordinaryMedianRGBMAE)<1e-12);}
const frameBytes=212*260*4;assert.equal(keyed.length,frameBytes*300);
const rgbaMae=(a,b)=>{let s=0;for(let i=0;i<frameBytes;i++)s+=Math.abs(keyed[a*frameBytes+i]-keyed[b*frameBytes+i]);return s/frameBytes;};
const keyedSeam=rgbaMae(299,0);assert.ok(Math.abs(keyedSeam-delivery.keyedMatteSource.seamRGBAMAE)<1e-12);
const first=raw.rows[0];let callbackError=0,footDelta=0;
for(const row of raw.rows){
 assert.equal(row.sourceFrame,row.frame%300);assert.equal(row.source,'media');assert.equal(row.ready,true);assert.equal(row.introCount,0);
 callbackError=Math.max(callbackError,Math.abs(row.decoded.mediaTime-row.sourceFrame/30));
 footDelta=Math.max(footDelta,...row.worldFoot.map((x,i)=>Math.abs(x-first.worldFoot[i])));
 assert.deepEqual(row.root,first.root);
}
assert.ok(callbackError<1e-6);assert.equal(footDelta,0);
const film=JSON.parse(execFileSync('ffprobe',['-v','error','-show_entries','stream=codec_name,codec_type,width,height,r_frame_rate,nb_frames,duration','-of','json',delivery.sourceFilm.path],{encoding:'utf8'}));
const report={utc:new Date().toISOString(),delivery:{path:deliveryPath,sha256:sha(await readFile(deliveryPath))},sourceCommit:raw.sourceCommit,indexSha256:raw.indexSha256,url:raw.url,viewport:raw.viewport,
 verifiedArtifacts:checked.size,artifactHashes:Object.fromEntries(checked),nativeFrames:65,adjacentPairs:60,regionComparisons:180,callbackMaxErrorSeconds:callbackError,footDelta,rootMatricesIdentical:true,seam:recomputed,keyedSourceSeamRGBAMAE:keyedSeam,film,
 decision:'ACCEPT numerical evidence of inherited loop discontinuity; REJECT seamless-loop acceptance. Original matte/fringe/halo and real-time performance remain open.',
 limits:['Lane captures were rehashed and measured, never visually reopened by CXI. This is numerical review, not CXI current-build visual acceptance.','Lower-left rectangle is an unlabelled study region, not a verified tail mask.','The keyed source is an estimated matte from black-composited art, not true alpha ground truth.','Two-second deterministic film does not establish real-time laptop performance.'],imagesViewed:0};
const out=`${root}/reports/v5/CXI/evidence/v8-clover-art-r2-review.json`;await writeFile(out,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({out,verifiedArtifacts:checked.size,nativeFrames:65,regionComparisons:180,seam:recomputed,callbackError,footDelta,decision:report.decision}));
