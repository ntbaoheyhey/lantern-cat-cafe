// Read existing S8 receipts only. No browser launch, combat sampling or runtime changes.
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const root='reports/cardrpg-big/skills-v5/s8';
const json=async p=>JSON.parse(await readFile(p,'utf8'));
const sha=b=>createHash('sha256').update(b).digest('hex');
const startup=await json(root+'/startup/summary.json');
const reg=await json(root+'/performance/REGISTERED-METHOD.json');
const receipts=[];
async function readReceipt(path){const bytes=await readFile(path);receipts.push({path,sha256:sha(bytes)});return JSON.parse(bytes);}
const configs=[];
for(const c of startup.configs){
  const builds={};
  for(const name of ['baseline','candidate']){
    const rows=[];
    for(const r of c.builds[name].rows){
      const x=await readReceipt(r.path);
      assert.deepEqual(x.errors,[]);assert.deepEqual(x.prohibitedModules,[]);assert.deepEqual(x.modelRequests,[]);
      rows.push({path:r.path,taskMs:r.taskMs,scriptMs:r.scriptMs,layoutMs:r.layoutMs,
        chunks:x.chunks.map(({path,bytes,sha256,modules})=>({path,bytes,sha256,modules}))});
    }
    builds[name]={rows,median:c.builds[name].taskMedian,max:c.builds[name].taskMax};
  }
  const canonical=p=>p.includes('\0')?p.slice(p.indexOf('\0')):(p.match(/(?:^|\/)((?:apps|packages|node_modules)\/.*)$/)?.[1]??p);
  const modules=name=>new Set(builds[name].rows[0].chunks.flatMap(c=>c.modules).map(canonical));
  const a=modules('baseline'),b=modules('candidate');
  configs.push({width:c.width,cpu:c.cpu,bytesDelta:c.bytesDelta,
    medianDeltaMs:builds.candidate.median-builds.baseline.median,
    maxDeltaMs:builds.candidate.max-builds.baseline.max,
    addedModules:[...b].filter(p=>!a.has(p)),removedModules:[...a].filter(p=>!b.has(p)),builds});
}
const performance=[];
for(const c of reg.cases){
  const path=root+'/performance/'+c.id+'/checks.json',r=await readReceipt(path);assert(r.complete);
  const x=r.result,casts=x.frames.filter(f=>f.at>=x.begin&&f.at<=x.ended&&f.showBattle&&f.planId!==null&&f.ready);
  const peak=key=>casts.reduce((a,b)=>b[key]>a[key]?b:a);
  const cold=x.frames.filter(f=>f.at<=x.ended).reduce((a,b)=>b.ms>a.ms?b:a);
  const direct=x.battle.initial;
  performance.push({id:c.id,seed:direct.seed,enemies:direct.enemies,cats:direct.cats.map(c=>c.id),
    initialSha256:x.initialSha256,castMaxMs:x.castMaxMs,peakDraws:x.peakDraws,
    battleSeconds:x.battleMs/1000,castMaxFrame:peak('ms'),drawMaxFrame:peak('calls'),coldMaxFrame:cold,
    source:path});
}
const result={configs,performance,receipts,limitations:[
  'Three startup observations per build/configuration. Signed differences retain all outliers; they are not causal estimates or statistical equivalence.',
  'Module identity removes checkout prefixes and preserves repository/node_modules paths and virtual IDs; original chunk paths remain in every row.',
  'Chunk membership can attribute loaded bytes to bundles, not CPU cost to a particular module.',
  'Frame timestamps identify the observed action context; they do not isolate rendering, scheduling or first-use work.',
  'The inherited A renderer differs from lane B presentation drafts. No renderer change or new sample is applied.'
]};
await writeFile(root+'/observation-attribution.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({configs:configs.map(({width,cpu,bytesDelta,medianDeltaMs,maxDeltaMs,addedModules,removedModules})=>({width,cpu,bytesDelta,medianDeltaMs,maxDeltaMs,addedModules:addedModules.length,removedModules:removedModules.length})),performance:performance.map(({id,castMaxMs,peakDraws,drawMaxFrame})=>({id,castMaxMs,peakDraws,peakSkill:drawMaxFrame.skillId}))}));
