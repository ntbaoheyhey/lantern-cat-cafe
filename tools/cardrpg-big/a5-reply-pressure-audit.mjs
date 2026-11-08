// REFERENCE: reply-pressure39. Audit all original samples and negative pairs; no combat calls.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const root='reports/cardrpg-big/a5/b1/reply-pressure-39',sha=b=>createHash('sha256').update(b).digest('hex'),receipts={};
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
 for(const[label,control]of Object.entries(controls)){
  assert.deepEqual(matrix.rows.map(r=>r.key),control.rows.map(r=>r.key));let improved=0,worsened=0,unchanged=0;
  for(let i=0;i<384;i++)for(let j=0;j<50;j++)for(const side of ['before','after']){
   const win=code=>side==='before'?Number(code)>=2:Number(code)%2===1;
   const a=win(control.rows[i].outcomes[j]),b=win(matrix.rows[i].outcomes[j]);
   if(a===b)unchanged++;else if(b)improved++;else{worsened++;negative.push({name,control:label,key:matrix.rows[i].key,seed:j+1,side});}
  }
  paired[label]={improved,worsened,unchanged};
 }
 const screen=summary.worstGainPp<=18&&summary.meanBefore>=.35&&summary.meanBefore<=.75&&summary.beforeSaturated<=84&&summary.afterSaturated<=105;
 arms[name]={...summary,multiplier:reg.multiplier,paired,screen,decision:screen?'Eligible only for separately registered precision/wider checks; not accepted.':'REJECTED for expansion under the prospective screen.'};
}
assert.equal(execFileSync('git',['diff','--name-only','994d84056','--','apps','packages','package.json','pnpm-lock.yaml'],{encoding:'utf8'}).trim(),'');
await writeFile(root+'/negative-pairs.json',JSON.stringify(negative,null,2)+'\n');
await writeFile(root+'/audit.json',JSON.stringify({arms,controls:Object.fromEntries(Object.entries(controls).map(([n,r])=>[n,stats(r)])),receipts,sourceUnchanged:true,acceptanceUnused:true,method:'Original TRAIN50 screening only. Controls are reused, all paired regressions retained. No new source suite, human playtest or fresh earned progression claim.'},null,2)+'\n');
console.log(JSON.stringify(Object.fromEntries(Object.entries(arms).map(([k,{rows,...v}])=>[k,v]))));
