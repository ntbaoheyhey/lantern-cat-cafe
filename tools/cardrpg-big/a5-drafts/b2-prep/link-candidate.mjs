import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {loadRules} from '/tmp/cardrpg-a5-b1-prep/a5-candidate-load.mjs';
import {fixtures} from './team-fixtures.mjs';
const prep='/tmp/cardrpg-a5-b2-prep',out='reports/cardrpg-big/a5/b2/link-candidate-01';
const manifest=JSON.parse(await readFile(out+'/manifest.json','utf8'));
const hash=value=>createHash('sha256').update(value).digest('hex');
const original=await readFile('reports/cardrpg-big/a4/p6/train/results.json');assert.equal(hash(original),manifest.trainSha256);
const train=JSON.parse(original),lookup=new Map(train.rows.map(r=>[r.key,r]));
for(const [file,expected] of Object.entries(train.source))assert.equal(hash(await readFile(file)),expected,file);
assert.equal(hash(await readFile(prep+'/linked-shield-battle.ts')),manifest.candidateSha256);
assert.equal(hash(await readFile(prep+'/team-fixtures.mjs')),manifest.fixtureSha256);
const checkpoint=JSON.parse(await readFile(out+'/partial.json','utf8').catch(e=>{if(e.code==='ENOENT')return '{}';throw e;}));
if(checkpoint.manifest)assert.deepEqual(checkpoint.manifest,manifest);
const rows=checkpoint.rows??[],start=Date.now(),pause=Error('slice');
const before=await loadRules(),after=await loadRules({transforms:{'packages/game-rules/src/cardrpg/depth/battle.ts':prep+'/linked-shield-battle.ts'}});
const O=before.depth,N=after.depth,F=fixtures(O,before.legacy);
try {
 for(const team of manifest.teams)for(const chapter of manifest.chapters) {
  const key=JSON.stringify({kind:'teams',team,chapter,level:6});assert(lookup.has(key));
  let row=rows.find(r=>r.key===key);if(!row){row={key,team,chapter,outcomes:'',linkedAbsorption:0};rows.push(row);}
  for(let seed=row.outcomes.length+1;seed<=50;seed++) {
   const state=F.fixture(seed,6,'epic',team),cats=F.matchedCats(state,seed).cats;
   const setup={seed,chapter,cats,enemies:[O.CHAPTERS[chapter-1].boss],gameplayV4:true,challengeLevel:6},saved=JSON.stringify(setup);
   const a=O.playBattle(O.createBattle(setup),'auto'),b=N.playBattle(N.createBattle(setup),'auto');
   assert.equal(Number(a.result==='party'),Number(lookup.get(key).outcomes[seed-1]));
   assert.equal(JSON.stringify(setup),saved);
   if(seed===1)assert.deepEqual(N.replayBattle(b.initial,b.choices),b);
   row.outcomes+=String((a.result==='party'?2:0)+(b.result==='party'?1:0));
   row.linkedAbsorption+=b.log.filter(e=>e.kind==='absorbed'&&e.text==='Shield absorbed linked damage').reduce((n,e)=>n+e.amount,0);
   if(Date.now()-start>=110000){process.exitCode=75;throw pause;}
  }
 }
 const summaries=rows.map(r=>({...r,beforeWins:[...r.outcomes].filter(x=>Number(x)>=2).length,afterWins:[...r.outcomes].filter(x=>Number(x)%2).length,improved:[...r.outcomes].filter(x=>x==='1').length,worsened:[...r.outcomes].filter(x=>x==='2').length}));
 for(const row of summaries)row.gainPp=(row.afterWins-row.beforeWins)*2;
 await writeFile(out+'/results.json',JSON.stringify({manifest,source:train.source,summaries},null,2));
 console.log(JSON.stringify(summaries.map(({team,chapter,beforeWins,afterWins,gainPp,linkedAbsorption})=>({team,chapter,beforeWins,afterWins,gainPp,linkedAbsorption}))));
}catch(e){if(e!==pause)throw e;}finally{await writeFile(out+'/partial.json',JSON.stringify({manifest,rows}));await before.close();await after.close();}
