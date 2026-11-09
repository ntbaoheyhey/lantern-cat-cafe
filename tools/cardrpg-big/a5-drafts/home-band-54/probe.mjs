// REFERENCE: home-band54. Same earned builds, fixed TRAIN1–50; no source adoption.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {loadRules} from '../../a4-load.mjs';
const draft='tools/cardrpg-big/a5-drafts/home-band-54',out='reports/cardrpg-big/a5/e2-home-band';
const sha=b=>createHash('sha256').update(b).digest('hex');
const reg=JSON.parse(await readFile(draft+'/registration.json'));
for(const[p,h]of Object.entries(reg.inputs))assert.equal(sha(await readFile(p)),h,p);
const timeline=JSON.parse(await readFile(draft+'/original-partial-timeline.json'));
const bosses=timeline.encounters.filter(e=>e.setup.enemies.includes('yarn-giant'));
const selected=[...new Set([...new Set(bosses.map(e=>e.setup.challengeLevel))].flatMap(band=>{const b=bosses.filter(e=>e.setup.challengeLevel===band);return[b[0],b.at(-1)];}))];
const loader=await loadRules();
try {
 const R=await loader.load('packages/game-rules/src/cardrpg/depth/index.ts'),rows=[];
 for(const entry of selected){
  const setup=entry.setup,replay=R.playBattle(R.createBattle(setup),'auto');
  assert.equal(replay.result,entry.battle.result);assert.deepEqual(replay.choices,entry.battle.choices);assert.deepEqual(replay.log,entry.battle.log);
  const outcomes=[];
  for(let seed=1;seed<=50;seed++){
   const a=R.playBattle(R.createBattle({...setup,seed}),'auto');
   const b=R.playBattle(R.createBattle({...setup,seed,challengeLevel:1,enemyStats:R.challengeStatsV4(1)}),'auto');
   outcomes.push((a.result==='party'?2:0)+(b.result==='party'?1:0));
  }
  rows.push({atMinute:entry.startMs/60000,band:setup.challengeLevel,setupSha256:sha(JSON.stringify(setup)),originalReplayExact:true,outcomes,
   originalWins:outcomes.filter(n=>n>=2).length,fixedBandWins:outcomes.filter(n=>n%2).length,
   improved:outcomes.filter(n=>n===1).length,worsened:outcomes.filter(n=>n===2).length});
 }
 await mkdir(out,{recursive:true});await writeFile(out+'/band-diagnostic.json',JSON.stringify({registered:reg,rows,seeds:{first:1,last:50},method:'Same original earned boss builds and carried HP; fixed band1 versus recorded band. Not a full earned route, causal cadence, or acceptance claim. Initial band1 controls are exact.'},null,2)+'\n');
 console.log(JSON.stringify(rows.map(({outcomes,...r})=>r)));
}finally{await loader.vite.close();}
