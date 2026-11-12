// Deterministic sensitivity analysis, not a demand forecast. No network or credentials.
import {mkdirSync, writeFileSync, readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {loadSourceSupply} from './supply-snapshot.mjs';

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
} = {}) {
  validateSupply(supply);
  assert(Number.isInteger(entitlementBps) && entitlementBps >= 0 && entitlementBps <= 10000, 'Invalid entitlement scale');
  assert(['season-close', 'legacy-weekly'].includes(rewardSchedule), 'Invalid reward schedule');
  assert(Number.isInteger(weeks) && weeks >= 1 && weeks <= 53, 'Invalid horizon');
  assert(Number.isFinite(botRankBoost) && botRankBoost >= 1 && botRankBoost <= 10, 'Invalid bot rank boost');
  assert(['persistent','opportunities'].includes(participation), 'Invalid participation model');
  assert(Number.isInteger(collectionTarget) && collectionTarget >= 0 && collectionTarget <= 1000, 'Invalid collection target');
  assert(Number.isInteger(sealStockTarget) && sealStockTarget >= 0 && sealStockTarget <= 1000, 'Invalid seal stock target');
  assert(['demo', 'implemented-sinks', 'roadmap'].includes(profile), 'Invalid profile');
  assert(demand >= 0 && demand <= 1 && paidMarketShare >= 0 && paidMarketShare <= 1, 'Invalid demand');
  assert.equal(mix.shares.length, 4);
  assert(Math.abs(mix.shares.reduce((a, b) => a + b, 0) - 1) < 1e-9);
  const random = rng(mix.seed);
  const players = mix.shares.flatMap((share, type) => Array.from({length: Math.round(share * 1000)}, () => ({
    type: TYPES[type], hours: [3, 10, 30, 70][type],
    requested: BigInt([6, 12, 12, 12][type]) * UNIT * BigInt(entitlementBps) / 10000n,
    balance: 20n * UNIT, rewards: 20n * UNIT, routine: 0n, h: 0, stock: 0,
    unsealed: [0,0,0], rankScore:0, rankPending:0n, adopts:random()<demand,
    rankReceived:0n, bossReceived:0n, forgeUses:0, renameUsed:false, decorUses:0, passUsed:false,
    // Demo cohort assumes all signed up and completed the fixed boss: 2 pass Relics + 1 boss Relic.
    relics: profile === 'demo' ? 3 : 0, material: profile === 'demo' ? 1 : 0,
  })));
  const buyers = players.filter(p => p.type !== 'bot' && (participation==='opportunities'||p.adopts)); // Bots supply; no invented cosmetic buyer utility.
  const grant = BigInt(players.length) * 20n * UNIT;
  let emitted = 0n, burned = 0n, treasury = 0n, seasonE = 0n, seasonB = 0n, multiplier = UNIT;
  let bossEmitted=0n, rankEmitted=0n, rankExpired=0n, acquired=0, shelfOverflow=0, legacyEmitted=0n;
  let sealed = 0, consumed = 0, sealBurn = 0n, saleBurn = 0n, cosmeticBurn = 0n, trades = 0;
  const featureBurn={forge:0n,rename:0n,decor:0n,pass:0n};
  const rows = [];
  for (let week = 1; week <= weeks; week++) {
    let weekE = 0n, weekB = 0n, weekBoss=0n, weekRank=0n;
    for (const p of players) {
      if (random() > .9) continue;
      p.h += p.hours;
      // Assume an authoritative issuer signs only the lesser of the entitlement
      // and remaining cap. The contract reverts an oversized voucher; it never
      // partially pays one. There is no deployed routine issuer yet.
      // Rank is earned from a closed season, then claimed during the next season.
      // A future issuer must sign the CURRENT season and keep the earning season in its ledger.
      // Rank takes priority inside the shared routine cap; unpaid rank stays pending until expiry.
      const bossEligible = random() < ({casual:.5,regular:.9,farmer:.95,bot:.95}[p.type]);
      const bossRequest = bossEligible ? 6n * UNIT * BigInt(entitlementBps) / 10000n : 0n;
      p.rankScore += random() * (p.type === 'bot' ? botRankBoost : 1);
      const rankReward = profile === 'demo' || rewardSchedule === 'legacy-weekly' ? 0n : min(p.rankPending,routineBudget(multiplier));
      const bossReward = profile === 'demo' || rewardSchedule === 'legacy-weekly' ? 0n : min(bossRequest,routineBudget(multiplier)-rankReward);
      const reward = profile === 'demo' ? 0n : rewardSchedule === 'legacy-weekly' ? min(p.requested,routineBudget(multiplier)) : rankReward+bossReward;
      p.rankPending -= rankReward; p.rankReceived += rankReward; p.bossReceived += bossReward;
      rankEmitted+=rankReward; bossEmitted+=bossReward; weekBoss+=bossReward; weekRank+=rankReward;
      if(rewardSchedule === 'legacy-weekly')legacyEmitted+=reward;
      p.balance += reward; p.rewards += reward; p.routine += reward; emitted += reward; weekE += reward;
      const spend = (amount, kind) => {
        if (p.balance < amount) return false;
        p.balance -= amount; burned += amount; weekB += amount;
        if (kind === 'seal') sealBurn += amount; else {cosmeticBurn += amount;featureBurn[kind]+=amount;}
        return true;
      };
      let playerSeals = 0;
      const ratesForType = supply.byType?.[p.type] ?? supply;
      const rates = profile === 'demo' ? [0,0,0] : [ratesForType.rarePerActiveWeek,ratesForType.epicPerActiveWeek,ratesForType.legendaryPerActiveWeek??0];
      const fees = [2n*UNIT,10n*UNIT,30n*UNIT];
      for(let kind=0;kind<3;kind++){
        const rate=rates[kind];
        const offered=Math.floor(rate)+(random()<rate%1?1:0);
        // Upper bound:240 slots available to eligible gear; bound gear occupancy is not modelled.
        const count=Math.min(offered,Math.max(0,240-p.unsealed.reduce((a,b)=>a+b,0)));
        shelfOverflow+=offered-count;
        p.unsealed[kind]+=count;acquired+=count;
        const eligible=profile==='demo'?(kind===0?p.material:0):p.unsealed[kind];
        // Uptake is assumed willingness; affordability and inventory constrain it separately.
        const uptake=participation==='persistent'?(p.adopts?1:0):demand;
        // At the assumed20-YARN resale price, bots never pay30 to seal a Legendary.
        const desired=p.type==='bot'&&fees[kind]>19n*UNIT?0:eligible*uptake;
        // Behavioral inventory target, not a new protocol/listing cap. A seller
        // does not keep paying to seal unsold inventory forever. Test this
        // assumption separately; more source drops cannot create more utility.
        const attempts=Math.min(21-playerSeals,Math.max(0,sealStockTarget-p.stock-p.relics),Math.floor(desired)+(random()<desired%1?1:0));
        for(let i=0;i<attempts;i++)if(spend(fees[kind],'seal')){
          p.stock++;sealed++;playerSeals++;
          if(profile==='demo')p.material--;else p.unsealed[kind]--;
        }
      }
      // These sinks do not exist in the live game. Only the explicitly labelled roadmap uses them.
      const forgeDraw = random(), cosmeticDraw = random();
      if (profile === 'roadmap' && p.type !== 'bot' && (participation==='opportunities'||p.adopts)) {
        if (forgeDraw < .35 * demand && p.stock >= 2 && p.forgeUses<4 && spend(3n * UNIT, 'forge')) {p.stock-=2; consumed+=2;p.forgeUses++;}
        if (cosmeticDraw < .05 * demand && !p.renameUsed && spend(2n * UNIT, 'rename')) p.renameUsed=true;
        if (cosmeticDraw >= .05 && cosmeticDraw < .20*demand && p.decorUses<2 && spend(4n * UNIT, 'decor')) p.decorUses++;
        // One purchase decision at season opening, no repeated retries that invent buyers.
        if ((week-1)%13===0 && cosmeticDraw >= .20 && cosmeticDraw < .40*demand && !p.passUsed && spend(12n * UNIT, 'pass')) p.passUsed=true;
      }
    }
    // Price 20 is a scenario assumption, never a floor. AVAX transfers do not burn YARN.
    for (const seller of players) {
      const buyer = buyers[Math.floor(random() * buyers.length)];
      const tradeDraw = random(), venueDraw = random();
      if (!buyer || seller === buyer || seller.stock + seller.relics < 1 || buyer.stock+buyer.relics>=collectionTarget || tradeDraw > .2 * demand || buyer.balance < 20n * UNIT) continue;
      const fee = venueDraw < paidMarketShare ? UNIT : 0n;
      const burn = fee * 4000n / 10000n;
      buyer.balance -= 20n * UNIT; seller.balance += 20n * UNIT - fee;
      if (seller.stock) {seller.stock--; buyer.stock++;} else {seller.relics--; buyer.relics++;}
      treasury += fee - burn; burned += burn; saleBurn += burn; weekB += burn; trades++;
    }
    const weeklyGrant = week === 1 ? grant : 0n;
    seasonE += weekE + weeklyGrant; seasonB += weekB;
    const balances = players.reduce((s, p) => s + p.balance, 0n);
    assert.equal(bossEmitted+rankEmitted+legacyEmitted,emitted,'Reward channel conservation');
    assert.equal(players.reduce((n,p)=>n+p.unsealed.reduce((a,b)=>a+b,0),0),acquired-(profile==='demo'?0:sealed),'Unsealed source conservation');
    assert.equal(balances + treasury + burned, grant + emitted, 'Player YARN conservation');
    assert(players.every(p => p.balance >= 0n && p.stock >= 0 && p.material >= 0), 'No negative balances');
    assert.equal(players.reduce((s, p) => s + p.stock, 0), sealed - consumed, 'Sealed item conservation');
    assert.equal(players.reduce((s, p) => s + p.relics, 0), profile === 'demo' ? 3 * players.length : 0, 'Relic conservation');
    // Hypothetical maximum allocation unlocks, not measured circulation or contract-enforced vesting.
    const external = 65_000_000n * UNIT - grant + 45_000_000n * UNIT * BigInt(Math.min(week, 26)) / 26n
      + 100_000_000n * UNIT * BigInt(week) / 208n + 2_400_000n * UNIT * BigInt(Math.floor(week / 13))
      + (week >= 26 ? 20_000_000n * UNIT : 0n);
    const reserved = GENESIS - external - grant - emitted;
    assert(reserved >= 0n, 'Reserved allocation must remain funded');
    assert.equal(external + balances + treasury + reserved + burned, GENESIS, 'Global YARN conservation');
    const perHour = Object.fromEntries(TYPES.map(type => {
      const group = players.filter(p => p.type === type), hours = group.reduce((s, p) => s + p.h, 0);
      return [type, hours ? units(group.reduce((s, p) => s + p.routine, 0n)) / hours : 0];
    }));
    const top = [...players].sort((a, b) => a.rewards === b.rewards ? 0 : a.rewards > b.rewards ? -1 : 1)
      .slice(0, Math.ceil(players.length / 100)).reduce((s, p) => s + p.rewards, 0n);
    const botRewards = players.filter(p => p.type === 'bot').reduce((s, p) => s + p.rewards, 0n);
    rows.push({week, bossEmission:units(weekBoss), rankEmission:units(weekRank), cumulativeBossEmission:units(bossEmitted), cumulativeRankEmission:units(rankEmitted), rankPending:units(players.reduce((n,p)=>n+p.rankPending,0n)), rankExpired:units(rankExpired), unsealedStock:players.reduce((n,p)=>n+p.unsealed.reduce((a,b)=>a+b,0),0), acquired, shelfOverflow, multiplier: units(multiplier), routineBudget: units(routineBudget(multiplier)),
      emission: units(weekE), burn: units(weekB), testerEmission: units(weeklyGrant), seasonEmission: units(seasonE), seasonBurn: units(seasonB),
      cumulativeEmission: units(emitted), cumulativeBurn: units(burned), inclusiveEmission: units(grant + emitted),
      burnEmission: Number(burned) / Number(grant + emitted), circulatingScenario: units(external + balances + treasury),
      unlockedExternal: units(external), totalSupply: units(GENESIS - burned), reserved: units(reserved),
      playerCirculating: units(balances), treasury: units(treasury), sealed, consumed, sealedStock: sealed - consumed,
      freeRelics: profile === 'demo' ? players.length * 3 : 0, sealBurn: units(sealBurn), saleBurn: units(saleBurn),
      cosmeticBurn: units(cosmeticBurn), forgeBurn:units(featureBurn.forge),renameBurn:units(featureBurn.rename),decorBurn:units(featureBurn.decor),passBurn:units(featureBurn.pass), trades, yarnPerHour: units(emitted) / players.reduce((s, p) => s + p.h, 0),
      farmerPerHour: perHour.farmer, casualPerHour: perHour.casual, botPerHour: perHour.bot,
      topOnePercent: Number(top) / Number(grant + emitted), botRewardShare: Number(botRewards) / Number(grant + emitted)});
    if (week % 13 === 0) {
      if (controlled) multiplier = nextMultiplier(multiplier, seasonE, seasonB);
      seasonE = 0n; seasonB = 0n;
      if(profile!=='demo' && rewardSchedule==='season-close'){
        const ranked=[...players].filter(p=>p.rankScore>0).sort((a,b)=>b.rankScore-a.rankScore);
        for(const p of players){rankExpired+=p.rankPending;p.rankPending=0n;}
        ranked.forEach((p,i)=>{p.rankPending=rankEntitlement(i,ranked.length,entitlementBps);});
        for(const p of players){p.rankScore=0;p.forgeUses=0;p.renameUsed=false;p.decorUses=0;p.passUsed=false;}
        rows.at(-1).rankPending=units(players.reduce((n,p)=>n+p.rankPending,0n));
        rows.at(-1).rankExpired=units(rankExpired);
      }
    }
  }
  return {name: mix.name, seed:mix.seed, profile, controlled, demand, paidMarketShare, entitlementBps, rewardSchedule, participation, collectionTarget, sealStockTarget, weeks, rows};
}

