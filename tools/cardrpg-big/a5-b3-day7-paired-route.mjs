// REFERENCE: PROMPT-A5 B3. Exact-route diagnostic; no acceptance sampling.
import {loadRules} from './a4-load.mjs';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const path='reports/cardrpg-big/a5/b3/day7-x1-e2/checks.json',bytes=await readFile(path),receipt=JSON.parse(bytes),out='reports/cardrpg-big/a5/b3/day7-x1-e2';
const suite=await loadRules(),R=await suite.load('packages/game-rules/src/cardrpg/depth/index.ts'),ok=r=>{assert(r.ok,r.error);return r.state;};
const json=x=>JSON.parse(JSON.stringify(x));
function play(initial){
 let s=initial;const encounters=[];
 for(let i=0;i<40&&!s.run.complete;i++){
  const run=s.run;
  if(run.battle){s=ok(R.commitPreparation(s));R.playBattle(s.run.battle,'auto');const b=s.run.battle;encounters.push({kind:run.nodes.find(n=>n.id===run.current).kind,battle:json(b)});s=ok(R.finishEncounter(s));if(b.result==='enemy')break;continue;}
  if(run.rewardChoices.length){s=ok(R.chooseReward(s,run.rewardChoices[0]));continue;}
  if(run.current){const n=run.nodes.find(n=>n.id===run.current);let choice;
   if(n.kind==='event')choice=R.EVENTS.find(e=>e.id===n.eventId).choices.find(c=>c.cost<=run.points).id;
   else choice={treasure:'points',shop:'leave',campfire:'heal'}[n.kind];assert(choice);s=ok(R.resolveNode(s,choice));continue;}
  const available=R.availableNodes(run),n=available.find(n=>n.kind==='event')??available.find(n=>n.kind==='elite')??available[0];assert(n);s=ok(R.enterNode(s,n.id));
 }
 return{won:s.run.won,complete:s.run.complete,encounters};
}
try{
 const withAdvice=play(structuredClone(receipt.applied.state));assert.equal(withAdvice.encounters.length,receipt.encounters.length);
 for(let i=0;i<withAdvice.encounters.length;i++)assert.deepEqual(withAdvice.encounters[i].battle,receipt.encounters[i].battle,'Exact observed browser battle replay');
 const baseline=ok(R.configurePreparation(receipt.applied.state,receipt.applied.state.team,receipt.applied.state.rows,receipt.before.state.v4.plan));
 const withoutAdvice=play(baseline);
 await writeFile(out+'/paired-route.json',JSON.stringify({sourceReceiptSha256:createHash('sha256').update(bytes).digest('hex'),method:'Replay the exact real-click alternative route and assert every battle JSON. Restore the original standing plan using the public preparation command on the same route seed, team and resources. No seed replacement, no old-path comparator.',withAdvice,withoutAdvice,interpretation:withAdvice.won&&!withoutAdvice.won?'The chosen plan changes this exact route from loss to win. This is a single paired fixture.':withAdvice.won&&withoutAdvice.won?'Both plans win this alternate route. The recorded informed retry succeeds, but its victory cannot be attributed to the advice alone.':'See both raw outcomes; no improvement claim.'},null,2));
 console.log(JSON.stringify({withAdvice:withAdvice.won,withoutAdvice:withoutAdvice.won}));
}finally{await suite.vite.close();}
