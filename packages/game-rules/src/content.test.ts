import { describe, expect, it } from 'vitest';
import { CONFIG, rarityIndex, relicIdFor, type Rarity } from './index';
import { RARITIES, RARITY_IDS, SLOTS, SLOT_IDS, relicIdOf } from './content';

// These values are on Fuji and in the database. Never edit an existing entry; only append.
const PINNED_RARITIES: readonly (readonly [Rarity, number, number])[] = [
  ['common', 0, 1],
  ['rare', 1, 2],
  ['epic', 2, 3],
  ['legendary', 3, 4],
];
const PINNED_SLOTS = ['weapon', 'helm', 'armor', 'ring'];

describe('content registry', () => {
  it('derives CONFIG.slots and CONFIG.rarities unchanged', () => {
    expect(CONFIG.slots).toEqual(['weapon', 'helm', 'armor', 'ring']);
    expect(CONFIG.rarities).toEqual(['common', 'rare', 'epic', 'legendary']);
    expect(CONFIG.slots).toBe(SLOT_IDS);
    expect(CONFIG.rarities).toBe(RARITY_IDS);
  });

  it('keeps pinned rarity ids, on-chain indexes and relicIds (append-only)', () => {
    PINNED_RARITIES.forEach(([rarity, index, relicId]) => {
      expect(rarityIndex(rarity)).toBe(index);
      expect(relicIdFor(rarity)).toBe(relicId);
      expect(relicIdOf(rarity)).toBe(relicId);
    });
    // A new rarity may only be appended: the pinned prefix must be untouched.
    expect(RARITIES.slice(0, PINNED_RARITIES.length).map((r) => [r.id, r.relicId])).toEqual(
      PINNED_RARITIES.map(([id, , relicId]) => [id, relicId]),
    );
    expect(RARITIES.length).toBeGreaterThanOrEqual(PINNED_RARITIES.length);
  });

  it('keeps the slot order and appends only', () => {
    expect(SLOTS.slice(0, PINNED_SLOTS.length).map((s) => s.id)).toEqual(PINNED_SLOTS);
  });

  it('has unique ids and unique positive integer relicIds', () => {
    expect(new Set(RARITIES.map((r) => r.id)).size).toBe(RARITIES.length);
    expect(new Set(SLOTS.map((s) => s.id)).size).toBe(SLOTS.length);
    const ids = RARITIES.map((r) => r.relicId);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(Number.isInteger(id) && id > 0).toBe(true);
  });

  it('has a row for every rarity and slot in each per-content table', () => {
    for (const r of RARITY_IDS) {
      expect(CONFIG.gear.rarityMultiplier[r]).toBeGreaterThan(0);
      expect(CONFIG.gear.upgradeRarityCostMultiplier[r]).toBeGreaterThan(0);
      expect(CONFIG.idle.dropRarityWeights[r]).toBeGreaterThanOrEqual(0);
      expect(CONFIG.relic.rarityOddsBp[r]).toBeGreaterThanOrEqual(0);
    }
    for (const s of SLOT_IDS) expect(CONFIG.gear.baseStat[s]).toBeGreaterThan(0);
  });

  it('throws for an unknown rarity', () => {
    expect(() => relicIdOf('mythic' as Rarity)).toThrow(/Unknown rarity/);
  });
});
