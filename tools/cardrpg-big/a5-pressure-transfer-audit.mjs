// REFERENCE: pressure-transfer27. Audit finished immutable arms; no simulation or seed changes.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const root='reports/cardrpg-big/a5/b1/pressure-transfer-27';
const current='reports/cardrpg-big/a5/b2/hush-eligibility-22',committed='reports/cardrpg-big/a5/b1/committed-pattern-26';
const sha=x=>createHash('sha256').update(x).digest('hex'),receipts=[];
async function read(path){const bytes=await readFile(path);receipts.push({path,sha256:sha(bytes)});return JSON.parse(bytes);}
const parent=await read(committed+'/REGISTERED-METHOD.json'),original=await read(current+'/summary.json'),prior=await read(committed+'/summary.json'),control=await read(committed+'/semantic-control.json');
const brief=s=>({pieceMisses:s.pieces.misses,worstPieceGainPp:s.pieces.worst.gainPp,
 beforeSaturated:s.pieces.beforeSaturated,afterSaturated:s.pieces.afterSaturated,
 tiers:s.tiers.positive,reversals:s.tiers.reversals,bandMisses:s.bands.filter(r=>r.spreadPp<15||r.saturated).length,
 catRange:[Math.min(...s.cats.map(r=>r.rate)),Math.max(...s.cats.map(r=>r.rate))],
 setRange:[Math.min(...s.sets.map(r=>r.rate)),Math.max(...s.sets.map(r=>r.rate))],crewGainPp:s.crew.gainPp});
const arms=[];
for(const name of ['transfer15','transfer30']){
 const dir=root+'/'+name,reg=await read(dir+'/REGISTERED-METHOD.json');
 assert.deepEqual(reg.scopes,parent.scopes);assert.deepEqual(reg.savedInputs,parent.savedInputs);
 for(const [p,h]of Object.entries(reg.source))assert.equal(sha(await readFile(reg.sourceRoot+'/'+p)),h,p);
 for(const [p,h]of Object.entries({...reg.scripts,...reg.savedInputs}))assert.equal(sha(await readFile(p)),h,p);
 assert.deepEqual(Object.keys(reg.source).filter(p=>reg.source[p]!==parent.source[p]),['packages/game-rules/src/cardrpg/depth/battle.ts']);
 for(const script of ['matrix.mjs','cohort.mjs'])assert.equal((await readFile(dir+'/'+script,'utf8')).replaceAll(dir,committed),await readFile(committed+'/'+script,'utf8'));
 const pressure=await read(dir+'/pressure-semantics.json'),semantic=await read(dir+'/semantic-candidate.json');
 assert.equal(pressure.cases,48);assert.equal(pressure.replays,6);assert.equal(semantic.pass,90);
 assert.deepEqual(pressure.source,reg.combatSource);assert.deepEqual(semantic.source,reg.source);
 for(let i=0;i<90;i++)if(!control.rows[i].gameplayV4)assert.deepEqual(semantic.rows[i],control.rows[i]);
 execFileSync(process.execPath,['tools/cardrpg-big/a5-train-summary.mjs',dir+'/balance',dir+'/summary.json']);
 for(const [label,path]of [['current22',current],['committed26',committed]]){
  execFileSync(process.execPath,['tools/cardrpg-big/a5-train-pairs.mjs',path+'/balance',dir+'/balance',dir+'/train-paired-'+label+'.json']);
 }
 execFileSync(process.execPath,['tools/cardrpg-big/a5-current-day7-pairs.mjs',dir,current+'/day7-checks/checks.json']);
 const summary=await read(dir+'/summary.json'),day=await read(dir+'/day7-checks/checks.json'),dayPairs=await read(dir+'/day7-paired.json');
 const pairs=await read(dir+'/train-paired-current22.json');
 assert.deepEqual(summary.source,reg.combatSource);assert.deepEqual(day.registration.source,reg.combatSource);
 assert.equal(day.accounts.length,90);assert.equal(summary.count,50);
 for(const d of [summary,dayPairs,pairs])for(const r of d.receipts)assert.equal(sha(await readFile(r.path)),r.sha256,r.path);
 const failed=Object.keys(day.gates).filter(k=>!day.gates[k]);
 arms.push({name,summary:brief(summary),cohorts:day.cohorts,gates:day.gates,failedProgressionGates:failed,day7Pairs:dayPairs.totals,groups:pairs.groups,
  decision:failed.length?'REJECT isolated adoption: a registered progression gate fails.':'Progression screen passes; full numeric/source/compatibility/browser review remains required.'});
}
const report={status:'Complete TRAIN diagnostic; no acceptance or production adoption',before:brief(original),committed26:brief(prior),arms,receipts,
 limitations:['Same original fixtures and TRAIN1–50; no 500-seed or fresh acceptance claim.',
 'N target budget equation holds for fixed targets; actual HP loss is not conserved.',
 '90 previous earned day7 inputs are not fresh45-day progression.',
 'Every negative pair, saturation and original failed gate is retained.']};
await writeFile(root+'/audit.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({before:report.before,arms:arms.map(a=>({name:a.name,summary:a.summary,gates:a.gates,decision:a.decision}))}));
