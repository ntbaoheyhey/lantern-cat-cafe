// REFERENCE: registered H0 journey; read-only aggregation. No runtime/simulation reruns.
import {readFile,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const root='reports/cardrpg-big/a5',out=root+'/h0';
const session=JSON.parse(await readFile(out+'/session/timeline.json','utf8'));
const day7=JSON.parse(await readFile(out+'/day7/checks.json','utf8'));
assert(session.complete&&session.activeMs>=3600000,'Do not publish partial elapsed windows');assert(day7.complete);
assert.equal(session.artifactSha256,day7.artifactSha256);
assert.deepEqual(session.errors,[]);assert.deepEqual(session.remote,[]);
const timeline=session.timeline,windows=[5,30,60];
const seconds=(start,end,limit)=>Math.max(0,Math.min(end,limit)-Math.max(0,start))/1000;
const median=xs=>{const a=[...xs].sort((a,b)=>a-b);return a.length?(a[Math.floor((a.length-1)/2)]+a[Math.floor(a.length/2)])/2:0;};
const unique=xs=>[...new Set(xs)];
const metrics=windows.map(minutes=>{
 const limit=minutes*60000,rows=timeline.filter(r=>r.atMs<=limit),screens=rows.filter(r=>r.kind==='screen');
 const choices=rows.filter(r=>r.kind==='choice-offered'),meaningful=choices.filter(r=>r.meaningful);
 const battleSeconds=session.encounters.reduce((n,e)=>n+seconds(e.startMs,e.endMs,limit),0);
 const readingSeconds=timeline.filter(r=>r.kind==='wait'&&r.reason==='scripted reading allowance').reduce((n,r)=>n+seconds(r.startMs,r.endMs,limit),0);
 return {minutes,meaningfulOffers:meaningful.length,meaningfulCategories:unique(meaningful.map(r=>r.category)),counterfactualOffers:choices.length,
  rewardEvents:rows.filter(r=>r.kind==='reward').length,celebrations:rows.filter(r=>r.kind==='celebration').length,
  battlesStarted:timeline.filter(r=>r.kind==='combat-start'&&r.startMs<limit).length,
  battlesCompleted:session.encounters.filter(e=>e.endMs<=limit).length,
  deadSeconds:battleSeconds,scriptedReadingSeconds:readingSeconds,
  otherElapsedSeconds:minutes*60-battleSeconds-readingSeconds,
  wordsMedian:median(screens.map(r=>r.words)),wordsMax:Math.max(0,...screens.map(r=>r.words)),
  debugControlsMax:Math.max(0,...screens.map(r=>r.debugControls.length)),debugControls:unique(screens.flatMap(r=>r.debugControls.map(c=>c.text))),
  screenVisits:screens.length,screenTypes:unique(screens.map(r=>r.screen)),
  wordCountsByScreen:Object.fromEntries(unique(screens.map(r=>r.screen)).map(screen=>{const a=screens.filter(r=>r.screen===screen);return [screen,{visits:a.length,median:median(a.map(r=>r.words)),max:Math.max(...a.map(r=>r.words))}];})),
 };
});
const boss=day7.encounters.find(e=>e.kind==='boss');assert(boss);
const b=boss.battle,party=b.actors.filter(a=>a.side==='party');
const actor=id=>b.actors.find(a=>a.id===id)?.name??id;
const firstFallen=b.log.find(e=>e.kind==='defeat'&&party.some(a=>a.id===e.targetId));
const hpLossKinds=['damage','dot','shared','reflect'];
const damageByRow=Object.fromEntries(['front','rear'].map(row=>[row,b.log.filter(e=>hpLossKinds.includes(e.kind)&&party.some(a=>a.id===e.targetId&&a.row===row)).reduce((n,e)=>n+e.amount,0)]));
const diagnosis={wallSeconds:boss.wallMs/1000,result:b.result,rounds:b.round,partyChoices:b.choices.length,
 firstFallen:firstFallen?{name:actor(firstFallen.targetId),round:firstFallen.round,source:actor(firstFallen.actorId)}:null,
 damageByRow,plan:b.v4.plan,crews:b.v4.events.filter(e=>e.kind==='crew-active'),
 cats:boss.setup.cats.map(c=>({id:c.id,row:c.row,equipment:c.equipment,stats:c.stats})),
 eventCounts:Object.fromEntries(unique(b.log.map(e=>e.kind)).map(kind=>[kind,b.log.filter(e=>e.kind===kind).length])),
 survivingEnemies:b.actors.filter(a=>a.side==='enemy'&&a.hp>0).map(a=>({name:a.name,hp:a.hp,maxHp:a.maxHp,shield:a.shield})),
 rowAttribution:'Starting and final rows agree for this fixed starter crew; full ordered logs retained. Includes damage, DOT, shared and reflected HP loss; absorbed shield reported separately.',
};
const rewards=timeline.filter(r=>['reward','celebration'].includes(r.kind)&&r.atMs<=1800000).map(r=>r.atMs);
const gapSeconds=[0,...rewards,1800000].slice(1).map((n,i)=>(n-[0,...rewards][i])/1000);
const report={status:'MEASURED',kind:'automation proxies, not a human playtest',artifactSha256:session.artifactSha256,methodFile:out+'/REGISTERED-JOURNEY.md',
 activeMinutes:session.activeMs/60000,started:session.started,ended:timeline.at(-1).wallAt,metrics,
 rewardCadence0to30:{maxGapSeconds:Math.max(...gapSeconds),gaps:gapSeconds},day7:diagnosis,
 limitations:['Counterfactual choice means differing final HP, action count or result on train seeds 1/2/3; it does not establish a win-probability improvement.',
 'Route, boon and event alternatives are recorded but not counted as meaningful without paired outcomes.',
 'Dead time is the registered conservative noninteractive combat proxy; enjoyable automatic animation may still engage a person.',
 'Other elapsed time includes navigation, computation, invitation reveals and browser readiness. It is not silently classified as dead time.',
 'Words include rendered content below the fold, selected option text, and no collapsed details or unselected dropdown choices.',
 'Shared-lock waits are excluded from active minutes; real cafe service time can accrue during these explicitly recorded wall-time handoffs.',
 'The earned day7 fixture is imported through the UI; this reproduces A4 public-command progression, not seven elapsed browser days.'],
 files:await Promise.all(['session/timeline.json','day7/checks.json','REGISTERED-JOURNEY.md'].map(async file=>({file:out+'/'+file,sha256:createHash('sha256').update(await readFile(out+'/'+file)).digest('hex')}))),
};
await writeFile(out+'/metrics.json',JSON.stringify(report,null,2));
await writeFile(out+'/timeline.json',JSON.stringify({...session,day7Receipt:'day7/checks.json'},null,2));
const table=metrics.map(r=>`|0–${r.minutes}|${r.meaningfulOffers}|${r.rewardEvents}|${r.celebrations}|${r.deadSeconds.toFixed(1)}|${r.wordsMedian}/${r.wordsMax}|${r.debugControlsMax}|`).join('\n');
const screenTable=Object.entries(metrics.at(-1).wordCountsByScreen).map(([name,s])=>`|${name}|${s.visits}|${s.median}|${s.max}|`).join('\n');
await writeFile(root+'/H0-FIRST-SESSION.md',`# A5 H0 first-session baseline\n\nMeasured on unchanged A4 P7 artifact \`${session.artifactSha256}\`. These are automation proxies, **not a human playtest**. One fresh save; real clicks; x1; no skip, accelerated time, currency or level injection. Active play ${report.activeMinutes.toFixed(2)} minutes.\n\n|Minutes|Meaningful offers|Rewards|Celebrations|Dead seconds (combat proxy)|Words median/max|Dev controls max|\n|---|---:|---:|---:|---:|---:|---:|\n${table}\n\nThe largest reward-or-celebration gap in minutes 0–30 is ${report.rewardCadence0to30.maxGapSeconds.toFixed(1)} seconds. Counters use committed positive currency/gear/cat differences and visible invitation ceremonies. Unique offer contexts are counted once; changing final HP/actions qualifies independently of changing victory.\n\n|Screen|Visits|Median words|Max words|\n|---|---:|---:|---:|\n${screenTable}\n\n## Day7 defeat reproduction\n\nExact earned P6 save imported by real UI. ${diagnosis.result==='party'?'VICTORY':'DEFEAT'} after **${diagnosis.wallSeconds.toFixed(3)} s**, ${diagnosis.rounds} rounds, ${diagnosis.partyChoices} automatic party actions. First fallen: **${diagnosis.firstFallen?.name}**, round ${diagnosis.firstFallen?.round}, source ${diagnosis.firstFallen?.source}.\n\nPlan: ${diagnosis.plan.focus}/${diagnosis.plan.care}. HP damage by final row: front ${damageByRow.front}, rear ${damageByRow.rear}. Remaining foes: ${diagnosis.survivingEnemies.map(a=>`${a.name} ${a.hp}/${a.maxHp} HP`).join('; ')}. This describes the observed failure; the B1 ablation will test causal explanations.\n\n${diagnosis.cats.map(c=>`- ${actor(c.id)}: ${c.row}; ${c.equipment.join(', ')}.`).join('\n')}\n\nActive crews: ${diagnosis.crews.map(e=>e.text).join(' ')}\n\n## Measurement limits and retained attempts\n\n${report.limitations.map(t=>'- '+t).join('\n')}\n- Attempt1 is retained under h0/session-attempt-1; its equipment-policy loop is a harness failure, excluded from baseline. See registered correction before attempt2.\n\nEvidence: [timeline](h0/timeline.json), [metrics](h0/metrics.json), [day7 full logs](h0/day7/checks.json), [protocol](h0/REGISTERED-JOURNEY.md), [contact sheet](h0/contact.png). No new acceptance seeds were sampled.\n`);
console.log(JSON.stringify({status:report.status,metrics,day7:diagnosis},null,2));
