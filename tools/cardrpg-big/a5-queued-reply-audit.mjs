// REFERENCE: A5 B1. Consume completed33/34 receipts; never run additional combat samples.
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
const root='reports/cardrpg-big/a5/b1';
const baseline='reports/cardrpg-big/a5/b2/hush-eligibility-22';
const baselineDay='reports/cardrpg-big/a5/e1/crew-advice-29/candidate/day7-checks/checks.json';
const sha=b=>createHash('sha256').update(b).digest('hex'), receipts={};
async function read(path){const bytes=await readFile(path);receipts[path]=sha(bytes);return JSON.parse(bytes);}
const baseDay=await read(baselineDay), matrices={}, arms={};
for(const scope of ['equipped','tiers','sets','teams'])matrices[scope]=await read(`${baseline}/balance/${scope}/results.json`);
for(const number of [33,34]){
  const dir=`${root}/queued-reply-${number}`, method=await read(`${dir}/REGISTERED-METHOD.json`);
  for(const [p,h]of Object.entries(method.source))assert.equal(sha(await readFile(method.sourceRoot+'/'+p)),h,p);
  for(const [p,h]of Object.entries({...method.scripts,...method.savedInputs}))assert.equal(sha(await readFile(p)),h,p);
  assert.deepEqual(await read(`${dir}/completed.json`),['day7',...Object.keys(method.scopes)]);
  execFileSync(process.execPath,['tools/cardrpg-big/a5-train-summary.mjs',dir+'/balance'],{stdio:'pipe'});
  const summary=await read(`${dir}/balance/summary.json`), comparisons={}, negative=[];
  for(const scope of Object.keys(matrices)){
    const current=await read(`${dir}/balance/${scope}/results.json`), before=matrices[scope];
    assert.equal(current.count,50);assert.equal(current.offset,0);assert.equal(current.sample,'pilot');
    const context=r=>r.kind==='crew'?JSON.stringify({kind:r.kind,chapter:r.chapter}):r.key;
    assert.deepEqual(current.rows.map(context),before.rows.map(context));
    let improved=0,worsened=0,unchanged=0;
    for(let i=0;i<current.rows.length;i++){
      const row=current.rows[i],old=before.rows[i];assert(row.complete);assert.equal(row.outcomes.length,50);
      assert.equal(row.digest,sha(JSON.stringify(row.outcomes)));
      for(let j=0;j<50;j++){
        const pairs=row.kind==='pieces-equipped'||row.kind==='crew'?['before','after']:['after'];
        for(const side of pairs){
          const win=code=>side==='before'?Number(code)>=2:Number(code)%2===1;
          const a=win(old.outcomes[j]),b=win(row.outcomes[j]);
          if(a===b)unchanged++;else if(b)improved++;else{worsened++;negative.push({key:row.key,seed:j+1,side,
            ...(row.kind==='crew'?{originalCrew:old.team,currentCrew:row.team,selection:'same registered TRAIN selection rule; team can differ'}:{})});}
        }
      }
    }
    comparisons[scope]={cells:current.rows.length,improved,worsened,unchanged};
  }
  const day=await read(`${dir}/day7-checks/checks.json`);assert.equal(day.accounts.length,90);
  const days=[];
  for(const row of day.accounts){
    const old=baseDay.accounts.find(a=>a.style===row.style&&a.index===row.index);assert(old);
    assert.equal(row.inputSaveSha256,old.inputSaveSha256);assert.equal(row.band,old.band);
    if(row.second)assert.equal(row.second.band,row.band);
    if(row.withoutAdvice)assert.equal(row.withoutAdvice.band,row.band);
    days.push({style:row.style,index:row.index,firstBefore:old.first.won,firstAfter:row.first.won,
      firstTwoBefore:!!(old.first.won||old.second?.won),firstTwoAfter:!!(row.first.won||row.second?.won),
      missingAdvice:!row.first.won&&!row.advice});
  }
  const semantic=await read(`${dir}/semantic-checks.json`);
  const baseProbe=await read(`${root}/queued-reply-33/baseline-probe.json`),probe=await read(`${dir}/candidate-probe.json`);
  assert.deepEqual(probe.off,baseProbe.off);assert.equal(probe.off.length,45);
  await writeFile(`${dir}/negative-pairs.json`,JSON.stringify(negative,null,2)+'\n');
  arms[number]={summary,comparisons,cohorts:day.cohorts,gates:day.gates,days,semantic,
    adoption:'REJECTED for isolated adoption: progression regression and/or saturation; 33 also violates the registered preview boundary.'};
}
await writeFile(`${root}/queued-reply-34/audit.json`,JSON.stringify({arms,receipts,
  sourceUnchanged:true,acceptanceUnused:true,method:'Receipt audit only. Original controls reused. Every worsened TRAIN pair retained; old day7 inputs, not a fresh earned cohort.'},null,2)+'\n');
console.log(JSON.stringify(Object.fromEntries(Object.entries(arms).map(([k,v])=>[k,{comparisons:v.comparisons,gates:v.gates}]))));
