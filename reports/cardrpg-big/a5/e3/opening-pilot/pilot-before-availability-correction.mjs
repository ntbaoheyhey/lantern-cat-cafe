import {loadRules} from '/Users/bao/taskbar-hero-cardrpg-a4/tools/cardrpg-big/a4-load.mjs';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const root='/tmp/cardrpg-a5-e3-prep',method=JSON.parse(await readFile(root+'/REGISTERED-METHOD.json','utf8'));
for(const [p,h]of Object.entries(method.source))assert.equal(createHash('sha256').update(await readFile(p)).digest('hex'),h,p);
const suite=await loadRules(),R=await suite.load('packages/game-rules/src/cardrpg/depth/index.ts'),O=await suite.load('packages/game-rules/src/cardrpg/depth/onboarding.ts');
const clone=structuredClone,rows=[];
function summary(b){return{result:b.result,round:b.round,actions:b.log.filter(e=>['action','enemy-action'].includes(e.kind)).length,choices:b.choices.length,causes:R.outcomeV4(b),hp:b.actors.filter(a=>a.side==='party').map(a=>({id:a.id,hp:a.hp,shield:a.shield})),damage:b.log.filter(e=>e.kind==='damage').map(e=>({actor:e.actorId,target:e.targetId,n:e.amount}))};}
try{
 const initial=R.setGameplayV4(R.createDepthAccount(11),true);
 for(const hp of [230,300,360])for(const formation of ['standard','clover-front','soot-front']){
  const cats=R.battleCats(initial);if(formation!=='standard'){cats.find(c=>c.id==='mochi').row='rear';cats.find(c=>c.id===formation.split('-')[0]).row='front';}
  const outcomes=[];
  for(let seed=1;seed<=50;seed++){
   const setup={seed,chapter:1,cats,enemies:['practice-cushion'],tutorial:true,gameplayV4:true,plan:initial.v4.plan,...(hp===230?{}:{enemyStats:{'practice-cushion':{hp,attack:60,defense:0}}})};
   const b=R.playBattle(R.createBattle(setup),'auto');outcomes.push(summary(b));
  }
  rows.push({kind:'practice',hp,formation,outcomes});
 }
 const invited=O.firstInvitation(initial,4);assert(invited.ok);
 const started=R.startRun(invited.state,1,invited.state.account.seed+invited.state.nextRunId*7919);assert(started.ok);
 const entered=R.enterNode(started.state,R.availableNodes(started.state.run)[0].id);assert(entered.ok);
 const setup=entered.state.run.battle.initial;
 for(const id of ['bellsteel-charm-rare','hearthloom-outfit-rare','moonwick-weapon-rare','mossbrew-relic-rare']){
  const craft=R.craftGear(invited.state,id);assert(craft.ok,craft.error);const gear=craft.state.gear.at(-1);
  const cat=id==='moonwick-weapon-rare'?'soot':id==='mossbrew-relic-rare'?'clover':'mochi';
  const equip=R.equipGear(craft.state,cat,gear.id);assert(equip.ok);
  const before=R.playBattle(R.createBattle(clone(setup)),'auto'),after=R.playBattle(R.createBattle({...clone(setup),cats:R.battleCats(equip.state)}),'auto');
  rows.push({kind:'piece',id,cat,cost:{fish:invited.state.account.currencies.fish-craft.state.account.currencies.fish,threads:invited.state.account.currencies.threads-craft.state.account.currencies.threads},before:summary(before),after:summary(after),compare:R.comparisonV4(craft.state,cat,gear.id)});
 }
 await writeFile(root+'/pilot.json',JSON.stringify({method,rows},null,2));console.log(JSON.stringify(rows.map(r=>r.kind==='practice'?{hp:r.hp,formation:r.formation,wins:r.outcomes.filter(o=>o.result==='party').length,maxActions:Math.max(...r.outcomes.map(o=>o.actions)),example:r.outcomes[6]}:{id:r.id,cat:r.cat,before:r.before,after:r.after})));
}finally{await suite.vite.close();}
