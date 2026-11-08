// REFERENCE: threat-beats47. Independently reconstruct completed receipts; zero new battles.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const root='reports/cardrpg-big/a5/b1/threat-beats-47',receipts={};
const sha=b=>createHash('sha256').update(b).digest('hex');
const json=async p=>{const b=await readFile(p);receipts[p]=sha(b);return JSON.parse(b);};
assert.deepEqual((await json(root+'/completed.json')).sort(),['control/probe','boss/probe','boss/equipped','all/probe','all/equipped'].sort());
const controlPath='reports/cardrpg-big/a5/b2/hush-eligibility-22/balance/equipped/results.json';
const control=await json(controlPath),baseProbe=await json(root+'/control/probe.json');
assert(baseProbe.passed);assert.equal(baseProbe.rows.length,18);
const expectedOff=(await json('reports/cardrpg-big/a5/b1/queued-reply-33/baseline-probe.json')).off;
assert.deepEqual(baseProbe.off,expectedOff);
const summarize=matrix=>{
 assert.equal(matrix.count,50);assert.equal(matrix.offset,0);assert.equal(matrix.rows.length,384);
 const rows=matrix.rows.map(r=>{
  assert(r.complete);assert.match(r.outcomes,/^[0-3]{50}$/);assert.equal(r.digest,sha(JSON.stringify(r.outcomes)));
  const codes=[...r.outcomes].map(Number),before=codes.filter(x=>x>=2).length,after=codes.filter(x=>x%2).length;
  const improved=codes.filter(x=>x===1).length,worsened=codes.filter(x=>x===2).length;
  const delta=(improved-worsened)/50,variance=(improved+worsened)/50-delta*delta;
  const se=Math.sqrt(variance/49);
  return {key:r.key,before,after,gainPp:100*delta,improved,worsened,pairedNormal95Pp:[100*(delta-1.96*se),100*(delta+1.96*se)]};
 });
 return {worstGainPp:Math.max(...rows.map(r=>r.gainPp)),pieceMisses:rows.filter(r=>r.gainPp>12+1e-9).length,
  beforeSaturated:rows.filter(r=>r.before>=48).length,afterSaturated:rows.filter(r=>r.after>=48).length,
  meanBefore:rows.reduce((s,r)=>s+r.before,0)/19200,meanAfter:rows.reduce((s,r)=>s+r.after,0)/19200,rows};
};
const baseline=summarize(control),arms={},negativePairs=[];
for(const name of ['control','boss','all']){
 const reg=await json(`${root}/${name}/REGISTERED-METHOD.json`);
 assert.equal(sha(await readFile(controlPath)),reg.controlSha256);
 for(const[p,h]of Object.entries(reg.source))assert.equal(sha(await readFile(reg.sourceRoot+'/'+p)),h,p);
 for(const[p,h]of Object.entries(reg.scripts))assert.equal(sha(await readFile(p)),h,p);
 assert.equal(reg.count,50);assert.equal(reg.seedOffset,0);assert.equal(reg.cases,384);assert.equal(reg.acceptanceSeedsUsed,false);
 if(name==='control')continue;
 assert.equal(sha(await readFile(`${root}/${name}/battle.ts.snapshot.txt`)),reg.source['packages/game-rules/src/cardrpg/depth/battle.ts']);
 const probe=await json(`${root}/${name}/probe.json`);assert(probe.passed);assert.deepEqual(probe.off,expectedOff);
 assert.equal(probe.rows.length,18);assert.equal(probe.schedules.length,2000);
 for(let i=0;i<18;i++){
  const a=baseProbe.rows[i],b=probe.rows[i];assert.equal(a.key,b.key);assert.equal(a.mode,b.mode);assert.equal(a.initialSha256,b.initialSha256);
  if(b.mode!=='on')assert.deepEqual(a,b);
 }
 const gaps=[],first=[];
 for(const row of probe.schedules){
  assert.equal(row.rounds.length,16);first.push(row.rounds[0]);
  for(let i=0;i<row.rounds.length;i++){
   assert(Math.abs(row.rounds[i]-3*(i+1))<=1);
   if(i){const gap=row.rounds[i]-row.rounds[i-1];assert(gap>=2&&gap<=4);gaps.push(gap);}
  }
 }
 const matrix=await json(`${root}/${name}/balance/equipped/results.json`);assert.deepEqual(matrix.source,reg.combatSource);
 assert.deepEqual(matrix.rows.map(r=>r.key),control.rows.map(r=>r.key));
 let improved=0,worsened=0,unchanged=0;
 for(let i=0;i<384;i++)for(let j=0;j<50;j++)for(const side of ['before','after']){
  const win=code=>side==='before'?Number(code)>=2:Number(code)%2===1;
  const a=win(control.rows[i].outcomes[j]),b=win(matrix.rows[i].outcomes[j]);
  if(a===b)unchanged++;else if(b)improved++;else{worsened++;negativePairs.push({name,key:matrix.rows[i].key,seed:j+1,side});}
 }
 const summary=summarize(matrix),screen=summary.worstGainPp<=18+1e-9&&summary.meanBefore>=.35&&summary.meanBefore<=.75&&summary.beforeSaturated<=84&&summary.afterSaturated<=105;
 arms[name]={...summary,pairedAgainstCurrent:{improved,worsened,unchanged},screen,
  schedule:{count:2000,firstMean:first.reduce((a,b)=>a+b)/first.length,gapMean:gaps.reduce((a,b)=>a+b)/gaps.length,minGap:Math.min(...gaps),maxGap:Math.max(...gaps)},
  decision:screen?'Eligible only for separately registered precision and wider checks.':'Rejected for expansion under the prospective screen.'};
}
assert.equal(execFileSync('git',['diff','--name-only','27f192301','--','apps','packages','assets','package.json','pnpm-lock.yaml'],{encoding:'utf8'}).trim(),'');
await writeFile(root+'/negative-pairs.json',JSON.stringify(negativePairs,null,2)+'\n');
await writeFile(root+'/audit.json',JSON.stringify({status:'PASS: receipt consistency',baseline,arms,receipts,newAuditBattles:0,runtimeUnchanged:true,acceptanceUnused:true,
 limitations:['TRAIN50 precision screen, not acceptance or population playtesting. Original full Wilson intervals remain in matrix results.','Paired normal intervals are descriptive at n50; not simultaneous intervals across384cells.','No fixture, gate, runtime, save or renderer change is adopted.']},null,2)+'\n');
