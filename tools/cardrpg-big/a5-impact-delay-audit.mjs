// REFERENCE: impact-delay49. Independently audit completed receipts; no new battles.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const root='reports/cardrpg-big/a5/b1/impact-delay-49',receipts={};
const sha=b=>createHash('sha256').update(b).digest('hex');
const json=async p=>{const b=await readFile(p);receipts[p]=sha(b);return JSON.parse(b);};
assert.deepEqual((await json(root+'/completed.json')).sort(),['quarter/probe','quarter/equipped','half/probe','half/equipped'].sort());
const controlPath='reports/cardrpg-big/a5/b2/hush-eligibility-22/balance/equipped/results.json';
const control=await json(controlPath),oldProbe=await json('reports/cardrpg-big/a5/b1/threat-beats-47/control/probe.json');
assert(oldProbe.passed);assert.equal(oldProbe.rows.length,18);
const summarize=matrix=>{
 assert.equal(matrix.count,50);assert.equal(matrix.offset,0);assert.equal(matrix.rows.length,384);
 const rows=matrix.rows.map(r=>{
  assert(r.complete);assert.match(r.outcomes,/^[0-3]{50}$/);assert.equal(r.digest,sha(JSON.stringify(r.outcomes)));
  const codes=[...r.outcomes].map(Number),before=codes.filter(x=>x>=2).length,after=codes.filter(x=>x%2).length;
  const improved=codes.filter(x=>x===1).length,worsened=codes.filter(x=>x===2).length;
  const delta=(improved-worsened)/50,variance=(improved+worsened)/50-delta*delta,se=Math.sqrt(variance/49);
  const reported=matrix.summaries.find(s=>s.key===r.key);assert.equal(reported.beforeWins,before);assert.equal(reported.wins,after);
  assert(Math.abs(reported.gainPp-100*delta)<1e-10);
  return {key:r.key,before,after,gainPp:100*delta,improved,worsened,pairedNormal95Pp:[100*(delta-1.96*se),100*(delta+1.96*se)]};
 });
 return {worstGainPp:Math.max(...rows.map(r=>r.gainPp)),pieceMisses:rows.filter(r=>r.gainPp>12+1e-9).length,
  beforeSaturated:rows.filter(r=>r.before>=48).length,afterSaturated:rows.filter(r=>r.after>=48).length,
  meanBefore:rows.reduce((s,r)=>s+r.before,0)/19200,meanAfter:rows.reduce((s,r)=>s+r.after,0)/19200,rows};
};
const baseline=summarize(control),arms={},negativePairs=[];
for(const name of ['quarter','half']){
 const reg=await json(`${root}/${name}/REGISTERED-METHOD.json`);
 assert.equal(sha(await readFile(controlPath)),reg.controlSha256);
 for(const[p,h]of Object.entries(reg.source))assert.equal(sha(await readFile(reg.sourceRoot+'/'+p)),h,p);
 for(const[p,h]of Object.entries(reg.scripts))assert.equal(sha(await readFile(p)),h,p);
 assert.equal(reg.count,50);assert.equal(reg.seedOffset,0);assert.equal(reg.cases,384);assert.equal(reg.acceptanceSeedsUsed,false);
 assert.equal(reg.fraction,name==='quarter'?.25:.5);
 for(const file of ['battle.ts','policies.ts'])assert.equal(sha(await readFile(`${root}/${name}/${file}.snapshot.txt`)),reg.source['packages/game-rules/src/cardrpg/depth/'+file]);
 const probe=await json(`${root}/${name}/probe.json`);assert(probe.passed);assert.deepEqual(probe.off,oldProbe.off);
 assert.equal(probe.rows.length,18);assert.equal(probe.semantics.length,5);
 for(let i=0;i<18;i++){
  const a=oldProbe.rows[i],b=probe.rows[i];assert.equal(a.key,b.key);assert.equal(a.mode,b.mode);assert.equal(a.initialSha256,b.initialSha256);
  if(b.mode!=='on'){assert.equal(a.battleSha256,b.battleSha256);assert.deepEqual(a.battle,b.battle);assert.equal(b.pendingStates,0);}
 }
 const conserved=probe.semantics[0];assert.equal(conserved.pending,Math.round(conserved.total*reg.fraction));
 assert.equal(conserved.total,conserved.immediate+conserved.pending);assert(conserved.shieldAfter>0);
 assert.equal(probe.semantics[4].result,'enemy');
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
  decision:screen?'Eligible only for separately registered precision and wider checks.':'Rejected for expansion under the prospective screen.'};
}
assert.equal(execFileSync('git',['diff','--name-only','27f192301','--','apps','packages','assets','package.json','pnpm-lock.yaml'],{encoding:'utf8'}).trim(),'');
await writeFile(root+'/negative-pairs.json',JSON.stringify(negativePairs,null,2)+'\n');
await writeFile(root+'/audit.json',JSON.stringify({status:'PASS: receipt consistency',baseline,arms,receipts,newAuditBattles:0,runtimeUnchanged:true,acceptanceUnused:true,
 limitations:['TRAIN50 precision screen, not acceptance or population playtesting. Original full Wilson intervals remain in matrix results.',
 'Paired normal intervals are descriptive at n50; not simultaneous intervals across384cells.',
 'Pending-damage mechanics require UI/events/compatibility and broader checks before any adoption. No source or fixture is adopted.']},null,2)+'\n');
const table=Object.entries({control:baseline,...arms}).map(([name,r])=>`|${name}|${r.worstGainPp.toFixed(1)}|${r.pieceMisses}|${r.beforeSaturated}/${r.afterSaturated}|${(100*r.meanBefore).toFixed(2)}%/${(100*r.meanAfter).toFixed(2)}%|${name==='control'?'reference':r.screen?'precision follow-up eligible':'rejected'}|`).join('\n');
await writeFile(root+'/RESULTS.md',`# Delayed boss impact49\n\nTwo isolated arms defer25% or50% of post-shield boss HP damage to the affected cat's next own-action completion. Nominal damage and source are conserved in controlled fixtures; settlement precedes the final result. All18automatic replays per arm,12OFF/tutorial exact cases,45historical OFF streams,initial-state hashes and5synthetic semantic cases pass. These are mechanics checks, not proof of better gameplay.\n\n|Arm|Worst piece gain pp|Cells over12pp|Before/after saturated|Mean before/after|Registered screen|\n|---|---:|---:|---:|---|---|\n${table}\n\nAll384paired cases use unchangedTRAIN1–50 and original current22 control outcomes. Every regression is retained in[negative-pairs.json](negative-pairs.json);[audit.json](audit.json) reconstructs original receipts without additional battles. The required piece gate remains≤12pp. No arm is adopted; production source27f192301 and fresh20001–20500 remain untouched. Any later proposal needs visible pending-damage explanation, typed events, save/replay review, all wider balance gates and earned day7 checks.\n`);
console.log(JSON.stringify(Object.fromEntries(Object.entries(arms).map(([name,{rows,...r}])=>[name,r]))));
