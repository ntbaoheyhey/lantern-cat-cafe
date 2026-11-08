// Summarize every missed cast from retained frames; never launch a browser.
import {readFile, writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import assert from 'node:assert/strict';

const out='reports/cardrpg-look/validation/l7';
const partial=process.argv.includes('--partial');
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const read=async path=>JSON.parse(await readFile(path));
const freeze=await read(`${out}/freeze.json`);
const matrixBytes=await readFile(`${out}/matrix/summary.json`);
const matrix=JSON.parse(matrixBytes);
assert.equal(matrix.sha256,freeze.sha256);
if(!partial){assert(matrix.ended);assert.equal(matrix.rows.length,860);}
const artifact=await readFile(freeze.artifact);
assert.equal(digest(artifact),freeze.sha256);
const payload=artifact.toString().match(/<script id="payload" type="application\/octet-stream">([^<]+)<\/script>/)[1];
const {js}=JSON.parse(gunzipSync(Buffer.from(payload,'base64')).toString());
const sourceLocations={};
for(const [key,path,anchor] of [
  ['sceneLoop','apps/web/src/game/squad/turn3d/scene.ts','private loop=(now:number)=>'],
  ['battleTick','apps/web/src/game/cardrpg/depth/Battle.tsx','const tick = (now: number) =>'],
]){
  const bytes=await readFile(path),source=bytes.toString(),offset=source.indexOf(anchor);
  assert.equal(digest(bytes),freeze.sourceHashes[path]);
  assert(offset>=0&&source.indexOf(anchor,offset+1)===-1);
  sourceLocations[key]={path,sha256:digest(bytes),line:source.slice(0,offset).split('\n').length,anchor};
}
const budgetMisses=(row,s)=>[
  ...(s.max>50?['firstRepeat']:[]),
  ...(row.quality==='high'&&row.dpr===1&&s.within20<.99?['highDpr1']:[]),
  ...(row.cpu===4&&row.quality!=='high'&&s.p95>33?['cpu4BalancedLow']:[]),
  ...(s.calls>250?['draws']:[]),
  ...(s.triangles>150000?['triangles']:[]),
];
const overlaps=(entry,start,end)=>entry.startTime<=end&&entry.startTime+entry.duration>=start;
const profiles=[],verifiedHashes={};
for(const row of matrix.rows){
  if(!row.casts.some(c=>budgetMisses(row,c.summary).length))continue;
  const bytes=await readFile(row.raw);
  assert.equal(digest(bytes),row.rawSha256);
  verifiedHashes[row.raw]=row.rawSha256;
  const raw=JSON.parse(bytes);
  assert.equal(raw.name,row.name);
  assert.deepEqual(raw.action,row.action);
  assert.deepEqual(raw.errors,[]);
  for(const cast of raw.casts){
    const misses=budgetMisses(row,cast.summary);
    if(!misses.length)continue;
    assert.deepEqual(cast.summary,row.casts.find(c=>c.use===cast.use).summary);
    const frames=raw.frames.filter(f=>f.at>=cast.before.at&&f.at<=cast.after.at);
    const times=frames.map(f=>f.ms).sort((a,b)=>a-b);
    const peak=frames.reduce((a,b)=>a.ms>b.ms?a:b);
    assert.equal(times.length,cast.summary.frames);
    assert.equal(peak.ms,cast.summary.max);
    assert.equal(times[Math.floor(times.length*.95)],cast.summary.p95);
    const peakStart=peak.at-peak.ms;
    const longFramesDuringCast=raw.longFrames.filter(e=>overlaps(e,cast.before.at,cast.after.at));
    const callbacks=new Map();
    for(const frame of longFramesDuringCast)for(const script of frame.scripts??[]){
      const position=script.sourceCharPosition;
      const key=JSON.stringify([script.sourceURL,script.sourceFunctionName,position]);
      let item=callbacks.get(key);
      if(!item){
        const excerpt=Number.isInteger(position)&&position>=0&&position<js.length
          ?js.slice(Math.max(0,position-40),position+750):null;
        const sceneLoop=script.sourceURL?.startsWith('blob:')&&script.sourceFunctionName==='loop'
          &&excerpt?.includes('this.post.setQuality')&&excerpt.includes('this.render');
        const battleTick=script.sourceURL?.startsWith('blob:')&&excerpt?.includes('.tick(')
          &&excerpt.includes('.animationAt>=600')&&excerpt.includes('.galleryEffectOnly')
          &&excerpt.includes('.sceneReady=!0')&&excerpt.includes('.ambience/174');
        item={function:script.sourceFunctionName,sourceURL:script.sourceURL,
          sourceCharPosition:position,count:0,maximumRecordedDurationMs:0,
          payloadMapping:sceneLoop?'scene-loop-offset-and-body-match':battleTick?'battle-tick-offset-and-body-match':'unattributed',
          sourceLocation:sceneLoop?sourceLocations.sceneLoop:battleTick?sourceLocations.battleTick:null,
          exactPayloadExcerpt:sceneLoop||battleTick?excerpt:null};
        callbacks.set(key,item);
      }
      item.count++;
      item.maximumRecordedDurationMs=Math.max(item.maximumRecordedDurationMs,script.duration);
    }
    profiles.push({case:row.name,use:cast.use,raw:row.raw,rawSha256:row.rawSha256,
      configuration:[row.width,row.height,row.dpr,row.cpu,row.quality],misses,
      summary:cast.summary,castStart:cast.before.at,castEnd:cast.after.at,peak,
      longTasksOverlappingPeak:raw.longTasks.filter(e=>overlaps(e,peakStart,peak.at)),
      longFramesOverlappingPeak:raw.longFrames.filter(e=>overlaps(e,peakStart,peak.at)),
      longFramesDuringCast:longFramesDuringCast.length,
      callbacksDuringCast:[...callbacks.values()],
    });
  }
}
const counts=Object.fromEntries(['firstRepeat','highDpr1','cpu4BalancedLow','draws','triangles']
  .map(key=>[key,profiles.filter(p=>p.misses.includes(key)).length]));
if(!partial){
  const audit=await read(`${out}/audit.json`);
  assert.equal(audit.artifact,freeze.sha256);
  assert.deepEqual(counts,audit.matrix.misses);
}
const result={at:new Date().toISOString(),artifact:freeze.sha256,complete:!partial,
  cases:matrix.rows.length,matrixSummarySha256:digest(matrixBytes),
  decodedJavaScriptSha256:digest(js),decodedJavaScriptUtf16Length:js.length,
  failedCastWindows:profiles.length,budgetMisses:counts,profiles,verifiedHashes,sourceLocations,
  limitations:[
    'This reads retained raw frames and PerformanceObserver entries, not a new browser run or CPU trace.',
    'Payload excerpts are supplied only for blob callbacks whose recorded UTF-16 offset matches the scene-loop or Battle tick body. Source locations are hash-bound to the frozen input files. Other callbacks remain unattributed.',
    'Matched callback locations do not identify expensive operations or root causes.',
    'Callbacks during a cast are separate from entries overlapping its slowest frame; absent entries do not prove absence of work.',
    'Cross-lane timing isolation remains unverified. Do not causally attribute stalls to rendering or background load.',
    'All applicable misses remain counted, including p95 values above the exact 33 ms threshold.',
  ]};
const file=`${out}/${partial?'cast-profile-progress':'cast-profile-audit'}.json`;
await writeFile(file,JSON.stringify(result,null,2)+'\n');
const reviewFile=`${out}/${partial?'CAST-PROFILE-PROGRESS':'CAST-PROFILE-REVIEW'}.md`;
const review=[
  `# L7 missed cast windows${partial?' — partial observation':''}`,
  '',
  `Artifact \`${freeze.sha256}\`. ${matrix.rows.length}/860 cases; ${profiles.length} distinct missed cast windows. ${partial?'The original matrix is still running; these counts are incomplete.':'All 860 cases completed once; counts match the independent raw-frame audit.'}`,
  '',
  'Every row uses the original cast boundaries. First/repeat maximum must be ≤50 ms; CPU4 Balanced/Low p95 must be ≤33 ms. The exact thresholds are used before display rounding. Draw and triangle limits are 250 and 150,000. Page initialization is reported separately in the interval audit.',
  '',
  '| Raw case / cast | Maximum ms | p95 ms | Frames ≤20 ms | Draws / triangles | Missed budgets |',
  '|---|---:|---:|---:|---:|---|',
  ...profiles.map(p=>`|[${p.case}/${p.use}](${p.raw.slice(out.length+1)})|${p.summary.max.toFixed(1)}|${p.summary.p95.toFixed(1)}|${(p.summary.within20*100).toFixed(2)}%|${p.summary.calls} / ${p.summary.triangles.toLocaleString('en-US')}|${p.misses.join(', ')}|`),
  '',
  'Long-task and long-animation-frame entries are retained observations, not a CPU sampling trace. A matched scene-loop or Battle tick callback identifies its source location but does not identify the expensive operation. Durations below are observations inside the whole cast unless explicitly marked as overlapping the peak.',
  '',
];
for(const p of profiles){
  const mapped=p.callbacksDuringCast.filter(c=>c.payloadMapping==='scene-loop-offset-and-body-match');
  const ticks=p.callbacksDuringCast.filter(c=>c.payloadMapping==='battle-tick-offset-and-body-match');
  const unknown=p.callbacksDuringCast.filter(c=>c.payloadMapping==='unattributed');
  review.push(`- **${p.case}/${p.use}**: slowest frame ends at ${p.peak.at.toFixed(1)} ms and records ${p.peak.calls} draws / ${p.peak.triangles.toLocaleString('en-US')} triangles. ${p.longTasksOverlappingPeak.length} long task(s) overlap that frame (${p.longTasksOverlappingPeak.map(t=>t.duration.toFixed(1)+' ms').join(', ')||'none recorded'}); ${p.longFramesOverlappingPeak.length} long-animation-frame entry/entries overlap it. During the whole cast, ${mapped.reduce((n,c)=>n+c.count,0)} recorded callback(s) match the scene loop, ${ticks.reduce((n,c)=>n+c.count,0)} match Battle tick, and ${unknown.reduce((n,c)=>n+c.count,0)} remain unattributed. Next diagnostic: collect an isolated CPU trace across this exact action and tier, inspect the matching callbacks and any unattributed work, then identify the expensive operation before changing prewarm or rendering. No new timing run was performed for this analysis.`);
}
review.push('',...result.limitations.map(s=>'- '+s),'',`Machine-readable evidence: [${file.split('/').at(-1)}](${file.split('/').at(-1)}). Raw-file and matrix-summary hashes are recorded there.`,'');
await writeFile(reviewFile,review.join('\n'));
console.log(JSON.stringify({file,complete:result.complete,cases:result.cases,
  reviewFile,failedCastWindows:profiles.length,budgetMisses:counts}));
