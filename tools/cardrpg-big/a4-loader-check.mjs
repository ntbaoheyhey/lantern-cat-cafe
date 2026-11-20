// REFERENCE: a4-load.mjs. Verify exact full battle/run outputs across both loaders.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { loadRules as viteLoad } from '../cardrpg-sim/load.mjs';
import { loadRules as bundleLoad } from './a4-load.mjs';
const receipts=[];
for(const loader of [viteLoad,bundleLoad]){
 const {load,vite}=await loader(), R=await load('packages/game-rules/src/cardrpg/depth/index.ts');
 const {playRun}=await load('packages/game-rules/src/cardrpg/depth/run-bot.ts');
 const start=performance.now(), runs=[];
 try {
  for(const level of [1,6,10])for(const chapter of [1,2,3])for(let seed=1;seed<=5;seed++){
   const s=R.createDepthAccount(seed);s.cleared=[1,2];
   for(const card of s.account.cards)card.level=level;
   runs.push(playRun(R.startRun(s,chapter,seed).state,'auto'));
  }
  receipts.push({loader:loader.name,count:runs.length,ms:performance.now()-start,sha256:createHash('sha256').update(JSON.stringify(runs)).digest('hex')});
 }finally{await vite.close();}
}
assert.equal(receipts[0].sha256,receipts[1].sha256);
await writeFile('reports/cardrpg-big/a4/g0/loader-equivalence.json',JSON.stringify(receipts,null,2));
console.log(JSON.stringify(receipts));
