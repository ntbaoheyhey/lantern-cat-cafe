// REFERENCE: A5 B1; audit existing receipts without simulating or changing source.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
const out='reports/cardrpg-big/a5/b1/current-cliffs-24';
const sha=x=>createHash('sha256').update(x).digest('hex'), receipts=[];
async function read(path){const bytes=await readFile(path);receipts.push({path,sha256:sha(bytes)});return JSON.parse(bytes);}
const reg=await read(`${out}/REGISTERED-METHOD.json`), result=await read(`${out}/results.json`);
for(const [path,digest] of Object.entries({...reg.source,...reg.tools}))assert.equal(sha(await readFile(path)),digest,path);
assert.equal(result.registrationSha,sha(JSON.stringify(reg)));assert.equal(result.count,50);
const original=await read(reg.original.path);assert.equal(receipts.at(-1).sha256,reg.original.sha256);
const old=new Map(original.rows.map(r=>[r.key,r]));
assert.deepEqual(result.rows.map(r=>r.key),reg.keys);assert.equal(new Set(reg.keys).size,68);
const summary=[];
for(const row of result.rows){
 assert(row.complete);const meta=JSON.parse(row.key),components={};
 for(const v of result.variants){
  const bits=row.outcomes[v];assert.match(bits,/^[01]{50}$/);
  const wins=[...bits].filter(v=>v==='1').length,baseline=[...row.outcomes.none].filter(v=>v==='1').length;
  components[v]={wins,gainPp:2*(wins-baseline)};
  const saved=result.summaries.find(r=>r.templateId===meta.templateId&&r.chapter===meta.chapter).components[v];
  assert.equal(saved.sha256,sha(bits));assert.equal(saved.wins,wins);assert.equal(saved.gainPp,components[v].gainPp);
 }
 for(let i=0;i<50;i++)assert.equal(String(2*Number(row.outcomes.none[i])+Number(row.outcomes.all[i])),old.get(row.key).outcomes[i]);
 summary.push({...meta,components});
}
const examples=[];
for(const example of result.replays){
 assert(reg.exampleKeys.includes(example.key));assert(!example.tracePending);
 const trace=await read(example.tracePath),pair=await read(example.path),meta=JSON.parse(example.key);
 assert.equal(trace.key,example.key);assert.equal(trace.seed,example.seed);
 assert.equal(pair.before.result,'enemy');assert.equal(pair.after.result,'party');
 for(const arm of ['before','after']){
  assert.equal(trace[arm].result,pair[arm].result);
  for(const s of trace[arm].steps){assert(s.logEnd>=s.logStart);assert(s.logEnd<=pair[arm].log.length);}
 }
 const death=trace.losingFirstDeath;assert.equal(death.hpMargin,death.hpBefore-death.requestedHpLoss);
 assert.equal(death.extraHpNeededToSurvive,1-death.hpMargin);
 const same=trace.winningAtSameActorRound?.actors.find(a=>a.id===death.targetId);
 examples.push({...meta,seed:example.seed,death,firstDivergence:trace.divergence?{partyIndex:trace.divergence.partyIndex,aligned:trace.divergence.aligned,before:trace.divergence.before.choice,after:trace.divergence.after?.choice}:null,
  afterHpAtSameEnemyAction:same?.hp??null,beforeRounds:pair.before.round,afterRounds:pair.after.round,tracePath:example.tracePath});
}
const chapters=[1,2,3].map(chapter=>{
 const rows=summary.filter(r=>r.chapter===chapter);
 return {chapter,cells:rows.length,meanGainPp:Object.fromEntries(result.variants.map(v=>[v,rows.reduce((n,r)=>n+r.components[v].gainPp,0)/rows.length]))};
});
const audit={status:'PASS',scope:'Audit of existing TRAIN1–50 selected residuals; no new simulation or acceptance.',cells:68,battles:20400,exactOriginalPairs:3400,chapters,examples,rows:summary,receipts};
await writeFile(`${out}/audit.json`,JSON.stringify(audit,null,2)+'\n');
const lines=['# Current-source cliff ablation24','',
 'All 68 current Hush22 TRAIN1–50 residuals are retained. Six isolated component arms total 20,400 battles; all 3,400 before/full pairs exactly match the original Hush22 outcome strings. Each first-seed component replay and six read-only HP-observer traces passed whole-battle parity in the original runner. This audit consumes those completed receipts; it does not resample them.','',
 '|Chapter|Cells|Main alone, mean pp|Affixes alone|Unique alone|Set4 alone|Full piece|','|---|---:|---:|---:|---:|---:|---:|',
 ...chapters.map(r=>`|${r.chapter}|${r.cells}|${['main','affixes','unique','set4','all'].map(v=>r.meanGainPp[v].toFixed(2)).join('|')}|`),'',
 'These are selected residuals, not an unbiased estimate of all equipment. Component gains are not additive: the same heal, defense and HP margins can interact. The isolated set4 effect is zero in every chapter2 case. No evidence supports trimming all set identities to fix this pattern.','',
 '|Item / chapter / seed|First losing death|HP before / request|Survival shortfall|Winning arm HP before same enemy action|','|---|---|---:|---:|---:|',
 ...examples.map(r=>`|${r.templateId} / ${r.chapter} / ${r.seed}|${r.death.targetId}, round ${r.death.round}|${r.death.hpBefore} / ${r.death.requestedHpLoss}|${r.death.extraHpNeededToSurvive}|${r.afterHpAtSameEnemyAction??'none'}|`),'',
 'Hearthloom Legendary charm in chapter2 rises 1→45/50 wins: main alone24, affixes7, unique1, set4 1. In seed1 the original Mochi has234HP before a301HP request and falls in round6. The equipped Mochi survives and uses Last light shelter at round7. Its first changed party choice follows the death, so this is not evidence that the AI initially chose the wrong skill. Defense reduces repeated hits; that accumulated survival margin unlocks another entire support turn.','',
 'Bellsteel Legendary outfit in chapter2 rises5→47/50; main alone40, affixes19, unique7, set4 5. Chapter1 offensive examples can still lose Mochi in both arms but finish the boss sooner. Current chapter3 examples first lose Mochi in round10, not the old A4 round6. The current source therefore needs its own diagnosis.','',
 'Code review confirms that wide boss signatures can spend175% attack separately on all three cats, with live phase expansion after the intent was created. Storm additionally discards every affected shield. These are candidate mechanisms, not proof that capping damage will close balance. A new isolated trial will test a maximum-HP damage envelope before absorption; every template and seed stays fixed, and both easy-win and all-loss saturation will be reported. No source adoption, numeric gate change, or fresh acceptance follows from this ablation.','',
 '[Audited component table and receipt hashes](audit.json) · [original component outcomes](results.json). Matching-round snapshots after choices diverge are descriptive, not controlled causal estimates. Bots are not a human playtest.'];
await writeFile(`${out}/INTERPRETATION.md`,lines.join('\n')+'\n');
console.log(JSON.stringify({status:audit.status,cells:audit.cells,battles:audit.battles,exactOriginalPairs:audit.exactOriginalPairs,chapters}));
