// Derive review tables from raw browser receipts; never manufacture an interaction.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { root } from './visual-support.mjs';
const out = resolve(root, 'reports/gameplay2');
const read = name => JSON.parse(readFileSync(resolve(out, name + '.json')));
const gaps = points => { const ordered = [...new Set([0, ...points.filter(n => n >= 0 && n <= 600), 600])].sort((a,b)=>a-b); return ordered.slice(1).map((n,i)=>({from:ordered[i],to:n,seconds:n-ordered[i]})); };
const rows = [], details = [];
for (const [style, seed] of [['idle',11],['active',29],['minmax',47]]) {
  for (const phase of ['before','after']) {
    const d=read(`${phase}-${style}-${seed}`); assert.ok(d.duration>=599, 'Incomplete normal-clock receipt');
    const rewards=d.events.filter(e=>e.type==='claimed' && (e.gains.fish || e.gains.xp || e.gains.yarn || e.gains.keys || e.gains.items.length));
    const points=rewards.map(e=>(e.at-d.start)/1000), intervals=gaps(points);
    const successful=d.actions.filter(a=>a.ok), boss=d.events.filter(e=>e.type==='bossFight');
    rows.push({label:`Main ${phase} · ${style} · seed ${seed}`, phase,style,seed,kind:'actual reward',firstReward:points[0],maxGap:Math.max(...intervals.map(g=>g.seconds)),points});
    details.push({phase,style,seed,duration:d.duration,rewards:rewards.length,firstReward:points[0],maxGap:Math.max(...intervals.map(g=>g.seconds)),deadTimeOver8:intervals.filter(g=>g.seconds>8),
      successfulActions:successful.length,failedActions:d.actions.length-successful.length,
      // Home visits and closing a result are navigation; equip/craft succeed only after a real mutation.
      meaningfulChoices:successful.filter(a=>/equip|craft|Attempt/i.test(a.name)).length,
      systemsTouched:[...new Set(successful.map(a=>/equip/i.test(a.name)?'gear':/craft/i.test(a.name)?'forge':/boss/i.test(a.name)?'boss':'navigation'))],
      firstBossAttempt:boss.length?(boss[0].at-d.start)/1000:null,bossWins:boss.filter(e=>e.result.won).length,bossAttempts:boss.length,
      itemsFound:rewards.reduce((n,e)=>n+e.gains.items.length,0),finalLevel:d.samples.at(-1).cat.level,finalChapter:d.samples.at(-1).progress.chapter,errors:d.errors,
      timeline:d.events.map(e=>({at:(e.at-d.start)/1000,type:e.type,...(e.type==='claimed'?{gains:e.gains}:e.type==='bossFight'?{won:e.result.won}:{})})),actions:d.actions});
  }
  const d=read(`sample-${style}-${seed}`);assert.ok(d.duration>=599,'Incomplete Sample receipt');
  const opportunities=d.timeline.filter(e=>['reward','decision','goal'].includes(e.kind));
  const points=opportunities.map(e=>e.observedAt), intervals=gaps(points), firstReward=d.timeline.find(e=>e.kind==='reward')?.observedAt;
  const changes=d.actions.filter(a=>a.ok&&a.changed);
  const results=[];let previous=null;for(const s of d.samples){if(s.lastBoss&&JSON.stringify(s.lastBoss)!==previous){results.push({...s.lastBoss,observedAt:s.at});previous=JSON.stringify(s.lastBoss);}if(s.boss)previous=null;}
  rows.push({label:`Sample · ${style} · seed ${seed}`,phase:'sample',style,seed,kind:'reward or available decision',firstReward,maxGap:Math.max(...intervals.map(g=>g.seconds)),points});
  details.push({phase:'sample',style,seed,duration:d.duration,firstReward,maxGap:Math.max(...intervals.map(g=>g.seconds)),deadTimeOver8:intervals.filter(g=>g.seconds>8),
    successfulChangedActions:changes.length,failedActions:d.actions.filter(a=>!a.ok).length,
    meaningfulChoices:changes.filter(a=>!/^Choose .* kit$|^Choose mastery$/.test(a.name)).length,
    decisionCaveat:'Conservative scripted choices exclude repeated build/mastery automation. No human decision or boredom claim.',
    systemsTouched:[...new Set(changes.map(a=>/Counter|Pounce|boss/.test(a.name)?'boss':/Craft|stitch/.test(a.name)?'forge':/kit/.test(a.name)?'gear':/mastery/.test(a.name)?'mastery':/Route/.test(a.name)?'encounters':'rooms'))],
    firstDecisionOpportunity:d.timeline.find(e=>e.kind==='decision')?.observedAt,firstActualChoice:changes[0]?.at??null,
    firstBossAttempt:changes.find(a=>/Attempt/.test(a.name))?.at??null,bossWins:results.filter(r=>r.won).length,bossAttempts:d.attempts,bossResults:results,
    inventoryGrowth:d.samples.at(-1).items-d.samples[0].items,
    itemsCrafted:changes.filter(a=>/^Craft missing/.test(a.name)).length,
    itemsFound:d.samples.at(-1).items-d.samples[0].items-changes.filter(a=>/^Craft missing/.test(a.name)).length,
    finalChapter:d.samples.at(-1).chapter,errors:d.errors,writes:d.writes,
    powerCurve:d.samples.filter((s,i)=>!i||s.chapter!==d.samples[i-1].chapter).map(s=>({at:s.at,chapter:s.chapter,...s.stats})),timeline:d.timeline,actions:d.actions});
}
const data={method:'Main: actual positive accepted claims. Sample: new rewards or visible decision opportunities. Wall-clock observation includes rendering/driver delay. Includes the initial and terminal boundary. Idle makes no tactical inputs; it only starts bosses and advances rooms. Before driver result-dismissal failures remain in raw logs and are not meaningful choices.',rows,details};
writeFileSync(resolve(out,'timelines.json'),JSON.stringify(data,null,2));
writeFileSync(resolve(out,'timeline-summary.json'),'{\n  \"method\": '+JSON.stringify(data.method)+',\n  \"rows\": [\n'+rows.map(r=>'    '+JSON.stringify(r)).join(',\n')+'\n  ]\n}\n');
console.table(rows.map(({label,firstReward,maxGap})=>({label,firstReward,maxGap})));
for(const r of rows.filter(r=>r.phase!=='before'))assert.ok(r.maxGap<=20,`${r.label}: gap ${r.maxGap}`);
