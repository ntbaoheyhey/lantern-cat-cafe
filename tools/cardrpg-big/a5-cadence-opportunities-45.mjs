// REFERENCE: Original Home02 misses. Read-only diagnosis of earned capped account and currently available choices.
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {loadRules} from './a4-load.mjs';
const root='reports/cardrpg-big/a5/engagement/opportunities-45',sha=b=>createHash('sha256').update(b).digest('hex');
const reg=JSON.parse(await readFile(root+'/registration.json'));
for(const[p,h]of Object.entries(reg.inputs))assert.equal(sha(await readFile(p)),h,p);
const loader=await loadRules();
try{
 const R=await loader.load('packages/game-rules/src/cardrpg/depth/index.ts');
 const state=JSON.parse(await readFile(reg.state)),before=JSON.stringify(state),timeline=JSON.parse(await readFile(reg.timeline));
 const caps=R.depthCaps(state),ceiling=Math.min(...state.team.map(id=>state.account.cards.find(c=>c.cardId===id).level));
 const upgrades=state.team.flatMap(id=>{
  const card=state.account.cards.find(c=>c.cardId===id),result=R.metaCommand(state,{type:'level',cardId:card.id});
  return result.ok?[{id,from:card.level,to:result.state.account.cards.find(c=>c.cardId===id).level,cost:Object.fromEntries(Object.entries(state.account.currencies).map(([id,n])=>[id,n-result.state.account.currencies[id]]).filter(([,n])=>n)),newBand:Math.min(...state.team.map(id=>result.state.account.cards.find(c=>c.cardId===id).level))}]:[];
 });
 const pending=Object.values(state.v4.journey.stars).filter(r=>r.conditions.some(x=>!x)&&r.band<=ceiling);
 const crews=[];
 for(const id of state.team)for(const reserve of state.account.cards.filter(c=>!state.team.includes(c.cardId)&&c.level>=ceiling)){
  const team=state.team.map(old=>old===id?reserve.cardId:old),rows={...state.rows,[reserve.cardId]:state.rows[id]};
  const result=R.configureTeam(state,team,rows,state.skills);if(!result.ok)continue;
  const bonuses=R.crewThresholds(team).filter(c=>c.threshold===4);
  if(!bonuses.length)continue;
  const discoveries=result.state.v4.journey.found.filter(d=>!state.v4.journey.found.some(old=>old.id===d.id));
  crews.push({remove:id,add:reserve.cardId,team,rows:Object.fromEntries(team.map(id=>[id,rows[id]])),band:Math.min(...team.map(id=>state.account.cards.find(c=>c.cardId===id).level)),bonuses:bonuses.map(c=>({id:c.id,name:c.name,marks:c.marks,contributors:c.contributors,description:c.description})),newDiscoveries:discoveries,moneyUnchanged:JSON.stringify(result.state.account.currencies)===JSON.stringify(state.account.currencies)});
 }
 const rewards=timeline.timeline.filter(r=>['reward','celebration'].includes(r.kind));
 const totalCurrencyDeltas={};for(const r of rewards)for(const[id,n]of Object.entries(r.currencies??{}))totalCurrencyDeltas[id]=(totalCurrencyDeltas[id]??0)+n;
 assert.equal(JSON.stringify(state),before);assert(crews.every(c=>c.moneyUnchanged&&c.band>=ceiling));
 const result={method:'Read-only original earned checkpoint plus successful public-command previews. No new combat, elapsed, acceptance or counterfactual win samples.',registration:reg,day:state.account.day,team:state.team,levels:state.team.map(id=>({id,level:state.account.cards.find(c=>c.cardId===id).level})),currencies:state.account.currencies,daily:state.account.daily,caps,allCurrenciesCapped:Object.keys(caps).every(id=>state.account.daily.earned[id]===caps[id]),starCount:R.starCountV4(state),currentCrew:R.crewThresholds(state.team),pendingStars:pending,affordableUpgrades:upgrades,oneSwapCrews:crews,totalObservedPositiveCurrencyDeltas:totalCurrencyDeltas,lastReward:rewards.at(-1),inputStateUnchanged:true,limitations:['Final60minute checkpoint does not establish the exact minute at which each cap filled.','A legal four-mark crew meets the noncombat star condition only; victory and survival are not promised.','Only one-seat substitutions at the current band are enumerated; no best-team ranking.','Selected-cat policy and repeated nodes limit the original journey; no human behavior inference.']};
 await writeFile(root+'/diagnosis.json',JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify({allCurrenciesCapped:result.allCurrenciesCapped,stars:result.starCount,pending:pending.length,upgrades,crewOptions:crews.map(c=>({remove:c.remove,add:c.add,bonuses:c.bonuses.map(b=>b.id),discoveries:c.newDiscoveries.map(d=>d.id)})),lastRewardMinutes:result.lastReward.atMs/60000}));
}finally{await loader.vite.close();}
