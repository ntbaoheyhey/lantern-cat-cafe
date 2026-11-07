// REFERENCE: measure.mjs. Recompute the saved frame windows, never replace them.
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const directory=process.argv[2];
assert(directory,'Usage: node audit-cold.mjs measurement-directory');
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const source=await readFile(`${directory}/summary.json`);
const receipt=JSON.parse(source);
assert.equal(hash(await readFile(receipt.artifact)),receipt.sha256);
assert.equal(receipt.rows.length,7);
const files=[];
for(const row of receipt.rows){
 const name=`${row.width}x${row.height}-dpr${row.dpr}-cpu${row.throttle}`;
 const bytes=await readFile(`${directory}/${name}.json`),raw=JSON.parse(bytes);
 assert.deepEqual(raw.errors,[]);
 assert.equal(raw.loadToInteractiveMs,row.loadToInteractiveMs);
 assert.equal(raw.battleReadyMs,row.battleReadyMs);
 for(const [from,expected]of [[0,row],[row.loadToInteractiveMs,row.postInteractive],[row.battleReadyMs,row.postReady]]){
  const values=raw.frames.filter(frame=>frame.at-frame.ms>=from).map(frame=>frame.ms).sort((a,b)=>a-b);
  assert(values.length>0&&values.every(value=>Number.isFinite(value)&&value>0));
  const computed={max:values.at(-1),p95:values[Math.floor(values.length*.95)],above25:values.filter(ms=>ms>25).length,above50:values.filter(ms=>ms>50).length,within20:values.filter(ms=>ms<=20).length/values.length};
  for(const [key,value]of Object.entries(computed))assert(Math.abs(value-expected[key])<1e-7,`${name} ${from} ${key}`);
 }
 files.push({name,sha256:hash(bytes),frames:raw.frames.length,traceSha256:hash(await readFile(`${directory}/${name}-trace.json.gz`))});
}
const max=(rows,field)=>Math.max(...rows.map(field));
const native=receipt.rows.filter(row=>row.throttle===1),cpu=receipt.rows.filter(row=>row.throttle===4);
const metrics={nativeMax:max(native,r=>r.max),cpu4Max:max(cpu,r=>r.max),postInteractiveMax:max(receipt.rows,r=>r.postInteractive.max),postReadyMax:max(receipt.rows,r=>r.postReady.max),cpu4P95:max(cpu,r=>r.p95)};
const range=(rows,field)=>[Math.min(...rows.map(field)),Math.max(...rows.map(field))];
const loading={nativeInteractive:range(native,r=>r.loadToInteractiveMs),cpu4Interactive:range(cpu,r=>r.loadToInteractiveMs),nativeReady:range(native,r=>r.battleReadyMs),cpu4Ready:range(cpu,r=>r.battleReadyMs)};
const gates={wholePage100:Math.max(metrics.nativeMax,metrics.cpu4Max)<=100+1e-6,postInteractive100:metrics.postInteractiveMax<=100+1e-6,cpu4P95_33:metrics.cpu4P95<=33+1e-6};
const audit={recordedAt:new Date().toISOString(),artifactSha256:receipt.sha256,summarySha256:hash(source),frames:files.reduce((n,f)=>n+f.frames,0),metrics,loading,gates,files};
await writeFile(`${directory}/raw-audit.json`,JSON.stringify(audit,null,2));
const n=v=>v.toFixed(1),r=values=>values.map(n).join('–');
await writeFile(`${directory}/CHECKPOINT.md`,`# Seven fresh-page measurements
REFERENCE: summary.json; raw-audit.json; *.json; *-trace.json.gz

Exact HTML SHA256 \`${receipt.sha256}\`. Seven fresh browser contexts with cache disabled, real clicks, raw RAF arrays and separate traces. Independently recomputed ${audit.frames} frames and all page/interactive/ready windows. No page errors. This sample does not replace the exhaustive skill matrix.

| Gate | Observed | Result |
|---|---:|---|
| Whole-page MAX ≤100 ms | Native ${n(metrics.nativeMax)} / CPU4 ${n(metrics.cpu4Max)} ms | ${gates.wholePage100?'PASS':'MISS'} |
| After interaction MAX ≤100 ms | ${n(metrics.postInteractiveMax)} ms | ${gates.postInteractive100?'PASS':'MISS'} |
| CPU4 p95 ≤33 ms | ${n(metrics.cpu4P95)} ms | ${gates.cpu4P95_33?'PASS':'MISS'} |
| After scene ready MAX | ${n(metrics.postReadyMax)} ms | Observation |

Load to hub interaction: native ${r(loading.nativeInteractive)} ms, CPU4 ${r(loading.cpu4Interactive)} ms. Battle ready: native ${r(loading.nativeReady)} ms, CPU4 ${r(loading.cpu4Ready)} ms. CPU throttling affects CPU only. Trace attribution entries overlap and cannot be summed as exclusive work.
`);
console.log(JSON.stringify({frames:audit.frames,metrics,loading,gates}));
