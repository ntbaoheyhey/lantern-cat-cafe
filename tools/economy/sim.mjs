#!/usr/bin/env node
// Taskbar Hero economy simulator (52 weeks, seeded, agent-based).
//
// One readable model of the whole loop: battles -> gear drops -> Spool ->
// YARN withdrawals (faucet) -> seal / fusion / studio crafts / market fees (burn),
// plus the studio's revenue lines. Every game number is imported from the live
// rule table `packages/game-rules/src/cardrpg/economy-v3.ts`; behaviour
// assumptions (play time, uptake, prices) are listed in ASSUMPTIONS below and
// printed into the report so a reader can challenge them.
//
// Usage:
//   node tools/economy/sim.mjs                 # write docs/economy/sim-results.{json,md} + chart
//   node tools/economy/sim.mjs --check         # exit 1 if any base-case gate fails
//
// Node 22.18+ (type stripping) is required to import the .ts rule table.
import {writeFileSync, mkdirSync} from 'node:fs';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {ECONOMY_V3 as E, EMISSION_GUARD as G, emissionHeadroom} from '../../packages/game-rules/src/cardrpg/economy-v3.ts';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

// Studio recipe prices (YARN, Star Thread). Mirrors ECONOMY_SINKS in
// economy-sinks-v3.ts; packages/game-rules/src/cardrpg/economy-guard.test.ts asserts they stay equal.
export const SINKS = {
  polish: {yarn: [3, 3], starThread: [1, 1]},
  decor: {yarn: 2, starThread: 1},
  display: {yarn: 2, starThread: 1, maxLevel: 3},
};

// Values fixed by the deployed Fuji contracts (read on 19 Nov 2026).
export const CHAIN = {
  testerGrant: 20, // SeasonRewards.TESTER_GRANT
  baseRoutineCap: 12, // SeasonRewards.BASE_ROUTINE_CAP per wallet per week
  healthThreshold: 0.8, // SeasonRewards.HEALTH_THRESHOLD
  contractSeasonWeeks: 13, // SeasonRewards.SEASON_LENGTH
  marketFee: E.market.feeBp / 10000, // RelicMarketV2.feeBps = 500
  marketBurnShare: 0.4, // RelicMarketV2.BURN_SHARE_BPS = 4000
  dripAvax: 0.05, // guest-drip DRIP_WEI
};

// Behaviour assumptions. These are NOT measured telemetry.
export const ASSUMPTIONS = {
  weeks: 52,
  startAccounts: 1000,
  newAccountsPerWeek: 150,
  testerSlots: 500, // first N wallets receive the one-time 20 YARN tester grant
  deedSupply: E.deed.supply,
  priceEpicYarn: 10, // assumed P2P price of a sealed Epic, YARN-equivalent (Epics are common; scarcity is Star Thread)
  priceRefUsd: 0.05, // reference USD value of 1 YARN for revenue lines only
  avaxUsd: 20,
  yarnListingShare: 0.5, // share of market sales priced in YARN (rest AVAX)
  encounterMix: {battle: 0.78, elite: 0.18, boss: 0.04},
  stampsPerPull: 150, // CARD_RPG_CONFIG.drawCost; 1 Bell = 1 pull
  types: {
    //          days/wk  wins/day  stamps/day  boss/wk  weeks->Lv15  withdraw  fuse  seal  cosmetic  payer  retention(base, weekly decay)
    casual:  {days: 4, wins: 8, stamps: 260, boss: 0.6, lv15: 3, withdraw: 0.3, fuse: 0.5, seal: 0.10, cosmetic: 0.25, payer: 0.03, ret: [0.40, 0.94], hours: 2},
    regular: {days: 6, wins: 16, stamps: 400, boss: 0.9, lv15: 2, withdraw: 0.5, fuse: 0.7, seal: 0.25, cosmetic: 0.45, payer: 0.08, ret: [0.55, 0.96], hours: 6},
    heavy:   {days: 7, wins: 30, stamps: 480, boss: 1.0, lv15: 1, withdraw: 0.7, fuse: 0.9, seal: 0.50, cosmetic: 0.70, payer: 0.20, ret: [0.80, 0.98], hours: 21},
    bot:     {days: 7, wins: 40, stamps: 480, boss: 1.0, lv15: 1, withdraw: 1.0, fuse: 0.0, seal: 0.90, cosmetic: 0.00, payer: 0.00, ret: [1.00, 1.00], hours: 28},
  },
};

