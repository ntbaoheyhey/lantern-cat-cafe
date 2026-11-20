// REFERENCE: route53. Deterministic UI fixtures from the retained earned Home02 account.
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { loadRules } from '../../a4-load.mjs';
const out='reports/cardrpg-big/a5/c1-route-order/fixtures';
const input='reports/cardrpg-big/a5/e2-star-plans/fixtures/earned.json';
const sha=b=>createHash('sha256').update(b).digest('hex');
const original=JSON.parse(await readFile(input)), fixtures=[], commands=[];
const {load,vite}=await loadRules();
try {
 const R=await load('packages/game-rules/src/cardrpg/depth/index.ts');
 const accept=r=>{assert(r.ok,r.error);return r.state;};
 const ack=s=>{while(s.v4?.journey.pending.length)s=accept(R.acknowledgeDiscoveryV4(s,s.v4.journey.pending[0].sequence));return s;};
 await mkdir(out,{recursive:true});
 async function save(mode,name,state,action,selector,expected) {
  state=ack(state); expected=expected?ack(expected):state;
  const path=`${out}/${mode}-${name}.save`,statePath=`${out}/${mode}-${name}.json`,afterPath=`${out}/${mode}-${name}-after.json`;
  await writeFile(path,R.exportSave(state)+'\n');await writeFile(statePath,JSON.stringify(state,null,2)+'\n');await writeFile(afterPath,JSON.stringify(expected,null,2)+'\n');
  fixtures.push({mode,name,path,statePath,afterPath,action,selector,sha256:sha(await readFile(path)),stateSha256:sha(await readFile(statePath)),afterSha256:sha(await readFile(afterPath))});
 }
 for(const mode of ['on','off']) {
  let s=ack(mode==='on'?structuredClone(original):R.setGameplayV4(original,false));
  await save(mode,'complete',s,'navigation','Return to cafe');
  const seed=s.account.seed+s.nextRunId*7919;
  s=accept(R.startRun(s,1,seed,'campaign','2026-11-06',1));
  await save(mode,'route',s,'enter','.dp-node:enabled',accept(R.enterNode(s,R.availableNodes(s.run)[0].id)));
  for(let i=0;i<30&&!s.run.complete;i++) {
   const run=s.run;
   if(run.battle) {if(run.gameplayV4)s=accept(R.commitPreparation(s));s.run.battle=R.playBattle(s.run.battle,'auto');commands.push({mode,kind:'automatic-fixture-battle',seed:run.battle.initial.seed,result:s.run.battle.result});s=ack(accept(R.finishEncounter(s)));continue;}
   if(run.rewardChoices.length) {const next=accept(R.chooseReward(s,run.rewardChoices[0]));if(!fixtures.some(f=>f.mode===mode&&f.name==='reward'))await save(mode,'reward',s,'reward','.dp-reward',next);s=ack(next);continue;}
   if(run.current) {
    const node=run.nodes.find(n=>n.id===run.current);let choice,selector;
    if(node.kind==='event'){choice=R.EVENTS.find(e=>e.id===node.eventId).choices.find(c=>c.cost<=run.points).id;selector='.cr-panel .dp-three button:enabled';}
    else if(node.kind==='treasure'){choice='points';selector='Take 70 run points';}
    else if(node.kind==='shop'){choice='leave';selector='Save your points and leave';}
    else if(node.kind==='campfire'){choice='heal';selector='Heal the team · 35% HP';}
    else throw Error(node.kind);
    const next=accept(R.resolveNode(s,choice));await save(mode,node.kind,s,'resolve',selector,next);s=ack(next);continue;
   }
   s=accept(R.enterNode(s,R.availableNodes(run)[0].id));
  }
  assert.deepEqual(fixtures.filter(f=>f.mode===mode).map(f=>f.name).sort(),['campfire','complete','event','reward','route','shop','treasure']);
 }
 await writeFile(out+'/checks.json',JSON.stringify({passed:true,input,inputSha256:sha(await readFile(input)),fixtures,commands,method:'Original earned Home02 account; public route commands and automatic battles create targeted UI fixtures only. No progression, cadence, probability, or live x1 timing inference.'},null,2)+'\n');
 console.log(JSON.stringify({passed:true,fixtures:fixtures.length,commands}));
} finally {await vite.close();}
