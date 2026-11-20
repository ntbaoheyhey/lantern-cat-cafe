// REFERENCE: PROMPT-A5 E2/E3/Z. Aggregate the original elapsed journey; never replay or resample.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
const out='reports/cardrpg-big/a5/engagement/home-03';
const json=async path=>JSON.parse(await readFile(path,'utf8'));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const reg=await json(out+'/REGISTERED-METHOD.json');
const session=await json(out+'/session/timeline.json');
const baseline=await json('reports/cardrpg-big/a5/h0/metrics.json');
assert(session.complete&&session.activeMs>=3600000,'Retain the original browser until 60 active minutes complete.');
assert.equal(session.artifactSha256,reg.artifactSha256);
assert.equal(sha(await readFile(reg.artifact)),reg.artifactSha256);
assert.equal(sha(await readFile(reg.script)),reg.scriptSha256);
assert.deepEqual(session.errors,[]);assert.deepEqual(session.remote,[]);
for(const [path,hash] of Object.entries(reg.source))assert.equal(sha(await readFile(reg.sourceRoot+'/'+path)),hash,path);
const timeline=session.timeline;
const seconds=(start,end,limit)=>Math.max(0,Math.min(end,limit)-Math.max(0,start))/1000;
const median=xs=>{const a=[...xs].sort((a,b)=>a-b);return a.length?(a[Math.floor((a.length-1)/2)]+a[Math.floor(a.length/2)])/2:0;};
const unique=xs=>[...new Set(xs)];
const metrics=[5,30,60].map(minutes=>{
 const limit=minutes*60000,events=timeline.filter(r=>r.atMs<=limit),screens=events.filter(r=>r.kind==='screen');
 const offers=events.filter(r=>r.kind==='choice-offered'),meaningful=offers.filter(r=>r.meaningful);
 const deadSeconds=session.encounters.reduce((n,e)=>n+seconds(e.startMs,e.endMs,limit),0);
 const readingSeconds=timeline.filter(r=>r.kind==='wait'&&r.reason==='scripted reading allowance').reduce((n,r)=>n+seconds(r.startMs,r.endMs,limit),0);
 const rewards=events.filter(r=>['reward','celebration'].includes(r.kind)).sort((a,b)=>a.atMs-b.atMs||a.index-b.index);
 const boundaries=[{atMs:0,label:'session start'},...rewards,{atMs:limit,label:'window end'}];
 const gaps=boundaries.slice(1).map((row,i)=>({seconds:(row.atMs-boundaries[i].atMs)/1000,
  from:boundaries[i].label??boundaries[i].text??boundaries[i].type,to:row.label??row.text??row.type,
  startMs:boundaries[i].atMs,endMs:row.atMs}));
 const old=baseline.metrics.find(r=>r.minutes===minutes);assert(old);
 return {minutes,meaningfulOffers:meaningful.length,meaningfulCategories:unique(meaningful.map(r=>r.category)),
  counterfactualOffers:offers.length,rewardEvents:events.filter(r=>r.kind==='reward').length,
  celebrations:events.filter(r=>r.kind==='celebration').length,
  discoveryCards:events.filter(r=>r.kind==='celebration'&&r.type==='discovery').length,
  battlesStarted:timeline.filter(r=>r.kind==='combat-start'&&r.startMs<limit).length,
  battlesCompleted:session.encounters.filter(e=>e.endMs<=limit).length,
  deadSeconds,scriptedReadingSeconds:readingSeconds,otherElapsedSeconds:minutes*60-deadSeconds-readingSeconds,
  deadReductionPercent:100*(old.deadSeconds-deadSeconds)/old.deadSeconds,
  rewardCadence:{maxGapSeconds:Math.max(...gaps.map(r=>r.seconds)),gaps,overFiveMinutes:gaps.filter(r=>r.seconds>300)},
  debugControlsMax:Math.max(0,...screens.map(r=>r.debugControls.length)),
  seedLabelsMax:Math.max(0,...screens.map(r=>r.seedLabels.length)),
  overflowMax:Math.max(0,...screens.map(r=>r.overflow)),
  wordsMedian:median(screens.map(r=>r.words)),wordsMax:Math.max(0,...screens.map(r=>r.words)),
  wordCountsByScreen:Object.fromEntries(unique(screens.map(r=>r.screen)).map(screen=>{
   const words=screens.filter(r=>r.screen===screen).map(r=>r.words);return [screen,{visits:words.length,median:median(words),max:Math.max(...words)}];
  })),
  before:{meaningfulOffers:old.meaningfulOffers,rewardEvents:old.rewardEvents,celebrations:old.celebrations,
   deadSeconds:old.deadSeconds,debugControlsMax:old.debugControlsMax},
 };
});
const last=metrics.find(row=>row.minutes===30);
const gates={meaningfulChoices:last.meaningfulOffers>=5?'PASS':'MISS',
 rewardCadence:last.rewardCadence.maxGapSeconds<=300?'PASS':'MISS',
 deadTimeReduction:last.deadReductionPercent>=40?'PASS':'MISS',
 playerControls:last.debugControlsMax===0&&last.seedLabelsMax===0?'PASS':'MISS'};
