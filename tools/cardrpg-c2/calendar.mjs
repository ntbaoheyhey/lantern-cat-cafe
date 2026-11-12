/** Declared calendar strata for economy projections. Accounts on the same date
 * still share daily-route seeds; account count is not independent date count. */
const DAY = 86400000;
export function calendarPlan(firstDay = '2026-11-12', startSpanDays = 1, firstSeed = 90001) {
 const epoch = Date.parse(`${firstDay}T00:00:00Z`);
 if (!/^\d{4}-\d{2}-\d{2}$/.test(firstDay) || !Number.isFinite(epoch) || new Date(epoch).toISOString().slice(0, 10) !== firstDay)
  throw Error('Use a real --start-date=YYYY-MM-DD');
 if (!Number.isSafeInteger(startSpanDays) || startSpanDays < 1 || startSpanDays > 366)
  throw Error('Choose --calendar-span=1–366 start dates');
 if (!Number.isSafeInteger(firstSeed) || firstSeed < 1) throw Error('Invalid first account seed');
 return { firstDay, startSpanDays, firstSeed,
  assignment: 'Consecutive account seeds cycle evenly through consecutive start dates; matched profiles share each account date.',
  dailyRouteSeeds: 'shared across accounts by calendar date', independentDailySamples: false };
}
export function accountCalendar(plan, seed) {
 if (!Number.isSafeInteger(seed) || seed < plan.firstSeed) throw Error('Account seed is outside the declared cohort');
 const offsetDays = (seed - plan.firstSeed) % plan.startSpanDays;
 const epoch = Date.parse(`${plan.firstDay}T00:00:00Z`) + offsetDays * DAY;
 return { firstDay: new Date(epoch).toISOString().slice(0, 10), offsetDays, epoch };
}
