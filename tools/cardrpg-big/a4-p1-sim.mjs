// REFERENCE: GAMEPLAY-V4.md section1. Functional deterministic sim, not balance acceptance.
import { loadRules } from './a4-load.mjs';
import { mkdir,writeFile,readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const {load,vite}=await loadRules(),R=await load('packages/game-rules/src/cardrpg/depth/index.ts');
const out='reports/cardrpg-big/a4/p1';await mkdir(out,{recursive:true});
const checkpointExit=new Error('Checkpoint'),started=Date.now();
try{
 const rows=JSON.parse(await readFile(`${out}/partial.json`,'utf8').catch(()=>'[]'));
 for(const focus of ['finish','support','leader'])for(const care of ['steady','protect'])for(let seed=1;seed<=500;seed++){
  if(rows.some(r=>r.focus===focus&&r.care===care&&r.seed===seed))continue;
  let s=R.setGameplayV4(R.createDepthAccount(seed),true);s.account.cards.forEach(c=>c.level=6);
  s=R.enterNode(R.startRun(s,1,seed).state,'0-0').state;
  const configured=R.configurePreparation(s,s.team,s.rows,{focus,care});assert(configured.ok);
  const b=R.playBattle(configured.state.run.battle,'auto');
  assert.equal(b.energy,0);assert(b.actors.every(a=>a.charge===0&&a.break===0));
  const replay=R.replayBattle(b.initial,b.choices);assert.deepEqual(replay,b);
  assert.equal(JSON.stringify(R.importSave(R.exportSave(configured.state)).run.battle),JSON.stringify(b));
  rows.push({seed,focus,care,result:b.result,round:b.round,actions:b.log.filter(e=>['action','enemy-action'].includes(e.kind)).length,hash:createHash('sha256').update(JSON.stringify(b)).digest('hex')});
  if(seed===73&&focus==='support'&&care==='protect')await writeFile(`${out}/events-fixture.json`,JSON.stringify({initial:b.initial,choices:b.choices,events:b.v4.events,reasons:R.battleReasons(b)},null,2));
  if(seed%100===0){await writeFile(`${out}/partial.json`,JSON.stringify(rows));if(Date.now()-started>110000){process.exitCode=75;throw checkpointExit;}}
 }
 await writeFile(`${out}/sim.json`,JSON.stringify({method:'3000 automatic encounters; 500 training seeds per standing-plan cell, exact replay/save comparison. Not heldout balance acceptance.',rows},null,2));
 console.log(JSON.stringify({encounters:rows.length,deterministicReplay:'PASS',resourcesAbsent:'PASS',plans:6}));
}catch(error){if(error!==checkpointExit)throw error;}finally{await vite.close();}
