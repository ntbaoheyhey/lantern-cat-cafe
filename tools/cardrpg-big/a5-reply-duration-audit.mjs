// REFERENCE: reply-duration52. Audit all original samples and negative pairs; no combat calls.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const root='reports/cardrpg-big/a5/b1/reply-duration-52',sha=b=>createHash('sha256').update(b).digest('hex'),receipts={};
async function json(path){const b=await readFile(path);receipts[path]=sha(b);return JSON.parse(b);}
const names=await json(root+'/arms.json'),completed=await json(root+'/completed.json');assert.equal(completed.length,9);
const controls={current22:await json('reports/cardrpg-big/a5/b2/hush-eligibility-22/balance/equipped/results.json'),full34:await json('reports/cardrpg-big/a5/b1/queued-reply-34/balance/equipped/results.json')};
const baseOff=(await json('reports/cardrpg-big/a5/b1/queued-reply-33/baseline-probe.json')).off;
const stats=r=>{assert.equal(r.rows.length,384);const rows=r.rows.map(row=>{
 assert(row.complete);assert.equal(row.outcomes.length,50);assert.equal(row.digest,sha(JSON.stringify(row.outcomes)));
 const outcomes=[...row.outcomes].map(Number),before=outcomes.filter(n=>n>=2).length,after=outcomes.filter(n=>n%2).length;
 return{key:row.key,before,after,gainPp:2*(after-before),improved:outcomes.filter(n=>n===1).length,worsened:outcomes.filter(n=>n===2).length};
 });return{worstGainPp:Math.max(...rows.map(r=>r.gainPp)),pieceMisses:rows.filter(r=>r.gainPp>12).length,beforeSaturated:rows.filter(r=>r.before>=48).length,afterSaturated:rows.filter(r=>r.after>=48).length,meanBefore:rows.reduce((n,r)=>n+r.before,0)/19200,meanAfter:rows.reduce((n,r)=>n+r.after,0)/19200,rows};};
