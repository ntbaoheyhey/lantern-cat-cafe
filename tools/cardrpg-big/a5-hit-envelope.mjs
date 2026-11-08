// REFERENCE: hit-envelope25 preregistration; bounded current-source diagnostic only.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { loadRules } from './a5-drafts/stat-budget-05-corrected/isolated-load.mjs';
import { fixtures } from './a5-drafts/b1-prep/a5-candidate-fixtures.mjs';
const out='reports/cardrpg-big/a5/b1/hit-envelope-25';
const sha=x=>createHash('sha256').update(x).digest('hex');
const reg=JSON.parse(await readFile(`${out}/REGISTERED-METHOD.json`,'utf8'));
assert.equal(reg.count,50);assert.equal(reg.seedOffset,0);assert.equal(reg.keys.length,384);
for(const [path,digest] of Object.entries(reg.source))assert.equal(sha(await readFile(`${reg.sourceRoot}/${path}`)),digest,path);
for(const [path,digest] of Object.entries(reg.tools))assert.equal(sha(await readFile(path)),digest,path);
const registrationSha=sha(JSON.stringify(reg));
const cp=JSON.parse(await readFile(`${out}/partial.json`,'utf8').catch(e=>{if(e.code==='ENOENT')return '{}';throw e;}));
if(cp.registrationSha)assert.equal(cp.registrationSha,registrationSha);
const rows=cp.rows??[],started=Date.now(),pause=new Error('checkpoint');
const save=()=>writeFile(`${out}/partial.json`,JSON.stringify({registrationSha,rows}));
process.env.BIG_RULES_ROOT=reg.sourceRoot;
try{
 for(const [variant,config] of Object.entries(reg.variants)){
  if(reg.keys.every(key=>rows.some(r=>r.key===key&&r.variant===variant&&r.outcomes.length===50)))continue;
  assert.equal(sha(await readFile(config.path)),config.sha256);
  const suite=await loadRules({transforms:{'packages/game-rules/src/cardrpg/depth/battle.ts':config.path}});
  try{
   const R=suite.depth;assert.equal(R.A5_HIT_ENVELOPE25,variant);assert.deepEqual(Object.values(suite.appliedTransforms),[1]);
   const {setups}=fixtures(R,suite.legacy);
   for(const key of reg.keys){
    let row=rows.find(r=>r.key===key&&r.variant===variant);
    if(!row){row={variant,key,outcomes:'',beforeRounds:0,afterRounds:0};rows.push(row);}
    for(let seed=row.outcomes.length+1;seed<=50;seed++){
     const f=setups(JSON.parse(key),seed),before=R.playBattle(R.createBattle(f.setups.none),'auto'),after=R.playBattle(R.createBattle(f.setups.all),'auto');
     if(seed===1){assert.deepEqual(R.replayBattle(before.initial,before.choices),before);assert.deepEqual(R.replayBattle(after.initial,after.choices),after);}
     row.outcomes+=String(2*Number(before.result==='party')+Number(after.result==='party'));
     row.beforeRounds+=before.round;row.afterRounds+=after.round;
     if(Date.now()-started>=110000){await save();process.exitCode=75;throw pause;}
    }
    row.complete=true;
   }
   await save();console.log(JSON.stringify({variant,cells:rows.filter(r=>r.variant===variant&&r.complete).length}));
  }finally{await suite.close();}
 }
 const oldBytes=await readFile(reg.original.path);assert.equal(sha(oldBytes),reg.original.sha256);
 const old=JSON.parse(oldBytes);const all=[...old.rows.map(r=>({...r,variant:'control'})),...rows];
 const summaries=all.map(r=>{
  assert.match(r.outcomes,/^[0-3]{50}$/);
  const wins=[...r.outcomes].filter(x=>Number(x)%2).length,before=[...r.outcomes].filter(x=>Number(x)>=2).length;
  return {variant:r.variant,key:r.key,wins,beforeWins:before,gainPp:2*(wins-before),improved:[...r.outcomes].filter(x=>x==='1').length,worsened:[...r.outcomes].filter(x=>x==='2').length};
 });
 const aggregate=['control',...Object.keys(reg.variants)].map(variant=>{
  const cells=summaries.filter(r=>r.variant===variant);assert.equal(cells.length,384);
  return {variant,cells:cells.length,maxGainPp:Math.max(...cells.map(r=>r.gainPp)),misses:cells.filter(r=>r.gainPp>12).length,
   beforeWinSaturated:cells.filter(r=>r.beforeWins>=48).length,afterWinSaturated:cells.filter(r=>r.wins>=48).length,
   beforeLossSaturated:cells.filter(r=>r.beforeWins<=2).length,afterLossSaturated:cells.filter(r=>r.wins<=2).length,
   meanBefore:cells.reduce((n,r)=>n+r.beforeWins,0)/19200,meanAfter:cells.reduce((n,r)=>n+r.wins,0)/19200};
 });
 await writeFile(`${out}/results.json`,JSON.stringify({registrationSha,rows,summaries,aggregate},null,2)+'\n');
 console.log(JSON.stringify(aggregate));
}catch(e){if(e!==pause)throw e;}
