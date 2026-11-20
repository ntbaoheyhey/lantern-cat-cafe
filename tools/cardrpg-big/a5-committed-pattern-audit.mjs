// REFERENCE: A5 committed-pattern26. Consume completed receipts; never resample.
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const root='reports/cardrpg-big/a5/b1/committed-pattern-26',old='reports/cardrpg-big/a5/b2/hush-eligibility-22';
const sha=x=>createHash('sha256').update(x).digest('hex'),receipts=[];
async function read(path){const bytes=await readFile(path);receipts.push({path,sha256:sha(bytes)});return JSON.parse(bytes);}
const reg=await read(root+'/REGISTERED-METHOD.json'),baseline=await read(old+'/REGISTERED-METHOD.json');
for(const [path,digest] of Object.entries(reg.source))assert.equal(sha(await readFile(reg.sourceRoot+'/'+path)),digest,path);
for(const [path,digest] of Object.entries({...reg.scripts,...reg.savedInputs}))assert.equal(sha(await readFile(path)),digest,path);
assert.deepEqual(reg.savedInputs,baseline.savedInputs);assert.deepEqual(reg.scopes,baseline.scopes);
for(const script of ['matrix.mjs','cohort.mjs']){
 const a=await readFile(old+'/'+script,'utf8'),b=await readFile(root+'/'+script,'utf8');
 assert.equal(b.replaceAll(root,old).replace('acceptance20001-20500 UNUSED;','heldout10001-10500;'),a);
}
const before=await read(old+'/summary.json'),after=await read(root+'/summary.json');
assert.deepEqual(before.source,baseline.combatSource);assert.deepEqual(after.source,reg.combatSource);
for(const d of [before,after]){assert.equal(d.count,50);for(const r of d.receipts)assert.equal(sha(await readFile(r.path)),r.sha256);}
const control=await read(root+'/semantic-control.json'),candidate=await read(root+'/semantic-candidate.json');
assert.equal(control.total,90);assert.equal(candidate.total,90);assert.equal(candidate.pass,90);
assert.equal(control.rows.length,90);assert.equal(candidate.rows.length,90);
let exactOff=0,unchangedOther=0;
for(let i=0;i<90;i++){
 const a=control.rows[i],b=candidate.rows[i];
 for(const key of ['gameplayV4','enemyId','context','control'])assert.equal(a[key],b[key]);
 assert(Object.values(b.checks).every(Boolean));
 if(!b.gameplayV4){assert.deepEqual(a,b);exactOff++;}
 else if(b.context!=='crossing'){assert.deepEqual(a.events,b.events);unchangedOther++;}
}
assert.equal(exactOff,45);
const pairs=await read(root+'/train-paired-current22.json'),dayPairs=await read(root+'/day7-paired.json');
const oldDay=await read(old+'/day7-checks/checks.json'),day=await read(root+'/day7-checks/checks.json');
assert.deepEqual(day.registration.source,reg.combatSource);assert.equal(day.accounts.length,90);
for(const d of [pairs,dayPairs])for(const r of d.receipts)assert.equal(sha(await readFile(r.path)),r.sha256);
const brief=s=>({pieceMisses:s.pieces.misses,worstPieceGainPp:s.pieces.worst.gainPp,
 beforeSaturated:s.pieces.beforeSaturated,afterSaturated:s.pieces.afterSaturated,
 tiers:s.tiers.positive,reversals:s.tiers.reversals,bandMisses:s.bands.filter(r=>r.spreadPp<15||r.saturated).length,
 catRange:[Math.min(...s.cats.map(r=>r.rate)),Math.max(...s.cats.map(r=>r.rate))],
 setRange:[Math.min(...s.sets.map(r=>r.rate)),Math.max(...s.sets.map(r=>r.rate))],crewGainPp:s.crew.gainPp});
const regressedGates=Object.keys(day.gates).filter(k=>oldDay.gates[k]&&!day.gates[k]);
assert.deepEqual(regressedGates,['heavyFirstAtMost95']);
const report={status:'AUDITED; isolated production adoption BLOCKED by preregistered progression gate',
 before:brief(before),after:brief(after),semantic:{before:control.pass,after:candidate.pass,total:90,exactOff,unchangedOther},
 progression:{before:oldDay.cohorts,after:day.cohorts,gates:day.gates,regressedGates,paired:dayPairs.totals},
 groups:pairs.groups,receipts,limitations:['TRAIN1–50 and 90 previously earned inputs, not fresh acceptance or a new 45-day cohort.',
 'Phase fairness improves, but heavy first wins rise28/30 to30/30; no gate relaxed.',
 'No source adoption, OFF8250 rerun, browser/build result or balanced-game claim for this rejected candidate.']};
await writeFile(root+'/audit.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({status:report.status,before:report.before,after:report.after,semantic:report.semantic,regressedGates}));
