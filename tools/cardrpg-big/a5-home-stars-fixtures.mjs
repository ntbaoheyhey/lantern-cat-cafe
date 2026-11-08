// REFERENCE: A5 Home43. Earned continuation plus labelled UI-only band/star edge cases.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const {loadRules}=await import(pathToFileURL(process.cwd()+'/tools/cardrpg-big/a4-load.mjs'));
const out='reports/cardrpg-big/a5/e2-home-stars/fixtures',sha=b=>createHash('sha256').update(b).digest('hex');
const origin=JSON.parse(await readFile(out+'/origin.json'));
const bytes=await readFile(out+'/earned-minute42.json');assert.equal(sha(bytes),origin.originSha256);
const {load,vite}=await loadRules(),R=await load('packages/game-rules/src/cardrpg/depth/index.ts'),B=await load('packages/game-rules/src/cardrpg/depth/run-bot.ts');
const checks=[],battles=[];
try{
 const active=JSON.parse(bytes);assert(active.run&&!active.run.complete);assert.deepEqual(active.cleared,[1,2,3]);
 let completed=B.playRun(structuredClone(active),'auto',battle=>{
  assert.deepEqual(R.replayBattle(battle.initial,battle.choices),battle);
  battles.push({setup:battle.initial,result:battle.result,replaySha256:sha(JSON.stringify(battle))});
 });
 assert(completed.run.complete);
 // Public acknowledgement of any continuation discoveries, matching the UI's settled state.
 while(completed.v4.journey.pending.length){const r=R.acknowledgeDiscoveryV4(completed,completed.v4.journey.pending[0].sequence);assert(r.ok);completed=r.state;}
 const first=Object.values(completed.v4.journey.stars).find(r=>r.conditions.some(c=>!c));
 assert.equal(first.chapter,1);assert.equal(first.band,1);
 const bands=structuredClone(completed);for(const cat of bands.account.cards)cat.level=5;
 const receipt=(chapter,band,nodeId,kind,conditions)=>({key:`${chapter}/${band}/${nodeId}/${kind}`,chapter,band,nodeId,kind,conditions});
 const a=receipt(1,2,'0-0','battle',[true,false,true]),b=receipt(2,4,'6-0','boss',[true,true,false]);
 bands.v4.journey.stars=Object.fromEntries([a,b].map(r=>[r.key,r]));
 const next=structuredClone(completed);next.cleared=[1];next.v4.journey.stars={};
 const low=receipt(1,1,'0-0','battle',[true,false,true]);next.v4.journey.stars[low.key]=low;
 const above=structuredClone(completed),high=receipt(1,5,'0-0','battle',[true,false,true]);above.v4.journey.stars={[high.key]:high};
 const full=structuredClone(completed);for(const r of Object.values(full.v4.journey.stars))r.conditions=[true,true,true];
 const started=R.startRun(bands,2,7930,'campaign','2026-11-06',2);assert(started.ok);
 const cases=[
  ['earned',completed,'Public-command continuation of the original minute42 state; no additional grants or level injection.'],
  ['bands',bands,'Synthetic UI fixture: owned levels5 and two partial star receipts to test exact band2/band4 selection.'],
  ['next',next,'Synthetic UI fixture: only chapter1 cleared, one partial chapter1 star; chapter2 must take priority.'],
  ['above',above,'Synthetic UI fixture: a band5 star above the current crew ceiling1 must not be advertised as available.'],
  ['full',full,'Synthetic UI fixture: every recorded star complete; no false first-star instruction.'],
  ['active-band',started.state,'Public route start from the synthetic bands fixture; band2 remains selected while the crew ceiling is5.'],
 ];
 await mkdir(out,{recursive:true});
 for(const[name,state,method]of cases){
  const path=out+'/'+name+'.save',code=R.exportSave(state);assert.equal(R.exportSave(R.importSave(code)),code);
  await writeFile(path,code+'\n');checks.push({name,path,method,sha256:sha(code+'\n'),stateSha256:sha(JSON.stringify(state))});
 }
 await writeFile(out+'/checks.json',JSON.stringify({passed:true,origin,checks,battles},null,2)+'\n');
 console.log(JSON.stringify({fixtures:checks.length,continuedBattles:battles.length}));
}finally{await vite.close();}
