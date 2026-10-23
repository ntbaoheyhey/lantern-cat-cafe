import { CONFIG } from './config';
import { Rng, deriveSeed, type Seed } from './rng';
import type {
  BossEvent,
  BossResult,
  ForgeBlock,
  Gear,
  IdleGains,
  PlayerState,
  Rarity,
  Slot,
} from './types';

const C = CONFIG;

export function gearStat(g: Gear): number {
  const base = C.gear.baseStat[g.slot] * C.gear.rarityMultiplier[g.rarity];
  return base * (1 + C.gear.levelGrowth * (g.level - 1));
}

/** Hero power: base plus the best item of each slot. */
export function heroPower(gear: readonly Gear[]): number {
  const best = new Map<Slot, number>();
  for (const g of gear) best.set(g.slot, Math.max(best.get(g.slot) ?? 0, gearStat(g)));
  let p: number = C.hero.basePower;
  for (const v of best.values()) p += v;
  return p;
}

export function goldPerSecond(power: number): number {
  return C.idle.baseGoldPerSecond + C.idle.goldPerSecondPerPower * Math.max(0, power);
}

export function starterGear(): Gear[] {
  return C.slots.map((slot) => ({ slot, rarity: 'common' as const, level: 1 }));
}

export function newPlayer(): PlayerState {
  return {
    gear: starterGear(),
    gold: 0,
    shards: 0,
    bossKeys: 0,
    bossLevel: 1,
    lastBossKeyDay: -1,
    lastForgeDay: -1,
  };
}

export function upgradeCost(g: Gear): number | null {
  if (g.level >= C.gear.maxLevel) return null;
  return Math.ceil(
    C.gear.upgradeBaseCost *
      Math.pow(C.gear.upgradeCostGrowth, g.level - 1) *
      C.gear.upgradeRarityCostMultiplier[g.rarity],
  );
}

export interface ComputeOptions {
  /** True when the time was spent away: efficiency penalty applies. */
  offline?: boolean;
}

/**
 * Gains for `elapsedSeconds` of idle progress. Time is clamped to the offline
 * cap. One kill per `secondsPerKill`; gear and shards roll per kill.
 * Pure: same (state.gear, state.bossLevel, elapsed, seed, opts) => same result.
 */
export function computeIdleGains(
  state: Pick<PlayerState, 'gear' | 'bossLevel'>,
  elapsedSeconds: number,
  seed: Seed,
  opts: ComputeOptions = {},
): IdleGains {
  const counted = Math.min(Math.max(0, Number.isFinite(elapsedSeconds) ? elapsedSeconds : 0), C.idle.offlineCapSeconds);
  const eff = opts.offline ? C.idle.offlineEfficiency : 1;
  const effective = counted * eff;
  const gold = Math.floor(goldPerSecond(heroPower(state.gear)) * effective);
  const kills = Math.floor(effective / C.idle.secondsPerKill);
  const rng = new Rng(deriveSeed(seed, 1));
  let shards = 0;
  const drops: Gear[] = [];
  for (let i = 0; i < kills; i++) {
    if (rng.chance(C.idle.shardDropChance)) shards += C.idle.shardsPerDrop;
    if (rng.chance(C.idle.gearDropChance)) {
      drops.push({
        slot: C.slots[rng.int(0, C.slots.length - 1)] as Slot,
        rarity: rng.weighted(C.idle.dropRarityWeights, C.rarities),
        level: Math.min(C.gear.maxLevel, Math.max(1, state.bossLevel)),
      });
    }
  }
  drops.sort((a, b) => gearStat(b) - gearStat(a));
  return { gold, shards, drops: drops.slice(0, C.idle.maxDropsPerClaim), countedSeconds: counted };
}

/**
 * Gains for one server claim covering `elapsedSeconds` since the previous claim. The first
 * `idle.onlineWindowSeconds` pay the full rate (an open game claims often); the rest pays
 * `idle.offlineEfficiency`. Total time is capped at `idle.offlineCapSeconds`. The two parts roll
 * with independent seeds derived from `seed`; drops are merged, best first, and capped.
 */
