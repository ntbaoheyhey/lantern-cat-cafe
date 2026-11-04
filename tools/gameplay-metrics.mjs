// Reproducible summaries of actual wall-clock guest records; no inferred retention claims.
import {readFileSync,writeFileSync} from 'node:fs';
const read=n=>JSON.parse(readFileSync(new URL(`../reports/gameplay/${n}`,import.meta.url)));
const summarise=d=>{
 const start=Date.parse(d.start),claims=d.events.filter(e=>e.type==='claimed'),time=e=>e?(e.at-start)/1000:null;
 const rewards=claims.filter(e=>e.gains.fish||e.gains.xp||e.gains.items.length);
 const firstDrop=claims.find(e=>e.gains.items.length),boss=d.actions.find(a=>a.name==='First boss attempt'&&a.ok);
 const fights=d.events.filter(e=>e.type==='bossFight').map(e=>({won:e.result.won,durationSeconds:Math.max(...e.result.timeline.map(t=>t.t))/1000,keySpent:e.result.keySpent,catDamage:[...new Set(e.result.timeline.filter(t=>t.type==='impact').map(t=>t.damage))],bossDamage:[...new Set(e.result.timeline.filter(t=>t.type==='boss_impact').map(t=>t.damage))],remainingBossHp:e.result.timeline.filter(t=>t.bossHp!==undefined).at(-1)?.bossHp}));
 const changed=d.samples.filter((s,i)=>i===0||JSON.stringify([s.progress,s.currencies,s.inventory])!==JSON.stringify([d.samples[i-1].progress,d.samples[i-1].currencies,d.samples[i-1].inventory]));
 const acknowledgements=[0,...rewards.map(time),d.duration],gaps=acknowledgements.slice(1).map((t,i)=>({start:acknowledgements[i],end:t,seconds:t-acknowledgements[i]})).filter(g=>g.seconds>8);
 const rarities={};for(const c of claims)for(const item of c.gains.items)rarities[item.rarity]=(rarities[item.rarity]??0)+1;
 const first=d.samples[0],last=d.samples.at(-1),ch1Kill=s=>(s.progress.round-1)*6+s.progress.kills;
 return {phase:d.phase,wallSeconds:d.duration,lastSampleSeconds:last.t,seed:d.seed,economySeed:d.economySeed,errors:d.errors,
 firstRewardSeconds:time(rewards[0]),firstDropSeconds:time(firstDrop),firstUpgradeAvailableSeconds:d.samples.find(s=>s.inventory.some(i=>!i.equipped))?.t??null,
 firstChoiceInspectionSeconds:d.actions.find(a=>a.name==='Inspect bag'&&a.ok)?.t??null,firstEquipSeconds:d.actions.find(a=>a.name==='Equip visible upgrades'&&a.ok)?.t??null,
 firstBossAttemptSeconds:boss?.t??null,bossFights:fights,claims:claims.length,gearDrops:Object.values(rarities).reduce((a,b)=>a+b,0),rarities,
 dropsPerMinute:Object.values(rarities).reduce((a,b)=>a+b,0)/(d.duration/60),
 chapterProgressKills:ch1Kill(last)-ch1Kill(first),chapterProgressKillsPerMinute:(ch1Kill(last)-ch1Kill(first))/(d.duration/60),
 fishEarned:claims.reduce((n,e)=>n+e.gains.fish,0),yarnEarned:claims.reduce((n,e)=>n+e.gains.yarn,0),xpEarned:claims.reduce((n,e)=>n+e.gains.xp,0),
 acknowledgedRewardGapsOver8s:gaps.length,maxAcknowledgedRewardGapSeconds:Math.max(...gaps.map(g=>g.seconds)),gaps,
 actions:d.actions,changes:changed.map(s=>({t:s.t,level:s.cat.level,progress:s.progress,fish:s.currencies.fish,gear:s.inventory.length})),
 caveats:['Acknowledged reward gaps are not visually empty time: automatic attack animation continues.','Chapter-progress kills stop at the boss gate; this is not a counter of all farming kills.','The harness chooses actions at fixed times. First inspection/equip is scripted behaviour, not a human decision-time study.','Random rewards vary when the accepted-claim counter changes; one seed cannot establish a loot-rate distribution.','Wow and fun are subjective visual observations, not measured retention.']};
};
const result={method:'Real ten-minute fresh guest, normal wall clock, no fixture inventory or accelerated time. Same Math.random seed 1404 and mock-economy seed 1. Baseline uses corrected boss gate harness.',before:summarise(read('before-corrected-run.json')),after:summarise(read('after-run.json'))};
writeFileSync(new URL('../reports/gameplay/timeline-metrics.json',import.meta.url),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(Object.fromEntries(['before','after'].map(k=>[k,Object.fromEntries(Object.entries(result[k]).filter(([n])=>!['actions','changes','gaps','caveats'].includes(n)))])),null,2));
