import assert from 'node:assert/strict';
import {rng,lognormal,quantile} from './runtime.mjs';

export function scenarios(config){return Object.keys(config.mixes).flatMap(mix=>[.5,1].flatMap(demand=>[.1,.2,.35].map(botShare=>({id:`${mix}-d${demand}-b${botShare}`,mix,demand,botShare}))));}
const sum=(xs,f)=>xs.reduce((a,x)=>a+f(x),0);
const ratio=(a,b)=>b?a/b:null;
const cachedWeeks=new WeakMap();
function weeklyCohort(runtime,bank){
 if(cachedWeeks.has(bank))return cachedWeeks.get(bank);
 const groups=new Map();
 for(const account of bank){
  const weeks=[];
  for(let at=0;at<account.daily.length;at+=7){
   const days=account.daily.slice(at,at+7),epics={};let legendary=0;
   for(const day of days)for(const [id,n] of Object.entries(day.gear)){
    const t=runtime.R.GEAR_BY_ID[id];if(t.rarity==='epic')epics[t.setId]=(epics[t.setId]??0)+n;if(t.rarity==='legendary')legendary+=n;
   }
   weeks.push({hours:sum(days,d=>d.hours),wins:sum(days,d=>d.wins),level:Math.max(...days.map(d=>d.level)),chapters:[...new Set(days.flatMap(d=>d.cleared))],epics,legendary});
  }
  if(!groups.has(account.profile))groups.set(account.profile,[]);groups.get(account.profile).push({...account,weeks});
 }
 cachedWeeks.set(bank,groups);return groups;
}

/** Closed token ledger with a separately identified, finite opening market float.
 * Retained withdrawal fees never enter wallets and never count as burns. */
