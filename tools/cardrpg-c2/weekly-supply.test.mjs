import test from 'node:test';
import assert from 'node:assert/strict';
import { weeklySupply } from './weekly-supply.mjs';
test('unknown Epic gear stays bound and a one-time judge drop is never recurring campaign supply', () => {
 const profile = { minutesPerDay: 30, perItem: {
  known: { rarity: 'epic', perActiveWeek: 2 }, unknown: { rarity: 'epic', perActiveWeek: 100 },
  legend: { rarity: 'legendary', perActiveWeek: .2 }, key: { rarity: 'rare', perActiveWeek: 5 } } };
 const r = weeklySupply({ profiles: { casual: profile } }, [
  { id: 'known', tradable: true, kind: 'equipment', rarity: 'epic' },
  { id: 'legend', tradable: true, kind: 'equipment', rarity: 'legendary' },
  { id: 'key', tradable: false, kind: 'bound', rarity: 'rare' },
  { id: 'star-thread', tradable: true, kind: 'material', rarity: 'rare' },
 ], { casual: 1 });
 assert.equal(r.epicPerActiveWeek, 2); assert.equal(r.legendaryPerActiveWeek, .2); assert.equal(r.rarePerActiveWeek, 0);
 assert.equal(r.items.unknown.eligiblePerActiveWeek, 0);
 assert.equal(r.items.known.authoritativeIssuancePerWeek, 0);
 assert.equal(r.specialOneTimeRewards['star-thread'].recurringPerWeek, 0);
});
test('active account mixes weight created items, preserving per-profile exposure', () => {
 const p = (n, minutesPerDay) => ({ minutesPerDay, perItem: { cup: { rarity: 'epic', perActiveWeek: n } } });
 const summary = { profiles: { casual: p(2, 30), heavy: p(8, 180) } };
 const rules = [{ id: 'cup', tradable: true, kind: 'equipment', rarity: 'epic' }];
 const r = weeklySupply(summary, rules, { casual: .75, heavy: .25 });
 assert.equal(r.epicPerActiveWeek, 3.5); assert.equal(r.activeHoursPerWeek.heavy, 21);
 assert.throws(() => weeklySupply(summary, rules, { casual: .75, heavy: .5 }), /mix/);
});
