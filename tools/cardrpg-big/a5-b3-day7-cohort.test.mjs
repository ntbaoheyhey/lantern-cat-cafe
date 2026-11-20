// REFERENCE: PROMPT-A5 B3. Recompute measured passes and misses without changing their gates.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const root=new URL('../../',import.meta.url),base='reports/cardrpg-big/a5/b3/day7-e2/';
const read=p=>JSON.parse(readFileSync(new URL(p,root)));
test('earned day7 cohort reports all 90 accounts, paired retries and every failed gate',()=>{
 const data=read(base+'checks.json'),registration=read(base+'REGISTERED-METHOD.json');
 assert.deepEqual(data.registration,registration);assert.equal(data.accounts.length,90);
 const rates=[];
 for(const style of ['casual','regular','heavy']){
  const a=data.accounts.filter(r=>r.style===style),reported=data.cohorts.find(r=>r.style===style);
  assert.deepEqual(a.map(r=>r.index),Array.from({length:30},(_,i)=>i));
  for(const r of a){
   const bytes=readFileSync(new URL(`${registration.inputs}/${style}-${r.index}.save`,root));
   assert.equal(createHash('sha256').update(bytes).digest('hex'),r.inputSaveSha256);
   if(r.second){assert(r.advice);assert(r.withoutAdvice);}
  }
  const first=a.filter(r=>r.first.won).length,two=a.filter(r=>r.first.won||r.second?.won).length;
  const losses=a.filter(r=>!r.first.won),advice=losses.filter(r=>r.advice).length;
  assert.equal(reported.firstWins,first);assert.equal(reported.twoAttemptWins,two);
  assert.equal(reported.availableAdvice,advice);assert.equal(reported.allLossesHaveAdvice,advice===losses.length);
  assert.equal(reported.retryWinsWithAdvice,losses.filter(r=>r.second?.won).length);
  assert.equal(reported.retryWinsWithoutAdvice,losses.filter(r=>r.withoutAdvice?.won).length);
  rates.push({first:first/30,two:two/30,allAdvice:advice===losses.length});
 }
 assert.deepEqual(data.gates,{casualFirstTwoAtLeast50:rates[0].two>=.5,
  regularFirstTwoAtLeast70:rates[1].two>=.7,heavyFirstAtMost95:rates[2].first<=.95,
  everyLossHasAvailableImprovement:rates.every(r=>r.allAdvice)});
});
