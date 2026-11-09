// Runtime0e1e15180 ON route hashes; legacy full digest is separately source-bound.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {loadRules} from './load.mjs';
const {load,vite}=await loadRules(),R=await load('packages/game-rules/src/cardrpg/depth/index.ts');
const {playRun}=await load('packages/game-rules/src/cardrpg/depth/run-bot.ts');
const rows=[],sha=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
try{
 for(const level of [1,6,10])for(const chapter of [1,2,3])for(let seed=1;seed<=5;seed++){
  let s=R.setGameplayV4(R.createDepthAccount(seed),true);s.cleared=[1,2];
  for(const c of s.account.cards)c.level=level;
  const start=R.startRun(s,chapter,seed);assert(start.ok,start.error);
  const end=playRun(start.state,'auto');rows.push({level,chapter,seed,won:end.run.won,sha256:sha(end)});
 }
 const receipt={runtime:'0e1e15180108b443ce2e615ea54272b907cc8bb0',mode:'gameplayV4 ON; skillsV5 omitted/OFF',count:rows.length,sha256:sha(rows),rows};
 const path='reports/cardrpg-big/skills-v5/s0/on-routes.json';
 if(process.argv.includes('--record')){await mkdir('reports/cardrpg-big/skills-v5/s0',{recursive:true});await writeFile(path,JSON.stringify(receipt,null,2)+'\n');}
 else assert.deepEqual(receipt,JSON.parse(await readFile(path,'utf8')));
 console.log(JSON.stringify({status:'PASS',count:receipt.count,sha256:receipt.sha256}));
}finally{await vite.close();}
