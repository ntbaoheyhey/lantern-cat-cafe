import test from 'node:test';
import assert from 'node:assert/strict';
import {loadLabRuntime,root} from './runtime.mjs';
import {resolve} from 'node:path';
import {assumptions,perturb} from './assumptions.mjs';
const runtime=await loadLabRuntime(resolve(root,'work/economy-lab/tests/assumptions-'+process.pid));
test('sensitivity separates native progression from token-only assumptions and bounds probabilities',()=>{
 const config=runtime.ECONOMY_LAB,rows=assumptions(config);
 for(const row of rows)for(const delta of [-.2,.2]){
  const result=perturb(config,row,delta);
  if(row.kind==='token')assert(!result.nativeChanged);
  if(row.probability)assert(result.after>=0&&result.after<=1);
  if(row.mix)assert(Math.abs(result.config.mixes[row.mix].reduce((a,b)=>a+b,0)-1)<1e-12);
 }
 assert(rows.some(r=>r.name==='bot.sink'));assert(rows.some(r=>r.name==='casual.activeDays'&&r.kind==='native'));
});
