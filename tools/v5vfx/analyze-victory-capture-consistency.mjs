/** Distinguish full-viewport pixels from a later element screenshot of the same UI. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {hash} from './victory-demand-source.mjs';
const root=resolve(import.meta.dirname,'../..'),input=resolve(root,'work/v5/CXV/films/V7-F-victory-demand-production');
const summary=JSON.parse(readFileSync(resolve(root,'reports/v5/CXV/V7-F-victory-demand-production.json')));
const diagnostic=JSON.parse(readFileSync(resolve(root,'reports/v5/CXV/V7-F-victory-composite-diagnostic.json')));
assert(diagnostic.gpuExact&&diagnostic.runs.length===2);
const rect=diagnostic.runs[0].style.rect;assert.deepEqual(rect,diagnostic.runs[1].style.rect);
const crop={x:Math.floor(rect.left),y:Math.floor(rect.top),width:Math.ceil(rect.right)-Math.floor(rect.left),height:Math.ceil(rect.bottom)-Math.floor(rect.top)};
const decode=p=>execFileSync('ffmpeg',['-v','error','-i',p,'-f','rawvideo','-pix_fmt','rgb24','pipe:1'],{maxBuffer:10_000_000});
function difference(a,b,width){
 assert.equal(a.length,b.length);let channels=0,pixels=0,total=0,max=0,x0=Infinity,y0=Infinity,x1=-1,y1=-1;
 for(let i=0;i<a.length;i+=3){let changed=false;for(let j=0;j<3;j++){const d=Math.abs(a[i+j]-b[i+j]);if(d){changed=true;channels++;total+=d;max=Math.max(max,d);}}
  if(changed){pixels++;const x=i/3%width,y=Math.floor(i/3/width);x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}
 }
 return{equal:!channels,changedPixels:pixels,changedChannels:channels,maximum:max,meanAbsoluteDifference:total/a.length,bbox:pixels?[x0,y0,x1,y1]:null};
}
let baselineFull,baselineCrop;const rows=[];
for(const r of summary.runs.filter(r=>r.reduced)){
 const bytes=readFileSync(r.path);assert.equal(bytes.readUInt32BE(16),1280);assert.equal(bytes.readUInt32BE(20),720);
 const full=decode(r.path),element=decode(r.crewPath),cropped=Buffer.alloc(crop.width*crop.height*3);
 for(let y=0;y<crop.height;y++)full.copy(cropped,y*crop.width*3,((crop.y+y)*1280+crop.x)*3,((crop.y+y)*1280+crop.x+crop.width)*3);
 assert.equal(element.length,cropped.length);baselineFull??=full;baselineCrop??=cropped;
 rows.push({trial:r.trial,mode:r.mode,rate:r.rate,path:r.path,pngSha256:hash(bytes),fullSceneRgbSha256:hash(full),fullSceneCrewRgbSha256:hash(cropped),elementRgbSha256:hash(element),elementMatchesFullCrop:difference(cropped,element,crop.width),fullSceneAgainstFirstBaseline:difference(baselineFull,full,1280),fullSceneCropAgainstFirstBaseline:difference(baselineCrop,cropped,crop.width)});
}
const fullSceneHashes=[...new Set(rows.map(r=>r.fullSceneRgbSha256))],fullSceneCrewHashes=[...new Set(rows.map(r=>r.fullSceneCrewRgbSha256))],elementHashes=[...new Set(rows.map(r=>r.elementRgbSha256))];
const report={utc:new Date().toISOString(),source:summary.source,runtimePatchSha256:summary.runtimePatchSha256,buildManifest:summary.buildManifest,viewport:{width:1280,height:720},crop,rectSource:diagnostic.raw,rows,fullSceneHashes,fullSceneCrewHashes,elementHashes,fullSceneExact:fullSceneHashes.length===1,fullSceneCrewExact:fullSceneCrewHashes.length===1,elementExact:elementHashes.length===1,limits:'Full-frame comparisons use original unmodified1280x720 production captures. Crew crop geometry comes from the subsequent matching-layout production diagnostic; the whole-frame comparison does not depend on that geometry. Element screenshots were requested after full-page screenshots and can differ independently. This analysis never changes or regenerates the original evidence.',interpretation:null};
const output=resolve(root,'reports/v5/CXV/V7-F-victory-capture-consistency.json');writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({output,fullSceneExact:report.fullSceneExact,fullSceneCrewExact:report.fullSceneCrewExact,elementExact:report.elementExact,rows:rows.map(r=>({trial:r.trial,mode:r.mode,rate:r.rate,full:r.fullSceneAgainstFirstBaseline,element:r.elementMatchesFullCrop}))}));
