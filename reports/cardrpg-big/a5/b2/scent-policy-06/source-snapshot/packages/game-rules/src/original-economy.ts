import { CONFIG } from './config';

const table = CONFIG.originalEconomy;
export type OriginalStatId = keyof typeof table.stats;
export type OriginalItemId = keyof typeof table.gear.items;
export type OriginalQualityId = keyof typeof table.gear.qualities;
export type OriginalSkillId = keyof typeof table.skills.entries;
export type OriginalStatBonuses = Partial<Record<OriginalStatId, number>>;

function nonnegative(value: number, label: string): number {
  if (!Number.isFinite(value) || value < 0) throw new RangeError(`${label} must be finite and nonnegative`);
  return value;
}

function boundedInteger(value: number, min: number, max: number, label: string): number {
  if (!Number.isInteger(value) || value < min || value > max) throw new RangeError(`${label} is outside the preview range`);
  return value;
}

/**
 * Explicit local opt-in only. No persistence, random drops, purchases or production rule overrides.
 * Backend rollout needs a separate reviewed integration; enabling this factory cannot enable it.
 */
export function createOriginalEconomyPreview({ enabled = CONFIG.features.originalEconomy }: { enabled?: boolean } = {}) {
  if (!enabled) return null;

  function stats(bonuses: OriginalStatBonuses = {}): Record<OriginalStatId, number> {
    return Object.fromEntries(Object.entries(table.stats).map(([id, stat]) => {
      const value = stat.base + nonnegative(bonuses[id as OriginalStatId] ?? 0, id);
      return [id, stat.cap === null ? value : Math.min(value, stat.cap)];
    })) as Record<OriginalStatId, number>;
  }

  function item(id: OriginalItemId, quality: OriginalQualityId, level: number): OriginalStatBonuses {
    boundedInteger(level, 1, table.gear.maxLevel, 'item level');
    const scale = table.gear.qualities[quality].multiplier * (1 + table.gear.levelGrowth * (level - 1));
    // Preserve fractions here; the UI may format them, but the rule never rounds a percentage to zero.
    return Object.fromEntries(Object.entries(table.gear.items[id].stats).map(([stat, base]) => [stat, base * scale]));
  }

  function upgradeCost(quality: OriginalQualityId, fromLevel: number): number | null {
    boundedInteger(fromLevel, 1, table.gear.maxLevel, 'item level');
    if (fromLevel === table.gear.maxLevel) return null;
    return Math.ceil(table.gear.upgradeFish[fromLevel - 1]! * table.gear.qualities[quality].costMultiplier);
  }

  function skillCost(rank: number, characterLevel: number): number | null {
    boundedInteger(rank, 1, table.skills.rankFish.length, 'skill rank');
    boundedInteger(characterLevel, 1, Number.MAX_SAFE_INTEGER, 'character level');
    return characterLevel < table.skills.unlockLevels[rank - 1]! ? null : table.skills.rankFish[rank - 1]!;
  }

  function skill(id: OriginalSkillId, rank: number, bonuses: OriginalStatBonuses = {}) {
    boundedInteger(rank, 1, table.skills.rankFish.length, 'skill rank');
    const entry = table.skills.entries[id];
    const current = stats(bonuses);
    const intervalMs = entry.trigger === 'cooldown'
      ? entry.every
      : entry.every * table.combat.attackIntervalMs / (1 + current.attackSpeed);
    const basis = entry.effect === 'damage' ? current.atk : current.hp;
    const amountPerActivation = basis * entry.perRank[rank - 1]! * entry.hits;
    return { effect: entry.effect, intervalMs, amountPerActivation, amountPerSecond: amountPerActivation * 1000 / intervalMs };
  }

  function rewards(elapsedSeconds: number, { offline = false, bonuses = {} }: { offline?: boolean; bonuses?: OriginalStatBonuses } = {}) {
    nonnegative(elapsedSeconds, 'elapsed seconds');
    const paidSeconds = offline ? Math.min(elapsedSeconds, table.rewards.offlineCapSeconds) * table.rewards.offlineEfficiency : elapsedSeconds;
    const current = stats(bonuses);
    const expectedGear = paidSeconds / table.rewards.killIntervalSeconds * table.rewards.gearDropChance;
    return {
      fish: paidSeconds * table.rewards.fishPerSecond * (1 + current.fishBonus),
      expectedGear,
      gearByQuality: Object.fromEntries(Object.entries(table.gear.qualities).map(([id, quality]) => [id, expectedGear * quality.weightBp / 10000])) as Record<OriginalQualityId, number>,
    };
  }

  function incomingDamage(attack: number, defense: number): number {
    nonnegative(attack, 'attack');
    nonnegative(defense, 'defense');
    return Math.max(table.combat.minDamage, attack * table.combat.defenseScale / (table.combat.defenseScale + defense));
  }

  return { stats, item, upgradeCost, skillCost, skill, rewards, incomingDamage };
}