const arms={},negative=[];
for(const name of names){
 const dir=root+'/'+name,reg=await json(dir+'/REGISTERED-METHOD.json'),obs=await json(dir+'/OBSERVER.json');
 for(const[p,h]of Object.entries(reg.source))assert.equal(sha(await readFile(reg.sourceRoot+'/'+p)),h,p);
 for(const[p,h]of Object.entries(obs.source))assert.equal(sha(await readFile(obs.sourceRoot+'/'+p)),h,p);
 for(const[p,h]of Object.entries(reg.scripts))assert.equal(sha(await readFile(p)),h,p);
 const plain=await json(dir+'/candidate-probe.json'),observed=await json(dir+'/observed-probe.json');
 assert(plain.passed&&observed.passed);assert.deepEqual(plain.off,baseOff);assert.deepEqual(plain.rows,observed.rows);assert.deepEqual(plain.scaling,observed.scaling);assert(observed.stats.replies>0);assert.equal(plain.rows.length,6);assert.equal(plain.scaling.length,24);
 const matrix=await json(dir+'/balance/equipped/results.json');assert.deepEqual(matrix.source,reg.combatSource);assert.equal(matrix.count,50);assert.equal(matrix.offset,0);assert.equal(matrix.sample,'pilot');
 const summary=stats(matrix),paired={};
 const rounds={};let roundLimitLosses=0;
 for(const row of matrix.rows){
  assert.equal(Object.values(row.roundCounts).reduce((a,b)=>a+b,0),50);
  for(const [round,count]of Object.entries(row.roundCounts))rounds[round]=(rounds[round]??0)+count;
  roundLimitLosses+=row.roundLimitLosses;
 }
 const quantile=p=>{let cumulative=0;for(const [round,count]of Object.entries(rounds).sort((a,b)=>Number(a[0])-Number(b[0]))){cumulative+=count;if(cumulative>=19200*p)return Number(round);}};
 summary.duration={afterArmRounds:{median:quantile(.5),p90:quantile(.9),max:Math.max(...Object.keys(rounds).map(Number)),counts:rounds},roundLimitLosses,meanAfterActions:matrix.rows.reduce((n,r)=>n+r.actions,0)/19200};
 for(const[label,control]of Object.entries(controls)){
  assert.deepEqual(matrix.rows.map(r=>r.key),control.rows.map(r=>r.key));let improved=0,worsened=0,unchanged=0;
  for(let i=0;i<384;i++)for(let j=0;j<50;j++)for(const side of ['before','after']){
   const win=code=>side==='before'?Number(code)>=2:Number(code)%2===1;
   const a=win(control.rows[i].outcomes[j]),b=win(matrix.rows[i].outcomes[j]);
   if(a===b)unchanged++;else if(b)improved++;else{worsened++;negative.push({name,control:label,key:matrix.rows[i].key,seed:j+1,side});}
  }
  paired[label]={improved,worsened,unchanged};
 }
 const screen=summary.worstGainPp<=18&&summary.meanBefore>=.35&&summary.meanBefore<=.75&&summary.beforeSaturated<=84&&summary.afterSaturated<=105&&summary.duration.roundLimitLosses===0;
 arms[name]={...summary,multiplier:reg.multiplier,paired,screen,decision:screen?'Eligible only for separately registered precision/wider checks; not accepted.':'REJECTED for expansion under the prospective screen.'};
}
assert.equal(execFileSync('git',['diff','--name-only','27f192301','--','apps','packages','package.json','pnpm-lock.yaml'],{encoding:'utf8'}).trim(),'');
await writeFile(root+'/negative-pairs.json',JSON.stringify(negative,null,2)+'\n');
await writeFile(root+'/audit.json',JSON.stringify({arms,controls:Object.fromEntries(Object.entries(controls).map(([n,r])=>[n,stats(r)])),receipts,sourceUnchanged:true,acceptanceUnused:true,method:'Original TRAIN50 screening only. Controls are reused, all paired regressions retained. No new source suite, human playtest or fresh earned progression claim.'},null,2)+'\n');
const compact=Object.fromEntries(Object.entries(arms).map(([k,{rows,...v}])=>[k,v]));
 const lines=Object.entries(compact).map(([name,s])=>`|${name}|${s.worstGainPp}|${s.pieceMisses}|${s.beforeSaturated}/${s.afterSaturated}|${(s.meanBefore*100).toFixed(2)}/${(s.meanAfter*100).toFixed(2)}|${s.duration.afterArmRounds.median}/${s.duration.afterArmRounds.p90}/${s.duration.afterArmRounds.max}|${s.duration.roundLimitLosses}|${s.screen?'eligible for precision only':'rejected'}|`);
 await writeFile(root+'/RESULTS.md',`# Reply-aware boss duration52\n\nAll three original arms completed384TRAIN1–50 paired cells each. Corrected34 automatic policy is held fixed; only initial V4 non-tutorial bossHP changes. Attack is unchanged. Six full replay cases,45OFF streams,24stat cases and independent queue-observer parity pass per arm. No production adoption or fresh acceptance.\n\n|Arm|Worst piece gain pp|Cells>12pp|Before/after saturated|Mean before/after %|After rounds median/p90/max|Round-limit losses|Prospective screen|\n|---|---:|---:|---:|---|---|---:|---|\n${lines.join('\n')}\n\nRound counts are after-arm combat length, not x1 browser seconds. The original controls did not retain histograms; no historical distribution is inferred. All negative pairs versus current22 and corrected34 remain in [negative-pairs.json](negative-pairs.json); the [audit](audit.json) reads existing receipts and runs no battles. Any eligible arm needs separately registered500TRAIN precision, all other balance/progression gates, forecastCPU and actual x1 pacing. The actual single-piece gate remains≤12pp. Fresh20001–20500 remains unused.\n`);
 console.log(JSON.stringify(compact));
