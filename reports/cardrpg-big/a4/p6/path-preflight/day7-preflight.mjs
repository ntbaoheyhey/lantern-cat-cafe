// Diagnostic only: fixed earned-day7 save and planned UI choices. No browser/pack run.
import {loadRules} from '/Users/bao/taskbar-hero-cardrpg-a4/tools/cardrpg-big/a4-load.mjs';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const path='reports/cardrpg-big/a4/p6/economy/day7.save',bytes=await readFile(path);
const {load,vite}=await loadRules(),R=await load('packages/game-rules/src/cardrpg/depth/index.ts');
const take=r=>{assert(r.ok,JSON.stringify(r.error));return r.state;};
try{
 let state=R.importSave(bytes.toString());assert.equal(state.account.day,7);
 const seed=state.account.seed+state.nextRunId*7919;
 const start={day:state.account.day,seed,team:state.team,levels:state.team.map(id=>state.account.cards.find(c=>c.cardId===id).level),cleared:state.cleared};
 state=take(R.startRun(state,1,seed,'campaign','2026-11-06'));
 const encounters=[],choices=[];
 for(let step=0;step<100&&!state.run.complete;step++){
  const run=state.run;
  if(run.battle){
   const node=run.nodes.find(n=>n.id===run.current),battle=R.playBattle(run.battle,'auto');
   state.run.battle=battle;encounters.push({node:node.id,kind:node.kind,result:battle.result,actions:battle.choices.length});
   state=take(R.finishEncounter(state));continue;
  }
  if(run.rewardChoices.length){const choice=run.rewardChoices[0];choices.push({kind:'reward',choice});state=take(R.chooseReward(state,choice));continue;}
  if(run.current){
   const node=run.nodes.find(n=>n.id===run.current);
   const choice=node.kind==='campfire'?'heal':node.kind==='treasure'?'points':node.kind==='shop'?'leave':R.EVENTS.find(e=>e.id===node.eventId).choices.find(c=>c.cost<=run.points).id;
   choices.push({node:node.id,kind:node.kind,choice});state=take(R.resolveNode(state,choice));continue;
  }
  state=take(R.enterNode(state,R.availableNodes(run)[0].id));
 }
 assert(state.run.complete);
 const result={method:'One fixed existing earned day7 save; same public model seed and planned first-node/first-reward/first-affordable-event UI policy. This is navigation feasibility, not browser acceptance, timing, or a new balance sample.',save:path,saveSha256:createHash('sha256').update(bytes).digest('hex'),start,encounters,choices,complete:state.run.complete,won:state.run.won,bossReached:encounters.some(e=>e.kind==='boss')};
 await writeFile('/tmp/cardrpg-a4-p7/day7-preflight.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{await vite.close();}
