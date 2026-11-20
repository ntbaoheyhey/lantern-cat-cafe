import {chromium} from '../../../../apps/web/node_modules/@playwright/test/index.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
import {gzipSync} from 'node:zlib';
import {open,apply} from './harness.mjs';
const out=process.env.V5_OUT;await mkdir(out,{recursive:true});const rows=[];
const browser=await chromium.launch({channel:'chromium',args:['--use-angle=metal','--enable-precise-memory-info']});
try{const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});await open(page,process.env.V5_ARTIFACT);const cdp=await page.context().newCDPSession(page);
for(const id of ['mochi-4','soot-4','enemy:yarn-giant']){
 await apply(page,{gallery:id,progress:.56});
 await page.evaluate(()=>{
  const s=window.__depthScene,e=s.cardEffects,v=s.view(),f={...v.frame},recipe=e.recipes[f.plan.presentationId??f.plan.skillId];
  window.__isolatedEffectCast=function isolatedEffectCast(n){
   for(let i=0;i<n;i++){f.progress=(i%60)/60;f.elapsed=f.beat.start+f.beat.duration*f.progress;
    e.render(f,recipe,v.actors,s.positions,s.camera,s.post.effectiveQuality,false,v.cardStatuses,3.2,v.cardPresentation,s.statusHeights,s.statusCrowns,1);
   }
  };
  window.__isolatedEffectCast(1200);
 });
 await cdp.send('HeapProfiler.collectGarbage');await cdp.send('HeapProfiler.startSampling',{samplingInterval:128,includeObjectsCollectedByMajorGC:true,includeObjectsCollectedByMinorGC:true});
 await page.evaluate(()=>window.__isolatedEffectCast(600));
 const {profile}=await cdp.send('HeapProfiler.stopSampling');
 let isolated=0;const allocations=[];
 function walk(n,inside=false){inside=inside||n.callFrame.functionName==='isolatedEffectCast';if(inside&&n.selfSize){isolated+=n.selfSize;allocations.push({name:n.callFrame.functionName,bytes:n.selfSize,line:n.callFrame.lineNumber})}for(const c of n.children)walk(c,inside)}walk(profile.head);
 rows.push({id,warmFrames:1200,measuredFrames:600,isolatedSampledBytes:isolated,allocations:allocations.sort((a,b)=>b.bytes-a.bytes)});
 console.log(JSON.stringify(rows.at(-1)));
}
}finally{await browser.close();await writeFile(out+'/allocation.json.gz',gzipSync(JSON.stringify({method:'Synchronous effect render only; preallocated view/frame, no renderer, DOM or RAF harness inside named root. CDP sampling is attribution, a zero sample would not prove absolute zero allocation.',rows})))}
