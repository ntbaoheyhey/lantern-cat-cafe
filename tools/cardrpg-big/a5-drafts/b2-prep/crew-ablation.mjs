// Registered TRAIN-only causal ablation. No production mutation or acceptance seeds.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {loadRules} from '/tmp/cardrpg-a5-b1-prep/a5-candidate-load.mjs';
import {fixtures} from './team-fixtures.mjs';
const prep='/tmp/cardrpg-a5-b2-prep',out='reports/cardrpg-big/a5/b2/crew-ablation';
const hash=x=>createHash('sha256').update(x).digest('hex');
const manifest=JSON.parse(await readFile(prep+'/REGISTERED-CREW-ABLATION.json','utf8'));
const bytes=await readFile('reports/cardrpg-big/a4/p6/train/results.json');assert.equal(hash(bytes),manifest.trainSha256);
const train=JSON.parse(bytes),rowsByKey=new Map(train.rows.map(r=>[r.key,r]));
for(const [file,expected] of Object.entries(train.source))assert.equal(hash(await readFile(file)),expected,file);
assert.equal(hash(await readFile(manifest.source)),manifest.sourceSha256);
assert.equal(hash(await readFile(prep+'/no-crew.ts')),manifest.candidateSha256);
assert.equal(hash(await readFile(prep+'/team-fixtures.mjs')),manifest.fixturesSha256);
await mkdir(out,{recursive:true});
const cp=JSON.parse(await readFile(out+'/partial.json','utf8').catch(e=>{if(e.code==='ENOENT')return '{}';throw e;}));
if(cp.manifest)assert.deepEqual(cp.manifest,manifest);
const rows=cp.rows??[],started=Date.now(),pause=new Error('checkpoint');
const before=await loadRules(),without=await loadRules({transforms:{[manifest.source]:prep+'/no-crew.ts'}});
const O=before.depth,N=without.depth,F=fixtures(O,before.legacy);
try{
 for(const team of manifest.teams)for(const chapter of manifest.chapters){
  const key=JSON.stringify({kind:'teams',team,chapter,level:6});
  const original=rowsByKey.get(key);assert(original);
  let row=rows.find(r=>r.key===key);if(!row){row={key,team,chapter,outcomes:''};rows.push(row);}
  for(let seed=row.outcomes.length+1;seed<=manifest.seeds[1];seed++){
   const s=F.fixture(seed,6,'epic',team),unscaled=O.battleCats(s);
   const utility=s.team.reduce((n,id)=>n+O.powerV4(s,id).utility,0),raw=unscaled.reduce((n,c)=>n+O.rawPowerV4(c.stats),0);
   const scale=(O.teamPowerV4(F.fixture(seed,6,'epic'))-utility)/raw;
   const modified=N.battleCats(s);
   for(const cats of [unscaled,modified])for(const cat of cats)for(const k of ['hp','attack','defense'])cat.stats[k]=Math.max(1,Math.round(cat.stats[k]*scale));
   const setup={seed,chapter,cats:unscaled,enemies:[O.CHAPTERS[chapter-1].boss],gameplayV4:true,challengeLevel:6};
   const a=O.playBattle(O.createBattle(setup),'auto'),b=N.playBattle(N.createBattle({...setup,cats:modified}),'auto');
   assert.equal(Number(a.result==='party'),Number(original.outcomes[seed-1]),key+' seed '+seed);
   row.outcomes+=String((b.result==='party'?2:0)+(a.result==='party'?1:0));
   if(seed===1){assert.deepEqual(O.replayBattle(a.initial,a.choices),a);assert.deepEqual(N.replayBattle(b.initial,b.choices),b);}
   if(Date.now()-started>110000){process.exitCode=75;throw pause;}
  }
 }
 const summaries=rows.map(r=>({...r,withCrew:[...r.outcomes].filter(x=>Number(x)%2).length,withoutCrew:[...r.outcomes].filter(x=>Number(x)>=2).length}));
 for(const row of summaries)row.crewGainPp=100*(row.withCrew-row.withoutCrew)/row.outcomes.length;
 await writeFile(out+'/results.json',JSON.stringify({manifest,source:train.source,rows,summaries,method:'Same cats/gear/scale with versus without crew stats/opening grants. Baseline matched all original training outcomes. Presentation events retain original crew-active labels in this diagnostic bundle and are not a UI claim.'},null,2));
 console.log(JSON.stringify({complete:true,cells:rows.length,maxCrewGainPp:Math.max(...summaries.map(r=>r.crewGainPp)),minCrewGainPp:Math.min(...summaries.map(r=>r.crewGainPp))}));
}catch(error){if(error!==pause)throw error;}
finally{await writeFile(out+'/partial.json',JSON.stringify({manifest,source:train.source,rows}));await before.close();await without.close();}
