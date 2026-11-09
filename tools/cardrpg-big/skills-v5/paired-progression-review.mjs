// Read complete progression receipts; no new accounts, routes, forecasts or tuning.
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const root='reports/cardrpg-big/skills-v5/s6',modes={},sources=[];
for(const mode of ['on','off']){
 const receipts={};
 for(const scope of ['economy','day7']){
  const path=`${root}/${mode}/${scope}/results.json`,bytes=await readFile(path);
  receipts[scope]=JSON.parse(bytes);sources.push({mode,scope,path,sha256:createHash('sha256').update(bytes).digest('hex')});
  assert.equal(receipts[scope].accounts.length,90);
 }
 assert.equal(receipts.economy.days,45);
 assert(receipts.economy.accounts.every(a=>a.days.length===45));
 assert.equal(receipts.day7.registration.offset,20000);
 assert.equal(receipts.day7.registration.skillsV5,mode==='on');
 const missing=receipts.day7.accounts.filter(a=>!a.first.won&&!a.advice).map(a=>({style:a.style,index:a.index,rootSeed:20001+a.index,routeSeed:20001+a.index+7*7919,chapter:a.chapter,band:a.band,levels:a.levels,inputSaveSha256:a.inputSaveSha256,reason:a.noAdvice,lastEncounter:a.first.encounters.at(-1)}));
 for(const c of receipts.day7.cohorts){const accounts=receipts.day7.accounts.filter(a=>a.style===c.style);assert.equal(accounts.length,30);assert.equal(accounts.filter(a=>a.first.won||a.second?.won).length,c.twoAttemptWins);assert.equal(accounts.filter(a=>!a.first.won&&!a.advice).length,c.losses-c.availableAdvice);}
 modes[mode]={ratios:receipts.economy.ratios,cohorts:receipts.day7.cohorts,gates:receipts.day7.gates,missingAdvice:missing};
}
const n=x=>x.toFixed(3),chapters=c=>[1,2,3].map(k=>c.chapters[k]??0).join('/');
const result={sources,modes,method:'Same registered account roots and public-command policy in both configurations. Earned states can differ. Read-only receipt review; no replay, retune or elapsed-time claim.'};
await writeFile(root+'/progression-attribution.json',JSON.stringify(result,null,2)+'\n');
const text=`# Paired progression and earned day-seven outcomes

${result.method} Each mode has90 accounts (30 per style),45 synthetic days and90 earned day-seven checks. [Source hashes and exact values](progression-attribution.json).

|Heavy/casual ratio|Fallback|V5|V5 ≤3×|
|---|---:|---:|---|
${Object.keys(modes.on.ratios).map(k=>`|${k}|${n(modes.off.ratios[k])}×|${n(modes.on.ratios[k])}×|${modes.on.ratios[k]<=3?'PASS':'MISS'}|`).join('\n')}

|Style|First wins, fallback / V5|Within two attempts, fallback / V5|Losses with available advice, fallback / V5|Earned chapters1/2/3, fallback / V5|
|---|---:|---:|---:|---|
${modes.on.cohorts.map(a=>{const b=modes.off.cohorts.find(c=>c.style===a.style);return `|${a.style}|${b.firstWins}/30 / ${a.firstWins}/30|${b.twoAttemptWins}/30 / ${a.twoAttemptWins}/30|${b.availableAdvice}/${b.losses} / ${a.availableAdvice}/${a.losses}|${chapters(b)} / ${chapters(a)}|`;}).join('\n')}

V5 casual15/30 meets the50% two-attempt floor. Regular20/30 misses70% (TRAIN21/30; fallback24/30). V5 heavy16/30 first wins meets the≤95% ceiling, while fallback29/30 exceeds it. These gates retain their original directions and denominators. Wilson intervals remain in the source receipts; the thresholds are not statistical significance tests.

Both modes begin from the same account roots, but combat changes earned progress: V5 reaches later chapters more often by day7 in the casual and regular cohorts. The result is an end-to-end earned-progression comparison, not an isolated same-boss or same-inventory effect. No account is excluded or granted resources to equalize that outcome.

|Mode|No-advice account|Root / route seed|Chapter / band|Saved reason|
|---|---|---|---|---|
${['off','on'].flatMap(mode=>modes[mode].missingAdvice.map(a=>`|${mode==='on'?'V5':'Fallback'}|${a.style}, index${a.index}|${a.rootSeed} / ${a.routeSeed}|${a.chapter} / ${a.band}|${a.reason}|`)).join('\n')}

No-advice means the registered available-change forecast found no improvement; it does not prove that no conceivable strategy could win. V5 has52/54 losses with available advice, fallback27/28. The casual root20002 failure is present in both; the V5 heavy root20021 adds another. Original input-save hashes and losing encounters are retained above. No replacement account or extra retry was used.

Next TRAIN work should separate earned chapter advancement, actual boss pressure and available preparation changes before adjusting one V5-only term. Essence-source totals need separate attribution. Any changed candidate requires a newly registered30001–30500 block. Earlier elapsed browser boss timings remain independent.
`;
await writeFile(root+'/PROGRESSION-REVIEW.md',text);
console.log(JSON.stringify({samplesRun:0,sources:sources.length,missingAdvice:{on:modes.on.missingAdvice.length,off:modes.off.missingAdvice.length}}));
