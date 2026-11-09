// Attribute the one retained Home observation; no browser, battles or new seeds.
import {readFile, writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const root='reports/cardrpg-big/skills-v5',out=root+'/s8/home';
const json=async p=>JSON.parse(await readFile(p,'utf8'));
const sha=b=>createHash('sha256').update(b).digest('hex');
const timelinePath=out+'/session/timeline.json',metricsPath=out+'/metrics.json';
const session=await json(timelinePath),metrics=await json(metricsPath);
assert(session.complete&&session.activeMs>=3600000);
assert.equal(session.artifactSha256,metrics.artifactSha256);
const clip=(a,b,start,end)=>Math.max(0,Math.min(b,end)-Math.max(a,start))/1000;
const count=rows=>rows.reduce((result,id)=>(result[id]=(result[id]??0)+1,result),{});
const encounters=session.encounters.map(e=>{
 const partyIds=new Set(e.setup.cats.map(c=>c.id));
 const actions=e.battle.log.filter(r=>r.kind==='action');
 const partyActions=actions.filter(r=>partyIds.has(r.actorId));
 return {index:e.index,startMs:e.startMs,endMs:e.endMs,seconds:e.wallMs/1000,
  seed:e.setup.seed,chapter:e.setup.chapter,enemies:e.setup.enemies,
  crew:e.setup.cats.map(c=>({id:c.id,skills:c.skills})),rounds:e.battle.round,
  result:e.battle.result,actions:actions.length,partyActions:partyActions.length,
  skillUses:count(partyActions.map(r=>r.skillId??'unknown')),
  battleSha256:sha(JSON.stringify(e.battle))};
});
const capNotices=session.timeline.filter(r=>r.kind==='screen'&&/supplies are gathered/i.test(r.text))
 .map(r=>({atMs:r.atMs,screen:r.screen,label:r.label,
  notice:r.text.split('\n').find(line=>/supplies are gathered/i.test(line))}));
const windows=metrics.metrics.map(m=>{
 const limit=m.minutes*60000;
 const rows=encounters.filter(e=>e.startMs<limit).map(e=>({...e,windowSeconds:clip(e.startMs,e.endMs,0,limit)}));
 const longestGap=[...m.rewardCadence.gaps].sort((a,b)=>b.seconds-a.seconds)[0];
 const battles=rows.filter(e=>clip(e.startMs,e.endMs,longestGap.startMs,longestGap.endMs)>0)
  .map(e=>({index:e.index,seed:e.seed,enemies:e.enemies,result:e.result,rounds:e.rounds,
   actions:e.actions,secondsWithinGap:clip(e.startMs,e.endMs,longestGap.startMs,longestGap.endMs)}));
 const combatSeconds=rows.reduce((n,e)=>n+e.windowSeconds,0);
 assert(Math.abs(combatSeconds-m.deadSeconds)<1e-6);
 return {minutes:m.minutes,combatSeconds,baselineCombatSeconds:m.before.deadSeconds,
  reductionPercent:m.deadReductionPercent,lossCombatSeconds:rows.filter(e=>e.result!=='party').reduce((n,e)=>n+e.windowSeconds,0),
  completedResults:count(rows.filter(e=>e.endMs<=limit).map(e=>e.result)),
  longestGap:{...longestGap,battles,combatSeconds:battles.reduce((n,e)=>n+e.secondsWithinGap,0)},
  longestBattles:[...rows].sort((a,b)=>b.windowSeconds-a.windowSeconds).slice(0,5)};
});
const result={artifactSha256:session.artifactSha256,windows,encounters,capNotices,
 sources:await Promise.all([timelinePath,metricsPath,'packages/game-rules/src/cardrpg/depth/state.ts',
  'apps/web/src/game/cardrpg/depth/star-plans-v4.ts'].map(async path=>({path,sha256:sha(await readFile(path))}))),
 limitations:['Recorded action counts and losses describe the fixed policy; they do not isolate a cause or a safe tuning change.',
  'Combat duration is clipped to each window. A battle crossing its boundary remains included.',
  'Progression can lock ultimates. Earned-route skill availability is separate from the base-stat and matched-power D4 probes.',
  'This reads the original observation only; no new Home run, selected seed, gate or denominator.']};
await writeFile(out+'/attribution.json',JSON.stringify(result,null,2)+'\n');
const m=windows.find(w=>w.minutes===30),g=m.longestGap,n=x=>Number(x).toFixed(2);
const capNote=capNotices.length?`The first recorded daily-supplies notice appears at ${n(capNotices[0].atMs/60000)}active minutes: “${capNotices[0].notice}” (${capNotices[0].screen}). The UI predicate requires every daily currency cap to be reached; grantDepth clips each currency to its remaining allowance. This is direct evidence of the cap boundary in the observed session, separate from the loss/action attribution. Raising caps would also affect the already-missing heavy/casual economy ratio, so no cap increase is applied as an untested cadence repair.`:'No daily-supplies cap notice was recorded.';
await writeFile(root+'/s8/ELAPSED-REVIEW.md',`# S8 elapsed observation attribution\n\nThe original first30minutes contain ${n(m.combatSeconds)}s of combat, including ${n(m.lossCombatSeconds)}s in battles recorded as losses. H0 contains ${n(m.baselineCombatSeconds)}s; the unchanged reduction gate measures ${n(m.reductionPercent)}%. All window boundaries and recorded results are retained.\n\nThe longest reward-or-celebration gap is ${n(g.seconds)}s, from ${n(g.startMs/60000)} to ${n(g.endMs/60000)}active minutes (${g.from} → ${g.to}). Combat occupies ${n(g.combatSeconds)}s of that gap.\n\n${capNote}\n\n|Encounter index|Recorded seed|Enemies|Result|Rounds|Actions|Seconds inside gap|\n|---|---:|---|---|---:|---:|---:|\n${g.battles.map(e=>`|${e.index}|${e.seed}|${e.enemies.join(', ')}|${e.result}|${e.rounds}|${e.actions}|${n(e.secondsWithinGap)}|`).join('\n')}\n\n[All windows, battle hashes, actual skill availability and action counts](home/attribution.json). This attribution does not establish which rule caused the difference. Review actual support opportunities and loss intervals before a future TRAIN change; do not change playback speed, drop losses or repeat the hour without a justified change.\n\n${result.limitations.map(s=>'- '+s).join('\n')}\n`);
console.log(JSON.stringify({minutes:m.minutes,combatSeconds:m.combatSeconds,reductionPercent:m.reductionPercent,longestRewardGap:g.seconds,lossCombatSeconds:m.lossCombatSeconds,samplesRun:0}));
