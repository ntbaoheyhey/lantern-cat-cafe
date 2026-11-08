// REFERENCE: A5 P1 original registered observations. Numerical claims must consume receipts.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const audit=read('reports/cardrpg-big/a5/p1/adoption/audit.json');
test('P1 preserves every registered cold observation and its exact receipt',()=>{
 for(const r of audit.receipts)assert.equal(createHash('sha256').update(readFileSync(r.path)).digest('hex'),r.sha256,r.path);
 const cold=audit.receipts.filter(r=>r.path.includes('/startup/'));
 assert.equal(cold.length,3*3*2);
 for(const c of audit.configs){
  for(const name of ['main','candidate']){
   const runs=c.builds[name].runs;assert.equal(runs.length,3);
   const raw=runs.map(r=>read(`reports/cardrpg-big/a5/p1/adoption/startup/${name}-${c.width}-cpu${c.cpu}-run${r.run}/checks.json`));
   assert.deepEqual(runs.map(r=>r.taskMs),raw.map(r=>r.cold.taskSeconds*1000));
   assert.equal(c.builds[name].taskMs.max,Math.max(...raw.map(r=>r.cold.taskSeconds*1000)));
   assert.equal(c.builds[name].taskMs.median,raw.map(r=>r.cold.taskSeconds*1000).sort((a,b)=>a-b)[1]);
   for(const r of raw)assert.equal(c.builds[name].loadedJsBytes,r.chunks.reduce((n,k)=>n+k.bytes,0));
  }
  assert.equal(c.deltaJsBytes,c.builds.candidate.loadedJsBytes-c.builds.main.loadedJsBytes);
  assert.equal(c.bytesWithin150000,c.deltaJsBytes<=150000);
  assert.equal(c.taskMedianNotWorse,c.builds.candidate.taskMs.median<=c.builds.main.taskMs.median);
  assert.equal(c.taskMaxNotWorse,c.builds.candidate.taskMs.max<=c.builds.main.taskMs.max);
 }
});
test('offline cold gate uses the full measured interval, never the narrower Hub interval',()=>{
 for(const r of audit.offline){
  const raw=read(`reports/cardrpg-big/a5/p1/pilot-07/packed-cpu4-run${r.run}/checks.json`);
  assert.equal(r.fullOpeningAndBattleMaxMs,raw.maxFrameMs);
  assert.equal(r.throughHubMaxMs,raw.loadThroughHubMaxMs);
  assert.equal(raw.artifact.sha256,audit.artifact.sha256);
 }
 assert.equal(audit.offlineColdWithin120,audit.offline.every(r=>r.fullOpeningAndBattleMaxMs<=120));
 assert.equal(audit.artifact.within24MB,audit.artifact.bytes<=24000000);
});
test('functional and historical checks do not erase the original source failure',()=>{
 assert(audit.gates.some(r=>r.name==='typecheck'&&r.code!==0));
 for(const name of ['typecheck','lint','web-unit','rules','e2e','build'])assert.equal(audit.gates.findLast(r=>r.name===name).code,0,name);
 assert.deepEqual(audit.browser.map(r=>r.width),[1280,1440,1024]);
 for(const row of audit.browser){assert.equal(row.captures,10);assert(row.minimumScopedContrast>=4.5);}
 assert.equal(audit.off.sha256,'47477251b3d20ab602bee5c55a56cdd661e111b1386e298e0c9bc67737fecfa3');
 assert.equal(audit.scope.scope,'PASS');
});
