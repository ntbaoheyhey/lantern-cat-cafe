import { describe, expect, it } from 'vitest';
import { CONFIG } from './config';
import { createOriginalEconomyPreview, type OriginalItemId, type OriginalQualityId, type OriginalSkillId } from './original-economy';
import { STAT_IDS } from './v2/content/stats';
import { GEAR_SLOT_IDS } from './v2/content/slots';
import { WEAPON_TYPE_IDS } from './v2/content/classes';
import { GEAR_RARITY_IDS } from './v2/content/rarities';

const table = CONFIG.originalEconomy;
const preview = createOriginalEconomyPreview({ enabled: true })!;
const qualities = Object.keys(table.gear.qualities) as OriginalQualityId[];
const items = Object.keys(table.gear.items) as OriginalItemId[];
const skills = Object.keys(table.skills.entries) as OriginalSkillId[];

describe('ORIG1 isolation and content', () => {
  it('requires explicit local opt-in and leaves disabled callers without a rules API', () => {
    expect(CONFIG.features.originalEconomy).toBe(false);
    expect(createOriginalEconomyPreview()).toBeNull();
    expect(createOriginalEconomyPreview({})).toBeNull();
    expect(createOriginalEconomyPreview({ enabled: false })).toBeNull();
    expect(preview).not.toBeNull();
  });

  it('covers every existing stat, slot, quality and weapon family without changing stored IDs', () => {
    expect(Object.keys(table.stats).sort()).toEqual([...STAT_IDS].sort());
    expect(qualities).toEqual(GEAR_RARITY_IDS);
    expect(new Set(Object.values(table.gear.items).map(item => item.slot))).toEqual(new Set(GEAR_SLOT_IDS));
    expect(Object.values(table.gear.items).flatMap(item => 'weaponType' in item ? [item.weaponType] : []).sort()).toEqual([...WEAPON_TYPE_IDS].sort());
    expect(Object.values(table.skills.entries).map(skill => skill.weaponType).sort()).toEqual([...WEAPON_TYPE_IDS].sort());
  });

  it('has unique authored labels and descriptions on every player-facing entry', () => {
    const entries = [...Object.values(table.stats), ...Object.values(table.gear.items), ...Object.values(table.skills.entries)];
    expect(new Set(entries.map(entry => entry.name)).size).toBe(entries.length);
    for (const entry of entries) expect(entry.description.length).toBeGreaterThan(25);
    for (const item of Object.values(table.gear.items)) {
      for (const [id, value] of Object.entries(item.stats)) {
        expect(STAT_IDS).toContain(id);
        expect(value).toBeGreaterThan(0);
        expect(Number.isFinite(value)).toBe(true);
      }
    }
  });
});

