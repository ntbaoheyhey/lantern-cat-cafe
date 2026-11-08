// REFERENCE: PROMPT-A5 B3. Registered earned-day7 test, actual commands, two attempts maximum.
import {loadRules} from '/Users/bao/taskbar-hero-cardrpg-a4/tools/cardrpg-big/a4-load.mjs';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const out=process.env.A5_DAY7_OUT||'reports/cardrpg-big/a5/b3/day7-e2';
const hash=x=>createHash('sha256').update(typeof x==='string'?x:JSON.stringify(x)).digest('hex');
await mkdir(out,{recursive:true});
const registration=JSON.parse(await readFile(out+'/REGISTERED-METHOD.json','utf8'));
for(const [path,sha]of Object.entries(registration.source))assert.equal(hash(await readFile(process.env.BIG_RULES_ROOT+'/'+path,'utf8')),sha,path);
const prior=JSON.parse(await readFile(out+'/partial.json','utf8').catch(e=>{if(e.code==='ENOENT')return '{"accounts":[]}';throw e;}));
if(prior.method)assert.equal(prior.method,hash(registration));
const {load,vite}=await loadRules(),R=await load('packages/game-rules/src/cardrpg/depth/index.ts');
const accept=r=>{assert(r.ok,r.error);return r.state;},accounts=prior.accounts,began=Date.now(),pause=new Error('checkpoint');
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
const summarize=r=>({won:r.won,encounters:r.encounters,choices:r.choices,stateHash:hash(r.state)});
try{
 for(const style of ['casual','regular','heavy'])for(let index=0;index<30;index++){
  if(accounts.some(a=>a.style===style&&a.index===index))continue;
  const save=await readFile(`${registration.inputs}/${style}-${index}.save`,'utf8'),initial=R.importSave(save);assert.equal(initial.account.day,7);
  const inputHash=hash(initial),chapter=Math.min(3,initial.cleared.length+1),seed=100000+index*7919+7*71;
  const first=await route(initial,chapter,seed),row={style,index,chapter,band:first.state.run.challengeLevel,inputSaveSha256:hash(save),levels:initial.team.map(id=>initial.account.cards.find(c=>c.cardId===id).level),first:summarize(first),advice:null,second:null};
  if(!first.won){
   const settled=accept(R.resultAdviceStateV4(first.state));
   const advice=R.recommendBuildV4(settled,first.lossSetup);
   if(advice){
    const applied=accept(R.applyResultAdviceV4(first.state,advice));
    row.advice=advice;row.appliedCurrencies={before:{...settled.account.currencies},after:{...applied.account.currencies}};
    assert(!R.applyResultAdviceV4(applied,advice).ok,'An already applied loss cannot be settled twice');
    const second=await route(applied,chapter,seed+1);row.second=summarize(second);
    // Paired reference uses the very same next route seed, with no suggested build change.
    const without=await route(settled,chapter,seed+1);row.withoutAdvice=summarize(without);
   }else row.noAdvice='No currently available build change improved the registered ten-seed forecast.';
   if(index===0){await writeFile(`${out}/${style}-loss.save`,R.exportSave(first.state));await writeFile(`${out}/${style}-loss-battle.json`,JSON.stringify(first.state.run.battle,null,2));}
  }
  assert.equal(hash(initial),inputHash,'Evaluation does not alter the earned initial account');
  accounts.push(row);await writeFile(out+'/partial.json',JSON.stringify({method:hash(registration),accounts}));
  console.log(JSON.stringify({style,index,chapter,first:row.first.won,advice:row.advice?.label,second:row.second?.won}));
  if(Date.now()-began>110000){process.exitCode=75;throw pause;}
 }
 const wilson=(wins,n)=>{const z=1.959963984540054,p=wins/n,d=1+z*z/n,c=(p+z*z/(2*n))/d,h=z*Math.sqrt(p*(1-p)/n+z*z/(4*n*n))/d;return[c-h,c+h];};
 const cohorts=['casual','regular','heavy'].map(style=>{const a=accounts.filter(r=>r.style===style),first=a.filter(r=>r.first.won).length,two=a.filter(r=>r.first.won||r.second?.won).length,losses=a.filter(r=>!r.first.won),advice=losses.filter(r=>r.advice).length;return{style,accounts:a.length,chapters:Object.fromEntries([1,2,3].map(c=>[c,a.filter(r=>r.chapter===c).length])),firstWins:first,firstWinRate:first/a.length,firstWilson:wilson(first,a.length),twoAttemptWins:two,twoAttemptWinRate:two/a.length,twoAttemptWilson:wilson(two,a.length),losses:losses.length,availableAdvice:advice,allLossesHaveAdvice:advice===losses.length,retryWinsWithAdvice:losses.filter(r=>r.second?.won).length,retryWinsWithoutAdvice:losses.filter(r=>r.withoutAdvice?.won).length};});
 const [casual,regular,heavy]=cohorts,gates={casualFirstTwoAtLeast50:casual.twoAttemptWinRate>=.5,regularFirstTwoAtLeast70:regular.twoAttemptWinRate>=.7,heavyFirstAtMost95:heavy.firstWinRate<=.95,everyLossHasAvailableImprovement:cohorts.every(c=>c.allLossesHaveAdvice)};
 await writeFile(out+'/checks.json',JSON.stringify({registration,cohorts,gates,accounts,limitations:['TRAIN progression proxy; not fresh combat acceptance, a human playtest or elapsed seven days.','Tests the next uncleared chapter at the existing lowest-cat challenge band on arrival day7. Accounts already clear throughchapter3 replaychapter3.','A loss before reaching the boss counts as a failure. One informed retry is allowed separately from the economy daily route budget.','No advice means no informed retry success; paired no-advice run is diagnostic only.']},null,2));
 console.log(JSON.stringify({cohorts,gates}));
}catch(e){if(e!==pause)throw e;}finally{await vite.close();}
