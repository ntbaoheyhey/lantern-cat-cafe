// REFERENCE: advice28. Re-export the first registered owned-cat suggestion from its earned path.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {loadRules} from './a4-load.mjs';
const root='reports/cardrpg-big/a5/e1/crew-advice-28',reg=JSON.parse(await readFile(root+'/REGISTERED-METHOD.json'));
const sha=x=>createHash('sha256').update(typeof x==='string'?x:JSON.stringify(x)).digest('hex');
for(const [p,h] of Object.entries(reg.combatSource))assert.equal(sha(await readFile(p,'utf8')),h,p);
const cohort=JSON.parse(await readFile(root+'/day7-checks/checks.json'));
const selected=cohort.accounts.find(a=>a.advice?.change.kind==='cat');assert(selected);
const {load,vite}=await loadRules(),R=await load('packages/game-rules/src/cardrpg/depth/index.ts');
const accept=r=>{assert(r.ok,r.error);return r.state;};
async function route(initial,chapter,seed){
 let state=accept(R.startRun(initial,chapter,seed,'campaign'));const encounters=[],choices=[];
 for(let step=0;step<100&&!state.run.complete;step++){
  const run=state.run;
  if(run.battle){
   state=accept(R.commitPreparation(state));R.playBattle(state.run.battle,'auto');const b=state.run.battle;
   const node=state.run.nodes.find(n=>n.id===state.run.current);
   encounters.push({node:node.id,kind:node.kind,result:b.result,round:b.round,actions:b.choices.length,firstFallen:R.outcomeV4(b).firstFallen,party:b.actors.filter(a=>a.side==='party').map(a=>({id:a.id,hp:a.hp,maxHp:a.maxHp})),enemy:b.actors.filter(a=>a.side==='enemy').map(a=>({id:a.catalogId,hp:a.hp,maxHp:a.maxHp}))});
   if(b.result==='enemy')return{state,encounters,choices,won:false,lossSetup:b.initial};
   state=accept(R.finishEncounter(state));continue;
  }
  if(run.rewardChoices.length){const choice=run.rewardChoices[0];choices.push({kind:'reward',choice});state=accept(R.chooseReward(state,choice));continue;}
  if(run.current){
   const node=run.nodes.find(n=>n.id===run.current);let choice;
   if(node.kind==='campfire')choice='heal';
   else if(node.kind==='treasure')choice='charm';
   else if(node.kind==='shop')choice=run.points>=45?R.shopStock(run)[0]:'leave';
   else if(node.kind==='event')choice=[...R.EVENTS.find(e=>e.id===node.eventId).choices].filter(o=>o.cost<=run.points).sort((a,b)=>b.heal-a.heal)[0].id;
   else throw Error('Unresolved stop');
   choices.push({node:node.id,kind:node.kind,choice});state=accept(R.resolveNode(state,choice));continue;
  }
  const node=R.availableNodes(run)[0];assert(node);choices.push({kind:'route',node:node.id});state=accept(R.enterNode(state,node.id));
 }
 assert(state.run.complete);return{state,encounters,choices,won:state.run.won};
}

try{
 const original=await readFile(`${cohort.registration.inputs}/${selected.style}-${selected.index}.save`,'utf8');
 assert.equal(sha(original),selected.inputSaveSha256);
 const initial=R.importSave(original),first=await route(initial,selected.chapter,100000+selected.index*7919+7*71);
 assert.equal(first.won,false);assert.equal(sha(first.state),selected.first.stateHash);
 const settled=accept(R.resultAdviceStateV4(first.state)),advice=R.recommendBuildV4(settled,first.lossSetup);
 assert.deepEqual(advice,selected.advice);
 const applied=accept(R.applyResultAdviceV4(first.state,advice));
 assert.deepEqual(applied.gear,first.state.gear);assert.deepEqual(applied.equipment,first.state.equipment);
 await writeFile(root+'/earned-reserve-loss.save',R.exportSave(first.state));
 const fixture={selection:'First registered account with an owned-cat recommendation, original cohort order.',style:selected.style,index:selected.index,inputSaveSha256:selected.inputSaveSha256,lossStateHash:sha(first.state),advice,
 beforeTeam:first.state.team,afterTeam:applied.team,afterRows:applied.rows,afterCurrencies:applied.account.currencies,equipment:applied.equipment,nextRunId:first.state.nextRunId};
 await writeFile(root+'/browser-fixture.json',JSON.stringify(fixture,null,2)+'\n');console.log(JSON.stringify({style:selected.style,index:selected.index,label:advice.label}));
}finally{await vite.close();}
