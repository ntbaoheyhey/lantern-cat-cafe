import { describe, expect, it } from 'vitest';
import { CHAPTERS, CHESTS, GEAR_RARITY_IDS } from '../content';
import { chestExpectedValues, chestDropRateRows } from '../lootcheck';
import { allChestOdds, chestOdds, exactOdds } from './odds';

const copy = (): typeof CHESTS => JSON.parse(JSON.stringify(CHESTS));

describe('exact chest odds', () => {
  it('covers exactly both chest variants for every chapter', () => {
    expect(Object.keys(allChestOdds())).toEqual(CHAPTERS.flatMap(ch => Object.values(ch.chests)));
    for (const ch of CHAPTERS) {
      expect(chestOdds(ch.chests.firstClear).variant).toBe('firstClear');
      expect(chestOdds(ch.chests.repeat).variant).toBe('repeat');
      expect(chestOdds(ch.chests.firstClear).chapterId).toBe(ch.id);
    }
  });

  it('normalizes actual weights, includes absent rarities and sums exclusive outcomes to 100%', () => {
    for (const chest of Object.values(allChestOdds())) for (const roll of chest.rolls) {
      const root = CHESTS[chest.chestId]!.lines[roll.lineIndex]!;
      const draw = CHESTS[roll.tableId]!.lines[0]!;
      const sum = draw.pick.reduce((s, p) => s + p.weight, 0);
      expect(roll.totalWeight).toBe(sum);
      expect(roll.drop.probability).toBe(root.chance);
      expect(roll.noDrop.probability).toBe(1 - root.chance);
      expect(roll.rarities.map(r => r.rarity)).toEqual(GEAR_RARITY_IDS);
      for (const row of roll.rarities) {
        const weight = draw.pick.filter(p => !('table' in p.value) && p.value.kind === 'gear' && p.value.rarity === row.rarity).reduce((s, p) => s + p.weight, 0);
        expect(row.weight).toBe(weight);
        expect(row.conditional.probability).toBe(weight / sum);
        expect(row.conditional.chancePct).toBe(weight / sum * 100);
        expect(row.perChest.probability).toBe(root.chance * (weight / sum));
        expect(row.perChest.chancePct).toBeCloseTo(root.chance * weight / sum * 100, 12);
        for (const odds of [row.conditional, row.perChest]) {
          expect(odds.oneIn).toBe(odds.probability === 0 ? null : 1 / odds.probability);
        }
      }
      expect(Math.abs(roll.rarities.reduce((s, r) => s + r.conditional.chancePct, 0) - 100)).toBeLessThanOrEqual(1e-9);
      expect(Math.abs(roll.noDrop.chancePct + roll.rarities.reduce((s, r) => s + r.perChest.chancePct, 0) - 100)).toBeLessThanOrEqual(1e-9);
    }
  });

  it('pins independently calculated first/repeat examples and non-100 weight totals', () => {
    const first = chestOdds('chest.ch1.first');
    expect(first.rolls.map(r => r.drop.chancePct)).toEqual([100, 50]);
    expect(first.rolls[0]!.rarities.map(r => r.conditional.chancePct)).toEqual([0, 60, 30, 9, 1]);
    expect(first.rolls[1]!.rarities.find(r => r.rarity === 'legendary')!.perChest).toEqual({ probability: 0.005, chancePct: 0.5, oneIn: 200 });
    const repeat = chestOdds('chest.ch1.repeat');
    expect(repeat.rolls.map(r => r.drop.chancePct)).toEqual([70, 25]);
    expect(repeat.rolls[0]!.rarities.find(r => r.rarity === 'legendary')!.perChest.probability).toBeCloseTo(0.007, 15);
    const later = chestOdds('chest.ch5.first').rolls[0]!;
    expect(later.totalWeight).toBe(92);
    expect(later.rarities.map(r => r.weight)).toEqual([0, 20, 30, 33, 9]);
    expect(later.rarities[4]!.conditional.probability).toBe(9 / 92);
    expect(later.rarities[4]!.conditional.oneIn).toBe(1 / (9 / 92));
  });

  it('agrees with the existing analytic loot engine for every group and rarity', () => {
    const rates = chestDropRateRows();
    for (const chest of Object.values(allChestOdds())) {
      const expected = chestExpectedValues(chest.chestId);
      for (const roll of chest.rolls) for (const row of roll.rarities) {
        expect(row.perChest.probability).toBeCloseTo(expected.gear[roll.group][row.rarity], 14);
        expect(row.perChest.probability).toBeCloseTo(rates.find(r => r.tableId === chest.chestId && r.reward === `${roll.group} gear: ${row.rarity}`)!.dropChance, 14);
      }
      for (const row of chest.atLeastOne) {
        const probabilities = chest.rolls.map(r => r.rarities.find(rarity => rarity.rarity === row.rarity)!.perChest.probability);
        expect(row.odds.probability).toBeCloseTo(1 - probabilities.reduce((miss, p) => miss * (1 - p), 1), 14);
        expect(row.odds.oneIn).toBe(row.odds.probability === 0 ? null : 1 / row.odds.probability);
      }
    }
    expect(chestOdds('chest.ch1.first').atLeastOne.find(r => r.rarity === 'legendary')!.odds.probability).toBeCloseTo(0.01495, 15);
  });

  it('uses changed input weights/chances without cached config or demo values', () => {
    const registry = copy();
    registry['chest.ch1.repeat']!.lines[4]!.chance = 0.2;
    const draw = registry['gear.ch1.repeat.main']!.lines[0]!;
    draw.pick = [{ weight: 2, value: { kind: 'gear', group: 'main', rarity: 'common' } },
      { weight: 3, value: { kind: 'gear', group: 'main', rarity: 'rare' } }];
    const main = chestOdds('chest.ch1.repeat', registry).rolls[0]!;
    expect(main.rarities.map(r => r.conditional.chancePct)).toEqual([40, 0, 60, 0, 0]);
    expect(main.rarities.map(r => r.perChest.probability)).toEqual([0.2 * 0.4, 0, 0.2 * 0.6, 0, 0]);
    expect(main.noDrop.chancePct).toBe(80);
    registry['chest.ch1.repeat']!.lines[4]!.chance = 0;
    expect(chestOdds('chest.ch1.repeat', registry).rolls[0]!.rarities.every(r => r.perChest.oneIn === null)).toBe(true);
  });

  it('rejects malformed and newly unsupported loot shapes instead of inventing odds', () => {
    expect(() => chestOdds('missing')).toThrow('Unknown chapter chest');
    expect(() => chestOdds('toString')).toThrow('Unknown chapter chest');
    const missing = copy(); delete missing['gear.ch1.first.main'];
    expect(() => chestOdds('chest.ch1.first', missing)).toThrow('unknown table');
    const invalid = copy(); invalid['gear.ch1.first.main']!.lines[0]!.pick[0]!.weight = -1;
    expect(() => chestOdds('chest.ch1.first', invalid)).toThrow('positive');
    const count = copy(); count['chest.ch1.first']!.lines[4]!.count = [1, 2];
    expect(() => chestOdds('chest.ch1.first', count)).toThrow('Unsupported gear roll');
    const nested = copy(); nested['gear.ch1.first.main']!.lines[0]!.chance = 0.5;
    expect(() => chestOdds('chest.ch1.first', nested)).toThrow('Unsupported gear table');
    const cycle = copy(); cycle['gear.ch1.first.main']!.lines[0]!.pick[0]!.value = { table: 'chest.ch1.first' };
    expect(() => chestOdds('chest.ch1.first', cycle)).toThrow('cycle');
    const mixed = copy(); mixed['gear.ch1.first.main']!.lines[0]!.pick[0]!.value = { kind: 'fish', amount: 1 };
    expect(() => chestOdds('chest.ch1.first', mixed)).toThrow('Unsupported mixed gear table');
    for (const p of [-1, 1.01, NaN, Infinity]) expect(() => exactOdds(p)).toThrow(RangeError);
    expect(exactOdds(0)).toEqual({ probability: 0, chancePct: 0, oneIn: null });
    expect(exactOdds(1)).toEqual({ probability: 1, chancePct: 100, oneIn: 1 });
  });
});
