// Read completed S8 observations and retain every unmet threshold; no new samples.
import {readFile,appendFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const root='reports/cardrpg-big/skills-v5',out=root+'/s8';
const json=async p=>JSON.parse(await readFile(p,'utf8'));
const [o,home,startup,audit]=await Promise.all([json(out+'/observations.json'),json(out+'/home/metrics.json'),json(out+'/startup/summary.json'),json(out+'/audit.json')]);
assert.equal(audit.status,'PASS');
const m=home.metrics.find(r=>r.minutes===30),rows=[];
const add=(id,pass,target,before,after,source,hypotheses,next)=>rows.push({id,pass,target,before,after,source,hypotheses,next});
add('reward-cadence',o.home.rewardCadence==='PASS','30-minute reward gap <=300s','Home03 723s',m.rewardCadence.maxGapSeconds+'s','home/metrics.json','1. Long loss/retry intervals; 2. fixed bot upgrade policy; 3. sparse visible rewards in the reached route.','Attribute the longest retained gap to its exact route and outcome before changing rewards. No second hour without a justified change.');
add('combat-dead-time',o.home.deadTimeReduction==='PASS','combat walltime reduction >=40%','Home03 2.0%',m.deadReductionPercent+'%','home/metrics.json','1. More actions from helpers and support; 2. repeated losses; 3. the natural playback clock.','Compare action counts and losses in the original timeline. Broad cooldown changes remain rejected; no unmeasured speed change.');
add('meaningful-offers',o.home.meaningfulChoices==='PASS','>=5 distinct-outcome offers at 30 minutes','Home03 73',m.meaningfulOffers,'home/metrics.json','1. Fewer reached interludes; 2. saturated counterfactual outcomes; 3. fixed bot choice policy.','Inspect the retained choice rows and keep the original counterfactual criterion.');
add('public-controls',o.home.playerControls==='PASS','zero visible developer controls or seed labels','C1 pass',`${m.debugControlsMax} controls / ${m.seedLabelsMax} seed labels`,'home/metrics.json','1. Incorrect dev gating; 2. hidden details counted as visible; 3. stale page state.','Trace any named visible control to its exact recorded screen before a UI-only repair.');
add('first-fight',o.firstFight.pass,'first fight won in <=25s','A5 13.067–13.139s',o.firstFight,'home/session/timeline.json','1. Opening load; 2. extra combat actions; 3. first-use rendering work.','Separate load time from action playback using the original event timeline.');
add('earned-boss',o.day7.bossVictory&&o.day7.boss45to90s,'earned day7 boss won in 45–90s','A5 paired fixture 64.921s',o.day7,'day7/checks.json','1. Helper/sustain action count; 2. earned crew power; 3. route outcome before reaching the boss.','Inspect the fixed account route and actual boss actions; no best-account selection or rounds-to-seconds substitution.');
for(const [name,bosses] of [['fixed',o.sampledBosses],['home',o.homeBosses]]){
 assert(Array.isArray(bosses));
 add('boss-pacing-'+name,bosses.length>0&&bosses.every(r=>r.seconds>=45&&r.seconds<=90),'every observed boss45–90s; fixed and Home pools reported separately','General V5 boss target45–90s',bosses,'observations.json','1. Helper/sustain action count; 2. party kit and earned power; 3. first-use loading before playback.','Inspect the exact retained boss actions and report every loss. This additional report of the original general pacing target does not replace the earned-day7 gate or change the registered self-score.');
}
add('native-casts',o.performance.nativeCastPass,'native active cast max <=16.8ms','Earlier B fixture evidence is a separate renderer',o.performance.nativeCastMax+'ms','observations.json','1. Native rendering work; 2. main-thread scheduling; 3. first-use work during a ready action.','Attribute the exact retained frame and notify lane B before renderer work; B-owned paths stay untouched.');
add('draws',o.performance.drawPass,'peak draw calls <=130','Earlier B fixture evidence is a separate renderer',o.performance.peakDraws,'observations.json','1. Helper count; 2. overlapping effects; 3. visible actor geometry.','Provide the exact peak fixture/action to lane B; do not omit helpers from the test.');
add('offline-cold',o.performance.coldPass,'offline CPU4 opening max <=120ms','A4 166.6ms',o.performance.coldCPU4Max+'ms','performance/opening-cpu4/checks.json','1. Renderer compilation/upload; 2. JS decode/evaluation; 3. scheduler variance in the single observation.','Inspect original cold frames and retain the sample. A measured runtime change is required before any new profile.');
add('offline-size',o.size.targetPass&&o.size.v5DeltaPass,'offline <=24MB and V5 delta <=1.5MB','A5 20,929,841 bytes',o.size,'observations.json','1. Embedded art; 2. duplicated bundle content; 3. new rules/copy payload.','Attribute actual byte growth by the bound manifest before a packaging-only change.');
for(const c of startup.configs)for(const key of ['bytes','median','max']){
 const pass=c[key+'Pass'],metric=key==='bytes'?'bytes':key==='median'?'taskMedian':'taskMax';
 add(`startup-${c.width}-cpu${c.cpu}-${key}`,pass,key==='bytes'?'loaded JS delta <=150000 bytes':'candidate task CPU '+key+' <= current main',c.builds.baseline[metric],c.builds.candidate[metric],'startup/summary.json','1. Different loaded modules or evaluation; 2. native scheduling variance; 3. initialization work after the onboarding click.','Use all three original paired observations and their chunk membership. Do not reroll an outlier or claim statistical equivalence.');
}
let text=await readFile(root+'/FIXLOG.md','utf8'),added=0;
for(const r of rows.filter(r=>!r.pass)){
 const heading=`## S8-GATE ${r.id} — PARTIAL`;
 if(text.includes(heading))continue;
 const entry=`\n${heading}\n- Reproduce: the single registered observation in \`s8/${r.source}\`; aggregate with \`node tools/cardrpg-big/skills-v5/s8-report.mjs\`. Unchanged gate: ${r.target}.\n- Measure: before ${JSON.stringify(r.before)}; observed ${JSON.stringify(r.after)}. Historical evidence is not substituted for current measurements.\n- Ranked hypotheses (not established causes): ${r.hypotheses}\n- Smallest next fix: ${r.next} This report does not apply a runtime change or run a new sample.\n- Verification/status: S8 six source gates and OFF8250/fallback180+45 compatibility remain exact in \`s8/audit.json\`; all affected observations are retained in \`s8/observations.json\`. **PARTIAL / MISS**; revisit the original evidence before S6, without moving gates.\n`;
 await appendFile(root+'/FIXLOG.md',entry);text+=entry;added++;
}
console.log(JSON.stringify({observedGates:rows.length,misses:rows.filter(r=>!r.pass).length,entriesAdded:added,samplesRun:0}));
