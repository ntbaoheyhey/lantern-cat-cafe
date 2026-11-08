// REFERENCE: PROMPT-A5 E2. Earn stars with actual commands; retain no injected currency, level or outcome.
import {loadRules} from './a4-load.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const out='reports/cardrpg-big/a5/e2/rules';await mkdir(out,{recursive:true});
const {load,vite}=await loadRules(),R=await load('packages/game-rules/src/cardrpg/depth/index.ts');
const take=result=>{assert(result.ok,result.error);return result.state;},hash=s=>createHash('sha256').update(JSON.stringify(s)).digest('hex');
try{
 let state=R.importSave(await readFile('reports/cardrpg-big/a5/e1/rules/earned-loss.save','utf8'));
 assert.equal(state.v4.journey.pending.length,0,'Old earned save migrates quietly');
 const settled=take(R.resultAdviceStateV4(state)),advice=R.recommendBuildV4(settled,state.run.battle.initial);
 state=take(R.applyResultAdviceV4(state,advice));state=take(R.startRun(state,1,state.account.seed+state.nextRunId*7919,'campaign','2026-11-06',7));
 const timeline=[];let first=true;
 for(let i=0;i<20&&!state.run.complete;i++){
  const available=R.availableNodes(state.run),node=available.find(n=>n.kind==='event')??available.find(n=>n.kind==='elite')??available[0];assert(node);
  state=take(R.enterNode(state,node.id));
  if(first){await writeFile(out+'/route-start.save',R.exportSave(state));first=false;}
  const before=R.starCountV4(state),money={...state.account.currencies};let expected,result;
  if(state.run.battle){
   state=take(R.commitPreparation(state));R.playBattle(state.run.battle,'auto');result=state.run.battle.result;
   expected=R.combatStarsV4(state.run,node,state.run.battle);state=take(R.finishEncounter(state));
   if(state.run.rewardChoices.length)state=take(R.chooseReward(state,state.run.rewardChoices[0]));
  }else{
   const choice=node.kind==='event'?R.EVENTS.find(e=>e.id===node.eventId).choices.find(c=>c.cost<=state.run.points).id:{treasure:'points',shop:'leave',campfire:'heal'}[node.kind];
   state=take(R.resolveNode(state,choice));expected=R.stopStarsV4(state,state.run,node,Object.fromEntries(R.battleCats(state).map(c=>[c.id,c.stats.hp])));
  }
  const after=R.starCountV4(state),receipt=state.v4.journey.stars[expected.key];
  if(expected.conditions.some(Boolean))assert.deepEqual(receipt,expected);else assert.equal(after,before);
  assert.equal(after-before,expected.conditions.filter(Boolean).length);
  if(!state.run.complete)assert.deepEqual(state.account.currencies,money,'Node stars do not directly grant currency');
  assert.deepEqual(R.importSave(R.exportSave(state)),state);
  timeline.push({node:node.id,kind:node.kind,result,before,after,receipt,stateHash:hash(state)});
 }
 assert(state.run.complete);assert(R.starCountV4(state)>=9);
 await writeFile(out+'/earned-stars.save',R.exportSave(state));
 const beforeClaim=structuredClone(state),claims=[];
 for(const target of R.STAR_REWARDS_V4){
  const preview=R.starRewardPreviewV4(state,target.id);if(preview.reason)continue;
  const before={...state.account.currencies},earned={...state.account.daily.earned};state=take(R.claimStarRewardV4(state,target.id));
  for(const [id,n] of Object.entries(preview.reward)){assert.equal(state.account.currencies[id]-before[id],n);assert.equal(state.account.daily.earned[id]-earned[id],n);assert(state.account.daily.earned[id]<=R.depthCaps(state)[id]);}
  assert(!R.claimStarRewardV4(state,target.id).ok);claims.push({id:target.id,reward:preview.reward});
 }
 assert(claims.length>=2);const found=structuredClone(state.v4.journey.found),balance={...state.account.currencies};
 while(state.v4.journey.pending.length)state=take(R.acknowledgeDiscoveryV4(state,state.v4.journey.pending[0].sequence));
 assert.deepEqual(state.account.currencies,balance);assert.deepEqual(state.v4.journey.found,found);
 const off=R.setGameplayV4(state,false);assert.deepEqual(R.importSave(R.exportSave(off)),off);
 await writeFile(out+'/checks.json',JSON.stringify({passed:true,method:'Same earned day7 save; rule-generated available advice; actual route commands and automatic combat. TRAIN only; not engagement or boss acceptance.',timeline,stars:R.starCountV4(state),found,claims,beforeClaim,afterClaim:state,advice,limitations:['Rank/set/Legendary type coverage is isolated unit fixtures; this earned route does not claim to earn all discovery types.','No invitation or 45-day economy acceptance is implied.']},null,2));
 console.log(JSON.stringify({passed:true,stars:R.starCountV4(state),claims,found:found.length,result:state.run.won}));
}finally{await vite.close();}
