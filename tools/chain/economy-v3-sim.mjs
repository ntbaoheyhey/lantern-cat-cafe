/** Conservation-checked demand sensitivity, never a forecast. All amounts are modeled YARN units. */
import assert from 'node:assert/strict';
import {ECONOMY_V3 as E} from '../../packages/game-rules/src/cardrpg/economy-v3.ts';
export function simulateEconomyV3({mix=[.6,.15,.05,.2],demand=.5,weeks=52,players=1000,seed=43113}={}){
 const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};
 const policies=[{name:'casual',hours:3.5,wins:3,seals:.5,fusions:.4,spoolUse:.2},{name:'regular',hours:7,wins:5,seals:.8,fusions:.7,spoolUse:.3},{name:'heavy',hours:21,wins:7,seals:1.2,fusions:1,spoolUse:.35},{name:'bot',hours:60,wins:7,seals:.15,fusions:.15,spoolUse:0}];
 const accounts=policies.flatMap((p,i)=>Array.from({length:Math.round(mix[i]*players)},()=>({...p,earned:0,withdrawn:0,spool:0,stars:0,gear:0,fused:0,sealed:0,yarn:20,style:false})));
 let lateEmission=0,lateBurn=0,emission=0,burn=0,retained=0,starSource=0,starSink=0,sealed=0,fused=0,treasury=0;
 const spend=(a,cost)=>{if(a.yarn+1e-9<cost)return false;a.yarn-=cost;burn+=cost;return true;};
 for(let week=0;week<weeks;week++){
  const beforeEmission=emission,beforeBurn=burn;
  // A closed four-week rank table, tier budgets match the server's scaled 6/4/2/1 awards.
  const order=[...accounts].sort((a,b)=>b.wins-a.wins);const rank=(a)=>{const start=order.findIndex(x=>x.wins===a.wins),end=order.findLastIndex(x=>x.wins===a.wins)+1;let sum=0;for(let i=start;i<end;i++){const p=(i+1)/order.length;sum+=p<=.01?6:p<=.1?4:p<=.25?2:p<=.5?1:0;}return sum/(end-start);};
  const listings=[];
  for(const a of accounts){
   const active=rand()<Math.min(1,a.wins/5),reward=(active?E.rewards.weeklySpool:0)+(week===0?3*E.rewards.chapterSpool:0)+(week%4===3?rank(a):0);
   a.earned+=reward;a.spool+=reward;if(active){a.stars+=E.rewards.weeklyStarThread;starSource+=E.rewards.weeklyStarThread;}
   a.gear+=a.wins*.6; // Declared same-set Epic availability; measured cohort reported separately.
   if(!a.style&&a.spool>=5&&rand()<a.spoolUse){a.spool-=5;a.style=true;}
   // Adversarial case: every account holds a Deed. No withdrawal fee counted as burn.
   const gross=Math.min(a.spool,16),fee=gross*E.spool.feeBp/10000,net=gross-fee;a.spool-=gross;a.withdrawn+=net;a.yarn+=net;retained+=fee;emission+=net;
   if(rand()<a.fusions*demand&&a.stars>=2&&a.gear>=3&&spend(a,E.fusion.legendary.yarn)){a.stars-=2;a.gear-=3;a.fused++;starSink+=2;fused++;}
   if(rand()<a.seals*demand&&a.gear>=1&&spend(a,E.seal.reference.epic*E.seal.feeBp/10000)){a.gear--;a.sealed++;sealed++;listings.push(a);}
  }
  // Transfers conserve balances; sales need a funded second account. No synthetic wash volume.
  for(const seller of listings){const buyer=accounts[Math.floor(rand()*accounts.length)],price=E.seal.reference.epic;
   if(buyer===seller||buyer.yarn<price||rand()>=.5*demand)continue;
   buyer.yarn-=price;seller.yarn+=price*(1-E.market.feeBp/10000);burn+=price*E.market.burnBp/10000;treasury+=price*E.market.treasuryBp/10000;
  }
  if(week>=weeks-13){lateEmission+=emission-beforeEmission;lateBurn+=burn-beforeBurn;}
 }
 const initial=20*accounts.length,remaining=accounts.reduce((s,a)=>s+a.yarn,0);
 assert(Math.abs(initial+emission-burn-treasury-remaining)<.00001,'YARN conservation');
 const byType=Object.fromEntries(policies.map(p=>{const rows=accounts.filter(a=>a.name===p.name);return [p.name,{spool:rows.reduce((s,a)=>s+a.earned,0),yarnPerHour:rows.reduce((s,a)=>s+a.withdrawn,0)/(rows.length*p.hours*weeks)}];}));
 const total=accounts.reduce((s,a)=>s+a.earned,0),top=[...accounts].sort((a,b)=>b.earned-a.earned).slice(0,Math.ceil(accounts.length*.01)).reduce((s,a)=>s+a.earned,0);
 return {players:accounts.length,weeks,botShare:mix[3],demand,burn,emission:initial+emission,routineEmission:emission,retained,initialTesterCapital:initial,remainingYarn:remaining,treasury,last13WeeksBurnEmission:lateBurn/lateEmission,burnEmission:burn/(initial+emission),burnRoutineEmission:burn/emission,starSource,starSink,starSourceSink:starSink?starSource/starSink:null,starSinkSource:starSink/starSource,sealed,fused,topOnePercentSpoolShare:top/total,byType,heavyCasualYarnPerHour:byType.heavy.yarnPerHour/byType.casual.yarnPerHour,assumptions:'100% Deed eligibility; finite one-time 20 YARN tester grant included in total emission; real weekly/season Spool schedule; same-set Epic availability assumed. No future passes, upgrades or Mythic sinks; no retained-fee burn; no controller auto-cut counted. Conservation enforced. Demand is unvalidated.'};
}
export function economyV3Scenarios(){return [[.6,.15,.05,.2],[.35,.3,.15,.2],[.1,.25,.45,.2]].flatMap((mix,i)=>[1,.5].map(demand=>({mix:['casual-heavy','balanced','heavy-heavy'][i],...simulateEconomyV3({mix,demand,seed:43113+i})})));}