describe('ORIG1 stat and item arithmetic', () => {
  it('adds flats and fractions in their own units, then clamps fractional stats', () => {
    const actual = preview.stats({ hp: 22, atk: 7, critChance: 0.014, attackSpeed: 5, hpRegen: 1, critDamage: 3 });
    expect(actual.hp).toBe(138);
    expect(actual.atk).toBe(19);
    expect(actual.critChance).toBeCloseTo(0.049);
    expect(actual.attackSpeed).toBe(0.65);
    expect(actual.hpRegen).toBe(0.012);
    expect(actual.critDamage).toBe(1.1);
    const base = preview.stats();
    expect(base.atk * (1 + base.critChance * base.critDamage)).toBeCloseTo(12.231);
  });

  it('keeps every declared cap finite, above its base, and probability caps below one', () => {
    for (const [id, stat] of Object.entries(table.stats)) {
      expect(stat.base).toBeGreaterThanOrEqual(0);
      if (stat.cap !== null) {
        expect(Number.isFinite(stat.cap)).toBe(true);
        expect(stat.cap).toBeGreaterThanOrEqual(stat.base);
        expect(preview.stats({ [id]: 10000 })[id as keyof typeof table.stats]).toBe(stat.cap);
      }
      if (stat.unit === 'probability') expect(stat.cap).toBeLessThan(1);
    }
  });

  it('uses diminishing mitigation with a damage floor, rather than treating rating as a percent', () => {
    expect(preview.incomingDamage(20, 0)).toBe(20);
    expect(preview.incomingDamage(20, 90)).toBe(10);
    expect(preview.incomingDamage(20, 180)).toBeCloseTo(20 / 3);
    expect(preview.incomingDamage(20, 10000)).toBe(1);
  });

  it('scales gear once, preserves tiny accessory fractions, and never mutates templates', () => {
    const actual = preview.item('seamblade', 'rare', 6);
    expect(actual.atk).toBeCloseTo(13.566);
    expect(preview.item('purrcharm', 'common', 1).hpRegen).toBe(0.0015);
    expect(preview.item('purrcharm', 'legendary', 6).hpRegen).toBeCloseTo(0.004685625);
    actual.atk = 999;
    expect(preview.item('seamblade', 'common', 1).atk).toBe(7);
  });

  it('increases each item with level and quality without exceeding a 3.2x top-item budget', () => {
    for (const id of items) {
      for (const [stat, base] of Object.entries(table.gear.items[id].stats)) {
        let previous = 0;
        for (const quality of qualities) {
          for (let level = 1; level <= table.gear.maxLevel; level++) {
            const value = preview.item(id, quality, level)[stat as keyof typeof table.stats]!;
            expect(value).toBeGreaterThanOrEqual(base);
            expect(value / base).toBeLessThan(3.2);
            if (level > 1) expect(value).toBeGreaterThan(preview.item(id, quality, level - 1)[stat as keyof typeof table.stats]!);
          }
          const value = preview.item(id, quality, 1)[stat as keyof typeof table.stats]!;
          expect(value).toBeGreaterThan(previous);
          previous = value;
        }
      }
    }
  });
});

describe('ORIG1 fish and loot budgets', () => {
  it('affords an upgrade plus the first skill in 90–120 seconds of the early benchmark', () => {
    const cost = preview.upgradeCost('common', 1)! + preview.skillCost(1, 2)!;
    const seconds = cost / table.rewards.fishPerSecond;
    expect(cost).toBe(42);
    expect(seconds).toBeGreaterThanOrEqual(90);
    expect(seconds).toBeLessThanOrEqual(120);
    expect(preview.rewards(seconds).fish).toBeCloseTo(cost);
  });

  it('prices a fully upgraded common item at 10–14 minutes and scales rare costs with one ceiling', () => {
    let total = 0;
    for (let level = 1; level < table.gear.maxLevel; level++) total += preview.upgradeCost('common', level)!;
    expect(total).toBe(293);
    expect(total / table.rewards.fishPerSecond / 60).toBeGreaterThan(10);
    expect(total / table.rewards.fishPerSecond / 60).toBeLessThan(14);
    expect(preview.upgradeCost('rare', 1)).toBe(27);
    for (const quality of qualities) {
      expect(preview.upgradeCost(quality, 6)).toBeNull();
      let previous = 0;
      for (let level = 1; level < 6; level++) {
        const cost = preview.upgradeCost(quality, level)!;
        expect(Number.isInteger(cost)).toBe(true);
        expect(cost).toBeGreaterThan(previous);
        previous = cost;
      }
    }
  });

  it('separates rank gates from incremental prices and budgets all three ranks below nine minutes', () => {
    expect(preview.skillCost(1, 1)).toBeNull();
    expect(preview.skillCost(1, 2)).toBe(24);
    expect(preview.skillCost(2, 4)).toBeNull();
    expect(preview.skillCost(2, 5)).toBe(58);
    expect(preview.skillCost(3, 8)).toBeNull();
    expect(preview.skillCost(3, 9)).toBe(126);
    expect(table.skills.rankFish.reduce((sum, cost) => sum + cost, 0) / table.rewards.fishPerSecond / 60).toBeLessThan(9);
  });

  it('conserves conditional weights and keeps the ten-minute gear yield modest', () => {
    expect(Object.values(table.gear.qualities).reduce((sum, q) => sum + q.weightBp, 0)).toBe(10000);
    const result = preview.rewards(600);
    expect(result.fish).toBe(252);
    expect(result.expectedGear).toBeCloseTo(2.8);
    expect(result.gearByQuality.common).toBeCloseTo(1.75);
    expect(result.gearByQuality.legendary).toBeCloseTo(0.0112);
    expect(Object.values(result.gearByQuality).reduce((a, b) => a + b, 0)).toBeCloseTo(result.expectedGear);
    expect(result.gearByQuality.legendary / 100).toBeCloseTo(0.000112);
  });

  it('caps offline duration before efficiency and prevents bonus scaling from changing quality odds', () => {
    const cap = preview.rewards(21600, { offline: true });
    expect(preview.rewards(86400, { offline: true })).toEqual(cap);
    expect(cap.fish).toBeCloseTo(4989.6);
    expect(cap.expectedGear).toBeCloseTo(55.44);
    const bonus = preview.rewards(600, { bonuses: { fishBonus: 5, materialFind: 5 } });
    expect(bonus.fish).toBeCloseTo(312.48);
    expect(bonus.gearByQuality).toEqual(preview.rewards(600).gearByQuality);
    expect(preview.rewards(0).fish).toBe(0);
    expect(preview.rewards(0).expectedGear).toBe(0);
  });
});

