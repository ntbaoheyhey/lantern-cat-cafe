import {loadRules} from '/Users/bao/taskbar-hero-cardrpg-a4/tools/cardrpg-big/a4-load.mjs';
import {writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const {load,vite}=await loadRules(),R=await load('packages/game-rules/src/cardrpg/depth/index.ts');
try{
 const rows=[];
 for(let level=1;level<=50;level++){
  const next=R.challengeStatsV4(level),growth=(1+(level-1)*.012)*(level>=6?1.12:1);
  const old=Object.fromEntries(R.ENEMIES.map(e=>{const pressure=e.tier==='boss'?[3.1,1.9,2.3][e.chapter-1]*(level>=6?1.15:1):1,hp=e.tier==='boss'?(e.chapter===3?.25:.30):e.tier==='elite'?.30:.25;return[e.id,{hp:Math.max(1,Math.round(e.hp*hp*growth)),attack:Math.max(1,Math.round(e.attack*growth*pressure)),defense:e.defense}];}));
  if(level<=5||level>=10)assert.deepEqual(next,old,`Unchanged band${level}`);
  for(const id of Object.keys(old)){assert(next[id].hp<=old[id].hp);assert(next[id].attack<=old[id].attack);assert.equal(next[id].defense,old[id].defense);}
  rows.push({level,identical:JSON.stringify(old)===JSON.stringify(next),old,next});
 }
 const path='/tmp/cardrpg-a5-band-anchored-03/source/packages/game-rules/src/cardrpg/depth/pacing-v4.ts';
 await writeFile('reports/cardrpg-big/a5/b3/band-anchored-03/band-audit.json',JSON.stringify({ended:new Date().toISOString(),sourceSha256:createHash('sha256').update(await readFile(path)).digest('hex'),checks:{earlyFiveExact:true,tenToFiftyExact:true,noEarlierHardening:true},rows},null,2));
 console.log('PASS: bands1–5/10–50 exact; only6–9 eased.');
}finally{await vite.close();}
