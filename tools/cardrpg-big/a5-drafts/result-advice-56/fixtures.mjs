// REFERENCE: Result56. Reuse earned loss saves; exact public transaction expectations, no new win-rate samples.
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { loadRules } from '../../a4-load.mjs';
const out='reports/cardrpg-big/a5/e1-result-advice/fixtures',sha=b=>createHash('sha256').update(b).digest('hex');
await mkdir(out,{recursive:true});const loader=await loadRules();
try {
 const R=await loader.load('packages/game-rules/src/cardrpg/depth/index.ts'),accept=r=>{assert(r.ok,r.error);return r.state;};
 const fixtures=[];
 for(const [name,path] of [
  ['original-loss','reports/cardrpg-big/a5/e1/crew-advice-28/earned-reserve-loss.save'],
  ['trained-reserve','reports/cardrpg-big/a5/e1/crew-advice-29/earned-reserve-loss.save'],
 ]) {
  const bytes=await readFile(path),state=R.importSave(bytes.toString());assert.equal(state.run.battle.result,'enemy');
  const advice=R.recommendBuildV4(accept(R.resultAdviceStateV4(state)),state.run.battle.initial);assert(advice);
  let applied=accept(R.applyResultAdviceV4(state,advice));
  applied=accept(R.startRun(applied,state.run.chapter,applied.account.seed+applied.nextRunId*7919,state.run.mode,'2026-11-06',state.run.challengeLevel));
  applied=accept(R.enterNode(applied,R.availableNodes(applied.run)[0].id));
  const beforePath=out+'/'+name+'-before.json',afterPath=out+'/'+name+'-after.json';
  await writeFile(beforePath,JSON.stringify(state,null,2)+'\n');await writeFile(afterPath,JSON.stringify(applied,null,2)+'\n');
  fixtures.push({name,path,sha256:sha(bytes),beforePath,afterPath,advice,method:'Existing earned day7 loss; unchanged recommendation and exact public apply/start/enter commands.'});
 }
 const original=JSON.parse(await readFile(fixtures[0].beforePath));
 const off=R.setGameplayV4(original,false);off.run.gameplayV4=false;
 off.run.battle=R.playBattle(R.createBattle({...original.run.battle.initial,gameplayV4:false}),'auto');
 const offPath=out+'/off-result.save';await writeFile(offPath,R.exportSave(off)+'\n');
 fixtures.push({name:'off',path:offPath,sha256:sha(await readFile(offPath)),method:'Synthetic OFF renderer regression: same fixed initial encounter resolved by OFF rules, not progression or a paired balance observation.'});
 await writeFile(out+'/checks.json',JSON.stringify({fixtures,acceptanceSeedsUsed:false},null,2)+'\n');
 console.log(JSON.stringify({fixtures:fixtures.length}));
} finally {await loader.vite.close();}
