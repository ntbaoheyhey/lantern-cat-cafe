import {loadRules} from '/Users/bao/taskbar-hero-cardrpg-a4/tools/cardrpg-big/a4-load.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const out='reports/cardrpg-big/a5/e1/rules';await mkdir(out,{recursive:true});
const {load,vite}=await loadRules();const R=await load('packages/game-rules/src/cardrpg/depth/index.ts');
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
try {
 const h0=JSON.parse(await readFile('reports/cardrpg-big/a5/h0/day7/checks.json','utf8'));
 let state=R.importSave(await readFile('reports/cardrpg-big/a4/p6/economy/day7.save','utf8'),0);
 state=R.setGameplayV4(state,true);
 const started=R.startRun(state,1,state.account.seed+state.nextRunId*7919,'campaign','2026-11-06');assert(started.ok);state=started.state;
 const timeline=[];
 for(let n=0;n<20&&!state.run.complete;n++) {
  const node=R.availableNodes(state.run)[0];assert(node);const enter=R.enterNode(state,node.id);assert(enter.ok);state=enter.state;
  if(state.run.battle) {
   const committed=R.commitPreparation(state);assert(committed.ok);state=committed.state;
   R.playBattle(state.run.battle,'auto');const battle=state.run.battle;
   timeline.push({node:node.id,kind:node.kind,result:battle.result,setup:battle.initial,battle});
   if(battle.result==='enemy')break;
   const done=R.finishEncounter(state);assert(done.ok);state=done.state;
   if(state.run.rewardChoices.length){const pick=R.chooseReward(state,state.run.rewardChoices[0]);assert(pick.ok);state=pick.state;}
  }else if(node.kind==='event'){const choice=R.resolveNode(state,R.EVENTS.find(e=>e.id===node.eventId).choices.find(c=>c.cost<=state.run.points).id);assert(choice.ok);state=choice.state;}
  else if(['treasure','shop','campfire'].includes(node.kind)){
   const choice=R.resolveNode(state,{treasure:'points',shop:'leave',campfire:'heal'}[node.kind]);assert(choice.ok);state=choice.state;
  }else throw Error('Unregistered route stop '+node.kind);
 }
 assert.equal(timeline.at(-1).kind,'boss');assert.equal(state.run.battle.result,'enemy');
 assert.deepEqual(state.run.battle,h0.encounters.at(-1).battle,'Same earned A4 combat path before advice');
 const beforeHash=hash(state),outcome=R.outcomeV4(state.run.battle),settled=R.resultAdviceStateV4(state);assert(settled.ok);
 const began=performance.now(),advice=R.recommendBuildV4(settled.state,state.run.battle.initial),adviceMs=performance.now()-began;
 assert(advice,'Earned day7 loss must have an available named improvement');
 assert.equal(hash(state),beforeHash);const applied=R.applyResultAdviceV4(state,advice);assert(applied.ok);
 assert(!R.applyResultAdviceV4(applied.state,advice).ok);assert.equal(hash(state),beforeHash);
 await writeFile(out+'/earned-loss.save',R.exportSave(state));
 const encounters=timeline.map(({kind,setup})=>({kind,forecast:R.forecastV4(setup),key:R.forecastKeyV4(setup)}));
 assert.deepEqual(outcome.damageByRow,{front:1194,rear:1612});assert.equal(outcome.firstFallen.id,'mochi');
 await writeFile(out+'/checks.json',JSON.stringify({method:'Original earned day7 public commands and same route; new explanations/advice do not alter combat. No acceptance seeds or injected resources.',beforeHash,timeline,advice,adviceMs,outcome,encounters,settledCurrencies:settled.state.account.currencies,appliedCurrencies:applied.state.account.currencies,appliedState:applied.state,passed:true},null,2));
 console.log(JSON.stringify({passed:true,advice:advice.label,adviceMs,forecastMs:encounters.map(e=>e.forecast.computeMs)}));
} finally {await vite.close();}
