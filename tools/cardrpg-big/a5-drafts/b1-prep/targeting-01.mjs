// REFERENCE: targeting-01/REGISTERED-METHOD.md. Isolated TRAIN, no automatic adoption.
import {loadRules} from './a5-candidate-load.mjs';
import {fixtures} from './a5-candidate-fixtures.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const directory=fileURLToPath(new URL('./targeting-01/',import.meta.url));
const out='reports/cardrpg-big/a5/b1/targeting-01';
const manifest=JSON.parse(await readFile(directory+'/manifest.json','utf8'));
const hash=x=>createHash('sha256').update(x).digest('hex');
const a4=JSON.parse(await readFile('reports/cardrpg-big/a4/p6/train/results.json','utf8'));
const a4Rows=new Map(a4.rows.map(r=>[r.key,r]));
for(const [path,expected]of Object.entries(manifest.source))assert.equal(hash(await readFile(path)),expected,path);
await mkdir(out,{recursive:true});
const cp=JSON.parse(await readFile(out+'/partial.json','utf8').catch(e=>{if(e.code==='ENOENT')return '{}';throw e;}));
if(cp.manifest)assert.deepEqual(cp.manifest,manifest);
const rows=cp.rows??[],started=Date.now(),pause=new Error('checkpoint');
const save=()=>writeFile(out+'/partial.json',JSON.stringify({manifest,rows}));
try{
 for(const [variant,files]of Object.entries(manifest.variants)){
  if(manifest.keys.every(key=>rows.some(r=>r.variant===variant&&r.key===key&&r.outcomes.length===manifest.count)))continue;
  const transforms={};
  for(const [path,expected]of Object.entries(files)){const full=directory+'/'+variant+'/'+path;assert.equal(hash(await readFile(full)),expected);transforms[path]=full;}
  const suite=await loadRules({transforms});
  try{
   const R=suite.depth,{setups}=fixtures(R,suite.legacy);
   for(const key of manifest.keys){
    const meta=JSON.parse(key);assert(a4Rows.has(key),'Original fixture must exist: '+key);
    let row=rows.find(r=>r.variant===variant&&r.key===key);
    if(!row){row={variant,key,outcomes:'',beforeActions:0,afterActions:0,firstDeathRounds:{}};rows.push(row);}
    for(let seed=row.outcomes.length+1;seed<=manifest.count;seed++){
     const pair=setups(meta,seed).setups;
     const before=R.playBattle(R.createBattle(pair.none),'auto'),after=R.playBattle(R.createBattle(pair.all),'auto');
     row.outcomes+=String((before.result==='party'?2:0)+(after.result==='party'?1:0));
     row.beforeActions+=before.log.filter(e=>['action','enemy-action'].includes(e.kind)).length;
     row.afterActions+=after.log.filter(e=>['action','enemy-action'].includes(e.kind)).length;
     const death=before.log.find(e=>e.kind==='defeat'&&before.actors.some(a=>a.id===e.targetId&&a.side==='party'));
     if(death)row.firstDeathRounds[death.round]=(row.firstDeathRounds[death.round]??0)+1;
     if(seed===1)assert.deepEqual(R.replayBattle(after.initial,after.choices),after,'Replay parity '+variant);
     if(Date.now()-started>=110000){await save();process.exitCode=75;throw pause;}
    }
   }
   await save();console.log(JSON.stringify({variant,cells:rows.filter(r=>r.variant===variant&&r.outcomes.length===manifest.count).length}));
  }finally{await suite.close();}
 }
 const paired=r=>{const codes=[...r.outcomes].map(Number),before=codes.filter(v=>v>=2).length,after=codes.filter(v=>v%2).length;return {...r,beforeWins:before,wins:after,gainPp:(after-before)*100/manifest.count};};
 const summaries=[...rows.map(paired),...manifest.keys.map(key=>paired({variant:'A4-reused',key,outcomes:a4Rows.get(key).outcomes.slice(0,manifest.count)}))];
 const aggregate=[...Object.keys(manifest.variants),'A4-reused'].map(variant=>{
  const cells=summaries.filter(r=>r.variant===variant);return {variant,cells:cells.length,worstPp:Math.max(...cells.map(r=>r.gainPp)),above12:cells.filter(r=>r.gainPp>12).length,
   saturatedBefore:cells.filter(r=>r.beforeWins/manifest.count>=.95).length,saturatedAfter:cells.filter(r=>r.wins/manifest.count>=.95).length,
   meanBefore:cells.reduce((n,r)=>n+r.beforeWins,0)/(cells.length*manifest.count),meanAfter:cells.reduce((n,r)=>n+r.wins,0)/(cells.length*manifest.count)};
 });
 await writeFile(out+'/results.json',JSON.stringify({manifest,rows,summaries,aggregate},null,2));console.log(JSON.stringify(aggregate));
}catch(error){if(error!==pause)throw error;}
