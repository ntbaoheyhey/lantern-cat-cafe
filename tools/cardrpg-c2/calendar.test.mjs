import {test} from 'node:test';
import assert from 'node:assert/strict';
import {calendarPlan, accountCalendar} from './calendar.mjs';

test('calendar strata cover every start date with balanced exposure, including a year boundary', () => {
 const plan = calendarPlan('2026-12-20', 28, 90001), counts = new Map();
 for (let seed = 90001; seed <= 90200; seed++) {
  const value = accountCalendar(plan, seed);
  counts.set(value.firstDay, (counts.get(value.firstDay) ?? 0) + 1);
 }
 assert.equal(counts.size, 28);
 assert.equal(accountCalendar(plan, 90028).firstDay, '2027-01-16');
 assert.equal(accountCalendar(plan, 90029).firstDay, '2026-12-20');
 assert.deepEqual([...new Set(counts.values())].sort(), [7, 8]);
 assert.equal(plan.independentDailySamples, false);
});
test('one-date plan retains the original calendar and matched-profile dates are deterministic', () => {
 const plan = calendarPlan();
 for (const seed of [90001, 90099, 90200]) {
  assert.deepEqual(accountCalendar(plan, seed), {firstDay: '2026-11-12', offsetDays: 0, epoch: Date.UTC(2026, 10, 12)});
 }
 assert.deepEqual(accountCalendar(calendarPlan('2028-02-28', 3), 90003), {firstDay: '2028-03-01', offsetDays: 2, epoch: Date.UTC(2028, 2, 1)});
});
test('invalid dates and cohort ranges fail before projections can silently change identity', () => {
 for (const day of ['2026-02-29', '2026-11-31', '12/11/2026', '2026-11-12T00:00:00Z']) assert.throws(() => calendarPlan(day));
 for (const span of [0, -1, 1.5, 367, NaN]) assert.throws(() => calendarPlan('2026-11-12', span));
 assert.throws(() => accountCalendar(calendarPlan(), 90000));
});