const table=Object.entries({control:baseline,...arms}).map(([name,r])=>`|${name}|${r.worstGainPp.toFixed(1)}|${r.pieceMisses}|${r.beforeSaturated}/${r.afterSaturated}|${(100*r.meanBefore).toFixed(2)}%/${(100*r.meanAfter).toFixed(2)}%|${name==='control'?'reference':r.screen?'precision follow-up eligible':'rejected'}|`).join('\n');
await writeFile(root+'/RESULTS.md',`# Bounded threat timing47\n\nTwo isolated arms keep nominal signature timing within one round of every third round, with2–4round gaps and unchanged hit strength. All18automatic replay cases per arm,12OFF/tutorial exact cases,45historical OFF streams,initial-state hashes and2,000schedule invariants per candidate pass. These are controlled semantic checks, not proof of better gameplay.\n\n|Arm|Worst piece gain pp|Cells over12pp|Before/after saturated|Mean before/after|Registered screen|\n|---|---:|---:|---:|---|---|\n${table}\n\nAll384paired cases use unchangedTRAIN1–50. Original current22 outcomes are reused. Every regression versus current production is retained in[negative-pairs.json](negative-pairs.json);[audit.json](audit.json) reconstructs the original receipts without additional battles. Any eligible candidate still needs registered500TRAIN precision, all other balance/progression gates and later fresh acceptance. No numeric gate is changed and no arm is adopted. Source27f192301 remains unchanged. Fresh20001–20500 UNUSED.\n`);
console.log(JSON.stringify(Object.fromEntries(Object.entries(arms).map(([name,{rows,...r}])=>[name,r]))));
