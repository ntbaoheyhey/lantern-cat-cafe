// Deterministic sensitivity analysis, not a demand forecast. No network or credentials.
import {mkdirSync, writeFileSync, readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {loadSourceSupply} from './supply-snapshot.mjs';
import {seasonBudget} from './season-budget.mjs';
import {grantHeadroom} from './grant-headroom.mjs';
import {allocationEnvelope} from './allocation-envelope.mjs';
import {validateFeaturePlan} from './feature-plan.mjs';
import {YARN_STYLES} from '../../packages/chain/src/cosmetics.ts';
import {FORGE_DESIGNS,FORGE_COST} from '../../packages/chain/src/forge.ts';
import {forgePreparation} from './forge-preparation.mjs';
import {tiedRankAmounts} from '../../packages/chain/src/rank.ts';
import {validateCampaignCohort,campaignWeek} from './campaign-cohort.mjs';

import {economyV3Scenarios} from './economy-v3-sim.mjs';
export {simulateEconomyV3,economyV3Scenarios} from './economy-v3-sim.mjs';

export const UNIT = 10n ** 18n;
const GENESIS = 1_000_000_000n * UNIT;
const THRESHOLD = 8n * UNIT / 10n;
const TYPES = ['casual', 'regular', 'farmer', 'bot'];
const root = fileURLToPath(new URL('../../', import.meta.url));
export const mixes = [
  {name: 'casual-heavy', shares: [.75, .2, .05, 0], seed: 43113},
  {name: 'balanced', shares: [.45, .35, .2, 0], seed: 43114},
  {name: 'farmer-heavy', shares: [.2, .2, .4, .2], seed: 43115},
];
export const provisionalSupply = {
  rarePerActiveWeek: .4, epicPerActiveWeek: .08,
  source: 'PROVISIONAL: C2 has not supplied weekly campaign issuance',
};
export function validateSupply(supply) {
  for (const key of ['rarePerActiveWeek', 'epicPerActiveWeek', ...(supply.legendaryPerActiveWeek === undefined ? [] : ['legendaryPerActiveWeek'])]) {
    assert(Number.isFinite(supply[key]) && supply[key] >= 0 && supply[key] <= 500, `Invalid ${key}`);
  }
  assert(typeof supply.source === 'string' && supply.source.trim(), 'Supply provenance required');
  if (supply.byType) for (const type of TYPES) validateSupply({...supply.byType[type], source:supply.source});
  return supply;
}
const min = (a, b) => a < b ? a : b;
const units = n => Number(n) / Number(UNIT);
const ratio = (a, b) => b === 0 ? null : a / b;
const rng = seed => () => {seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 2 ** 32;};

// Integer operations match SeasonRewards._nextMultiplier (including order of floors).
export function nextMultiplier(previous, emission, burned) {
  if (emission === 0n) return previous;
  const health = burned * UNIT / emission;
  if (health >= THRESHOLD) return previous;
  return previous * min(THRESHOLD, health * UNIT / THRESHOLD) / UNIT;
}
export const routineBudget = multiplier => 12n * UNIT * multiplier / UNIT;
export function rankEntitlement(position, total, bps = 10000) {
  assert(Number.isInteger(position) && position >= 0 && position < total);
  const percentile = (position + 1) / total;
  return BigInt(percentile <= .01 ? 6 : percentile <= .10 ? 4 : percentile <= .25 ? 2 : percentile <= .50 ? 1 : 0) * UNIT * BigInt(bps) / 10000n;
}


export function simulate(mix, {
  profile = 'implemented-sinks', controlled = true, demand = 1, paidMarketShare = 1,
  supply = provisionalSupply, entitlementBps = 10000, rewardSchedule = 'season-close', weeks = 52, botRankBoost = 1,
  participation = 'persistent', collectionTarget = 4, sealStockTarget = 6,
  rewardPolicy = 'fixed', grantPolicy = 'universal', grantLeakage = 0,
  botsClaimGrant = true, botsHoard = false, burnBudgetBps = 5000,
  demandShockWeek = null, demandAfterShock = 0, marketPriceYarn = 20,
  featurePlan = null, stylePlan = null, forgePlan = null, hoursByType = null, supplySchedule = null,
  earningEndWeek = null, sealFeeBps = 1000, campaign = null,
} = {}) {
  validateSupply(supply);
  if(campaign){
    validateCampaignCohort(campaign);
    assert(profile==='implemented-sinks'&&rewardSchedule==='season-close'&&rewardPolicy==='fixed'&&!supplySchedule&&botRankBoost===1,'Campaign evidence must not mix with synthetic supply or ranking');
  }
  // Offline sensitivity only; signed production prices remain in game-rules.
  assert(Number.isInteger(sealFeeBps)&&sealFeeBps>=0&&sealFeeBps<=1000,'Invalid experimental seal fee');
  const sealFees=[20n,100n,300n].map(reference=>reference*UNIT*BigInt(sealFeeBps)/10000n);
  const hours=hoursByType??{casual:3,regular:10,farmer:30,bot:70};
  for(const type of TYPES)assert(Number.isFinite(hours[type])&&hours[type]>0&&hours[type]<=168,'Invalid active hours');
  if(supplySchedule){
    assert(Array.isArray(supplySchedule.initial)&&supplySchedule.initial.length>0&&supplySchedule.initial.length<=52,'Invalid source schedule');
    supplySchedule.initial.forEach(validateSupply);validateSupply(supplySchedule.tail);
  }
  if(forgePlan!==null){
    assert(!featurePlan&&profile!=='roadmap','Finite local forge stays separate from hypothetical recurring recipes');
    assert(Number.isInteger(forgePlan.interestBps)&&forgePlan.interestBps>=0&&forgePlan.interestBps<=10000,'Invalid forge interest');
    assert(Number.isInteger(forgePlan.maxDesigns)&&forgePlan.maxDesigns>=1&&forgePlan.maxDesigns<=FORGE_DESIGNS.length,'Finite forge catalog required');
    assert(typeof forgePlan.first==='boolean','Explicit competing spend order required');
    assert(forgePlan.reserveCompletion===undefined||typeof forgePlan.reserveCompletion==='boolean','Invalid recipe reservation');
  }
  if(stylePlan!==null){
    assert(!featurePlan&&profile!=='roadmap','Finite implemented style pilot cannot be pooled with roadmap sinks');
    assert(Number.isInteger(stylePlan.adoptionBps)&&stylePlan.adoptionBps>=0&&stylePlan.adoptionBps<=10000,'Invalid style interest');
    assert(Number.isInteger(stylePlan.maxStyles)&&stylePlan.maxStyles>=1&&stylePlan.maxStyles<=YARN_STYLES.length,'Finite style catalog required');
    assert(Number.isInteger(stylePlan.openWeek)&&stylePlan.openWeek>=1&&stylePlan.openWeek<=520,'Invalid style opening');
  }
  if(featurePlan!==null){validateFeaturePlan(featurePlan);assert.equal(profile,'roadmap','Recipe experiments must remain separate from implemented sinks');}
  assert(Number.isSafeInteger(marketPriceYarn)&&marketPriceYarn>=0&&marketPriceYarn<=10000,'Invalid scenario sale price');
  assert(['fixed','closed-burn','burn-credit','treasury-closed','grant-headroom'].includes(rewardPolicy),'Invalid reward policy');
  assert(['universal','opt-in'].includes(grantPolicy),'Invalid grant policy');
  assert(Number.isFinite(grantLeakage)&&grantLeakage>=0&&grantLeakage<=1,'Invalid grant leakage');
  assert(typeof botsClaimGrant==='boolean'&&typeof botsHoard==='boolean','Invalid bot behavior');
  assert(Number.isInteger(burnBudgetBps)&&burnBudgetBps>=0&&burnBudgetBps<=10000,'Invalid burn budget');
  assert(demandShockWeek===null||(Number.isInteger(demandShockWeek)&&demandShockWeek>=1&&demandShockWeek<=520),'Invalid shock week');
  assert(Number.isFinite(demandAfterShock)&&demandAfterShock>=0&&demandAfterShock<=1,'Invalid shocked demand');
  assert(rewardPolicy==='fixed'||rewardSchedule==='season-close','Closed-burn requires seasonal rank');
  assert(Number.isInteger(entitlementBps) && entitlementBps >= 0 && entitlementBps <= 10000, 'Invalid entitlement scale');
  assert(['season-close', 'legacy-weekly'].includes(rewardSchedule), 'Invalid reward schedule');
  assert(Number.isInteger(weeks) && weeks >= 1 && weeks <= 520, 'Invalid horizon');
  // A finite pilot stops earning at a closed season boundary. Previously earned
  // rank remains claimable in the next season under its actual reduced cap.
  // null preserves every historical recurring-policy control.
  assert(earningEndWeek===null||(Number.isInteger(earningEndWeek)&&earningEndWeek>=13&&earningEndWeek<=520&&earningEndWeek%13===0),'Invalid earning window');
  assert(Number.isFinite(botRankBoost) && botRankBoost >= 1 && botRankBoost <= 10, 'Invalid bot rank boost');
  assert(['persistent','opportunities'].includes(participation), 'Invalid participation model');
  assert(Number.isInteger(collectionTarget) && collectionTarget >= 0 && collectionTarget <= 1000, 'Invalid collection target');
  assert(Number.isInteger(sealStockTarget) && sealStockTarget >= 0 && sealStockTarget <= 1000, 'Invalid seal stock target');
  assert(['demo', 'implemented-sinks', 'roadmap'].includes(profile), 'Invalid profile');
  assert(demand >= 0 && demand <= 1 && paidMarketShare >= 0 && paidMarketShare <= 1, 'Invalid demand');
  assert.equal(mix.shares.length, 4);
  assert(Math.abs(mix.shares.reduce((a, b) => a + b, 0) - 1) < 1e-9);
  const random = rng(mix.seed);
  const marketPrice=BigInt(marketPriceYarn)*UNIT;
  const marketFee=marketPrice*500n/10000n;
  const players = mix.shares.flatMap((share, type) => Array.from({length: Math.round(share * 1000)}, () => ({
    type: TYPES[type], hours: hours[TYPES[type]],
    requested: BigInt([6, 12, 12, 12][type]) * UNIT * BigInt(entitlementBps) / 10000n,
    balance: 20n * UNIT, rewards: 20n * UNIT, routine: 0n, seasonStartRoutine:0n, h: 0, stock: 0,
    unsealed: [0,0,0], sealedKinds:[0,0,0], rankScore:0, rankPending:0n, adopts:random()<demand,
    cosmeticInterest:false, lifetimeCrafts:0, stylesBought:0, styleInterest:false, forgedDesigns:0, forgeInterest:false,
    firstForgeWeek:null, rankReceived:0n, bossReceived:0n, forgeUses:0, renameUsed:false, decorUses:0, passUsed:false,
    // Demo cohort assumes all signed up and completed the fixed boss: 2 pass Relics + 1 boss Relic.
    relics: profile === 'demo' ? 3 : 0, material: profile === 'demo' ? 1 : 0,
  })));
  // Independent draws preserve the historical random stream for fixed/universal controls.
  const grantRandom=rng(mix.seed^0x71a94);
  const shockRandom=rng(mix.seed^0x41c0f);
  const contentRandom=rng(mix.seed^0x69ba23);
  const styleRandom=rng(mix.seed^0x1ba79);
  const forgeRandom=rng(mix.seed^0x593bb);
  const campaignRandom=rng(mix.seed^0x68ca4);
  for(const p of players){
    if(campaign){const samples=campaign.byType[p.type];p.campaignSample=samples[Math.floor(campaignRandom()*samples.length)];}
    p.forgeInterest=forgeRandom()<(forgePlan?.interestBps??0)/10000;
    // Baseline cohort remains the denominator after a demand collapse. Never
    // drop non-completers or departed adopters from a completion report.
    p.forgeEnrolled=p.type!=='bot'&&p.adopts&&p.forgeInterest;
    p.styleInterest=styleRandom()<(stylePlan?.adoptionBps??0)/10000;
    const leak=grantRandom()<grantLeakage;
    p.claimedGrant=grantPolicy==='universal'||p.adopts||leak||(p.type==='bot'&&botsClaimGrant);
    p.balance=p.claimedGrant?20n*UNIT:0n;p.rewards=p.balance;
    p.shockDraw=shockRandom();
    p.affordAt=Object.fromEntries([2,4,10,12,23,30].map(price=>[price,null]));
  }
  let buyers = players.filter(p => p.type !== 'bot' && (participation==='opportunities'||p.adopts)); // Bots supply; no invented cosmetic buyer utility.
  const grant = players.reduce((sum,p)=>sum+p.balance,0n);
  let emitted = 0n, burned = 0n, treasury = 0n, seasonE = 0n, seasonB = 0n, multiplier = UNIT;
  // Counterfactual recycling spends only a CLOSED season's unspent treasury.
  // All payments still count in the ORIGINAL gross-claims denominator and in
  // SeasonRewards policy. Only the separately reported fresh release is lower.
  let recycled=0n,treasuryRevenue=0n,recycleAvailable=0n;
  let bossEmitted=0n, rankEmitted=0n, rankExpired=0n, acquired=0, shelfOverflow=0, legacyEmitted=0n;
  let sealed = 0, consumed = 0, unsealedConsumed=0, crafts=0, sealBurn = 0n, saleBurn = 0n, cosmeticBurn = 0n, trades = 0;
  const featureBurn={forge:0n,rename:0n,decor:0n,pass:0n,style:0n};
  const rows = [];
  let announcedBoss=0n, announcedSeason=0n, seasonRoutine=0n, closedOrganicBurn=0n;
  let eligibleOrganicBurn=0n, seasonOrganic=0n, currentDemand=demand, seasonQuote=null;
  const budgets=[],seasons=[];
  for (let week = 1; week <= weeks; week++) {
    const earningOpen=earningEndWeek===null||week<=earningEndWeek;
    const weekSupply=supplySchedule?(supplySchedule.initial[week-1]??supplySchedule.tail):supply;
    if(featurePlan&&(week-1)%13===0)for(const p of players)
      p.cosmeticInterest=contentRandom()<featurePlan.renewalBps/10000;
    if(week===demandShockWeek){
      currentDemand=demandAfterShock;
      for(const p of players)p.adopts=p.shockDraw<currentDemand;
      buyers=players.filter(p=>p.type!=='bot'&&(participation==='opportunities'||p.adopts));
    }
    if(rewardPolicy!=='fixed'&&(week-1)%13===0){
      recycleAvailable=rewardPolicy==='treasury-closed'?treasury*BigInt(burnBudgetBps)/10000n:0n;
      // Offline planner and dynamic experiment use the same gross-claim bound.
      // Prior season's unsigned/unclaimed allocation expires in this model;
      // there are no signed carry liabilities or extra tester arrivals here.
      // Production must reserve both before applying this formula.
      const h=grantHeadroom({grossClaims:grant+emitted,eligibleBurn:eligibleOrganicBurn});
      seasonQuote=seasonBudget({organicBurn:closedOrganicBurn,burnBudgetBps,accounts:players.length,
        bossCeiling:earningOpen?6n*UNIT*BigInt(entitlementBps)/10000n:0n,
        rankRequests:players.map(p=>p.rankPending),weeklyCap:routineBudget(multiplier),
        ...(rewardPolicy==='grant-headroom'?{available:h.headroom}:{}),
        earnedCredit:rewardPolicy==='treasury-closed'?recycleAvailable:
          rewardPolicy==='burn-credit'?eligibleOrganicBurn*BigInt(burnBudgetBps)/10000n-emitted:null});
      announcedBoss=seasonQuote.bossPerWeek;announcedSeason=seasonQuote.committed;
      players.forEach((p,i)=>{p.rankPending=seasonQuote.rankAwards[i];});
      budgets.push({week,closedOrganicBurn:units(closedOrganicBurn),cumulativeOrganicBurn:units(eligibleOrganicBurn),paidBefore:units(emitted),ceiling:units(seasonQuote.ceiling),
        committed:units(announcedSeason),bossPerWeek:units(announcedBoss),rank:units(seasonQuote.rankTotal),
        treasuryAtOpen:units(treasury),recycleAvailable:units(recycleAvailable)});
      if(rewardPolicy==='grant-headroom'){
        Object.assign(budgets.at(-1),{grossClaimsAtOpen:units(grant+emitted),headroomAtOpen:units(h.headroom),
          additionalBurnRequired:units(h.additionalBurnRequired)});
        assert(announcedSeason<=h.headroom,'Routine promises cannot spend inherited grant headroom twice');
        assert(announcedSeason===0n||grant+emitted+announcedSeason<=2n*eligibleOrganicBurn,'New promises preserve the grant-inclusive bound without future spending');
      }
      seasonRoutine=0n;
    }
    let weekE = 0n, weekB = 0n, weekOrganic=0n, weekBoss=0n, weekRank=0n;
    for (const p of players) {
      const activityDraw=random();
      if (!campaign&&activityDraw > .9) continue;
      // Keep each account's observed two-week source/win relationship together.
      // Later repetitions are an explicit scenario, never longer observation.
      const observed=campaign?campaignWeek(campaign,p.campaignSample,week):null;
      p.h += p.hours;
      // Assume an authoritative issuer signs only the lesser of the entitlement
      // and remaining cap. The contract reverts an oversized voucher; it never
      // partially pays one. There is no deployed routine issuer yet.
      // Rank is earned from a closed season, then claimed during the next season.
      // A future issuer must sign the CURRENT season and keep the earning season in its ledger.
      // Rank takes priority inside the shared routine cap; unpaid rank stays pending until expiry.
      const bossDraw=random();
      const bossEligible = observed?observed.wins>0:bossDraw < ({casual:.5,regular:.9,farmer:.95,bot:.95}[p.type]);
      const bossRequest = bossEligible&&earningOpen ? (rewardPolicy!=='fixed'?announcedBoss:6n * UNIT * BigInt(entitlementBps) / 10000n) : 0n;
      const rankDraw=random(); // Preserve the random stream after pilot closure.
      if(earningOpen)p.rankScore += observed?(observed.wins>0?1:0):rankDraw * (p.type === 'bot' ? botRankBoost : 1);
      // The implemented campaign ledger permits ONE full reservation per earned
      // event. It cannot split an oversized rank voucher across multiple weeks.
      // Historical scenarios retain their explicitly hypothetical partial issuer.
      const rankPayable=campaign?(p.rankPending<=routineBudget(multiplier)?p.rankPending:0n):min(p.rankPending,routineBudget(multiplier));
      const rankReward = profile === 'demo' || rewardSchedule === 'legacy-weekly' ? 0n : rankPayable;
      const bossRoom=routineBudget(multiplier)-rankReward;
      const bossReward = profile === 'demo' || rewardSchedule === 'legacy-weekly' ? 0n : campaign?(bossRequest<=bossRoom?bossRequest:0n):min(bossRequest,bossRoom);
      const reward = profile === 'demo' ? 0n : rewardSchedule === 'legacy-weekly' ? (earningOpen?min(p.requested,routineBudget(multiplier)):0n) : rankReward+bossReward;
      p.rankPending -= rankReward; p.rankReceived += rankReward; p.bossReceived += bossReward;
      rankEmitted+=rankReward; bossEmitted+=bossReward; weekBoss+=bossReward; weekRank+=rankReward;
      if(rewardSchedule === 'legacy-weekly')legacyEmitted+=reward;
      p.balance += reward; p.rewards += reward; p.routine += reward; emitted += reward; weekE += reward;
      if(rewardPolicy==='treasury-closed'){
        assert(reward<=recycleAvailable&&reward<=treasury,'Only reserved closed-period revenue can be recycled');
        treasury-=reward;recycleAvailable-=reward;recycled+=reward;
      }
      for(const price of [2,4,10,12,23,30])if(p.affordAt[price]===null&&p.routine>=BigInt(price)*UNIT)p.affordAt[price]=week;
      const spend = (amount, kind) => {
        if (p.balance < amount) return false;
        p.balance -= amount; burned += amount; weekB += amount;
        // Ground-truth bot labels are an optimistic oracle in this model, not a detector.
        if(p.type!=='bot')weekOrganic+=amount;
        if (kind === 'seal') sealBurn += amount; else {cosmeticBurn += amount;featureBurn[kind]+=amount;}
        return true;
      };
      // Local pilot catalog only: each style can be bought once for life, by a
      // persistently interested human. Never infer new utility each season.
      // Spend from the SAME balance before sealing: cosmetics can crowd out a
      // different sink; adding their gross burns to an old result is invalid.
      const buyStyles=()=>{if(stylePlan&&week>=stylePlan.openWeek&&p.type!=='bot'&&p.adopts&&p.styleInterest){
        while(p.stylesBought<stylePlan.maxStyles){
          if(forgePlan?.reserveCompletion&&forgePlan.first&&p.forgeInterest&&p.forgedDesigns<forgePlan.maxDesigns){
            const recipe=forgePreparation({sealedEpics:p.sealedKinds[1],unsealedEpics:p.unsealed[1],balance:p.balance,sealFee:sealFees[1]});
            if(p.balance<recipe.total+BigInt(YARN_STYLES[p.stylesBought].cost))break;
          }
          if(!spend(BigInt(YARN_STYLES[p.stylesBought].cost),'style'))break;
          p.stylesBought++;
        }
      }};
      if(!forgePlan?.first)buyStyles();
      let playerSeals = 0;
      const wantsRecipe=featurePlan&&p.type!=='bot'&&p.adopts&&p.cosmeticInterest&&
        Math.ceil(week/13)<=featurePlan.catalogSeasons&&p.forgeUses<featurePlan.recipesPerSeason;
      const ratesForType = weekSupply.byType?.[p.type] ?? weekSupply;
      const rates = observed?[0,observed.epic,observed.legendary]:profile === 'demo' ? [0,0,0] : [ratesForType.rarePerActiveWeek,ratesForType.epicPerActiveWeek,ratesForType.legendaryPerActiveWeek??0];
      const fees = sealFees;
      for(let kind=0;kind<3;kind++){
        const rate=rates[kind];
        const offered=Math.floor(rate)+(random()<rate%1?1:0);
        // Upper bound:240 slots available to eligible gear; bound gear occupancy is not modelled.
        const count=Math.min(offered,Math.max(0,240-p.unsealed.reduce((a,b)=>a+b,0)));
        shelfOverflow+=offered-count;
        p.unsealed[kind]+=count;acquired+=count;
        // Explicit counterfactual: consume two authoritative source Epics before
        // paying to make them tradable. There is no campaign authority in this
        // simulator; the output never claims this recipe is implemented.
        if(wantsRecipe&&featurePlan.input==='unsealed'&&kind===1&&p.unsealed[1]>=2&&
          spend(BigInt(featurePlan.forgePriceYarn)*UNIT,'forge')){
          p.unsealed[1]-=2;unsealedConsumed+=2;p.forgeUses++;p.lifetimeCrafts++;crafts++;
        }
        const eligible=profile==='demo'?(kind===0?p.material:0):p.unsealed[kind];
        // Uptake is assumed willingness; affordability and inventory constrain it separately.
        const uptake=p.type==='bot'&&botsHoard?0:participation==='persistent'?(p.adopts?1:0):currentDemand;
        // A bot declines a seal when its fee alone exceeds the assumed net sale price.
        const desired=p.type==='bot'&&fees[kind]>marketPrice-marketFee?0:eligible*uptake;
        // Behavioral inventory target, not a new protocol/listing cap. A seller
        // does not keep paying to seal unsold inventory forever. Test this
        // assumption separately; more source drops cannot create more utility.
        let attempts=Math.min(21-playerSeals,Math.max(0,sealStockTarget-p.stock-p.relics),Math.floor(desired)+(random()<desired%1?1:0));
        // A separate behavioral sensitivity: a forge-interested person saves
        // the COMPLETE next recipe before self-sealing. This is not a protocol
        // limit, forced purchase or assumption that every user plans this way.
        // Existing pay-as-you-go controls retain their original random stream.
        if(forgePlan?.reserveCompletion&&p.type!=='bot'&&p.adopts&&p.forgeInterest&&p.forgedDesigns<forgePlan.maxDesigns){
          if(kind!==1)attempts=0;
          else {
            const quote=forgePreparation({sealedEpics:p.sealedKinds[1],unsealedEpics:p.unsealed[1],balance:p.balance,sealFee:fees[1]});
            attempts=quote.canComplete&&attempts>=quote.missing?quote.missing:0;
          }
        }
        for(let i=0;i<attempts;i++)if(spend(fees[kind],'seal')){
          p.stock++;p.sealedKinds[kind]++;sealed++;playerSeals++;
          if(profile==='demo')p.material--;else p.unsealed[kind]--;
        }
      }
      if(forgePlan&&p.type!=='bot'&&p.adopts&&p.forgeInterest){
        while(p.forgedDesigns<forgePlan.maxDesigns&&p.sealedKinds[1]>=2){
          if(!spend(FORGE_COST,'forge'))break;
          p.sealedKinds[1]-=2;p.stock-=2;consumed+=2;p.forgedDesigns++;crafts++;p.firstForgeWeek??=week;
        }
      }
      if(forgePlan?.first)buyStyles();
      // These sinks do not exist in the live game. Only the explicitly labelled roadmap uses them.
      const forgeDraw = random(), cosmeticDraw = random();
      if(featurePlan){
        if(wantsRecipe&&featurePlan.input==='sealed'&&p.sealedKinds[1]>=2&&
          spend(BigInt(featurePlan.forgePriceYarn)*UNIT,'forge')){
          p.sealedKinds[1]-=2;p.stock-=2;consumed+=2;p.forgeUses++;p.lifetimeCrafts++;crafts++;
        }
      } else if (profile === 'roadmap' && p.type !== 'bot' && (participation==='opportunities'||p.adopts)) {
        if (forgeDraw < .35 * currentDemand && p.stock >= 2 && p.forgeUses<4 && spend(3n * UNIT, 'forge')) {
          let remaining=2;for(let kind=0;kind<3;kind++){const take=Math.min(remaining,p.sealedKinds[kind]);p.sealedKinds[kind]-=take;remaining-=take;}
          p.stock-=2; consumed+=2;p.forgeUses++;
        }
        if (cosmeticDraw < .05 * currentDemand && !p.renameUsed && spend(2n * UNIT, 'rename')) p.renameUsed=true;
        if (cosmeticDraw >= .05 && cosmeticDraw < .20*currentDemand && p.decorUses<2 && spend(4n * UNIT, 'decor')) p.decorUses++;
        // One purchase decision at season opening, no repeated retries that invent buyers.
        if ((week-1)%13===0 && cosmeticDraw >= .20 && cosmeticDraw < .40*currentDemand && !p.passUsed && spend(12n * UNIT, 'pass')) p.passUsed=true;
      }
    }
    // Scenario sale price defaults to20; never a floor. AVAX cannot burn YARN.
    for (const seller of players) {
      const buyer = buyers[Math.floor(random() * buyers.length)];
      const tradeDraw = random(), venueDraw = random();
      if (!buyer || seller === buyer || seller.stock + seller.relics < 1 || buyer.stock+buyer.relics>=collectionTarget || tradeDraw > .2 * currentDemand || buyer.balance < marketPrice) continue;
      if(forgePlan?.reserveCompletion&&forgePlan.first&&buyer.forgeInterest&&buyer.forgedDesigns<forgePlan.maxDesigns){
        const incomingEpic=seller.stock>0&&seller.sealedKinds.findIndex(n=>n>0)===1?1:0;
        const after=forgePreparation({sealedEpics:buyer.sealedKinds[1]+incomingEpic,unsealedEpics:buyer.unsealed[1],
          balance:buyer.balance-marketPrice,sealFee:sealFees[1]});
        if(after.shortfall>0n)continue; // The same reserved cash cannot also fund a market purchase.
      }
      const fee = venueDraw < paidMarketShare ? marketFee : 0n;
      const burn = fee * 4000n / 10000n;
      buyer.balance -= marketPrice; seller.balance += marketPrice - fee;
      if (seller.stock) {
        const kind=seller.sealedKinds.findIndex(n=>n>0);
        seller.sealedKinds[kind]--;buyer.sealedKinds[kind]++;seller.stock--; buyer.stock++;
      } else {seller.relics--; buyer.relics++;}
      treasury += fee - burn;treasuryRevenue+=fee-burn; burned += burn; saleBurn += burn; weekB += burn; trades++;
      if(seller.type!=='bot'&&buyer.type!=='bot')weekOrganic+=burn;
    }
    const weeklyGrant = week === 1 ? grant : 0n;
    seasonE += weekE + weeklyGrant; seasonB += weekB;eligibleOrganicBurn+=weekOrganic;seasonOrganic+=weekOrganic;
    seasonRoutine+=weekE;
    if(rewardPolicy!=='fixed'){
      assert(seasonRoutine<=announcedSeason,'Season promises stay within closed-burn budget');
      if(rewardPolicy==='treasury-closed')assert.equal(emitted,recycled,'Recycled policy releases no fresh routine tokens');
      else assert(emitted<=eligibleOrganicBurn*BigInt(burnBudgetBps)/10000n,'Routine claims cannot reuse earned burn credit');
    }
    const balances = players.reduce((s, p) => s + p.balance, 0n);
    assert.equal(bossEmitted+rankEmitted+legacyEmitted,emitted,'Reward channel conservation');
    assert.equal(players.reduce((n,p)=>n+p.unsealed.reduce((a,b)=>a+b,0),0),acquired-(profile==='demo'?0:sealed)-unsealedConsumed,'Unsealed source conservation');
    assert(players.every(p=>p.sealedKinds.reduce((a,b)=>a+b,0)===p.stock),'Typed sealed stock conservation');
    if(forgePlan)assert(players.every(p=>p.forgedDesigns<=forgePlan.maxDesigns),'Finite3-design forge');
    if(featurePlan)assert(players.every(p=>p.lifetimeCrafts<=featurePlan.catalogSeasons*featurePlan.recipesPerSeason),'Finite cosmetic catalog');
    assert(players.every(p=>p.stylesBought<=(stylePlan?.maxStyles??0)),'Finite lifetime style purchases');
    assert.equal(treasury+recycled,treasuryRevenue,'Treasury cash cannot be reused');
    assert.equal(balances + treasury + burned, grant + emitted-recycled, 'Player YARN conservation');
    assert(players.every(p => p.balance >= 0n && p.stock >= 0 && p.material >= 0), 'No negative balances');
    assert.equal(players.reduce((s, p) => s + p.stock, 0), sealed - consumed, 'Sealed item conservation');
    assert.equal(players.reduce((s, p) => s + p.relics, 0), profile === 'demo' ? 3 * players.length : 0, 'Relic conservation');
    // Hypothetical maximum allocation unlocks, not measured circulation or contract-enforced vesting.
    const allocation=allocationEnvelope(week);
    assert(grant<=allocation.buckets.testers&&emitted<=allocation.playerBudget,'Claims fit allocation ceilings');
    const external=allocation.nonPlayerUnlocked-grant;
    const reserved = GENESIS - external - grant - emitted+recycled;
    assert(reserved >= 0n, 'Reserved allocation must remain funded');
    assert.equal(external + balances + treasury + reserved + burned, GENESIS, 'Global YARN conservation');
    const perHour = Object.fromEntries(TYPES.map(type => {
      const group = players.filter(p => p.type === type), hours = group.reduce((s, p) => s + p.h, 0);
      return [type, hours ? units(group.reduce((s, p) => s + p.routine, 0n)) / hours : 0];
    }));
    const top = [...players].sort((a, b) => a.rewards === b.rewards ? 0 : a.rewards > b.rewards ? -1 : 1)
      .slice(0, Math.ceil(players.length / 100)).reduce((s, p) => s + p.rewards, 0n);
    const botRewards = players.filter(p => p.type === 'bot').reduce((s, p) => s + p.rewards, 0n);
    rows.push({week, currentDemand, organicBurn:units(weekOrganic), cumulativeOrganicBurn:units(eligibleOrganicBurn),
      seasonCommitted:units(announcedSeason), quotedBoss:earningOpen?(rewardPolicy!=='fixed'?units(announcedBoss):6*entitlementBps/10000):0,
      bossEmission:units(weekBoss), rankEmission:units(weekRank), cumulativeBossEmission:units(bossEmitted), cumulativeRankEmission:units(rankEmitted), rankPending:units(players.reduce((n,p)=>n+p.rankPending,0n)), rankExpired:units(rankExpired), unsealedStock:players.reduce((n,p)=>n+p.unsealed.reduce((a,b)=>a+b,0),0), acquired, shelfOverflow, multiplier: units(multiplier), routineBudget: units(routineBudget(multiplier)),
      emission: units(weekE), burn: units(weekB), testerEmission: units(weeklyGrant), seasonEmission: units(seasonE), seasonBurn: units(seasonB),
      cumulativeEmission: units(emitted), cumulativeBurn: units(burned), inclusiveEmission: units(grant + emitted),
      freshRoutineRelease:units(emitted-recycled),recycledRewards:units(recycled),treasuryRevenue:units(treasuryRevenue),
      inclusiveFreshRelease:units(grant+emitted-recycled),
      burnEmission: Number(burned) / Number(grant + emitted), circulatingScenario: units(external + balances + treasury),
      unlockedExternal: units(external), totalSupply: units(GENESIS - burned), reserved: units(reserved),
      playerCirculating: units(balances), treasury: units(treasury), sealed, consumed, unsealedConsumed, crafts, sealedStock: sealed - consumed,
      freeRelics: profile === 'demo' ? players.length * 3 : 0, sealBurn: units(sealBurn), saleBurn: units(saleBurn),
      stylePurchases:players.reduce((n,p)=>n+p.stylesBought,0),styleBurn:units(featureBurn.style),cosmeticBurn: units(cosmeticBurn), forgeBurn:units(featureBurn.forge),renameBurn:units(featureBurn.rename),decorBurn:units(featureBurn.decor),passBurn:units(featureBurn.pass), trades, yarnPerHour: units(emitted) / players.reduce((s, p) => s + p.h, 0),
      farmerPerHour: perHour.farmer, casualPerHour: perHour.casual, botPerHour: perHour.bot,
      topOnePercent: Number(top) / Number(grant + emitted), botRewardShare: Number(botRewards) / Number(grant + emitted)});
    if (week % 13 === 0) {
      const casualEarnings=players.filter(p=>p.type==='casual').map(p=>units(p.routine-p.seasonStartRoutine)).sort((a,b)=>a-b);
      const closedRows=rows.slice(-13);
      seasons.push({season:week/13,claims:units(seasonE),burn:units(seasonB),organicBurn:units(seasonOrganic),
        routine:closedRows.reduce((n,r)=>n+r.emission,0),burnClaimRatio:seasonE?Number(seasonB)/Number(seasonE):null,
        healthTargetMet:seasonE>0n&&seasonB>=seasonE,activeBurnWeeks:closedRows.filter(r=>r.burn>0).length,
        casualRoutineMedian:casualEarnings.length?casualEarnings[Math.floor((casualEarnings.length-1)/2)]:null,
        nextWeeklyCap:units(routineBudget(controlled?nextMultiplier(multiplier,seasonE,seasonB):multiplier))});
      for(const p of players)p.seasonStartRoutine=p.routine;
      if (controlled) multiplier = nextMultiplier(multiplier, seasonE, seasonB);
      closedOrganicBurn=seasonOrganic;seasonOrganic=0n;
      seasonE = 0n; seasonB = 0n;
      if(profile!=='demo' && rewardSchedule==='season-close'){
        const ranked=[...players].filter(p=>p.rankScore>0).sort((a,b)=>b.rankScore-a.rankScore);
        for(const p of players){rankExpired+=p.rankPending;p.rankPending=0n;}
        const awards=campaign?tiedRankAmounts(ranked.map(p=>p.rankScore),6n*UNIT*BigInt(entitlementBps)/10000n):null;
        ranked.forEach((p,i)=>{p.rankPending=awards?awards[i]:rankEntitlement(i,ranked.length,entitlementBps);});
        for(const p of players){p.rankScore=0;p.forgeUses=0;p.renameUsed=false;p.decorUses=0;p.passUsed=false;}
        rows.at(-1).rankPending=units(players.reduce((n,p)=>n+p.rankPending,0n));
        rows.at(-1).rankExpired=units(rankExpired);
      }
    }
  }
  const affordability=TYPES.map(type=>{
    const ps=players.filter(p=>p.type===type), sorted=ps.map(p=>units(p.routine)).sort((a,b)=>a-b);
    return {type,accounts:ps.length,grants:ps.filter(p=>p.claimedGrant).length,
      routineMedian:sorted.length?sorted[Math.floor((sorted.length-1)/2)]:null,
      features:Object.fromEntries([2,4,10,12,23,30].map(price=>{
        const waits=ps.map(p=>p.affordAt[price]).filter(x=>x!==null).sort((a,b)=>a-b);
        return [price,{reachable:waits.length,share:ps.length?waits.length/ps.length:null,
          reachByWeek:Object.fromEntries([13,26,52,104,260].filter(w=>w<=weeks).map(w=>[w,ps.length?waits.filter(t=>t<=w).length/ps.length:null])),
          medianWeekAmongReachable:waits.length?waits[Math.floor((waits.length-1)/2)]:null}];
      }))};
  });
  const forgeParticipants=players.filter(p=>p.forgeEnrolled);
  const forgeOutcomes={interested:forgeParticipants.length,
    completed:forgeParticipants.filter(p=>p.forgedDesigns>0).length,
    allCompleted:forgeParticipants.filter(p=>p.forgedDesigns===(forgePlan?.maxDesigns??0)).length,
    sealedButNeverForged:forgeParticipants.filter(p=>p.forgedDesigns===0&&p.sealedKinds[1]>0).length,
    nextRecipeUnaffordable:forgeParticipants.filter(p=>p.forgedDesigns<(forgePlan?.maxDesigns??0)&&
      forgePreparation({sealedEpics:p.sealedKinds[1],unsealedEpics:p.unsealed[1],balance:p.balance,sealFee:sealFees[1]}).shortfall>0n).length};
  const forgeTiming=TYPES.map(type=>{
    const ps=forgeParticipants.filter(p=>p.type===type);
    const times=ps.map(p=>p.firstForgeWeek).filter(n=>n!==null).sort((a,b)=>a-b);
    return {type,enrolled:ps.length,completed:times.length,
      byWeek:Object.fromEntries([1,4,13,26,52,260].filter(w=>w<=weeks).map(w=>[w,times.filter(t=>t<=w).length])),
      medianWeekAmongCompleters:times.length?times[Math.floor((times.length-1)/2)]:null};
  });
  return {campaign:campaign?{evidenceHash:campaign.evidenceHash,policy:campaign.policy,tail:campaign.tail,botProfile:campaign.botProfile}:null,sealFeeBps,forgeTiming,name: mix.name, seed:mix.seed, hoursByType:hours, supplySchedule,featurePlan,stylePlan,forgePlan,forgeOutcomes,rewardPolicy,grantPolicy,grantLeakage,botsClaimGrant,botsHoard,burnBudgetBps,earningEndWeek,
    demandShockWeek,demandAfterShock,marketPriceYarn,grantClaims:players.filter(p=>p.claimedGrant).length,budgets,seasons,affordability, profile, controlled, demand, paidMarketShare, entitlementBps, rewardSchedule, participation, collectionTarget, sealStockTarget, weeks, rows};
}

export function summarize(s) {
  const r = s.rows.at(-1);
  return {mix: s.name, seed:s.seed, rewardPolicy:s.rewardPolicy,marketPriceYarn:s.marketPriceYarn,grantPolicy:s.grantPolicy,grantClaims:s.grantClaims,grantLeakage:s.grantLeakage,botsHoard:s.botsHoard,burnBudgetBps:s.burnBudgetBps,rewardSchedule:s.rewardSchedule,earningEndWeek:s.earningEndWeek, participation:s.participation, collectionTarget:s.collectionTarget, sealStockTarget:s.sealStockTarget, profile: s.profile, demand: s.demand, paidMarketShare: s.paidMarketShare,
    entitlementBps: s.entitlementBps, maxEntitlement: 12 * s.entitlementBps / 10000, maxBoss:6*s.entitlementBps/10000, maxRankPerSeason:6*s.entitlementBps/10000,
    emissionBurn: ratio(r.inclusiveEmission, r.cumulativeBurn), routineEmissionBurn: ratio(r.cumulativeEmission, r.cumulativeBurn),
    farmerCasual: ratio(r.farmerPerHour, r.casualPerHour), top1: r.topOnePercent, botShare: r.botRewardShare,
    sealedStock: r.sealedStock, unsealedStock:r.unsealedStock, rankPending:r.rankPending, rankExpired:r.rankExpired, bossEmission:r.cumulativeBossEmission, rankEmission:r.cumulativeRankEmission, finalWeeklyCap: r.routineBudget,
    trades:r.trades, saleBurn:r.saleBurn, sealBurn:r.sealBurn,
    flowPass: r.inclusiveEmission > 0 && r.cumulativeBurn > 0 && r.inclusiveEmission <= 2 * r.cumulativeBurn,
    farmingPass: r.farmerPerHour <= 3 * r.casualPerHour};
}

/** Smaller hypothetical signed entitlements, not a change to the contract cap,
 * tester grant, fees, allocation, supply or default acceptance scenario. */
export function rewardSensitivity(supply = provisionalSupply) {
  const scales = [10000, 7500, 5000, 2500, 1000, 500, 0], demands = [1, .5, .1];
  const rows = demands.flatMap(demand => scales.flatMap(entitlementBps =>
    mixes.map(mix => summarize(simulate(mix, {supply, demand, entitlementBps})))));
  const envelopes = demands.map(demand => {
    const candidates = scales.filter(bps => bps > 0 && rows.filter(r => r.demand === demand && r.entitlementBps === bps)
      .every(r => r.flowPass && r.farmingPass));
    return {demand, largestTestedMaxEntitlement: candidates.length ? 12 * Math.max(...candidates) / 10000 : null};
  });
  return {rows, envelopes};
}

const escape = text => String(text).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const fmt = (n, suffix = '') => n === null ? 'n/a (zero denominator)' : n.toFixed(2) + suffix;
const colors = ['#75dbd0', '#faab72', '#a99eff'];
function chart(scenarios, field, title, target) {
  const max = Math.max(...scenarios.flatMap(s => s.rows.map(r => r[field])), target || 0, .01);
  return `<section><h2>${title}</h2><svg role="img" aria-label="${title}" viewBox="0 0 840 300"><text x="0" y="20" fill="#bac6d6">${max.toLocaleString('en', {maximumFractionDigits: 2})}</text><path d="M60 30V260H810" fill="none" stroke="#67758b"/>${target ? `<path d="M60 ${260 - target / max * 220}H810" stroke="#e8c562" stroke-dasharray="6 6"/><text x="65" y="${252 - target / max * 220}" fill="#e8c562">minimum ${target}</text>` : ''}${scenarios.map((s, i) => `<polyline fill="none" stroke="${colors[i]}" stroke-width="3" points="${s.rows.map((r, j) => `${60 + j * 750 / 51},${260 - r[field] / max * 220}`).join(' ')}"/>`).join('')}<text x="60" y="285" fill="#bac6d6">week 1</text><text x="755" y="285" fill="#bac6d6">week 52</text></svg></section>`;
}

function main() {
  if(process.argv.includes('--v3')){const scenarios=economyV3Scenarios();writeFileSync(resolve(root,'reports/v3-shell/ECONOMY-SIM.json'),JSON.stringify(scenarios,null,2));console.log(JSON.stringify(scenarios.map(x=>({mix:x.mix,demand:x.demand,burnEmission:x.burnEmission,late:x.last13WeeksBurnEmission,starSourceSink:x.starSourceSink}))));return;}
  const supplyPath = process.argv.find(x => x.startsWith('--supply='))?.slice(9);
  const supply = validateSupply(supplyPath ? JSON.parse(readFileSync(supplyPath, 'utf8')) : loadSourceSupply());
  const out = resolve(root, 'docs/chain'); mkdirSync(out, {recursive: true});
  const scenarios = mixes.map(m => simulate(m, {supply}));
  const demo = mixes.map(m => simulate(m, {supply, profile: 'demo'}));
  const roadmap = mixes.map(m => simulate(m, {supply, profile: 'roadmap'}));
  const uncontrolled = mixes.map(m => simulate(m, {supply, controlled: false}));
  const stress = [
    simulate({...mixes[2], name: 'low-demand'}, {supply, demand: .1}),
    simulate({...mixes[2], name: 'zero-demand'}, {supply, demand: 0}),
    simulate({name: 'half-bots', shares: [.2, .1, .2, .5], seed: 43116}, {supply}),
    simulate({...mixes[2], name: 'fee-bypass'}, {supply, paidMarketShare: .2}),
  ];
  const all = [...scenarios, ...demo, ...roadmap, ...uncontrolled, ...stress];
  const sensitivity = rewardSensitivity(supply);
  const summary = all.map(summarize);
  const acceptance = scenarios.every(s => {const r = summarize(s); return r.flowPass && r.farmingPass;});
  const data = {modelVersion: 6, supply, assumptions: {
    cohort: '1000 pre-enrolled accounts; one 20-YARN tester grant each; no growth or attrition',
    demo: 'One Star Thread and three free Relics after fixed boss/pass, no routine reward or future sinks',
    implementedSinks: 'Counterfactual recurring C2 supply/routine issuer; only existing seal and YARN sale burns',
    roadmap: 'Counterfactual plus unshipped forge and cosmetic sinks; not acceptance evidence',
    demand: '90% weekly activity; persistent adopting wallets (not repeated chances for nonadopters); 20% trade chance*demand; price20 YARN; non-bot buyers only, collection target4; sealers stop at6 owned/unsold items (behavioral assumption, not protocol cap). Source stock carried,240 eligible shelf slots, bound shelf occupancy omitted.',
    policy: 'SeasonRewards integer arithmetic; all claims incl tester grants; hypothetical issuer signs min(entitlement, remaining cap). Contract rejects oversized claims.',
    rewardSensitivity: '63 additional fixed-seed runs scale 6-YARN boss and 0/1/2/4/6 closed-season rank. Contract caps/20-YARN grants/fees unchanged. No calibrated setting.',
    rewards:'Weekly boss completion conditioned on active week:50/90/95/95% casual/regular/farmer/bot; 6 YARN. Rank top1/10/25/50% earns6/4/2/1 once per13-week season. Independent uniform weekly rank-score samples; no paid power. Rank claim from prior season paid in current season, priority within12 cap; remainder expires at next close. Fourth rank pending at week52, not silently excluded.',
    unlocks: 'Maximum hypothetical external unlocks, not deployed vesting or observed circulation',
    funding: 'Allocation envelope, not the live 9960-YARN reward pool; demo cohort alone needs 20000 YARN',
    scarcity: '21 seals/week is only an optimistic aggregation of3/day, not a demonstrated daily-feasible path. Source rarity is not scarcity. Stock limits and overflow tracked; no stock valuation.',
    roadmapFeatures:'Forge3+2 items max4/season; rename2 max1; decor4 max2; pass12 max1. Demand draws hypothetical, feature-specific burn columns. Item sink would require audited irrecoverable custody, not NFT totalSupply burn.',
    adversary: 'Bots are wallets, not verified humans; correlated wallet ownership is unmeasured',
  }, acceptance: {standardImplementedSinksPass: acceptance, economicStatus: acceptance ? 'PASS UNDER ASSUMPTIONS ONLY' : 'NOT MET', integrity: 'PASS'},
  summary, scenarios, demo, roadmap, uncontrolled, stress, sensitivity};
  const sensitivityKeys = Object.keys(sensitivity.rows[0]);
  writeFileSync(resolve(out, 'token-reward-sensitivity.csv'), sensitivityKeys.join(',') + '\n'
    + sensitivity.rows.map(row => sensitivityKeys.map(key => row[key] === null ? '' : row[key]).join(',')).join('\n') + '\n');
  for (const s of all) {
    const keys = Object.keys(s.rows[0]);
    const name = `${s.name}-${s.profile}-${s.controlled ? 'controlled' : 'uncontrolled'}`;
    writeFileSync(resolve(out, `token-${name}.csv`), keys.join(',') + '\n' + s.rows.map(r => keys.map(k => r[k]).join(',')).join('\n') + '\n');
  }
  writeFileSync(resolve(out, 'tokenomics.json'), JSON.stringify(data, null, 2) + '\n');
  const table = list => `<div class="table"><table><thead><tr><th>Mix</th><th>Emission / burn¹</th><th>Farmer / casual per hour²</th><th>Bot reward share</th><th>Flow gate</th></tr></thead><tbody>${list.map(s => {const r = summarize(s); return `<tr><td>${escape(s.name)}</td><td>${fmt(r.emissionBurn, '×')}</td><td>${fmt(r.farmerCasual, '×')}</td><td>${fmt(r.botShare * 100, '%')}</td><td>${r.flowPass ? 'PASS assumptions' : 'NOT MET'}</td></tr>`;}).join('')}</tbody></table></div>`;
  const legend = `<p>${mixes.map((s, i) => `<span style="color:${colors[i]}">● ${s.name}</span>`).join(' &nbsp; ')}</p>`;
  const budgetTable = `<section><h2>5. Reward budget sensitivity</h2><p>63 additional 52-week runs scale hypothetical weekly boss and closed-season rank entitlements. Rank is paid from week14,27,40; fourth-season accrual remains pending at week52. The 20-YARN grant, deployed routine ceiling, fees, allocation and conditional source supply stay fixed. The displayed maximum is boss6 + maximum rank6 in a payout week; other weeks request at most6. Casual boss completion is50% per active week; other groups90/95/95%. These probabilities and rank scores are assumptions. These are experiments, not deployed rewards or calibrated recommendations.</p><div class="table"><table><thead><tr><th>Assumed demand</th><th>Maximum YARN / week</th><th>Casual-heavy claims / burn</th><th>Balanced</th><th>Farmer-heavy</th><th>All flow gates</th></tr></thead><tbody>${sensitivity.rows.filter(r => r.mix === mixes[0].name).map(first => {
    const group = sensitivity.rows.filter(r => r.demand === first.demand && r.entitlementBps === first.entitlementBps);
    return `<tr><td>${first.demand * 100}%</td><td>${fmt(first.maxEntitlement)}${first.entitlementBps === 0 ? ' (no routine)' : ''}</td>${group.map(r => `<td>${fmt(r.emissionBurn, '×')}</td>`).join('')}<td>${group.every(r => r.flowPass) ? 'PASS assumptions' : 'NOT MET'}</td></tr>`;
  }).join('')}</tbody></table></div><p>Largest tested nonzero maximum passing both gates in every mix: ${sensitivity.envelopes.map(e => `${e.demand * 100}% demand: ${e.largestTestedMaxEntitlement === null ? 'none' : e.largestTestedMaxEntitlement + ' YARN/week'}`).join('; ')}. This is a finite grid, not an optimized threshold. At 10% demand even zero routine rewards cannot absorb the initial grant sufficiently.</p><p>Neither a smaller signed entitlement nor the season controller creates buyers. E1/E10 motivate this sensitivity; they do not establish its supply or demand coefficients. Default economic acceptance above remains unchanged. <a href="token-reward-sensitivity.csv">Download the complete sensitivity table</a>.</p></section>`;
  const html = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>YARN · evidence and 52-week stress tests</title><style>body{background:#101b2b;color:#eef4ff;font:16px/1.6 system-ui;max-width:1080px;margin:40px auto;padding:0 24px}h1{font-size:clamp(28px,5vw,44px);line-height:1.2}h2{line-height:1.3}table{border-collapse:collapse;width:100%;min-width:650px}td,th{padding:10px;border-bottom:1px solid #34435b;text-align:left}.table{overflow:auto}svg{width:100%;height:auto}a{color:#75dbd0}section{border:1px solid #34435b;border-radius:16px;padding:20px;margin:20px 0}small{color:#bac6d6}.status{color:#ffd29a;font-weight:700}</style><p>FUJI 43113 · Testnet — no real value</p><h1>The demo works. Sustainable demand is unproven.</h1><p class="status">Scenario economic acceptance: ${data.acceptance.economicStatus}. Model accounting checks: PASS.</p><p>52 weeks · 1,000 pre-enrolled accounts · fixed seeds · no growth. Routine issuance and authoritative campaign supply are not shipped. This cohort needs 20,000 YARN for tester grants alone; it is not a forecast for the live reward pool.</p><section><h2>1. Current judge demo only</h2><p>One 20-YARN grant, one Star Thread and three free Relics per account after the starter pass/boss. No recurring reward, Epic issuance, forge or cosmetic burn. Repeated sales still assume buyers; no measured retention or liquidity.</p>${table(demo)}</section><section><h2>2. Proposed routine rewards, implemented sinks</h2><p>Only sealing and YARN market fees burn. Campaign supply is conditional/provisional: ${supply.rarePerActiveWeek} rare + ${supply.epicPerActiveWeek} Epic + ${supply.legendaryPerActiveWeek??0} Legendary per active account/week; per-type rates override these when supplied. Provenance: ${escape(supply.source)}. Default input is the checked source-study artifact, not C2 telemetry. Chapter3 and successful routes are assumed; invitation/craft supply is excluded. <a href="balance-study.html">The 720-run source-derived follow-up</a> replaces unsupported supply and shows persistent low uptake and stock saturation. A 20-YARN sale price and uptake are hypotheses; players can use any price or a fee-free venue.</p>${table(scenarios)}</section><small>¹ All reward claims, including initial grants; not gross token minting. Zero burn is undefined, never a hidden pass. ² Routine reward/hour. Top 1% in CSV/JSON is account reward share including grants, not human ownership concentration.</small>${legend}${chart(scenarios, 'burnEmission', 'Implemented sinks: cumulative burn / all claims', .5)}${chart(scenarios, 'routineBudget', 'Deployed policy: maximum routine YARN per account/week')}${chart(scenarios, 'sealedStock', 'Sealed inventory: no deployed item sink')}${chart(scenarios, 'circulatingScenario', 'Hypothetical maximum unlocks, not measured circulation')}<section><h2>3. Unshipped roadmap sensitivity</h2><p>Add proposed cosmetic forge (3 YARN +2 sealed items, at most4/season), rename2 (once/season), decor4 (twice/season), cosmetic pass12 (once/season). Each burn channel is separate in CSV/JSON; none grants combat power or rewards. These burns must not be counted as current demand. Passing this table would not close the implementation or calibration gap.</p>${table(roadmap)}</section><section><h2>4. Failure and abuse cases</h2><p>Low demand keeps10% of accounts as persistent adopters; half-bots has 50% bot wallets; fee-bypass routes 80% of trades away from V2 fees. Bots can earn/hoard but are not invented cosmetic buyers. Zero-demand stops routine rewards after week 13, while new tester grants remain possible in the actual contract. Wallet caps do not cap rewards per human.</p>${table(stress)}<p>Without policy reductions, routine emission/burn: ${uncontrolled.map(s => `${s.name}: ${fmt(summarize(s).routineEmissionBurn, '×')}`).join('; ')}.</p></section><p>Integer wei accounting matches the deployed reduction formula; the first season includes tester grants. The policy can reduce rewards but cannot create buyers. Distributor burns count on chain, so burn ratios alone do not prove organic demand. Budget reaches zero permanently unless contracts change; a 0.8 healthy boundary does not guarantee the 1.0 target.</p><p><a href="tokenomics.json">All weekly data and assumptions</a> · <a href="../design/chain/TOKENOMICS.md">Design</a> · <a href="../design/chain/TOKENOMICS-RESEARCH.md">Research</a> · <a href="../../reports/chain/TOKENOMICS-AUDIT.md">Audit and decisions</a></p></html>`;
  writeFileSync(resolve(out, 'tokenomics.html'), html.replace('<p>Integer wei accounting', budgetTable + '<p>Integer wei accounting'));
  writeFileSync(resolve(out, 'tokenomics.svg'), chart(scenarios, 'burnEmission', 'Implemented sinks: burn / all claims', .5).match(/<svg[\s\S]*<\/svg>/)[0].replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" style="background:#101b2b" '));
  writeFileSync(resolve(root, 'docs/design/chain/TOKENOMICS-VI.md'), `# YARN — Fuji, không có giá trị thật\n\n1 tỷ YARN tạo một lần; tiền mềm nằm ngoài blockchain.\n\n| Phân bổ | % |\n|---|---:|\n| Người chơi / đội ngũ | 35 / 15 |\n| Kho bạc / nhà đầu tư | 12 / 12 |\n| Hệ sinh thái / thử nghiệm sớm | 10 / 6 |\n| Thanh khoản / cố vấn / dự phòng | 5 / 3 / 2 |\n\nDemo đã chạy trên Fuji: tặng 20 YARN một lần; chưa phát thưởng chiến dịch định kỳ.\nPhí seal 10% giá tham chiếu, đốt toàn bộ; Star Thread tốn 2 YARN.\nPhí bán 5%: 2% giá bán đốt, 3% kho bạc. AVAX không tính là đốt YARN.\nGiá bán tự chọn, không sàn/trần. V1/chuyển trực tiếp có thể bỏ qua phí V2.\nHợp đồng tự giảm trần thưởng mùa sau nếu đốt/phát hành dưới 0,8; tính cả trợ cấp.\nTrần ban đầu 12 YARN/tuần, tổng32 gồm trợ cấp; boss6/tuần, rank tối đa6/mùa là đề xuất chưa bật.\nVesting là lịch dự kiến, chưa được khóa bởi hợp đồng phân phối.\n\n![Đốt/phát hành với nguồn đốt đã có](../../chain/tokenomics.svg)\n\nBa nhóm 1.000 ví, 52 tuần; nhóm nhiều người farm có 20% bot.\nChỉ nguồn đốt đã có: phát hành/đốt ${scenarios.map(s => fmt(summarize(s).emissionBurn)).join(' / ')}; ngưỡng <=2: ${acceptance ? 'đạt theo giả định' : 'CHƯA ĐẠT'}.\nForge/mỹ phẩm chưa triển khai được tách sang kịch bản riêng.\nNguồn cung đo có điều kiện từ luật drop; chưa phải dữ liệu người chơi/C2; [720 lượt với luật drop thật](../../chain/balance-study.html) vẫn chưa chứng minh nhu cầu.\nÍt người mua, 50% bot và bỏ qua phí đều được kiểm tra; không có cam kết thu nhập.\n1.000 trợ cấp cần 20.000 YARN, không phải dự báo cho quỹ demo hiện có.\n[CSV, biểu đồ và giới hạn](../../chain/tokenomics.html) · [Nguồn nghiên cứu](TOKENOMICS-RESEARCH.md).\n`);
  console.log(JSON.stringify({integrity: 'PASS', economicAcceptance: data.acceptance.economicStatus, standard: scenarios.map(summarize), stress: stress.map(summarize), rewardSensitivity: sensitivity.envelopes}, null, 2));
  if (process.argv.includes('--require-sustainability') && !acceptance) process.exitCode = 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