export const MIXES = {
  balanced: {casual: 0.35, regular: 0.45, heavy: 0.15, bot: 0.05},
  'casual-heavy': {casual: 0.60, regular: 0.30, heavy: 0.07, bot: 0.03},
  'farmer-heavy': {casual: 0.20, regular: 0.40, heavy: 0.20, bot: 0.20},
};

// Stress cases scale demand (uptake of fusion, seal, cosmetics, paying).
export const SCENARIOS = [
  {id: 'balanced', mix: 'balanced', demand: 1},
  {id: 'casual-heavy', mix: 'casual-heavy', demand: 1},
  {id: 'farmer-heavy', mix: 'farmer-heavy', demand: 1},
  {id: 'half-demand', mix: 'balanced', demand: 0.5},
  {id: 'low-demand', mix: 'balanced', demand: 0.1},
  {id: 'half-bots', mix: 'farmer-heavy', demand: 1, bots: 0.5},
];
export const POLICIES = ['contract-only', 'burn-backed'];

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Exact effective Legendary rate and mean pulls per Legendary for a pity banner. */
export function gachaEffective(odds, soft, hard, stepBp) {
  // Mirrors getBannerOdds(): next pull n (1-based since last Legendary).
  let survive = 1, expected = 0;
  for (let n = 1; n <= hard; n++) {
    const p = n >= hard ? 1 : Math.min(1, (odds.legendary + Math.max(0, n - soft + 1) * stepBp) / 10000);
    expected += n * survive * p;
    survive *= 1 - p;
  }
  return {pullsPerLegendary: expected, effectiveRate: 1 / expected};
}

const SETS_BY_CHAPTER = [3, 6, 8]; // epic sets unlocked in chapters 1..3 (8 sets x 4 slots)

function pickRarity(odds, r) {
  const x = r() * 10000;
  if (x < odds.legendary) return 'legendary';
  if (x < odds.legendary + odds.epic) return 'epic';
  if (x < odds.legendary + odds.epic + odds.rare) return 'rare';
  return 'common';
}

function rankAmounts(scores, maximum) {
  // Same weights as packages/chain/src/rank.ts (ties ignored: scores are continuous here).
  const order = scores.map((s, i) => [s, i]).sort((a, b) => b[0] - a[0]);
  const n = scores.length, out = new Array(n).fill(0);
  order.forEach(([, i], k) => {
    const pos = k + 1;
    const w = pos * 100 <= n ? 6 : pos * 10 <= n ? 4 : pos * 4 <= n ? 2 : pos * 2 <= n ? 1 : 0;
    out[i] = maximum * w / 6;
  });
  return out;
}

