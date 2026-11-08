import { describe, expect, it } from 'vitest';
import { CONFIG } from './config';
import { RARITIES, RARITY_IDS, SLOT_IDS, relicIdOf } from './content';
import { deriveSeed, Rng } from './rng';
import {
  goldPerSecond,
  heroPower,
  rarityIndex,
  relicIdFor,
  relicOdds,
  rollRelicRarity,
  simulateBoss,
  upgradeCost,
} from './rules';
import type { Gear } from './types';

const CASES = 500;
const SEED = 0x746268;

function forCases(salt: number, check: (rng: Rng, seed: number) => void): void {
  for (let i = 0; i < CASES; i++) {
    const seed = deriveSeed(deriveSeed(SEED, salt), i);
    try {
      check(new Rng(seed), seed);
    } catch (cause) {
      throw new Error(`Property ${salt}, case ${i}, seed ${seed}`, { cause });
    }
  }
}

function randomGear(rng: Rng): Gear[] {
  return SLOT_IDS.map((slot) => ({
    slot,
    rarity: RARITY_IDS[rng.int(0, RARITY_IDS.length - 1)]!,
    level: rng.int(1, CONFIG.gear.maxLevel),
  }));
}

describe('seeded game-rule properties', () => {
  it('hero power never decreases when an equipped item level rises', () => {
    forCases(1, (rng) => {
      const gear = randomGear(rng);
      const index = rng.int(0, gear.length - 1);
      const item = { ...gear[index]!, level: rng.int(1, CONFIG.gear.maxLevel - 1) };
      gear[index] = item;
      const upgraded = gear.map((g, i) =>
        i === index ? { ...g, level: rng.int(item.level + 1, CONFIG.gear.maxLevel) } : g,
      );
      expect(heroPower(upgraded)).toBeGreaterThanOrEqual(heroPower(gear));
    });
  });

  it('hero power never decreases when an equipped item rarity rises', () => {
    forCases(2, (rng) => {
      const gear = randomGear(rng);
      const index = rng.int(0, gear.length - 1);
      const tier = rng.int(0, RARITY_IDS.length - 2);
      gear[index] = { ...gear[index]!, rarity: RARITY_IDS[tier]! };
      const upgraded = gear.map((g, i) =>
        i === index
          ? { ...g, rarity: RARITY_IDS[rng.int(tier + 1, RARITY_IDS.length - 1)]! }
          : g,
      );
      expect(heroPower(upgraded)).toBeGreaterThanOrEqual(heroPower(gear));
    });
  });

  it('upgrade cost strictly increases between purchasable levels', () => {
    forCases(3, (rng) => {
      const gear = randomGear(rng)[rng.int(0, SLOT_IDS.length - 1)]!;
      const level = rng.int(1, CONFIG.gear.maxLevel - 2);
      const lower = upgradeCost({ ...gear, level });
      const higher = upgradeCost({ ...gear, level: level + 1 });
      // At maxLevel there is no upgrade to buy, rather than a numeric cost.
      expect(lower).not.toBeNull();
      expect(higher).not.toBeNull();
      expect(higher!).toBeGreaterThan(lower!);
      expect(upgradeCost({ ...gear, level: CONFIG.gear.maxLevel })).toBeNull();
    });
  });

  it('boss simulation returns identical outcomes and logs for the same seed', () => {
    forCases(4, (rng, seed) => {
      const power = heroPower(randomGear(rng));
      const level = rng.int(1, CONFIG.boss.maxLevel);
      const result = simulateBoss(power, level, seed);
      // Interleave another simulation to catch accidental shared RNG state.
      simulateBoss(power, level, deriveSeed(seed, 1));
      expect(simulateBoss(power, level, seed)).toEqual(result);
    });
  });

  it('forge odds are valid probabilities summing to one and cover every roll', () => {
    forCases(5, (_rng, seed) => {
      const odds = relicOdds();
      expect(Object.keys(odds).sort()).toEqual([...RARITY_IDS].sort());
      for (const probability of Object.values(odds)) {
        expect(Number.isFinite(probability)).toBe(true);
        expect(probability).toBeGreaterThanOrEqual(0);
        expect(probability).toBeLessThanOrEqual(1);
      }
      expect(Object.values(odds).reduce((sum, probability) => sum + probability, 0)).toBeCloseTo(
        1,
        12,
      );
      expect(Object.values(CONFIG.relic.rarityOddsBp).reduce((sum, bp) => sum + bp, 0)).toBe(10000);
      expect(odds[rollRelicRarity(seed)]).toBeGreaterThan(0);
    });
  });

  it('gold per second never decreases as power rises, including across zero', () => {
    forCases(6, (rng) => {
      const lower = rng.int(-1_000_000, 1_000_000) + rng.next();
      const higher = lower + rng.next() * 1_000_000;
      expect(goldPerSecond(higher)).toBeGreaterThanOrEqual(goldPerSecond(lower));
      expect(goldPerSecond(-rng.next() * 1_000_000)).toBeLessThanOrEqual(
        goldPerSecond(rng.next() * 1_000_000),
      );
    });
  });

  it('rarities preserve the append-only prefix and pinned token ids 1..4', () => {
    // This literal prefix is the compatibility contract, independent of CONFIG.
    const pinned = [
      { id: 'common', relicId: 1 },
      { id: 'rare', relicId: 2 },
      { id: 'epic', relicId: 3 },
      { id: 'legendary', relicId: 4 },
    ] as const;
    forCases(7, (rng) => {
      expect(RARITIES.slice(0, pinned.length)).toEqual(pinned);
      expect(RARITIES.length).toBeGreaterThanOrEqual(pinned.length);
      expect(new Set(RARITIES.map((r) => r.id)).size).toBe(RARITIES.length);
      expect(new Set(RARITIES.map((r) => r.relicId)).size).toBe(RARITIES.length);
      const index = rng.int(0, pinned.length - 1);
      const { id, relicId } = pinned[index]!;
      expect(RARITY_IDS[index]).toBe(id);
      expect(rarityIndex(id)).toBe(index);
      expect(relicIdOf(id)).toBe(relicId);
      expect(relicIdFor(id)).toBe(relicId);
      for (const appended of RARITIES.slice(pinned.length)) {
        expect(Number.isInteger(appended.relicId)).toBe(true);
        expect(appended.relicId).toBeGreaterThan(pinned.length);
      }
    });
  });
});
