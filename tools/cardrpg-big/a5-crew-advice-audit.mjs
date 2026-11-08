// REFERENCE: crew-advice28. Validate immutable isolated source and every original earned input.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root='reports/cardrpg-big/a5/e1/crew-advice-28',sha=x=>createHash('sha256').update(x).digest('hex'),receipts=[];
async function read(path){const bytes=await readFile(path);receipts.push({path,sha256:sha(bytes)});return JSON.parse(bytes);}
const reg=await read(root+'/REGISTERED-METHOD.json'),before=await read('reports/cardrpg-big/a5/b1/current-cliffs-24/REGISTERED-METHOD.json');
for(const [p,h]of Object.entries(reg.source))assert.equal(sha(await readFile(reg.sourceRoot+'/'+p)),h,p);
assert.deepEqual(Object.keys(reg.source).filter(p=>reg.source[p]!==before.source[p]),['packages/game-rules/src/cardrpg/depth/recommendation-v4.ts']);
for(const [p,h]of Object.entries({...reg.scripts,...reg.savedInputs}))assert.equal(sha(await readFile(p)),h,p);
const day=await read(root+'/day7-checks/checks.json'),pairs=await read(root+'/day7-paired.json');
assert.deepEqual(day.registration.source,reg.combatSource);assert.equal(day.accounts.length,90);
for(const r of pairs.receipts)assert.equal(sha(await readFile(r.path)),r.sha256,r.path);
for(const key of ['firstEncountersExact','firstChoicesExact','firstStateHashesExact','withoutAdviceExact'])assert.equal(pairs.totals[key],90,key);
assert(Object.values(day.gates).every(Boolean));
const replacements=day.accounts.filter(a=>a.advice?.change.kind==='cat');
for(const a of replacements){assert.deepEqual(a.advice.cost,{});assert.deepEqual(a.appliedCurrencies.before,a.appliedCurrencies.after);}
const report={status:'Supported isolated candidate; source/browser/OFF closure pending',source:reg.combatSource,cohorts:day.cohorts,gates:day.gates,
 paired:pairs.totals,ownedCatSuggestions:replacements.map(a=>({style:a.style,index:a.index,advice:a.advice,won:a.second?.won})),receipts,
 limitations:['90previously earned day7 inputs, not fresh45-day acceptance or a human playtest.',
 'Recommendation forecasts are not guarantees: one heavy account still loses with advice while its no-advice retry wins.',
 'No pressure-transfer27 or phase26 runtime change is included.']};
await writeFile(root+'/audit.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,gates:report.gates,paired:report.paired,catSuggestions:replacements.length}));
