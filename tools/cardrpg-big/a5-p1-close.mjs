// REFERENCE: PROMPT-A5 P1. Close the original registered observations without rerunning them.
import {readFile,writeFile,copyFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const root='reports/cardrpg-big/a5/p1',out=root+'/adoption';
const json=async p=>JSON.parse(await readFile(p,'utf8'));
const hash=b=>createHash('sha256').update(b).digest('hex');
const receipts=[];
async function receipt(path){const bytes=await readFile(path);receipts.push({path,sha256:hash(bytes)});return JSON.parse(bytes);}
const reg=await receipt(out+'/REGISTERED-STARTUP.json');
const gates=await receipt('reports/cardrpg-big/a5/p1-adopted/gates/checks.json');
for(const name of ['typecheck','lint','web-unit','rules','e2e','build']){
 const g=gates.findLast(r=>r.name===name);assert(g&&g.code===0,name);assert.equal(g.head.slice(0,9),reg.candidate);
}
for(const g of gates)assert.equal(hash(await readFile(g.log)),g.sha256,g.log);
const runtimeHead=execFileSync('git',['rev-parse',reg.candidate],{encoding:'utf8'}).trim();
const declared=await receipt(out+'/source.json');
for(const [p,h] of Object.entries(declared.sourceHashes))assert.equal(hash(await readFile(p)),h,p);
const build=await json('/tmp/cardrpg-a5-p1-adopted/build.json');
const artifact=await readFile('/tmp/cardrpg-a5-p1-adopted/index.html');
assert.equal(hash(artifact),build.sha256);assert.equal(artifact.length,build.bytes);
const durableArtifact=root+'/artifact/index.html';
assert.equal(hash(await readFile(durableArtifact)),build.sha256);
// The original build predates a test portability correction and a declaration-only addition.
// Bind every input to the measured build; allow that reviewed test change explicitly.
const sourceChanges=[];
for(const [p,h] of Object.entries(build.sourceHashes)){
 if(hash(await readFile(p))!==h){assert.equal(p,'tools/cardrpg-big/pixel-packing.test.mjs');sourceChanges.push(p);}
}
await copyFile('/tmp/cardrpg-a5-p1-adopted/build.json',out+'/offline-build.json');
const configs=[],median=xs=>[...xs].sort((a,b)=>a-b)[Math.floor(xs.length/2)];
for(const [width,cpu] of reg.configs){
 const builds={};
 for(const name of ['main','candidate']){
  const runs=[];
  for(let run=1;run<=reg.observations;run++){
   const r=await receipt(`${out}/startup/${name}-${width}-cpu${cpu}-run${run}/checks.json`);
   assert(!r.incomplete);assert.equal(r.harnessSha256,reg.harnessSha256);
   assert.equal(r.buildHead,name==='main'?reg.baseline:runtimeHead);
   assert.equal(r.cold.width,width);assert.equal(r.cold.cpu,cpu);
   assert.deepEqual(r.errors,[]);assert.deepEqual(r.prohibitedModules,[]);assert.deepEqual(r.modelRequests,[]);
   runs.push({run,loadedJsBytes:r.chunks.reduce((n,c)=>n+c.bytes,0),taskMs:r.cold.taskSeconds*1000,
    scriptMs:r.cold.scriptSeconds*1000,layoutMs:r.cold.layoutSeconds*1000,
    frameMaxMs:Math.max(...r.cold.frames),longTaskMaxMs:Math.max(0,...r.cold.longTasks.map(t=>t.duration))});
  }
  assert.equal(new Set(runs.map(r=>r.loadedJsBytes)).size,1);
  builds[name]={runs,loadedJsBytes:runs[0].loadedJsBytes};
  for(const metric of ['taskMs','scriptMs','layoutMs','frameMaxMs','longTaskMaxMs'])builds[name][metric]={median:median(runs.map(r=>r[metric])),max:Math.max(...runs.map(r=>r[metric]))};
 }
 const delta=builds.candidate.loadedJsBytes-builds.main.loadedJsBytes;
 configs.push({width,cpu,builds,deltaJsBytes:delta,bytesWithin150000:delta<=150000,
  taskMedianNotWorse:builds.candidate.taskMs.median<=builds.main.taskMs.median,
  taskMaxNotWorse:builds.candidate.taskMs.max<=builds.main.taskMs.max});
}
const offline=[];
for(let run=1;run<=3;run++){
 const r=await receipt(`${root}/pilot-07/packed-cpu4-run${run}/checks.json`);
 assert.equal(r.artifact.sha256,build.sha256);assert.equal(r.passed,true);
 assert.deepEqual(r.errors,[]);assert.deepEqual(r.remote,[]);
 if(run===1){
  const expected=(await receipt(root+'/pilot-04/transport.json')).rows;
  assert.equal(r.restoredAssets.length,expected.length);assert.equal(expected.length,198);
  for(const row of r.restoredAssets){const prior=expected.find(x=>x.key===row.key);assert(prior);assert.equal(row.bytes,prior.decodedBytes);assert.equal(row.sha256,prior.decodedSha256);}
 }
 offline.push({run,fullOpeningAndBattleMaxMs:r.maxFrameMs,throughHubMaxMs:r.loadThroughHubMaxMs,throughSceneMaxMs:r.loadThroughSceneMaxMs,restoredAssets:r.restoredAssets?.length??null,assetParity:run===1?'Measured after timing interval':'Reuses identical artifact hash and original run1 byte audit'});
}
const browser=[];
for(const width of [1280,1440,1024]){
 const p=width===1280?`${root}/pilot-07/flows/browser-1280/checks.json`:`${out}/flows/browser-${width}/checks.json`;
 const r=await receipt(p);assert.equal(r.sha256,build.sha256);assert.equal(r.captures.length,10);
 assert.equal(r.checks.length,5);assert.deepEqual(r.errors,[]);assert.deepEqual(r.remote,[]);
 assert(r.captures.every(c=>c.overflow===0&&c.contrast.every(x=>x.ratio>=4.5)));
 browser.push({width,captures:r.captures.length,checks:r.checks,minimumScopedContrast:Math.min(...r.captures.flatMap(c=>c.contrast.map(x=>x.ratio)))});
}
const lazy=await receipt(out+'/lazy-flows/checks.json');assert(lazy.passed);assert.equal(lazy.sha256,build.sha256);
assert.deepEqual(lazy.errors,[]);assert.deepEqual(lazy.remote,[]);
const h0=await receipt('reports/cardrpg-big/a5/h0/closure.json');
for(const [p,h] of Object.entries(h0.source))assert.equal(hash(await readFile(p)),h,p);
assert.equal(h0.off.sha256,'47477251b3d20ab602bee5c55a56cdd661e111b1386e298e0c9bc67737fecfa3');
const scope=JSON.parse(execFileSync(process.execPath,['tools/cardrpg-big/a5-scope.mjs'],{encoding:'utf8'}));
const summary={status:'PARTIAL: lossless size and functional checks pass; cold performance remains measured, not waived.',runtimeHead,
 artifact:{path:durableArtifact,measuredPath:'/tmp/cardrpg-a5-p1-adopted/index.html',sha256:build.sha256,bytes:build.bytes,within24MB:build.bytes<=24000000},
 registration:reg,configs,offline,offlineColdWithin120:offline.every(r=>r.fullOpeningAndBattleMaxMs<=120),
 browser,lazyChecks:lazy.checks,gates,sourceChanges,off:{...h0.off,ruleFiles:Object.keys(h0.source).length,method:'Exact source parity with completed H0 digest; no unchanged simulation repeated.'},scope,receipts,
 limitations:['Full opening/battle frame interval and narrower through-Hub interval are different; never substitute one for the other.',
 'Three fixed cold observations per configuration are noisy observations, not statistical equivalence.',
 'Targeted captures and scoped contrast only; full Z screenshots/contrast and engagement journey remain pending.',
 'No new balance/progression acceptance or human-playtest claim. Fresh acceptance seeds remain unused.',
 'Public demo remains A4 until Z. All previous failed pilots and original typecheck failure retained.']};
await writeFile(out+'/audit.json',JSON.stringify(summary,null,2));
const fmt=x=>x.toFixed(1);
const lines=['# A5 P1 — lossless size reduction; cold performance still partial','',
 'Bản đóng gói còn 20,82 MB, giảm 5,40 MB so với A4.','Toàn bộ 198 tài nguyên khôi phục đúng từng byte.','Luồng chơi và công cụ đánh giá hoạt động ở ba kích thước màn hình.','Kiểm tra mã đạt; nhịp khựng và một số phép đo CPU vẫn chưa đạt.','Chưa thay bản demo công khai, chưa gộp hay triển khai.','',
 `Source: ${runtimeHead}. Offline SHA-256: ${build.sha256}; ${build.bytes.toLocaleString('en-US')} bytes.`,
 'The A-owned loader defers screens and reviewer panels, packs existing pixel rows, and deduplicates identical model byte ranges. It restores all original assets without changing artwork, combat rules, dependencies or B-owned source. The original layout effect remains.','',
 '| Default configuration | Main task ms median / max | Candidate task ms median / max | Requested JS delta | CPU observation |',
 '|---|---:|---:|---:|---|'];
for(const c of configs)lines.push(`| ${c.width}, CPU${c.cpu} | ${fmt(c.builds.main.taskMs.median)} / ${fmt(c.builds.main.taskMs.max)} | ${fmt(c.builds.candidate.taskMs.median)} / ${fmt(c.builds.candidate.taskMs.max)} | +${c.deltaJsBytes} | ${c.taskMedianNotWorse&&c.taskMaxNotWorse?'PASS':'MISS'} |`);
lines.push('',`Baseline is registered main ${reg.baseline}. Each row contains three fixed, alternating, fresh profiles per build: real onboarding and five seconds of runtime; all individual task/script/layout/frame values remain in [audit.json](p1/adoption/audit.json). No observations are dropped. All requested JavaScript chunks match their build inventory; zero Three/V4/model modules requested on this default path.`,
 '', '| Offline CPU4 run | Through Hub maximum ms | Full opening + battle maximum ms | Full interval <=120 ms |','|---|---:|---:|---|');
for(const r of offline)lines.push(`| ${r.run} | ${fmt(r.throughHubMaxMs)} | ${fmt(r.fullOpeningAndBattleMaxMs)} | ${r.fullOpeningAndBattleMaxMs<=120?'PASS':'MISS'} |`);
lines.push('', 'The full maximum is 266.6 ms: MISS. The smaller Hub numbers do not replace the original cold gate. The offline artifact meets 24 MB and the default requested-JS delta meets +150,000 bytes; neither establishes a CPU improvement.',
 '', 'Validation: typecheck (original failure retained, declaration correction passed), lint, 1,737 web tests, 1,106 rules tests (+2 expected failures/11 skipped), 421 E2E checks and build PASS. Three widths each retain ten targeted captures, zero overflow and scoped contrast >=4.5. Deferred player navigation, reviewer panels and resize behavior pass. The original layout-effect ablation was rejected.',
 '', 'OFF reuses the completed 165-cell/8,250-route digest with all 63 rule input hashes unchanged. Frozen baseline-v1 and all 13 historical sim hashes match; protected/B scope and author checks pass. Six native transport tests and three independent receipt tests pass. Full screenshot pack is reserved for Z. Closure assembly attempts1/2 stopped on the still-pending1024 receipt; original logs remain and the browser was not rerun.',
 '', 'All rejected experiments remain in p1/pilot-01 through pilot-07 and b1; none of their balance code is adopted. Runtime combat stays A4. Public docs/cardrpg3/index.html remains unchanged until Z; the exact measured artifact is archived at [p1/artifact/index.html](p1/artifact/index.html). Remaining A5 balance, day-7 victory, forecast, discoveries, engagement and fresh acceptance are not closed.','');
await writeFile('reports/cardrpg-big/a5/P1-SIZE-STARTUP.md',lines.join('\n'));
console.log(JSON.stringify({status:summary.status,artifact:summary.artifact,configs:configs.map(c=>({width:c.width,cpu:c.cpu,delta:c.deltaJsBytes,median:c.taskMedianNotWorse,max:c.taskMaxNotWorse})),offline}));
