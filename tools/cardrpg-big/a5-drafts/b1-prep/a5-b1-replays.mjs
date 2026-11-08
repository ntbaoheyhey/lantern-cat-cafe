// REFERENCE: A5 B1; inspect existing train examples. Optional observer records raw HP calls without changing the battle.
import {loadRules} from './a5-load.mjs';
import {readFile,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const out=process.env.A5_ABLATION_OUT||'reports/cardrpg-big/a5/b1/ablation';
const summary=JSON.parse(await readFile(out+'/results.json','utf8'));
assert(summary.count<=500);
const {depth:R,close}=await loadRules({probe:true});
let live=null,raw=[];
globalThis.__a5HpProbe=(battle,source,target,amount,kind)=>{
 if(battle!==live)return;
 const request=Math.max(0,Math.round(amount));
 raw.push({logIndex:battle.log.length,round:battle.round,actorId:source.id,targetId:target.id,kind,
  row:target.row,hpBefore:target.hp,shieldAfterDirectAbsorption:target.shield,requestedHpLoss:request,
  effectiveHpLoss:Math.min(target.hp,request),hpMargin:target.hp-request,
  extraHpNeededToSurvive:Math.max(0,request-target.hp+1),statuses:structuredClone(target.statuses)});
};
function trace(setup,expected) {
 const b=R.createBattle(setup),steps=[];live=b;raw=[];
 for(let i=0;i<900&&!b.result;i++){
  const actor=R.currentActor(b),choice=actor.side==='party'?R.chooseAction(b,'auto'):null;
  const snap={index:i,round:b.round,actorId:actor.id,side:actor.side,choice,rng:b.rng,logStart:b.log.length,
   actors:b.actors.map(a=>({id:a.id,side:a.side,hp:a.hp,maxHp:a.maxHp,shield:a.shield,row:a.row,statuses:structuredClone(a.statuses),cooldowns:{...a.cooldowns}}))};
  assert(choice?R.act(b,choice):R.enemyAct(b));snap.logEnd=b.log.length;steps.push(snap);
 }
 assert(b.result);assert.deepEqual(JSON.parse(JSON.stringify(b)),expected,'Observer/step execution must preserve the recorded battle exactly');
 const deaths=raw.filter(e=>b.log[e.logIndex+1]?.kind==='defeat'&&b.log[e.logIndex+1]?.targetId===e.targetId);
 const firstPartyDeath=deaths.find(e=>setup.cats.some(c=>c.id===e.targetId));
 return {steps,rawHpCalls:raw,firstPartyDeath,result:b.result};
}
try {
 for(const example of summary.replays){
  const data=JSON.parse(await readFile(example.path,'utf8'));assert(data.seed>=1&&data.seed<=500);
  const before=trace(data.before.initial,data.before),after=trace(data.after.initial,data.after);
  const a=before.steps.filter(s=>s.side==='party'),b=after.steps.filter(s=>s.side==='party');
  const i=a.findIndex((s,j)=>!b[j]||s.actorId!==b[j].actorId||s.round!==b[j].round||JSON.stringify(s.choice)!==JSON.stringify(b[j].choice));
  const divergence=i<0?null:{partyIndex:i,aligned:a[i].actorId===b[i]?.actorId&&a[i].round===b[i]?.round,before:a[i],after:b[i]??null};
  const death=before.firstPartyDeath,deathStep=death?before.steps.find(s=>s.logStart<=death.logIndex&&s.logEnd>death.logIndex):null;
  const matchingAfter=deathStep?after.steps.find(s=>s.actorId===deathStep.actorId&&s.round===deathStep.round):null;
  const path=example.path.replace('.json','-trace.json');
  await writeFile(path,JSON.stringify({method:'Vite read-only observer before loseHp clamp; records only live battle, never AI previews. Final state/log/choices are byte-equivalent JSON to uninstrumented saved battles. Full raw calls retain source/request/HP margin. Matching-round snapshots are descriptive after automatic decisions diverge, not a controlled one-variable effect.',key:example.key,seed:data.seed,divergence,losingFirstDeath:death,losingDeathAction:deathStep,winningAtSameActorRound:matchingAfter,before,after},null,2));
  example.tracePath=path;example.tracePending=false;
 }
 await writeFile(out+'/results.json',JSON.stringify(summary,null,2));
}finally{delete globalThis.__a5HpProbe;live=null;await close();}