export function computeClaimGains(
  state: Pick<PlayerState, 'gear' | 'bossLevel'>,
  elapsedSeconds: number,
  seed: Seed,
): IdleGains {
  const counted = Math.min(Math.max(0, Number.isFinite(elapsedSeconds) ? elapsedSeconds : 0), C.idle.offlineCapSeconds);
  const online = Math.min(counted, C.idle.onlineWindowSeconds);
  const a = computeIdleGains(state, online, deriveSeed(seed, 10));
  const b = computeIdleGains(state, counted - online, deriveSeed(seed, 11), { offline: true });
  const drops = [...a.drops, ...b.drops].sort((x, y) => gearStat(y) - gearStat(x));
  return {
    gold: a.gold + b.gold,
    shards: a.shards + b.shards,
    drops: drops.slice(0, C.idle.maxDropsPerClaim),
    countedSeconds: counted,
  };
}

export function bossPower(level: number): number {
  const l = Math.min(Math.max(1, Math.floor(level)), C.boss.maxLevel);
  return C.boss.basePower * Math.pow(C.boss.powerGrowth, l - 1);
}

/** Deterministic boss fight, 1 round per second; log is for client animation. */
export function simulateBoss(power: number, bossLevel: number, seed: Seed): BossResult {
  const rng = new Rng(deriveSeed(seed, 2));
  const bp = bossPower(bossLevel);
  const heroMaxHp = Math.round(power * C.hero.hpPerPower);
  const bossMaxHp = Math.round(bp * C.boss.hpPerPower);
  let heroHp = heroMaxHp;
  let bossHp = bossMaxHp;
  const log: BossEvent[] = [];
  let won = false;
  for (let t = 1; t <= C.boss.maxRounds; t++) {
    const crit = rng.chance(C.hero.critChance);
    const dmg = Math.round(power * C.hero.damagePerPower * (crit ? C.hero.critMultiplier : 1));
    bossHp = Math.max(0, bossHp - dmg);
    log.push({ t, type: 'hero_hit', damage: dmg, crit, bossHp });
    if (bossHp === 0) {
      won = true;
      break;
    }
    const spread = 1 + (rng.next() * 2 - 1) * C.boss.damageSpread;
    const bd = Math.round(bp * C.boss.damagePerPower * spread);
    heroHp = Math.max(0, heroHp - bd);
    log.push({ t, type: 'boss_hit', damage: bd, heroHp });
    if (heroHp === 0) break;
  }
  log.push({ t: log.length ? (log[log.length - 1] as BossEvent).t : 0, type: 'end', won });
  return { won, log, bossMaxHp, heroMaxHp };
}

/** Relic rarity odds as probabilities (sum to 1). */
export function relicOdds(): Record<Rarity, number> {
  const total = C.rarities.reduce((s, r) => s + C.relic.rarityOddsBp[r], 0);
  const out = {} as Record<Rarity, number>;
  for (const r of C.rarities) out[r] = C.relic.rarityOddsBp[r] / total;
  return out;
}

export function rollRelicRarity(seed: Seed): Rarity {
  const rng = new Rng(deriveSeed(seed, 3));
  return rng.weighted(C.relic.rarityOddsBp, C.rarities);
}

/** On-chain rarity (uint8): the index of `rarity` in CONFIG.rarities. */
export function rarityIndex(rarity: Rarity): number {
  return C.rarities.indexOf(rarity);
}

/**
 * The RelicNFT token id for a rarity tier. One relicId per tier (common = 1, ...) so a relicId's
 * rarity never changes (docs/contracts.md, rule 1). Server and client must both use this.
 */
export function relicIdFor(rarity: Rarity): number {
  return rarityIndex(rarity) + 1;
}

/** Day index (days reset at midnight UTC+7) for a unix time in seconds. */
export function dayIndex(unixSeconds: number): number {
  return Math.floor((unixSeconds + C.time.dayOffsetSeconds) / C.time.secondsPerDay);
}

export function canClaimBossKey(state: PlayerState, today: number): boolean {
  return state.lastBossKeyDay !== today;
}

/** Null when forging is allowed, otherwise the reason it is blocked. */
export function forgeBlock(state: PlayerState, today: number): ForgeBlock | null {
  if (state.lastForgeDay === today) return 'daily_limit';
  if (state.bossKeys < C.relic.bossKeyCost) return 'no_boss_key';
  if (state.shards < C.relic.shardCost) return 'not_enough_shards';
  return null;
}

export function canForge(state: PlayerState, today: number): boolean {
  return forgeBlock(state, today) === null;
}
