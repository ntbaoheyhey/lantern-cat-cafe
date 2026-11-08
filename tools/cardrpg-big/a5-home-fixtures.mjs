// REFERENCE: A5 E2 Home follow-up. Preserve original earned state; label synthetic UI edge cases.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { loadRules } from './a4-load.mjs';
const out='reports/cardrpg-big/a5/e2-home/fixtures',sha=b=>createHash('sha256').update(b).digest('hex');
const origin=JSON.parse(await readFile(out+'/origin.json'));
const bytes=await readFile(out+'/earned-minute10.json');assert.equal(sha(bytes),origin.sha256);
const {load,vite}=await loadRules(),R=await load('packages/game-rules/src/cardrpg/depth/index.ts'),B=await load('packages/game-rules/src/cardrpg/depth/run-bot.ts');
const checks=[];
try{
 const active=JSON.parse(bytes);assert(active.run&&!active.run.complete);assert(active.cleared.includes(1));
 const battles=[];
 const completed=B.playRun(structuredClone(active),'auto',battle=>{
  assert.deepEqual(R.replayBattle(battle.initial,battle.choices),battle);
  battles.push({setup:battle.initial,result:battle.result,replaySha256:sha(JSON.stringify(battle))});
 });
 assert(completed.run.complete);assert(completed.cleared.includes(1));
 const band=structuredClone(completed);for(const cat of band.account.cards)cat.level=5;
 const allStars=structuredClone(completed);
 for(const star of Object.values(allStars.v4.journey.stars))star.conditions=[true,true,true];
 assert(R.starCountV4(allStars)>0);
 for(const [name,state,method] of [
  ['active',active,'Exact earned minute10 checkpoint; no additional actions or grants.'],
  ['completed',completed,'One continuation through public route commands/auto from the earned checkpoint; not an elapsed play claim.'],
  ['band',band,'Synthetic UI fixture: all owned cats level5 solely to expose the band selector. Not earned progression.'],
  ['all-stars',allStars,'Synthetic UI fixture: existing star receipts completed solely to test the fallback. No reward/pacing claim.'],
 ]){
  const path=out+'/'+name+'.save',code=R.exportSave(state);await writeFile(path,code+'\n');
  const imported=R.importSave(code);assert(imported.ok,imported.error);
  checks.push({name,path,method,sha256:sha(code+'\n'),stateSha256:sha(JSON.stringify(state)),cleared:state.cleared,stars:R.starCountV4(state)});
 }
 await writeFile(out+'/checks.json',JSON.stringify({passed:true,origin,checks,battles},null,2)+'\n');
 console.log(JSON.stringify({fixtures:checks.length,publicCommandBattles:battles.length,completed:completed.run.won}));
}finally{await vite.close();}