export function simulate({mix, demand = 1, bots, policy = 'burn-backed', seed = 20261121, weeks = ASSUMPTIONS.weeks}) {
  const A = ASSUMPTIONS, r = rng(seed);
  const shares = {...MIXES[mix]};
  if (bots !== undefined) { const human = 1 - shares.bot; for (const k of ['casual', 'regular', 'heavy']) shares[k] = shares[k] / human * (1 - bots); shares.bot = bots; }
  const pickType = () => { let x = r(); for (const [k, v] of Object.entries(shares)) { if ((x -= v) < 0) return k; } return 'regular'; };
  const agents = [];
  let deedsIssued = 0, testerGrants = 0;
  const join = week => {
    const type = pickType();
    const a = {type, join: week, spool: 0, yarn: 0, stars: 0, bossSeals: 0, epics: [], sealedOwned: 0, legendaryDay: null,
      payer: false, tailor: {seals: 0, materials: 0, essence: 0}, deed: false, lastWithdraw: -99, skin: false, display: 0, decorSeason: -1, polish: 0, rankScore: 0, activeWeeks: 0, earnedSpool: 0, withdrawn: 0};
    a.payer = r() < A.types[type].payer * demand; // fixed trait: a small share of players ever buy YARN
    if (testerGrants < A.testerSlots) { a.yarn += CHAIN.testerGrant; testerGrants++; a.tester = true; }
    agents.push(a);
  };
  for (let i = 0; i < A.startAccounts; i++) join(0);

  // Ledgers (YARN units). claims = on-chain SeasonRewards emissions.
  const L = {claims: 0, tester: 0, withdrawNet: 0, burnSeal: 0, burnFusion: 0, burnCraft: 0, burnMarket: 0,
    retained: 0, rebate: 0, treasuryYarnSold: 0, marketVolumeYarnEq: 0, treasuryFeeYarnEq: 0, dripAvax: 0,
    requestedNet: 0, deniedByGuard: 0, botNet: 0, sealedStock: 0, sealedTotal: 0, fusedInputs: 0, fusions: 0,
    epicsDropped: 0, legendaryDropped: 0, legendaryTailored: 0, legendaryFused: 0, skins: 0, spoolOutstanding: 0, gachaPulls: 0};
  L.tester = testerGrants * CHAIN.testerGrant; L.claims = L.tester; L.dripAvax = A.startAccounts * CHAIN.dripAvax;
  const weekly = [];
  let multiplier = 1, seasonClaims = L.claims, seasonBurn = 0, contractSeason = 0;

  for (let w = 0; w < weeks; w++) {
    if (w > 0) { for (let i = 0; i < A.newAccountsPerWeek; i++) join(w); L.dripAvax += A.newAccountsPerWeek * CHAIN.dripAvax; }
    const newTester = agents.filter(a => a.join === w && a.tester && w > 0).length * CHAIN.testerGrant;
    L.tester += newTester; L.claims += newTester; seasonClaims += newTester;
    // Contract season roll (13 weeks): controller cuts the routine budget when burn/emission < 0.8.
    const cs = Math.floor(w / CHAIN.contractSeasonWeeks);
    if (cs !== contractSeason) {
      const ratio = seasonClaims ? seasonBurn / seasonClaims : 1;
      if (ratio < CHAIN.healthThreshold) multiplier *= Math.min(CHAIN.healthThreshold, ratio / CHAIN.healthThreshold);
      contractSeason = cs; seasonClaims = 0; seasonBurn = 0;
    }
    const contentSeason = Math.floor(w / (E.season.days / 7));
    let wkBurn = 0, wkClaims = newTester;
    const burn = (k, v) => { L[k] += v; wkBurn += v; seasonBurn += v; };
    const active = [];
    for (const a of agents) {
      const T = A.types[a.type], age = w - a.join;
      if (r() >= T.ret[0] * Math.pow(T.ret[1], age)) continue;
      active.push(a); a.activeWeeks++;
      const chapter = Math.min(3, 1 + Math.floor(a.activeWeeks / 2)), sets = SETS_BY_CHAPTER[chapter - 1];
      // Daily battles and gear drops (E.drops; first E.drops.full eligible wins at full chance, then half until halfUntil).
      for (let d = 0; d < T.days; d++) {
        const attempts = Math.min(T.wins, E.drops.halfUntil);
        for (let i = 0; i < attempts; i++) {
          const mult = i < E.drops.full ? 1 : E.drops.halfBp / 10000;
          const x = r(), kind = x < A.encounterMix.boss ? 'boss' : x < A.encounterMix.boss + A.encounterMix.elite ? 'elite' : 'battle';
          const table = E.drops[kind];
          if (r() * 10000 >= table.chanceBp * mult) continue;
          const rarity = pickRarity(table.odds, r);
          if (rarity === 'epic') { a.epics.push(Math.floor(r() * sets)); L.epicsDropped++; }
          if (rarity === 'legendary') { L.legendaryDropped++; if (a.legendaryDay === null) a.legendaryDay = (a.activeWeeks - 1) * 7 + d + 1; }
        }
        // Bound Legendary tailoring (E.tailoring.legendary): daily boss seal, run materials (<=30/day),
        // essence (2 per rewarded win, 6 rewarded runs/day). No YARN, no NFT: power never needs the token.
        const t = a.tailor, rewarded = Math.min(T.wins, 6);
        if (r() < 0.9) t.seals++;
        t.materials += Math.min(30, rewarded * 7); t.essence += rewarded * 2;
        const need = E.tailoring.legendary;
        if (t.seals >= need.seals && t.materials >= need.materials && t.essence >= need.essence) {
          t.seals -= need.seals; t.materials -= need.materials; t.essence -= need.essence; L.legendaryTailored++;
          if (a.legendaryDay === null) a.legendaryDay = (a.activeWeeks - 1) * 7 + d + 1;
        }
        L.gachaPulls += T.stamps / A.stampsPerPull; // bound Bells only; outputs are soulbound (never sealable)
        a.rankScore += T.wins;
      }
      // Weekly boss credit: Spool + Star Thread (bank cap) + Boss Seal.
      if (r() < T.boss) {
        a.spool += E.rewards.weeklySpool; a.earnedSpool += E.rewards.weeklySpool;
        a.stars += Math.min(E.rewards.weeklyStarThread, Math.max(0, E.rewards.starThreadBankCap - a.stars));
        a.bossSeals++;
      }
      const lv15 = a.activeWeeks >= T.lv15;
      if (lv15 && !a.deed && deedsIssued < A.deedSupply) { a.deed = true; deedsIssued++; }
      const want = p => r() < p * (a.type === 'bot' ? 1 : demand);
      const pay = cost => { // spend wallet YARN; payers buy the shortfall from treasury / LP
        if (a.yarn >= cost) { a.yarn -= cost; return true; }
        if (a.payer) { L.treasuryYarnSold += cost - a.yarn; a.yarn = 0; return true; }
        return false;
      };
      // 1) Fusion: 3 same-set Epics + 1 Star Thread + YARN -> guaranteed Legendary (inputs burned on-chain).
      const counts = {}; for (const s of a.epics) counts[s] = (counts[s] || 0) + 1;
      let fuseSet = Object.keys(counts).find(s => counts[s] >= E.fusion.legendary.count);
      if (fuseSet === undefined && a.type !== 'bot' && demand > 0) { // complete a pair by buying one sealed Epic
        const pair = Object.keys(counts).find(s => counts[s] === E.fusion.legendary.count - 1);
        if (pair !== undefined && L.sealedStock > 0 && want(T.fuse * 0.5) && pay(A.priceEpicYarn * A.yarnListingShare)) {
          L.sealedStock--; a.epics.push(Number(pair)); fuseSet = pair;
          const volume = A.priceEpicYarn; L.marketVolumeYarnEq += volume;
          L.treasuryFeeYarnEq += volume * CHAIN.marketFee * (1 - CHAIN.marketBurnShare);
          burn('burnMarket', volume * A.yarnListingShare * CHAIN.marketFee * CHAIN.marketBurnShare);
        }
      }
      if (fuseSet !== undefined && a.stars >= E.fusion.legendary.starThread && want(T.fuse) && pay(E.fusion.legendary.yarn)) {
        burn('burnFusion', E.fusion.legendary.yarn); a.stars -= E.fusion.legendary.starThread;
        let left = E.fusion.legendary.count; a.epics = a.epics.filter(s => !(String(s) === String(fuseSet) && left-- > 0));
        L.fusions++; L.fusedInputs += E.fusion.legendary.count; L.legendaryFused++;
        if (a.legendaryDay === null) a.legendaryDay = a.activeWeeks * 7;
      }
      // 2) Seal one spare Epic for the P2P market (Lv15, Boss Seal, daily cap, YARN fee burned).
      const spare = a.epics.length - 2;
      if (lv15 && spare > 0 && a.bossSeals >= E.seal.bossSeals && want(T.seal)) {
        const fee = E.seal.reference.epic * E.seal.feeBp / 10000;
        if (pay(fee)) { burn('burnSeal', fee); a.bossSeals -= E.seal.bossSeals; a.epics.shift(); L.sealedStock++; L.sealedTotal++; }
      }
      // 3) Studio crafts with Star Thread left over (guaranteed outputs, partial Spool rebate).
      if (a.stars >= 1 && a.type !== 'bot' && want(T.cosmetic)) {
        let cost = 0;
        if (a.decorSeason !== contentSeason) { cost = SINKS.decor.yarn; }
        else if (a.display < SINKS.display.maxLevel) { cost = SINKS.display.yarn * (a.display + 1); }
        else if (a.polish < 2) { cost = SINKS.polish.yarn[a.polish]; }
        if (cost && pay(cost)) {
          burn('burnCraft', cost); a.stars -= 1;
          if (a.decorSeason !== contentSeason) a.decorSeason = contentSeason; else if (a.display < SINKS.display.maxLevel) a.display++; else a.polish++;
          const rebate = Math.min(cost * E.craft.rebateBp / 10000, E.craft.weeklySpoolCap);
          a.spool += rebate; L.rebate += rebate;
        }
      }
      // 4) Spool-only purchase (in-game, no token emitted).
      if (!a.skin && a.type !== 'bot' && a.spool >= E.spool.skinCost && want(T.cosmetic)) { a.spool -= E.spool.skinCost; a.skin = true; L.skins++; }
      // 5) Withdraw Spool -> YARN (Deed, Lv15, account age, one per cooldown, net cap, controller + guard).
      if (a.deed && lv15 && age * 7 >= E.spool.minAgeDays && w - a.lastWithdraw >= E.spool.cooldownDays / 7 && a.spool > 0 && r() < T.withdraw) {
        const grossCap = E.spool.weeklyNetCap / (1 - E.spool.feeBp / 10000);
        const gross = Math.min(a.spool, grossCap);
        let net = gross * (1 - E.spool.feeBp / 10000);
        net = Math.min(net, CHAIN.baseRoutineCap * multiplier);
        L.requestedNet += net;
        if (policy === 'burn-backed') {
          const room = emissionHeadroom(seasonClaims, seasonBurn); // live rule shared with the server guard
          if (net > room) { L.deniedByGuard += net; net = 0; }
        }
        if (net > 0) {
          const g = net / (1 - E.spool.feeBp / 10000);
          a.spool -= g; L.retained += g - net; a.yarn += net; a.withdrawn += net; a.lastWithdraw = w;
          L.claims += net; L.withdrawNet += net; wkClaims += net; seasonClaims += net;
          if (a.type === 'bot') { L.botNet += net; a.yarn = Math.max(0, a.yarn - net); } // bots dump to LP
        }
      }
    }
    // Content-season rank payout (E.rewards.seasonRankMax, percentile weights).
    if ((w + 1) % (E.season.days / 7) === 0) {
      const ranked = agents.filter(a => a.rankScore > 0), amounts = rankAmounts(ranked.map(a => a.rankScore + r()), E.rewards.seasonRankMax);
      ranked.forEach((a, i) => { a.spool += amounts[i]; a.earnedSpool += amounts[i]; a.rankScore = 0; });
    }
    L.spoolOutstanding = agents.reduce((s, a) => s + a.spool, 0);
    weekly.push({week: w + 1, active: active.length, claims: +L.claims.toFixed(2), burn: +(L.burnSeal + L.burnFusion + L.burnCraft + L.burnMarket).toFixed(2),
      wkClaims: +wkClaims.toFixed(2), wkBurn: +wkBurn.toFixed(2), multiplier: +multiplier.toFixed(4), sealedStock: L.sealedStock, deeds: deedsIssued});
  }

  const burnTotal = L.burnSeal + L.burnFusion + L.burnCraft + L.burnMarket;
  const humans = agents.filter(a => a.type !== 'bot' && a.activeWeeks > 0);
  const byType = {};
  for (const t of Object.keys(A.types)) {
    const g = agents.filter(a => a.type === t && a.activeWeeks >= 8);
    const days = g.map(a => a.legendaryDay ?? Infinity).sort((x, y) => x - y); // players without one count as 'not yet'
    byType[t] = {
      accounts: agents.filter(a => a.type === t).length,
      spoolPerActiveWeek: g.length ? +(g.reduce((s, a) => s + a.earnedSpool / a.activeWeeks, 0) / g.length).toFixed(3) : 0,
      spoolPerHour: g.length ? +(g.reduce((s, a) => s + a.earnedSpool / a.activeWeeks, 0) / g.length / A.types[t].hours).toFixed(4) : 0,
      medianFirstLegendaryDay: days.length && Number.isFinite(days[Math.floor(days.length / 2)]) ? days[Math.floor(days.length / 2)] : null,
      shareWithLegendaryBy8Weeks: g.length ? +(g.filter(a => a.legendaryDay !== null && a.legendaryDay <= 56).length / g.length).toFixed(3) : 0,
    };
  }
  const revenueUsd = {
    treasuryYarnSales: L.treasuryYarnSold * A.priceRefUsd,
    marketFeesTreasury: L.treasuryFeeYarnEq * A.priceRefUsd,
    sponsorGasCost: -L.dripAvax * A.avaxUsd,
  };
  return {
    policy, mix, demand, bots: shares.bot, accounts: agents.length, deeds: deedsIssued,
    ledger: Object.fromEntries(Object.entries(L).map(([k, v]) => [k, +v.toFixed(3)])),
    burnTotal: +burnTotal.toFixed(2),
    burnPerClaim: L.claims ? +(burnTotal / L.claims).toFixed(3) : null,
    routineBurnPerClaim: L.withdrawNet ? +(burnTotal / L.withdrawNet).toFixed(3) : null,
    withdrawFill: L.requestedNet ? +((L.withdrawNet) / L.requestedNet).toFixed(3) : null,
    botShareOfWithdrawals: L.withdrawNet ? +(L.botNet / L.withdrawNet).toFixed(3) : 0,
    heavyCasualWeeklyReward: byType.casual.spoolPerActiveWeek ? +(byType.heavy.spoolPerActiveWeek / byType.casual.spoolPerActiveWeek).toFixed(2) : null,
    fusedPerSealed: L.sealedTotal ? +(L.fusedInputs / L.sealedTotal).toFixed(2) : null,
    byType, revenueUsd: Object.fromEntries(Object.entries(revenueUsd).map(([k, v]) => [k, +v.toFixed(2)])),
    humansEverActive: humans.length, weekly,
  };
}

