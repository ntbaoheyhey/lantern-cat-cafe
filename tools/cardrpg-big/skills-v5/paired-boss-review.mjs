// Read completed acceptance receipts only. No battles, fitting or gate changes.
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const root='reports/cardrpg-big/skills-v5/s6',modes={};
const sha=x=>createHash('sha256').update(x).digest('hex');
const mean=xs=>xs.reduce((n,x)=>n+x,0)/xs.length;
const approved={Oven:['mallow','cinnamon','mochi'],Thread:['velvet','biscuit','brioche'],'Night lamp':['soot','marigold','inkcap'],'Afternoon tea':['clover','sorrel','panko']};
for(const mode of ['on','off']){
 const path=`${root}/${mode}/teams/results.json`,bytes=await readFile(path),d=JSON.parse(bytes);
 assert.equal(d.offset,20000);assert.equal(d.count,500);assert.equal(d.skillsV5,mode==='on');
 assert.equal(d.rows.length,663);assert(d.rows.every(r=>r.complete&&r.outcomes.length===500));
 const teams=d.summaries.filter(r=>r.kind==='teams');assert.equal(teams.length,660);
 const cats=[...new Set(teams.flatMap(r=>r.team))].map(id=>{
  const group=teams.filter(r=>r.team.includes(id));
  const top=group.filter(r=>{const partners=r.team.filter(c=>c!==id);return r.rate>=Math.max(...teams.filter(t=>t.chapter===r.chapter&&partners.every(c=>t.team.includes(c))).map(t=>t.rate));});
  const rate=mean(group.map(r=>r.rate));
  return {id,rate,topPickCells:top.length,pass:rate>=.55&&rate<=.75&&top.length>0};
 });
 const bosses=[1,2,3].map(chapter=>{
  const group=teams.filter(r=>r.chapter===chapter),best=Math.max(...group.map(r=>r.rate));
  return {chapter,best,nearBest:group.filter(r=>best-r.rate<=.05+1e-8).length,crews:Object.fromEntries(Object.entries(approved).map(([name,ids])=>{
   const row=group.find(r=>ids.every(id=>r.team.includes(id)));assert(row);
   return [name,{rate:row.rate,gapPp:100*(best-row.rate),within5:best-row.rate<=.05+1e-8,key:row.key}];
  }))};
 });
 const reference=teams.filter(r=>['mochi','soot','clover'].every(id=>r.team.includes(id))).map(r=>({chapter:r.chapter,rate:r.rate}));
 modes[mode]={path,sha256:sha(bytes),sourceDigest:d.registration.sourceDigest,cats,bosses,reference,coherent:d.chosenCrew,coherentGainPp:mean(d.summaries.filter(r=>r.kind==='crew').map(r=>r.gainPp))};
}
assert.equal(modes.on.sourceDigest,modes.off.sourceDigest);assert.deepEqual(modes.on.coherent,modes.off.coherent);
const transitions={passBoth:[],newMiss:[],newPass:[],missBoth:[]};
for(const a of modes.on.cats){const b=modes.off.cats.find(c=>c.id===a.id);transitions[a.pass?(b.pass?'passBoth':'newPass'):(b.pass?'newMiss':'missBoth')].push(a.id);}
const result={method:'All 220 legal triples at each of 3 bosses, 500 seeds per cell; three coherent/random cells. This reads saved complete outcomes, with unchanged registered aggregation and thresholds.',modes,transitions,limitations:['Full V5 package comparison; no mechanic-specific causal attribution.','Elite diversity remains separate until its registered scope completes.','Top-pick cells mean a best replacement for the same two partners, including ties; not a globally best crew.','All values use registered fixtures; matched displayed power does not establish matched difficulty.']};
await writeFile(root+'/boss-attribution.json',JSON.stringify(result,null,2)+'\n');
const pct=x=>(100*x).toFixed(2)+'%',n=x=>x.toFixed(2),status=x=>x?'PASS':'MISS';
const catRows=modes.on.cats.map(a=>{const b=modes.off.cats.find(c=>c.id===a.id);return `|${a.id}|${pct(b.rate)}|${pct(a.rate)}|${b.topPickCells} / ${a.topPickCells}|${status(b.pass)} → ${status(a.pass)}|`;}).join('\n');
const bossRows=modes.on.bosses.flatMap(a=>{const b=modes.off.bosses.find(x=>x.chapter===a.chapter);return Object.keys(approved).map(name=>`|${a.chapter}|${name}|${pct(b.crews[name].rate)} / ${n(b.crews[name].gapPp)}pp|${pct(a.crews[name].rate)} / ${n(a.crews[name].gapPp)}pp|${status(b.crews[name].within5)} → ${status(a.crews[name].within5)}|`);}).join('\n');
const text=`# Paired boss crews and cat balance\n\nAll 663 cells per mode are complete: 220 legal triples × three bosses, plus three fixed coherent/random comparisons, each on registered seeds 20001–20500. This review reads retained receipts; it does not sample, retune or substitute fixtures. [Source hashes and measurements](boss-attribution.json).\n\nThe cat gate remains 55–75% and at least one top-pick situation. Top-pick counts use the registered same-partners replacement comparison, including ties; they do not claim globally best teams.\n\n|Cat|Fallback wins|V5 wins|Top-pick cells, fallback / V5|Gate transition|\n|---|---:|---:|---:|---|\n${catRows}\n\nNew cat misses: ${transitions.newMiss.join(', ')||'none'}. Newly passing: ${transitions.newPass.join(', ')||'none'}. These package-level comparisons do not isolate any one skill or policy term.\n\n|Boss chapter|Named crew|Fallback rate / gap from best|V5 rate / gap from best|Within 5pp transition|\n|---|---|---:|---:|---|\n${bossRows}\n\nNear-best distinct crews per boss, fallback → V5: ${modes.on.bosses.map(a=>a.chapter+': '+modes.off.bosses.find(b=>b.chapter===a.chapter).nearBest+' → '+a.nearBest).join('; ')}. The generic diversity requirement and the four named crews are separate gates; a large total cannot conceal a named-crew miss. Elite results are still separate.\n\nThe fixed TRAIN-selected coherent crew (${modes.on.coherent.join(', ')}) gains ${n(modes.on.coherentGainPp)}pp over random under V5, versus ${n(modes.off.coherentGainPp)}pp in fallback; the target remains 10–25pp. No crew was selected from acceptance.\n\nReference Mochi/Soot/Clover wins by chapter: fallback ${modes.off.reference.map(r=>r.chapter+': '+pct(r.rate)).join(', ')}; V5 ${modes.on.reference.map(r=>r.chapter+': '+pct(r.rate)).join(', ')}. Matched displayed power remains a budget constraint, not proof of equal encounter difficulty. The original median 55–60% reference target stays unchanged.\n\nFuture work must separate encounter difficulty, helper pressure and kit/policy interactions on TRAIN. Any changed candidate needs a newly registered 30001–30500 acceptance block. Original outcomes and Wilson intervals remain in each teams/results.json.\n`;
await writeFile(root+'/BOSS-CREW-REVIEW.md',text);console.log(JSON.stringify({transitions,coherentGainPp:modes.on.coherentGainPp,catRange:[Math.min(...modes.on.cats.map(c=>c.rate)),Math.max(...modes.on.cats.map(c=>c.rate))]}));
