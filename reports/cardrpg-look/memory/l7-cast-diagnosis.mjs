// Diagnose a retained missed cast. No browser, rebuild, or repeated measurement.
import {readFile, writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import assert from 'node:assert/strict';
const out='reports/cardrpg-look/validation/l7';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const json=async path=>JSON.parse(await readFile(path));
const freeze=await json(`${out}/freeze.json`);
const artifact=await readFile(freeze.artifact);
assert.equal(hash(artifact),freeze.sha256);
const payload=artifact.toString().match(/<script id="payload" type="application\/octet-stream">([^<]+)<\/script>/)[1];
const {js}=JSON.parse(gunzipSync(Buffer.from(payload,'base64')).toString());
const folder=`${out}/matrix/config-5/batch-12`;
const batch=await json(`${folder}/summary.json`);
assert(batch.completed && batch.ended); assert.equal(batch.sha256,freeze.sha256);
const row=batch.rows.find(row=>row.action.id==='panko-1');
assert(row);
const rawPath=`${folder}/${row.name}.json`, bytes=await readFile(rawPath),raw=JSON.parse(bytes);
assert.deepEqual(raw.errors,[]);
const cast=raw.casts.find(c=>c.use==='repeat');
assert.deepEqual(cast.summary,row.casts.find(c=>c.use==='repeat').summary);
const frames=raw.frames.filter(f=>f.at>=cast.before.at&&f.at<=cast.after.at);
const peak=frames.reduce((a,b)=>a.ms>b.ms?a:b);
assert.equal(peak.ms,cast.summary.max); assert.equal(peak.ms,150);
const overlap=item=>item.startTime<=peak.at && item.startTime+item.duration>=peak.at-peak.ms;
const duringCast=item=>item.startTime<=cast.after.at && item.startTime+item.duration>=cast.before.at;
const longFrames=raw.longFrames.filter(duringCast);
const callbacks=longFrames.flatMap(frame=>frame.scripts).map(script=>({
  ...script,sourceExcerpt:js.slice(Math.max(0,script.sourceCharPosition-40),script.sourceCharPosition+750),
}));
const renderCallbacks=callbacks.filter(s=>s.sourceFunctionName==='loop' && s.sourceExcerpt.includes('this.post.setQuality'));
assert(renderCallbacks.length);
const result={at:new Date().toISOString(),artifact:freeze.sha256,
  raw:rawPath,rawSha256:hash(bytes),batchSummary:`${folder}/summary.json`,
  batchSummarySha256:hash(await readFile(`${folder}/summary.json`)),
  case:row.name,use:cast.use,configuration:{width:row.width,height:row.height,dpr:row.dpr,cpu:row.cpu,quality:row.quality},
  summary:cast.summary,castStart:cast.before.at,castEnd:cast.after.at,peak,
  longTasksOverlappingPeak:raw.longTasks.filter(overlap),
  longFramesOverlappingPeak:raw.longFrames.filter(overlap),
  longFramesDuringCast:longFrames,renderCallbacks,
  decodedJavaScriptSha256:hash(js),decodedJavaScriptUtf16Length:js.length,
  attribution:'The unchanged offline loader creates the application Blob directly from payload.js. UTF-16 sourceCharPosition excerpts identify recorded long-animation-frame callbacks as the scene loop using this.post.setQuality and this.render. Corresponding source: apps/web/src/game/squad/turn3d/scene.ts, loop method. This identifies the broad render callback, not an expensive operation or the root cause.',
  limitations:['No long-animation-frame entry overlapping the 150ms peak was delivered in this raw capture; the overlapping long task and adjacent scene-loop entries are retained separately.',
    'No isolated-device timing claim. Background CPU/GPU influence remains unverified; retain both the frame and p95 budget misses.',
    'No new browser trace, source modification, rerun, or causal attribution to a specific shader/model. Profile the scene render callback under verified isolation before selecting a fix.']};
await writeFile(`${out}/cast-diagnosis.json`,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({case:row.name,max:peak.ms,p95:cast.summary.p95,renderCallbacks:renderCallbacks.length,overlappingTasks:result.longTasksOverlappingPeak.length}));