describe('ORIG1 skill timing and input boundaries', () => {
  it('speeds attack triggers while leaving elapsed cooldowns alone', () => {
    expect(preview.skill('kettlepulse', 1).intervalMs).toBe(8750);
    expect(preview.skill('kettlepulse', 1, { attackSpeed: 0.4 }).intervalMs).toBe(6250);
    expect(preview.skill('seamsweep', 1, { attackSpeed: 0.4 }).intervalMs).toBe(9000);
    expect(preview.skill('hempair', 3).amountPerActivation).toBeCloseTo(19.68);
    expect(preview.skill('mossparcel', 3).amountPerActivation).toBeCloseTo(12.76);
  });

  it('keeps damage skills below 30% extra basic DPS and recovery below 1% HP/second at every rank', () => {
    for (const id of skills) {
      let previous = 0;
      for (let rank = 1; rank <= 3; rank++) {
        const result = preview.skill(id, rank);
        expect(result.amountPerSecond).toBeGreaterThan(previous);
        previous = result.amountPerSecond;
        if (result.effect === 'damage') expect(result.amountPerSecond / (12 / 1.25)).toBeLessThan(0.3);
        else expect(result.amountPerSecond / 116).toBeLessThan(0.01);
      }
    }
  });

  it.each([-1, NaN, Infinity])('rejects invalid numeric inputs: %s', value => {
    expect(() => preview.rewards(value)).toThrow(RangeError);
    expect(() => preview.stats({ atk: value })).toThrow(RangeError);
    expect(() => preview.incomingDamage(value, 0)).toThrow(RangeError);
    expect(() => preview.incomingDamage(1, value)).toThrow(RangeError);
  });

  it.each([0, 1.5, 7, NaN, Infinity])('rejects invalid item levels: %s', level => {
    expect(() => preview.item('seamblade', 'common', level)).toThrow(RangeError);
    expect(() => preview.upgradeCost('common', level)).toThrow(RangeError);
  });

  it.each([0, 1.5, 4, NaN, Infinity])('rejects invalid skill ranks: %s', rank => {
    expect(() => preview.skill('seamsweep', rank)).toThrow(RangeError);
    expect(() => preview.skillCost(rank, 9)).toThrow(RangeError);
  });
});