export const GATES = [
  {id: 'burn>=claims', label: 'Cumulative YARN burned >= all YARN claimed (incl. tester grants)', test: s => s.burnPerClaim >= 1},
  {id: 'fairness', label: 'Heavy player earns <= 3x Spool per week of a casual player', test: s => s.heavyCasualWeeklyReward <= 3},
  {id: 'item-sink', label: 'Fusion consumes >= 0.5 Epic per Epic sealed (no endless NFT pile-up)', test: s => s.fusedPerSealed === null || s.fusedPerSealed >= 0.5},
  {id: 'progress', label: 'Median regular player owns a Legendary between day 7 and day 42', test: s => { const d = s.byType.regular.medianFirstLegendaryDay; return d !== null && d >= 7 && d <= 42; }},
  {id: 'rewards-flow', label: '>= 50% of requested withdrawals are paid (rewards stay real)', test: s => s.withdrawFill === null || s.withdrawFill >= 0.5},
];

export function runAll() {
  const results = [];
  for (const sc of SCENARIOS) for (const policy of POLICIES) {
    const s = simulate({...sc, policy});
    results.push({id: sc.id, ...s, gates: Object.fromEntries(GATES.map(g => [g.id, g.test(s)]))});
  }
  const cat = gachaEffective(E.cat.odds, E.cat.soft, E.cat.hard, E.cat.stepBp);
  const gear = gachaEffective(E.gear.odds, E.gear.soft, E.gear.hard, E.gear.stepBp);
  return {generated: new Date().toISOString().slice(0, 10), assumptions: ASSUMPTIONS, chain: CHAIN, guard: G, gacha: {cat, gear}, results};
}

