// REFERENCE: reports/cardrpg-big/a5/p1/pilot-01/REGISTERED-STARTUP.json.
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const root='reports/cardrpg-big/a5/p1/pilot-01';
const registration=JSON.parse(await readFile(`${root}/REGISTERED-STARTUP.json`,'utf8'));
const median=values=>[...values].sort((a,b)=>a-b)[Math.floor(values.length/2)];
const receipts=[],configs=[];
for(const [width,cpu]of registration.configs){
 const builds={};
 for(const name of ['main','packed']){
  const runs=[];
  for(let run=1;run<=registration.observations;run++){
   const path=`${root}/${name}-${width}-cpu${cpu}-run${run}/checks.json`;
   const bytes=await readFile(path),r=JSON.parse(bytes);
   assert(!r.incomplete);assert.equal(r.harnessSha256,registration.harnessSha256);
   assert.equal(r.buildHead,name==='main'?registration.baseline:registration.candidateRuntime);
   assert.equal(r.cold.width,width);assert.equal(r.cold.cpu,cpu);
   assert.deepEqual(r.errors,[]);assert.deepEqual(r.prohibitedModules,[]);assert.deepEqual(r.modelRequests,[]);
   receipts.push({path,sha256:createHash('sha256').update(bytes).digest('hex')});
   runs.push({run,loadedJsBytes:r.chunks.reduce((n,c)=>n+c.bytes,0),taskMs:r.cold.taskSeconds*1000,
    scriptMs:r.cold.scriptSeconds*1000,layoutMs:r.cold.layoutSeconds*1000,
    frameMaxMs:Math.max(...r.cold.frames),longTaskMaxMs:Math.max(0,...r.cold.longTasks.map(t=>t.duration))});
  }
  assert.equal(new Set(runs.map(r=>r.loadedJsBytes)).size,1);
  builds[name]={runs,loadedJsBytes:runs[0].loadedJsBytes};
  for(const metric of ['taskMs','scriptMs','layoutMs','frameMaxMs','longTaskMaxMs'])
   builds[name][metric]={median:median(runs.map(r=>r[metric])),max:Math.max(...runs.map(r=>r[metric]))};
 }
 const delta=builds.packed.loadedJsBytes-builds.main.loadedJsBytes;
 configs.push({width,cpu,builds,deltaJsBytes:delta,bytesWithin150000:delta<=150000,
  taskMedianNotWorse:builds.packed.taskMs.median<=builds.main.taskMs.median,
  taskMaxNotWorse:builds.packed.taskMs.max<=builds.main.taskMs.max});
}
const summary={registration,receipts,configs,status:'PARTIAL: byte diagnostic PASS against registered main; startup task median/max MISS in some configurations. No production adoption.',
 limitation:'Three observations/config; no equivalence claim. Five-second window includes active default app. Baseline is registered commit340f88b9, not an assertion that origin/main has remained unchanged. Offline artifact and CPU4 are not measured here.'};
await writeFile(`${root}/summary.json`,JSON.stringify(summary,null,2));
const ms=n=>n.toFixed(3);
const lines=['# P1 lossless packing diagnostic 01','','Status: PARTIAL. No production adoption. All 18 originally registered browser observations are retained.','',
 'The default entry did not request V4 or Three modules before this change; a V4 screen split would not remove its measured overhead. The isolated build encodes existing pixel rows/frames and decodes each monster on first use. All 25 monsters, every catalog field, frame and pixel round-trip exactly in Node; browser renderer parity is still NOT VERIFIED.','',
 `Registered main: ${registration.baseline}. Candidate runtime: ${registration.candidateRuntime}, plus the registered build-only transform.`, '',
 '| Configuration | Main task ms median / max | Packed task ms median / max | Loaded JS delta | Task result |',
 '|---|---:|---:|---:|---|'];
for(const c of configs)lines.push(`| ${c.width}, CPU${c.cpu} | ${ms(c.builds.main.taskMs.median)} / ${ms(c.builds.main.taskMs.max)} | ${ms(c.builds.packed.taskMs.median)} / ${ms(c.builds.packed.taskMs.max)} | +${c.deltaJsBytes} | ${c.taskMedianNotWorse&&c.taskMaxNotWorse?'PASS observation':'MISS'} |`);
lines.push('', 'Each row uses three fresh profiles per build, cache disabled, alternating fixed build order, real onboarding click and five seconds of runtime. Every requested JS chunk is verified against its build inventory. Browsers and local servers close between timing leases. No observation was removed or rerolled.','',
 'The byte target passes against the registered baseline (+148,752 <=150,000 bytes), but the small remaining margin and mixed CPU outcomes do not close P1. Default-app timing includes animation and scheduling noise; three observations do not establish statistical equivalence. The 233.4 ms frame gap in packed 1440 run3 remains visible, although the long-task observer reported zero.','',
 'All raw task/script/layout values, frame maxima, long tasks and receipt hashes are in summary.json. Current-main comparison, full browser art parity, offline size and offline CPU4 remain pending. Source artwork, runtime rules, production build config and public demo are unchanged.','');
await writeFile(`${root}/RESULTS.md`,lines.join('\n'));
console.log(JSON.stringify(configs.map(({width,cpu,deltaJsBytes,taskMedianNotWorse,taskMaxNotWorse})=>({width,cpu,deltaJsBytes,taskMedianNotWorse,taskMaxNotWorse}))));
