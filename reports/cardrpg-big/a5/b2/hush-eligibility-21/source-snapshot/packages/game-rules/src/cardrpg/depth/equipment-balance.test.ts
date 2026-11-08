import { expect, it } from 'vitest';
import { EQUIPMENT_SLOTS, RARITY_ORDER } from '../contract';
import { clone } from '../internal';
import { AFFIXES, AFFIX_BY_ID, depthStats, equipmentEffects, GEAR, gearAffixRoll, makeGear, SETS } from './equipment';
import { exportSave, importSave } from './save';
import { battleCats, createDepthAccount } from './state';
import type { DepthAccount } from './contract';

function teamPower(state: DepthAccount) {
  return state.team.reduce((total, id) => {
    const stats = depthStats(state, id);
    return total + Math.round(stats.hp / 5 + stats.attack * 2 + stats.defense * 1.5);
  }, 0);
}

it('keeps every main-stat rarity band increasing in all eight sets and four slots', () => {
  for (const set of SETS) for (const slot of EQUIPMENT_SLOTS) {
    const values = RARITY_ORDER.map(rarity => GEAR.find(item =>
      item.setId === set.id && item.slot === slot && item.rarity === rarity)!.value);
    for (let index = 1; index < values.length; index++) {
      expect(values[index]).toBeGreaterThan(values[index - 1]!);
    }
  }
});

it.each(GEAR.filter(template => template.rarity === 'legendary'))(
  '$id contributes at most 10% of bare starter team power even at maximum rolls and enhancement', template => {
    const weights: Record<string, number> = { hp: .2, attack: 2, defense: 1.5 };
    for (const id of ['mochi', 'soot', 'clover']) for (const enhancement of [0, 12]) {
      const state = createDepthAccount(101);
      state.gear = [];
      state.equipment = {};
      const before = teamPower(state);
      const item = makeGear(state, template.id, 101);
      const compatible = AFFIXES.filter(affix => affix.slots.includes(template.slot));
      const score = (affix: typeof AFFIXES[number]) =>
        (weights[affix.stat] ?? 0) * affix.tiers[item.tier - 1]![1];
      const strongest = compatible.sort((left, right) => score(right) - score(left))
        .slice(0, item.affixes.length);
      item.affixes = strongest.map(affix => affix.id);
      // Old saves can hold larger pre-balance rolls. The effective range must
      // also bound those items when battle stats are read.
      item.rolls = Object.fromEntries(strongest.map(affix =>
        [affix.id, affix.tiers[item.tier - 1]![1] * 4]));
      item.enhancement = enhancement;
      state.gear.push(item);
      state.equipment[id] = { [template.slot]: item.id };
      const after = teamPower(state);
      expect((after - before) / after).toBeLessThanOrEqual(.1);
    }
  },
);

it('reads and displays old saved affix rolls within current bounds without rewriting the save', () => {
  const state = createDepthAccount(11);
  const item = makeGear(state, 'hearthloom-relic-legendary', 11);
  item.affixes = ['affix-hp'];
  item.rolls = { 'affix-hp': 54 };
  state.gear.push(item);
  state.equipment.mochi!.relic = item.id;
  const before = clone(state);
  const restored = importSave(exportSave(state));
  const restoredItem = restored.gear.find(gear => gear.id === item.id)!;
  expect(restoredItem.rolls['affix-hp']).toBe(54);
  expect(gearAffixRoll(restoredItem, 'affix-hp')).toBe(14);
  expect(equipmentEffects(restored, 'mochi').bonuses.hp).toBe(14);
  expect(battleCats(restored)[0]!.stats).toEqual(depthStats(restored, 'mochi'));
  expect(state).toEqual(before);
});

it('keeps newly rolled and missing-roll affixes inside their stated tier', () => {
  const state = createDepthAccount(19);
  for (const template of GEAR) {
    const item = makeGear(state, template.id, 19);
    for (const id of item.affixes) {
      const range = AFFIX_BY_ID[id]!.tiers[item.tier - 1]!;
      expect(gearAffixRoll(item, id)).toBe(item.rolls[id]);
      expect(item.rolls[id]).toBeGreaterThanOrEqual(range[0]);
      expect(item.rolls[id]).toBeLessThanOrEqual(range[1]);
      delete item.rolls[id];
      expect(gearAffixRoll(item, id)).toBe(range[0]);
    }
  }
});