const pct = x => x === null ? 'n/a' : `${(x * 100).toFixed(0)}%`;
const n = x => x === null ? 'n/a' : Number(x).toLocaleString('en-US', {maximumFractionDigits: 2});

function chart(results) {
  const W = 640, H = 260, P = 40;
  const series = ['contract-only', 'burn-backed'].map(p => results.find(r => r.id === 'balanced' && r.policy === p));
  const max = Math.max(...series.flatMap(s => s.weekly.flatMap(x => [x.claims, x.burn])));
  const x = i => P + i * (W - 2 * P) / 51, y = v => H - P - v / max * (H - 2 * P);
  const line = (s, k, color, dash = '') => `<polyline fill="none" stroke="${color}" stroke-width="2.5" ${dash ? `stroke-dasharray="${dash}"` : ''} points="${s.weekly.map((p, i) => `${x(i).toFixed(1)},${y(p[k]).toFixed(1)}`).join(' ')}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Cumulative YARN claimed vs burned, balanced mix, 52 weeks">
<style>text{font:12px system-ui,sans-serif;fill:#3b2f2a}</style><rect width="${W}" height="${H}" fill="#fff8ef"/>
<line x1="${P}" y1="${H - P}" x2="${W - P}" y2="${H - P}" stroke="#bfae9f"/><line x1="${P}" y1="${P}" x2="${P}" y2="${H - P}" stroke="#bfae9f"/>
${line(series[0], 'claims', '#c0392b', '6 4')}${line(series[1], 'claims', '#c0392b')}${line(series[1], 'burn', '#1e7a5a')}${line(series[0], 'burn', '#1e7a5a', '6 4')}
<text x="${P}" y="${P - 14}">Cumulative YARN, balanced mix (solid = burn-backed guard, dashed = contract only)</text>
<text x="${W - P - 150}" y="${P + 10}" style="fill:#c0392b">claimed (faucet)</text><text x="${W - P - 150}" y="${P + 26}" style="fill:#1e7a5a">burned (sinks)</text>
<text x="${P}" y="${H - P + 16}">week 1</text><text x="${W - P - 40}" y="${H - P + 16}">week 52</text><text x="${P + 4}" y="${P + 4}">${n(max)}</text></svg>\n`;
}