export function summarize(s) {
  const r = s.rows.at(-1);
  return {mix: s.name, seed:s.seed, rewardSchedule:s.rewardSchedule, participation:s.participation, collectionTarget:s.collectionTarget, sealStockTarget:s.sealStockTarget, profile: s.profile, demand: s.demand, paidMarketShare: s.paidMarketShare,
    entitlementBps: s.entitlementBps, maxEntitlement: 12 * s.entitlementBps / 10000, maxBoss:6*s.entitlementBps/10000, maxRankPerSeason:6*s.entitlementBps/10000,
    emissionBurn: ratio(r.inclusiveEmission, r.cumulativeBurn), routineEmissionBurn: ratio(r.cumulativeEmission, r.cumulativeBurn),
    farmerCasual: ratio(r.farmerPerHour, r.casualPerHour), top1: r.topOnePercent, botShare: r.botRewardShare,
    sealedStock: r.sealedStock, unsealedStock:r.unsealedStock, rankPending:r.rankPending, rankExpired:r.rankExpired, bossEmission:r.cumulativeBossEmission, rankEmission:r.cumulativeRankEmission, finalWeeklyCap: r.routineBudget,
    trades:r.trades, saleBurn:r.saleBurn, sealBurn:r.sealBurn,
    flowPass: r.inclusiveEmission <= 2 * r.cumulativeBurn,
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
  const data = {modelVersion: 5, supply, assumptions: {
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
