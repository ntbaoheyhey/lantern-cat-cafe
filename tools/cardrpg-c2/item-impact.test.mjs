import test from 'node:test';
import assert from 'node:assert/strict';
import { pairedSummary } from './item-impact.mjs';

test('item comparisons retain regressions and saturated cells instead of treating Power as a win rate', () => {
 const mixed = pairedSummary([0, 1, 1, 2, 3]);
 assert.equal(mixed.gainPp, 20); assert.equal(mixed.changedToWin, 2); assert.equal(mixed.changedToLoss, 1);
 assert.equal(mixed.beforeWins, 2); assert.equal(mixed.afterWins, 3); assert.equal(mixed.pass, false);
 const saturated = pairedSummary([3, 3, 3, 3]);
 assert.equal(saturated.saturatedBefore, true); assert.equal(saturated.saturatedAfter, true);
 assert.equal(saturated.gainPp, 0);
 const worse = pairedSummary([2, 2, 3, 0]);
 assert.equal(worse.gainPp, -50); assert.equal(worse.pass, false);
 assert.throws(() => pairedSummary([]), /paired/); assert.throws(() => pairedSummary([4]), /paired/);
});
