import test from 'node:test';
import assert from 'node:assert/strict';
import { createEconomyLedger } from './economy-ledger.mjs';
const state = () => ({ materials: 0, seals: 0, gear: [], account: {
 currencies: { fish: 100, threads: 0, stamps: 0, essence: 0 }, inventory: { stacks: {} }, cards: [{ cardId: 'mochi', shards: 0 }],
}});
const catalog = { apron: { id: 'apron', rarity: 'epic' }, cup: { id: 'cup', rarity: 'legendary' } };
test('gross issuance survives salvage, duplicates, and the weekly boundary', () => {
 const start = state(), ledger = createEconomyLedger(start, catalog), first = structuredClone(start);
 first.gear.push({ id: 'one', templateId: 'apron' }); first.materials = 4; first.seals = 1;
 ledger.record(start, first, { day: 1, source: 'boss' });
 const salvaged = structuredClone(first); salvaged.gear = []; salvaged.account.currencies.threads = 12;
 ledger.record(first, salvaged, { day: 2, source: 'salvage' });
 const second = structuredClone(salvaged); second.gear.push({ id: 'two', templateId: 'apron' }, { id: 'three', templateId: 'cup' });
 second.account.currencies.fish -= 80; second.account.cards[0].shards = 2;
 ledger.record(salvaged, second, { day: 8, source: 'tailor' });
 const result = ledger.finish(second);
 assert.deepEqual(result.gearCreated, { apron: 2, cup: 1 }); assert.equal(result.firstEpicDay, 1); assert.equal(result.firstLegendaryDay, 8);
 assert.deepEqual(result.weeks[1].gear, { apron: 1 }); assert.deepEqual(result.weeks[2].gear, { apron: 1, cup: 1 });
 assert.equal(result.finalBag, 2); assert.equal(result.income.threads, 12); assert.equal(result.spending.fish, 80); assert.equal(result.duplicateShards, 2);
});
test('a missing observed purchase is detected by conservation', () => {
 const start = state(), ledger = createEconomyLedger(start, catalog), final = structuredClone(start); final.account.currencies.fish -= 1;
 assert.throws(() => ledger.finish(final), /reconcile/);
});
test('daily counters are not tradable materials and inventory existing at entry is not new issuance', () => {
 const start = state(); start.gear.push({ id: 'existing', templateId: 'apron' });
 const ledger = createEconomyLedger(start, catalog), next = structuredClone(start);
 next.account.inventory.stacks['depth-drops-1'] = 6; next.account.inventory.stacks['pantry-key'] = 1;
 ledger.record(start, next, { day: 1, source: 'journal' });
 const result = ledger.finish(next); assert.deepEqual(result.gearCreated, {}); assert.deepEqual(result.materialsCreated, { 'pantry-key': 1 });
});