export function tokenRun(runtime,config,bank,scenario,seed,{zeroExternal=false}={}){
 const E=config.policy,random=rng(seed),types=config.profiles,humans=config.mixes[scenario.mix],shares=humans.map(x=>x*(1-scenario.botShare)).concat(scenario.botShare),cohorts=weeklyCohort(runtime,bank);
 const counts=shares.map((_,i)=>Math.round(config.population*sum(shares.slice(0,i+1),x=>x))-Math.round(config.population*sum(shares.slice(0,i),x=>x)));
 const all=types.flatMap((p,i)=>Array.from({length:counts[i]},()=>{
  const rows=cohorts.get(p.id),gear=rows?.[Math.floor(random()*rows.length)];if(!gear)throw Error('Missing C2 cohort '+p.id);
  return {p,gear,alive:true,hours:0,spool:0,stars:0,bossSeals:0,yarn:0,withdrawn:0,claims:0,deed:random()<p.deed,market:random()<p.market,level:1,score:0,epics:{},legendary:0,sealed:0,fusions:0,style:false,chapters:new Set()};
 }));
 // Deterministically randomize grant recipients, rather than favoring a profile.
 for(let i=all.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[all[i],all[j]]=[all[j],all[i]];}
 const recipients=Math.min(all.length,config.initial.testerRecipients);
 for(let i=0;i<recipients;i++)all[i].yarn=all[i].claims=config.initial.testerYarn;
 const testerClaims=recipients*config.initial.testerYarn;
 const openingMarketYarn=zeroExternal?0:config.initial.marketYarnPerParticipant*all.filter(a=>a.market).length;
 let external=openingMarketYarn,burn=0,treasury=0,withdrawals=0,retained=0,starSource=0,starSink=0,seals=0,fusions=0,volume=0,externalVolume=0;
 const weeks=[],burnBySink={fusion:0,seal:0,market:0};
 const spend=(a,cost,kind)=>{if(cost<0||!Number.isFinite(cost))throw Error('Invalid cost');if(a.yarn+1e-9<cost)return false;a.yarn-=cost;burn+=cost;burnBySink[kind]=(burnBySink[kind]??0)+cost;return true;};
 for(let week=0;week<config.tokenWeeks;week++){
  const before={burn,withdrawals,starSource,starSink};const listings=[];
  for(const a of all){
   if(!a.alive)continue;
   if(week&&random()<(week<4?a.p.churnFirst:a.p.churnLater)){a.alive=false;continue;}
   // Aggregate exact C2 day records once. Mature weeks reuse the final fortnight.
   const index=week<a.gear.weeks.length?week:Math.max(0,a.gear.weeks.length-2)+(week%2),row=a.gear.weeks[index];
   const won=row.wins,chapters=row.chapters;
   a.hours+=row.hours?lognormal(random,row.hours,a.p.hoursSigma*.3):0;a.level=Math.max(a.level,row.level);
   for(const [set,n] of Object.entries(row.epics))a.epics[set]=(a.epics[set]??0)+n;a.legendary+=row.legendary;
   if(won){a.spool+=E.rewards.weeklySpool;a.stars+=E.rewards.weeklyStarThread;starSource+=E.rewards.weeklyStarThread;a.bossSeals++;a.score=Math.min(39,a.score+1);}
   for(const c of chapters)if(!a.chapters.has(c)){a.chapters.add(c);a.spool+=E.rewards.chapterSpool;}
   if(!a.style&&a.spool>=E.spool.skinCost&&random()<a.p.sink*scenario.demand*.25){a.spool-=E.spool.skinCost;a.style=true;}
  }
  if((week+1)*7%E.season.days===0){
   const eligible=all.filter(a=>a.alive&&a.score>0),ranks=runtime.tiedRankAmounts(eligible.map(a=>a.score),BigInt(Math.round(E.rewards.seasonRankMax*1e6)));
   eligible.forEach((a,i)=>{a.spool+=Number(ranks[i])/1e6;a.score=0;});
  }
  for(const a of all){
   if(!a.alive)continue;
   if(a.deed&&a.level>=E.deed.level&&week*7>=E.spool.minAgeDays&&random()<a.p.withdraw){
    const gross=Math.min(a.spool,E.spool.weeklyNetCap/(1-E.spool.feeBp/10000));
    const fee=gross*E.spool.feeBp/10000,net=gross-fee;
    a.spool-=gross;a.yarn+=net;a.withdrawn+=net;a.claims+=net;withdrawals+=net;retained+=fee;
   }
   const set=Object.keys(a.epics).find(k=>a.epics[k]>=E.fusion.legendary.count);
   // A finite desired loadout. A model cannot require endless unwanted crafts.
   if(set&&a.fusions<16&&a.stars>=E.fusion.legendary.starThread&&random()<a.p.sink*scenario.demand&&spend(a,E.fusion.legendary.yarn,'fusion')){
    a.epics[set]-=E.fusion.legendary.count;a.stars-=E.fusion.legendary.starThread;starSink+=E.fusion.legendary.starThread;a.legendary++;a.fusions++;fusions++;
   }
   if(a.level>=E.seal.level&&a.market&&a.bossSeals>=E.seal.bossSeals&&random()<a.p.sell*scenario.demand){
    const gear=Object.keys(a.epics).find(k=>a.epics[k]>0),price=E.seal.reference.epic;
    if(gear&&spend(a,price*E.seal.feeBp/10000,'seal')){a.epics[gear]--;a.bossSeals-=E.seal.bossSeals;a.sealed++;seals++;listings.push({seller:a,price});}
   }
  }
  for(const {seller,price} of listings){
   // A funded counterparty is required. External capital is finite, not revenue.
   const buyer=all[Math.floor(random()*all.length)],externalBuy=random()<scenario.demand*.25;
   if(externalBuy&&external>=price){external-=price;externalVolume+=price;}
   else if(buyer!==seller&&buyer.alive&&buyer.market&&buyer.yarn>=price&&random()<buyer.p.buy*scenario.demand){buyer.yarn-=price;buyer.sealed++;}
   else continue;
   seller.sealed--;seller.yarn+=price*(1-E.market.feeBp/10000);burn+=price*E.market.burnBp/10000;burnBySink.market+=price*E.market.burnBp/10000;treasury+=price*E.market.treasuryBp/10000;volume+=price;
  }
  weeks.push({week:week+1,active:all.filter(a=>a.alive).length,claims:withdrawals-before.withdrawals,burn:burn-before.burn,starSource:starSource-before.starSource,starSink:starSink-before.starSink});
 }
 const claims=testerClaims+withdrawals,balances=sum(all,a=>a.yarn),error=testerClaims+openingMarketYarn+withdrawals-burn-treasury-balances-external;
 assert(Math.abs(error)<1e-6,'YARN conservation '+error);
 const byType=Object.fromEntries(types.map(p=>{const xs=all.filter(a=>a.p.id===p.id);return[p.id,{accounts:xs.length,activeHours:sum(xs,a=>a.hours),withdrawn:sum(xs,a=>a.withdrawn),yarnPerHour:ratio(sum(xs,a=>a.withdrawn),sum(xs,a=>a.hours))}];}));
 const first=id=>quantile(all.filter(a=>a.p.id===id).map(a=>a.gear.firstLegendaryDay??config.cohortDays+1),.5);
 const top=all.map(a=>a.withdrawn).sort((a,b)=>b-a).slice(0,Math.ceil(all.length*.01));
 return {seed,burnClaims:ratio(burn,claims),starRatio:ratio(starSource,starSink),heavyCasualHourlyRatio:ratio(byType.heavy.yarnPerHour,byType.casual.yarnPerHour),casualLegendaryDay:first('casual'),heavyLegendaryDay:first('heavy'),botRegularHourlyRatio:ratio(byType.bot.yarnPerHour,byType.regular.yarnPerHour),topOnePercentWithdrawnShare:ratio(sum(top,x=>x),withdrawals),claims,testerClaims,withdrawals,burn,retained,treasury,balances,openingMarketYarn,remainingMarketYarn:external,externalVolume,volume,starSource,starSink,seals,fusions,burnBySink,byType,conservationError:error,lateBurnClaims:ratio(sum(weeks.slice(-13),w=>w.burn),sum(weeks.slice(-13),w=>w.claims)),weeks};
}
