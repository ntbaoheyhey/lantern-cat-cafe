// Read complete registered receipts. No new battles, fitting or threshold changes.
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const scope=process.argv[2];assert(['pieces','elites'].includes(scope));
const root='reports/cardrpg-big/skills-v5/s6',modes={};
const sha=x=>createHash('sha256').update(x).digest('hex');
const n=x=>Number(x).toFixed(2),pct=x=>n(100*x)+'%';
for(const mode of ['on','off']){
 const path=`${root}/${mode}/${scope}/results.json`,bytes=await readFile(path),r=JSON.parse(bytes);
 assert.equal(r.offset,20000);assert.equal(r.count,500);assert.equal(r.skillsV5,mode==='on');
 assert.equal(r.rows.length,scope==='pieces'?2304:880);
 assert.equal(r.summaries.length,r.rows.length);
 for(const original of r.rows){
  assert(original.complete);assert.equal(original.outcomes.length,500);assert.equal(sha(JSON.stringify(original.outcomes)),original.digest);
  const summary=r.summaries.find(x=>x.key===original.key);assert.equal(summary.n,500);assert.equal(summary.digest,original.digest);
  const outcomes=[...original.outcomes].map(Number),wins=outcomes.filter(x=>x%2===1).length;
  assert.equal(summary.wins,wins);assert.equal(summary.rate,wins/500);
  if(scope==='pieces')assert.equal(summary.gainPp,100*(wins-outcomes.filter(x=>x>=2).length)/500);
 }
 modes[mode]={path,sha256:sha(bytes),sourceDigest:r.registration.sourceDigest,rows:r.summaries};
}
assert.equal(modes.on.sourceDigest,modes.off.sourceDigest);
assert.deepEqual(modes.on.rows.map(r=>r.key),modes.off.rows.map(r=>r.key));
let result,text;
const sourceNote='Both modes use the same registered 20001–20500 block, 500 seeds per cell. This review reads complete retained outcomes only. It does not replay, retune or replace any sample.';
if(scope==='pieces'){
 const transitions={passBoth:[],newPass:[],newMiss:[],missBoth:[]};
 const compact=r=>({key:r.key,templateId:r.templateId,cardId:r.cardId,level:r.level,chapter:r.chapter,beforeWins:r.beforeWins,wins:r.wins,n:r.n,gainPp:r.gainPp});
 const groups={};
 for(const mode of ['on','off']){
  const rows=modes[mode].rows;
  groups[mode]=[1,6].flatMap(level=>[1,2,3].map(chapter=>{
   const group=rows.filter(r=>r.level===level&&r.chapter===chapter);assert.equal(group.length,384);
   return {level,chapter,cells:group.length,misses:group.filter(r=>r.gainPp>12).length,zeroBefore:group.filter(r=>r.beforeWins===0).length,zeroAfter:group.filter(r=>r.wins===0).length,worst:compact(group.reduce((a,b)=>a.gainPp>b.gainPp?a:b))};
  }));
 }
 for(const a of modes.on.rows){const b=modes.off.rows.find(r=>r.key===a.key),pass=a.gainPp<=12,prior=b.gainPp<=12;
  transitions[pass?(prior?'passBoth':'newPass'):(prior?'newMiss':'missBoth')].push({key:a.key,on:a.gainPp,off:b.gainPp});
 }
 const totals=Object.fromEntries(['on','off'].map(mode=>[mode,{cells:2304,misses:modes[mode].rows.filter(r=>r.gainPp>12).length,worst:compact(modes[mode].rows.reduce((a,b)=>a.gainPp>b.gainPp?a:b))}]));
 result={method:sourceNote,unchangedGatePp:12,sources:Object.fromEntries(Object.entries(modes).map(([k,v])=>[k,{path:v.path,sha256:v.sha256,sourceDigest:v.sourceDigest}])),totals,groups,transitions};
 const table=groups.on.map(a=>{const b=groups.off.find(r=>r.level===a.level&&r.chapter===a.chapter);return `|${a.level}|${a.chapter}|${b.misses} / ${a.misses}|${b.zeroBefore} / ${a.zeroBefore}|${b.zeroAfter} / ${a.zeroAfter}|${n(b.worst.gainPp)} / ${n(a.worst.gainPp)}pp|`;}).join('\n');
 text=`# Paired bare-item effects\n\n${sourceNote} The original 128 templates × three carriers × two levels × three bosses yields 2,304 cells per mode. [Source hashes and every gate transition](pieces-attribution.json).\n\nThe unchanged cap is a gain of at most 12 percentage points in every cell. Fallback has ${totals.off.misses}/2,304 misses, worst ${n(totals.off.worst.gainPp)}pp; V5 has ${totals.on.misses}/2,304 misses, worst ${n(totals.on.worst.gainPp)}pp. ${transitions.newPass.length} previous misses pass, while ${transitions.newMiss.length} previous passes fail; ${transitions.missBoth.length} fail in both.\n\nEach group below contains 384 cells. Values are fallback / V5. Zero-win counts show fixture floors; they are retained in the original denominators.\n\n|Level|Boss chapter|Misses|Zero wins without item|Zero wins with item|Largest gain|\n|---|---|---:|---:|---:|---:|\n${table}\n\n|Mode|Largest-gain case|Without → with item wins|Gain|\n|---|---|---:|---:|\n${['off','on'].map(mode=>{const r=totals[mode].worst;return `|${mode==='on'?'V5':'Fallback'}|${r.templateId}; ${r.cardId}; level ${r.level}; chapter ${r.chapter}|${r.beforeWins} → ${r.wins} / 500|${n(r.gainPp)}pp|`;}).join('\n')}\n\nBare-item effects and the [fourth-slot comparison](EQUIPMENT-REVIEW.md) answer different questions. Neither can replace the other. Adding one item to an otherwise bare team can cross survival thresholds; a small displayed power share does not bound that win-rate effect. These package comparisons do not isolate a particular new skill or helper as the cause.\n\nFuture TRAIN work should isolate one failing interaction while retaining the fixture floors, losses and negative pairs. A changed candidate requires a newly registered 30001–30500 block.\n`;
}else{
 const approved={Oven:['mallow','cinnamon','mochi'],Thread:['velvet','biscuit','brioche'],'Night lamp':['soot','marigold','inkcap'],'Afternoon tea':['clover','sorrel','panko']};
 const names=['Spool Ram','Kettle Knight','Pollen Scout','Crumb Sentinel'],groups={};
 for(const mode of ['on','off'])groups[mode]=names.map((name,scene)=>{
  const rows=modes[mode].rows.filter(r=>r.scene===scene);assert.equal(rows.length,220);
  const best=Math.max(...rows.map(r=>r.rate));
  return {name,scene,best,minimum:Math.min(...rows.map(r=>r.rate)),nearBest:rows.filter(r=>best-r.rate<=.05+1e-8).length,perfect:rows.filter(r=>r.wins===500).length,crews:Object.fromEntries(Object.entries(approved).map(([name,cats])=>{const r=rows.find(r=>cats.every(c=>r.team.includes(c)));assert(r);return [name,{key:r.key,rate:r.rate,gapPp:100*(best-r.rate),within5:best-r.rate<=.05+1e-8}];}))};
 });
 result={method:sourceNote,sources:Object.fromEntries(Object.entries(modes).map(([k,v])=>[k,{path:v.path,sha256:v.sha256,sourceDigest:v.sourceDigest}])),groups};
 const table=groups.on.map(a=>{const b=groups.off.find(r=>r.scene===a.scene);return `|${a.name}|${pct(b.minimum)}–${pct(b.best)} / ${pct(a.minimum)}–${pct(a.best)}|${b.nearBest} / ${a.nearBest}|${b.perfect} / ${a.perfect}|`;}).join('\n');
 const crews=groups.on.flatMap(a=>{const b=groups.off.find(r=>r.scene===a.scene);return Object.keys(approved).map(name=>`|${a.name}|${name}|${pct(b.crews[name].rate)} / ${n(b.crews[name].gapPp)}pp|${pct(a.crews[name].rate)} / ${n(a.crews[name].gapPp)}pp|${a.crews[name].within5?'PASS':'MISS'}|`);}).join('\n');
 text=`# Paired elite diversity and fixture limits\n\n${sourceNote} Every one of the 220 distinct triples faces each of four registered elites, yielding 880 cells per mode. [Source hashes and complete per-crew values](elites-attribution.json).\n\n|Elite|Win-rate range, fallback / V5|Within 5pp of best, fallback / V5|Perfect 500/500, fallback / V5|\n|---|---|---:|---:|\n${table}\n\n|Elite|Named crew|Fallback wins / gap from best|V5 wins / gap from best|V5 within 5pp|\n|---|---|---:|---:|---|\n${crews}\n\nThe generic gate requires at least four near-best triples per encounter. The named-crew gate requires each approved crew within 5pp. A saturated encounter can satisfy both without demonstrating distinct strengths; all such ties and fixtures remain in the registered result. These elite measurements do not erase the [boss crew misses](BOSS-CREW-REVIEW.md).\n\nEqual displayed power is a controlled budget, not a guarantee of equal challenge. Future TRAIN work should inspect encounter pressure before interpreting saturation as successful diversity. No encounter or weight has been replaced in this acceptance; any retuned candidate needs registered 30001–30500.\n`;
}
await writeFile(`${root}/${scope}-attribution.json`,JSON.stringify(result,null,2)+'\n');
await writeFile(`${root}/${scope==='pieces'?'BARE-ITEM':'ELITE'}-REVIEW.md`,text);
console.log(JSON.stringify({scope,samplesRun:0,complete:true,...(scope==='pieces'?{totals:result.totals}:{groups:result.groups})}));
