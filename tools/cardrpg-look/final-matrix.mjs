// Staged for tools/cardrpg-look. One matrix on the frozen L7 artifact;
// 86 valid action fixtures on25 owners, NOT invalid action/rig cross-products.
import {spawn} from 'node:child_process';
import {readFile,writeFile,mkdir,access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {withTimingLock} from './lock.mjs';
const out='reports/cardrpg-look/validation/l7/matrix';
const configs=[
 [1280,720,1,1,'high'],[1440,900,1,1,'high'],
 [1280,720,2,1,'high'],[1440,900,2,1,'high'],
 [1280,720,1,4,'medium'],[1440,900,1,4,'medium'],
 [1280,720,2,4,'medium'],[1440,900,2,4,'medium'],
 [1280,720,1,4,'low'],[1440,900,1,4,'low'],
];
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const json=async path=>JSON.parse(await readFile(path));
const freeze=await json('reports/cardrpg-look/validation/l7/freeze.json');
assert.equal(freeze.sourceAccepted,true,'Finish UI and source gates before the one final matrix');
const artifact=freeze.artifact,sha=freeze.sha256;
const verify=async()=>{
 assert.equal(hash(await readFile(artifact)),sha,'Frozen HTML changed');
 for(const [path,want]of Object.entries(freeze.sourceHashes))assert.equal(hash(await readFile(path)),want,path);
};
await verify();await mkdir(out,{recursive:true});
const exists=path=>access(path).then(()=>true,()=>false);
if(await exists(`${out}/summary.json`)){
 const previous=await json(`${out}/summary.json`);
 assert.equal(previous.sha256,sha,'Do not repeat a final matrix on a different artifact');
 assert(!previous.ended,'Final matrix already complete; do not repeat it');
}
const receipt={artifact,sha256:sha,started:freeze.matrixStarted??new Date().toISOString(),configurations:configs,
 method:'One immutable artifact; each valid gallery action gets a fresh page and first/repeat casts. Fixed requested quality, observed every frame. Six actions per shared-lock window,6.5s handoff. Screenshots are measured separately.',rows:[],batches:[]};
let actions;
const run=(env)=>new Promise((resolve,reject)=>{
 const child=spawn(process.execPath,['tools/cardrpg-look/skill-measure.mjs'],{stdio:'inherit',env:{...process.env,...env}});
 child.once('error',reject);child.once('close',code=>code===0?resolve():reject(Error(`Skill measurement exited${code}`)));
});
for(const [configIndex,config]of configs.entries())for(let offset=0;!actions||offset<actions.length;offset+=6){
 await verify();
 const folder=`${out}/config-${configIndex}/batch-${offset}`;
 const ids=actions?.slice(offset,offset+6).map(row=>row.id);
 let batch;
 if(await exists(`${folder}/summary.json`)){
  batch=await json(`${folder}/summary.json`);
  assert(batch.ended && batch.completed,'Incomplete attempt exists: inspect and preserve it before an explicit continuation');
 }else{
  await withTimingLock(`LOOK final matrix config${configIndex+1} actions${offset+1}–${Math.min(86,offset+6)}`,()=>run({
   BIG_ARTIFACT:artifact,BIG_SKILL_OUT:folder,BIG_SKILL_CONFIGS:JSON.stringify([config]),
   BIG_SKILL_OWNERS:'',BIG_SKILL_IDS:ids?.join(',')??'',BIG_SKILL_LIMIT:ids?'':'6',
  }));
  batch=await json(`${folder}/summary.json`);
 }
 actions??=batch.fullGalleryActions;
 assert.equal(actions.length,86);assert.equal(new Set(actions.map(row=>row.owner)).size,25);
 assert.deepEqual(batch.fullGalleryActions,actions);assert.equal(batch.sha256,sha);assert(batch.ended && batch.completed);
 const expected=actions.slice(offset,offset+6).map(row=>row.id);
 assert.deepEqual(batch.rows.map(row=>row.action.id),expected);
 for(const row of batch.rows){
  assert.deepEqual([row.width,row.height,row.dpr,row.cpu,row.quality],config);assert.deepEqual(row.errors,[]);assert.equal(row.casts.length,2);
  for(const cast of row.casts){assert.equal(cast.before.quality,config[4]);assert.equal(cast.after.quality,config[4]);assert.deepEqual(cast.summary.qualities,[config[4]]);assert(cast.summary.frames>0);}
  row.raw=`${folder}/${row.name}.json`;row.rawSha256=hash(await readFile(row.raw));
 }
 receipt.rows.push(...batch.rows);receipt.batches.push({configIndex,offset,summary:`${folder}/summary.json`,sha256:hash(await readFile(`${folder}/summary.json`))});
 receipt.actions=actions;receipt.completed=receipt.rows.length;
 assert.equal(new Set(receipt.rows.map(row=>row.name)).size,receipt.rows.length);
 await writeFile(`${out}/summary.json`,JSON.stringify(receipt,null,2)+'\n');
 console.log(JSON.stringify({matrix:receipt.completed,total:860,config:configIndex+1}));
}
await verify();assert.equal(receipt.rows.length,860);
const casts=receipt.rows.flatMap(row=>row.casts.map(cast=>({name:row.name,dpr:row.dpr,cpu:row.cpu,quality:row.quality,use:cast.use,...cast.summary})));
receipt.misses={firstRepeat:casts.filter(row=>row.max>50),highDpr1:casts.filter(row=>row.quality==='high'&&row.dpr===1&&row.within20<.99),cpu4BalancedLow:casts.filter(row=>row.cpu===4&&row.quality!=='high'&&row.p95>33),draws:casts.filter(row=>row.calls>250),triangles:casts.filter(row=>row.triangles>150000)};
receipt.metrics={owners:25,actions:86,configurations:10,cases:860,casts:casts.length,maxFrameMs:Math.max(...casts.map(row=>row.max)),maxCalls:Math.max(...casts.map(row=>row.calls)),maxTriangles:Math.max(...casts.map(row=>row.triangles))};
receipt.ended=new Date().toISOString();await writeFile(`${out}/summary.json`,JSON.stringify(receipt,null,2)+'\n');
console.log(JSON.stringify({complete:true,metrics:receipt.metrics,misses:Object.fromEntries(Object.entries(receipt.misses).map(([key,rows])=>[key,rows.length]))}));