const leases=timeline.filter(r=>r.kind==='lease-start').map(start=>{
 const end=timeline.find(r=>r.kind==='lease-end'&&r.leaseNumber===start.leaseNumber);assert(end);
 const durationMs=end.atMs-start.atMs;assert(durationMs<1200000,'Shared lease exceeded 20 minutes');
 return {number:start.leaseNumber,startMs:start.atMs,endMs:end.atMs,durationMs,wallStart:start.wallAt,wallEnd:end.wallAt};
});
const evidence=[out+'/REGISTERED-METHOD.json',out+'/REGISTERED-METHOD.md',out+'/session/timeline.json',
 'reports/cardrpg-big/a5/h0/metrics.json',reg.script];
const report={kind:'Automated engagement proxies, not a human playtest or fresh acceptance',runtime:reg.runtimeSource,
 artifactSha256:reg.artifactSha256,activeMinutes:session.activeMs/60000,metrics,gates,leases,
 captures:session.captures.map(r=>({path:r.path,label:r.label,atMs:r.atMs})),
 files:await Promise.all(evidence.map(async path=>({path,sha256:sha(await readFile(path))}))),
 limitations:[
  'Choice offers differ in final HP, actions or result at seeds 1/2/3; these are not distinct strategy ideas or estimated causal win gains.',
  'H0 and A5 use the same automated reading allowances. New opening, rewards, click controls and closed-details visibility are explicit protocol adaptations.',
  'Historical H0 word counts include an imperfect closed-details visibility check. Use the separate paired C1 copy audit for before/after copy claims.',
  'Noninteractive battle walltime is the registered dead-time proxy. Other elapsed time is not silently classified as dead time.',
  'Discovery timestamps are DOM observation times; chronological reward sorting precedes gap calculation.',
  'Browser lifecycle freezes at lock handoffs, but cafe service uses real walltime. This is not an isolated causal comparison of one mechanic.',
  'The script records offered choices and takes a fixed policy. It does not prove that a new human understands each choice or follows advice.',
  'Home primary chooses the route; the fixed policy reviews one affordable lowest-level teammate upgrade and chooses the first available named crew option. UI and policy changed together; this is not a causal comparison or human retention evidence.',
 ]};
await writeFile(out+'/metrics.json',JSON.stringify(report,null,2)+'\n');
const rows=metrics.map(r=>`|0–${r.minutes}|${r.before.meaningfulOffers} → ${r.meaningfulOffers}|${r.before.rewardEvents} → ${r.rewardEvents}|${r.before.celebrations} → ${r.celebrations}|${r.before.deadSeconds.toFixed(1)} → ${r.deadSeconds.toFixed(1)}|${r.deadReductionPercent.toFixed(1)}%|${r.rewardCadence.maxGapSeconds.toFixed(1)}|`).join('\n');
await writeFile('reports/cardrpg-big/a5/E2-INFORMED-ENGAGEMENT.md',`# Informed A5 elapsed engagement03\n\nOne original persistent browser completed ${report.activeMinutes.toFixed(2)} active minutes, using real UI clicks, x1 automatic fights, and no skip, imported save, grants or clock changes. Source ${reg.runtimeSource}; artifact ${reg.artifactSha256}. These are automated proxies, not a human playtest.\n\n|Window|Choice offers H0 → A5|Rewards|Celebrations|Combat dead seconds|Dead-time reduction|Largest A5 reward gap seconds|\n|---|---:|---:|---:|---:|---:|---:|\n${rows}\n\nAt30minutes: ≥5meaningful offers **${gates.meaningfulChoices}**; reward-or-celebration gap≤5minutes **${gates.rewardCadence}**; dead-time reduction≥40% **${gates.deadTimeReduction}**. H0's largest30minute gap was ${baseline.rewardCadence0to30.maxGapSeconds.toFixed(1)}seconds. No numeric gate is relaxed.\n\nDeveloper controls and seed labels: ${last.debugControlsMax}/${last.seedLabelsMax}; maximum recorded horizontal overflow ${last.overflowMax}px. This is a single1280×720 journey, not the Z screenshot pack or a new global contrast audit.\n\n${last.rewardCadence.overFiveMinutes.map(g=>`- Gap ${(g.startMs/60000).toFixed(2)}–${(g.endMs/60000).toFixed(2)}min: ${g.seconds.toFixed(1)}seconds, ${g.from} → ${g.to}.`).join('\n')||'No reward-or-celebration gap exceeded five minutes in this measured window.'}\n\n## Interpretation limits\n\n${report.limitations.map(s=>'- '+s).join('\n')}\n\n[Registered protocol](engagement/home-03/REGISTERED-METHOD.md) · [full timeline and battles](engagement/home-03/session/timeline.json) · [audited metrics](engagement/home-03/metrics.json). All previous H0 receipts remain unchanged. Fresh acceptance seeds20001–20500 remain unused.\n`);
console.log(JSON.stringify({activeMinutes:report.activeMinutes,gates,metrics:metrics.map(({rewardCadence,wordCountsByScreen,...r})=>({...r,maxGapSeconds:rewardCadence.maxGapSeconds}))}));
