import assert from 'node:assert/strict';
import {writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {labelSearchSources,loadLabelSearch,root} from './label-search-prototype.mjs';
const sources=labelSearchSources(),baseline=loadLabelSearch(sources.original).layoutLabels,pruned=loadLabelSearch(sources.pruned).layoutLabels;
let seed=0x71a8f37;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};
const cases=[];
for(let sample=0;sample<1000;sample++){
 const input=[],obstacles=[],count=sample%13;
 for(let i=0;i<count;i++){
  const x=sample%5===0?640+(random()-.5)*100:random()*1500-100,y=sample%5===0?350+(random()-.5)*100:random()*900-90;
  input.push({id:'unit-'+i,x,y,height:24+Math.floor(random()*90),head:{x:x-20-random()*80,y:y-20-random()*80,width:25+random()*220,height:30+random()*280}});
 }
 for(let i=0;i<sample%6;i++)obstacles.push({x:random()*1280,y:random()*720,width:random()*300,height:random()*300});
 if(sample%19===0)obstacles.push({x:0,y:0,width:1280,height:720});
 cases.push({name:'seeded-'+sample,args:[input,1280,720,[90,110,114,138,150][sample%5],obstacles]});
}
for(const x of [-Infinity,-0,0,640,Infinity,NaN])cases.push({name:'numeric-'+String(x),args:[[{id:'a',x,y:320,height:40,head:{x:600,y:300,width:80,height:90}}],1280,720,110,[]]});
for(const row of cases){const before=structuredClone(row.args);assert.deepEqual([...pruned(...row.args)],[...baseline(...row.args)],row.name);assert.deepEqual(row.args,before,'Input mutated:'+row.name);}
const med=v=>[...v].sort((a,b)=>a-b)[Math.floor(v.length/2)],timings=[];
for(const mode of ['baseline','pruned','pruned','baseline','baseline','pruned']){
 const fn=mode==='baseline'?baseline:pruned;let placed=0;const start=performance.now();
 for(let repeat=0;repeat<3;repeat++)for(const row of cases)placed+=fn(...row.args).size;
 timings.push({mode,ms:performance.now()-start,placed});
}
const out=resolve(root,'work/v5/CXV/films/V7-F-label-search');await mkdir(out,{recursive:true});
const report={utc:new Date().toISOString(),pass:true,cases:cases.length,sourcePath:sources.sourcePath,baselineRef:sources.baselineRef,originalSha256:sources.originalSha256,prunedSha256:sources.prunedSha256,viewport:{width:1280,height:720},timings,baselineMedianMs:med(timings.filter(r=>r.mode==='baseline').map(r=>r.ms)),prunedMedianMs:med(timings.filter(r=>r.mode==='pruned').map(r=>r.ms)),limits:'Deterministic exact oracle and Node microbenchmark only; no browser/ordinary-play gain established. Inputs use numeric records; source remains unchanged.'};
await writeFile(resolve(out,'micro.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
