import {loadRules,root} from '../cardrpg-sim/load.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const {load,vite}=await loadRules();
const {createDepthAccount}=await load('packages/game-rules/src/cardrpg/depth/state.ts');
const {startRun}=await load('packages/game-rules/src/cardrpg/depth/run.ts');
const {playRun}=await load('packages/game-rules/src/cardrpg/depth/run-bot.ts');
const count=Number(process.env.DEPTH_SEEDS||20),offset=Number(process.env.DEPTH_OFFSET||0),rows=[];
try {
 for(const chapter of [1,2,3])for(const policy of ['random','auto','greedy','smart']){
  const runs=[];
  for(let index=1;index<=count;index++){
   const seed=index+offset,s=createDepthAccount(seed);s.cleared=Array.from({length:chapter-1},(_,i)=>i+1);
   const begin=startRun(s,chapter,seed);if(!begin.ok)throw Error(begin.error);
   const encounters=[];
   const finish=playRun(begin.state,policy,b=>encounters.push({firstDeath:b.firstDeath,turns:b.choices.length,rounds:b.round,won:b.result==='party'}));
   runs.push({seed,won:finish.run.won,nodes:finish.run.visited.length,finalHp:finish.run.hp,firstDeath:encounters.find(b=>b.firstDeath)?.firstDeath??null,encounters,boons:finish.run.boons});
  }
  const row={chapter,policy,wins:runs.filter(r=>r.won).length,count,winRate:runs.filter(r=>r.won).length/count,runs};rows.push(row);
  console.log(JSON.stringify({...row,runs:undefined}));
 }
 await mkdir(resolve(root,'reports/cardrpg-depth/sim'),{recursive:true});
 await writeFile(resolve(root,`reports/cardrpg-depth/sim/combat-${process.env.DEPTH_TRIAL||'initial'}.json`),JSON.stringify({count,offset,method:'Actual seven-node runs, starter account and gear. Same safe path, event/camp/shop/reward strategy for all combat policies. Later chapters unlocked only for the measurement fixture.',rows},null,2));
} finally {await vite.close();}
