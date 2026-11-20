// REFERENCE: A5 H0 registered protocol. Verify recorded evidence, never resample outcomes.
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';
const out='reports/cardrpg-big/a5/h0';
const json=async path=>JSON.parse(await readFile(path,'utf8'));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const session=await json(out+'/session/timeline.json'),metrics=await json(out+'/metrics.json');
test('baseline provenance refers to the completed, unchanged real-click artifact',async()=>{
 assert(session.complete);assert(session.activeMs>=3600000);
 const artifact=execFileSync('git',['show','f1b433e89ec4626cb73daff24d35c699bcd94e0d:docs/cardrpg3/index.html'],{maxBuffer:32*1024*1024});
 assert.equal(session.artifactSha256,hash(artifact));
 assert.equal(metrics.artifactSha256,session.artifactSha256);
 assert.deepEqual(session.errors,[]);assert.deepEqual(session.remote,[]);
 for(const row of metrics.files)assert.equal(hash(await readFile(row.file)),row.sha256,row.file);
 for(const row of session.captures){const png=await readFile(row.path);assert.equal(png.readUInt32BE(16),1280);assert.equal(png.readUInt32BE(20),720);}
});
test('every meaningful offer has differing paired TRAIN outcomes',()=>{
 for(const row of session.timeline.filter(r=>r.kind==='choice-offered'&&r.meaningful)){
  const variants=row.options.filter(option=>Array.isArray(option.outcomes)).map(option=>JSON.stringify(option.outcomes));
  assert(variants.length>=2&&new Set(variants).size>1,'Missing paired difference: '+row.category);
 }
});
test('window counts and combat dead-time proxy reconstruct from the raw timeline',()=>{
 for(const row of metrics.metrics){
  const end=row.minutes*60000,events=session.timeline.filter(r=>r.atMs<=end);
  assert.equal(row.meaningfulOffers,events.filter(r=>r.kind==='choice-offered'&&r.meaningful).length);
  assert.equal(row.rewardEvents,events.filter(r=>r.kind==='reward').length);
  assert.equal(row.celebrations,events.filter(r=>r.kind==='celebration').length);
  const overlap=session.encounters.reduce((n,e)=>n+Math.max(0,Math.min(e.endMs,end)-Math.max(0,e.startMs))/1000,0);
  assert(Math.abs(row.deadSeconds-overlap)<1e-8);
 }
 const rewards=session.timeline.filter(r=>['reward','celebration'].includes(r.kind)&&r.atMs<=1800000).map(r=>r.atMs);
 const points=[0,...rewards,1800000],gaps=points.slice(1).map((at,i)=>(at-points[i])/1000);
 assert.deepEqual(metrics.rewardCadence0to30.gaps,gaps);
 assert.equal(metrics.rewardCadence0to30.maxGapSeconds,Math.max(...gaps));
});
test('all six phase checks have intact successful logs',async()=>{
 const gates=await json(out+'/gates/checks.json');
 assert.deepEqual(gates.map(r=>r.name),['typecheck','lint','web-unit','rules','e2e','build']);
 for(const row of gates){assert.equal(row.code,0,row.name);assert.equal(hash(await readFile(row.log)),row.sha256,row.log);}
});
test('completed OFF receipt and unchanged source have intact closure evidence',async()=>{
 const closure=await json(out+'/closure.json');
 assert.deepEqual(closure.off,{offBehavior:'PASS',sha256:'47477251b3d20ab602bee5c55a56cdd661e111b1386e298e0c9bc67737fecfa3',cells:165,routes:8250});
 assert.deepEqual(closure.off,await json(out+'/off/checks.json'));
 for(const [path,expected] of Object.entries(closure.source)){
  assert.equal(hash(execFileSync('git',['show',`f1b433e89ec4626cb73daff24d35c699bcd94e0d:${path}`])),expected,path);
 }
});