function report(out) {
  const R = out.results, row = s => `| ${s.id} | ${s.policy} | ${n(s.ledger.claims)} | ${n(s.burnTotal)} | **${n(s.burnPerClaim)}** | ${pct(s.withdrawFill)} | ${pct(s.botShareOfWithdrawals)} | ${n(s.fusedPerSealed)} | ${s.byType.regular.medianFirstLegendaryDay ?? 'n/a'} | ${GATES.every(g => s.gates[g.id]) ? 'PASS' : 'FAIL: ' + GATES.filter(g => !s.gates[g.id]).map(g => g.id).join(', ')} |`;
  const base = R.find(s => s.id === 'balanced' && s.policy === 'burn-backed');
  return `# Economy simulation results

Generated by \`node tools/economy/sim.mjs\` on ${out.generated}. Seeded and deterministic: the same command prints the same numbers.
All game numbers come from \`packages/game-rules/src/cardrpg/economy-v3.ts\`; contract numbers from the deployed Fuji contracts.
Behaviour inputs are assumptions (listed at the end), not telemetry. Testnet YARN has no real value.

![Cumulative YARN claimed vs burned](emission-burn.svg)

## Verdict per scenario (52 weeks, ${n(out.assumptions.startAccounts)} starting accounts, +${out.assumptions.newAccountsPerWeek}/week)

| Scenario | Policy | YARN claimed | YARN burned | Burn / claim | Withdraw fill | Bot share | Fused / sealed | Regular: first Legendary (day) | Gates |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
${R.map(row).join('\n')}

*contract-only* = today's deployed SeasonRewards controller alone (12 YARN/wallet/week, auto-cut next 13-week season when burn/emission < 0.8).
*burn-backed* = the same plus the server guard added in this change: a withdrawal is signed only while
\`emittedInSeason + amount <= ${n(out.guard.launchAllowance)} + ${out.guard.backingBp / 100}% x burnedInSeason\` (both read from Fuji).

## Gates

${GATES.map(g => `- **${g.id}**: ${g.label}`).join('\n')}

## Base case detail (balanced mix, burn-backed)

| Flow | YARN |
|---|---:|
| Tester grants (one-time, first ${out.assumptions.testerSlots} wallets) | ${n(base.ledger.tester)} |
| Spool withdrawn to YARN (net) | ${n(base.ledger.withdrawNet)} |
| Withdraw fee retained in the pool (never paid out) | ${n(base.ledger.retained)} |
| Burned: seal fees | ${n(base.ledger.burnSeal)} |
| Burned: Legendary fusion | ${n(base.ledger.burnFusion)} |
| Burned: studio crafts (decor, showcase, polish) | ${n(base.ledger.burnCraft)} |
| Burned: market fee share | ${n(base.ledger.burnMarket)} |
| Bought from treasury / LP by paying players | ${n(base.ledger.treasuryYarnSold)} |
| Spool still held in game (spendable 1:1, not on-chain) | ${n(base.ledger.spoolOutstanding)} |

| Player type | Spool / active week | Spool / hour | Median first Legendary (day) | Has a Legendary by week 8 |
|---|---:|---:|---:|---:|
${Object.entries(base.byType).map(([t, v]) => `| ${t} | ${v.spoolPerActiveWeek} | ${v.spoolPerHour} | ${v.medianFirstLegendaryDay ?? 'n/a'} | ${pct(v.shareWithLegendaryBy8Weeks)} |`).join('\n')}

Items: ${n(base.ledger.epicsDropped)} Epics dropped, ${n(base.ledger.legendaryDropped)} Legendaries dropped, ${n(base.ledger.legendaryTailored)} bound Legendaries tailored without YARN, ${n(base.ledger.legendaryFused)} tradable Legendaries fused, ${n(base.ledger.sealedTotal)} sealed as NFTs, ${n(base.ledger.fusions)} fusions burned ${n(base.ledger.fusedInputs)} Epics, sealed stock left on the market ${n(base.ledger.sealedStock)}.

Gacha (Bells only, outputs soulbound): cat banner Legendary every ${out.gacha.cat.pullsPerLegendary.toFixed(1)} pulls on average (effective ${(out.gacha.cat.effectiveRate * 100).toFixed(2)}%), gear banner every ${out.gacha.gear.pullsPerLegendary.toFixed(1)} pulls (${(out.gacha.gear.effectiveRate * 100).toFixed(2)}%).

Revenue lines, base case, at an assumed reference of $${out.assumptions.priceRefUsd}/YARN and $${out.assumptions.avaxUsd}/AVAX (illustration only):
treasury YARN sales $${n(base.revenueUsd.treasuryYarnSales)}, market fee share $${n(base.revenueUsd.marketFeesTreasury)}, sponsored guest gas $${n(base.revenueUsd.sponsorGasCost)}.

## Assumptions

\`\`\`json
${JSON.stringify(out.assumptions, null, 1)}
\`\`\`
`;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const out = runAll(), dir = resolve(ROOT, 'docs/economy');
  mkdirSync(dir, {recursive: true});
  const slim = {...out, results: out.results.map(({weekly, ...rest}) => ({...rest, weekly: weekly.filter((_, i) => i % 4 === 3 || i === 0)}))};
  writeFileSync(resolve(dir, 'sim-results.json'), JSON.stringify(slim, null, 1) + '\n');
  writeFileSync(resolve(dir, 'SIM-REPORT.md'), report(out));
  writeFileSync(resolve(dir, 'emission-burn.svg'), chart(out.results));
  for (const s of out.results) console.log(`${s.id.padEnd(13)} ${s.policy.padEnd(13)} claims ${n(s.ledger.claims).padStart(9)} burn ${n(s.burnTotal).padStart(9)} ratio ${String(s.burnPerClaim).padStart(6)} fill ${pct(s.withdrawFill).padStart(4)} bots ${pct(s.botShareOfWithdrawals).padStart(4)} fused/sealed ${s.fusedPerSealed} legDay ${s.byType.regular.medianFirstLegendaryDay} ${GATES.filter(g => !s.gates[g.id]).map(g => g.id).join(',') || 'PASS'}`);
  if (process.argv.includes('--check')) {
    const base = out.results.filter(s => s.policy === 'burn-backed' && ['balanced', 'casual-heavy', 'farmer-heavy'].includes(s.id));
    if (base.some(s => GATES.some(g => !s.gates[g.id]))) process.exit(1);
  }
}
