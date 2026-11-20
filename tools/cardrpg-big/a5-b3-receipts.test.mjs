// REFERENCE: PROMPT-A5 B3; checks recorded candidate evidence, not production acceptance.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const base = new URL('../../reports/cardrpg-big/a5/b3/', import.meta.url);
const read = path => JSON.parse(readFileSync(new URL(path, base), 'utf8'));
const close = (a, b) => assert(Math.abs(a - b) < 1e-10, `${a} != ${b}`);
const mean = values => values.reduce((a, b) => a + b, 0) / values.length;
const median = values => {
  const sorted = [...values].sort((a, b) => a - b), n = sorted.length;
  return n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
};

test('all three banners retain the registered 10,000 accounts and exact conditional CDF', () => {
  const data = read('invitations-01/gacha.json');
  assert.equal(data.rows.length, 3);
  assert.deepEqual(data.rows.map(row => row.banner).sort(), ['equipment', 'featured', 'standard']);
  for (const row of data.rows) {
    assert.equal(row.accounts.length, 10000);
    assert.deepEqual(row.accounts.map(account => account.seed), Array.from({length:10000}, (_, i) => i + 1));
    const summary = data.summaries.find(summary => summary.banner === row.banner);
    assert.equal(summary.accounts, row.accounts.length);
    assert.equal(summary.draws, row.accounts.length * 60);
    let survival = 1, maximumDeviation = 0;
    for (const point of summary.cdf) {
      const probability = point.draw >= 24 ? 1 : Math.min(1, .01 + Math.max(0, point.draw - 12) * .07);
      survival *= 1 - probability;
      const observed = row.accounts.filter(account => account.first !== null && account.first <= point.draw).length / row.accounts.length;
      const deviation = Math.abs(observed - (1 - survival)) * 100;
      close(point.expected, 1 - survival); close(point.observed, observed); close(point.errorPp, deviation);
      maximumDeviation = Math.max(maximumDeviation, deviation);
    }
    close(summary.maxDeviationPp, maximumDeviation);
    assert(maximumDeviation <= 1, `${row.banner}: ${maximumDeviation} pp exceeds the registered 1 pp gate`);
    assert(row.accounts.every(account => account.first >= 1 && account.first <= 24));
    assert(row.accounts.every(account => account.selectorRedeemedAt === 60 && account.selectorCost === 24 && account.remainingMarks === 36));
  }
});

test('45-day candidate summary is derived from all 90 actual account receipts', () => {
  const data = read('reward-confirmation-01/progression.json');
  const summary = read('reward-confirmation-01/summary.json');
  assert.equal(createHash('sha256').update(readFileSync(new URL('reward-confirmation-01/progression.json', base))).digest('hex'), summary.sourceSha256);
  assert.equal(data.accounts.length, 90);
  for (const style of ['casual', 'regular', 'heavy']) {
    const accounts = data.accounts.filter(account => account.style === style);
    assert.equal(accounts.length, 30);
    assert.equal(new Set(accounts.map(account => account.index)).size, 30);
    assert(accounts.every(account => account.days.length === 45 && account.days.every((day, i) => day.day === i + 1)));
    const total = data.totals.find(total => total.style === style), row = summary.rows.find(row => row.style === style);
    for (const [key, field] of [['firstLegendary', 'legendary'], ['firstChosen', 'chosen']]) {
      const days = total[key].map(result => result?.day ?? null);
      assert.deepEqual(row[field].observations, days);
      assert.equal(row[field].censored, days.filter(day => day === null).length);
      close(row[field].medianDay, median(days.filter(day => day !== null)));
      for (const n of [7, 14]) close(row[field][`byDay${n}`], days.filter(day => day !== null && day <= n).length / 30);
    }
    for (const currency of ['fish', 'threads', 'stamps', 'essence']) {
      const actual = mean(accounts.map(account => account.days.reduce((sum, day) => sum + day.earned[currency], 0)));
      close(total.earned[currency], actual); close(row.earned[currency], actual);
    }
    close(total.paidPulls, mean(accounts.map(account => account.days.at(-1).paidPulls)));
  }
  const casual = summary.rows.find(row => row.style === 'casual');
  const regular = summary.rows.find(row => row.style === 'regular');
  const heavy = summary.rows.find(row => row.style === 'heavy');
  for (const key of ['fish', 'threads', 'stamps', 'essence', 'paidPulls']) {
    const ratio = key === 'paidPulls' ? heavy.paidPulls / casual.paidPulls : heavy.earned[key] / casual.earned[key];
    close(summary.ratios[key], ratio); assert(ratio <= 3, key);
  }
  assert(regular.legendary.byDay7 >= .35 && regular.legendary.byDay14 >= .7);
  assert(heavy.legendary.medianDay < casual.legendary.medianDay);
  assert(regular.chosen.medianDay <= 21 && casual.chosen.medianDay <= 35 && heavy.chosen.censored === 0);
});

test('corrected caps reproduce all 4050 earned days and include Legendary rewards from every source', () => {
  const current = read('reward-validation-02/progression.json');
  const prior = read('reward-confirmation-01/progression.json');
  const summary = read('reward-validation-02/summary.json');
  assert.equal(createHash('sha256').update(readFileSync(new URL('reward-validation-02/progression.json', base))).digest('hex'), summary.sourceSha256);
  assert.equal(current.accounts.length, 90);
  let count = 0;
  for (const account of current.accounts) {
    const original = prior.accounts.find(a => a.style === account.style && a.index === account.index);
    assert(original); assert.deepEqual(account.days, original.days); count += account.days.length;
    assert.deepEqual(account.firstLegendary, original.firstLegendary);
    assert.deepEqual(account.firstChosen, original.firstChosen);
    assert(account.firstAnyLegendary.day <= account.firstLegendary.day);
  }
  assert.equal(count, 4050); assert.equal(summary.matchedDays, count);
  for (const row of summary.rows) for (const field of ['firstLegendary', 'firstAnyLegendary', 'firstChosen']) {
    const days = current.accounts.filter(a => a.style === row.style).map(a => a[field]?.day ?? null);
    assert.deepEqual(row[field].observations, days);
    assert.equal(row[field].censored, days.filter(d => d === null).length);
    close(row[field].medianDay, median(days.filter(d => d !== null)));
    for (const n of [7, 14]) close(row[field][`byDay${n}`], days.filter(d => d !== null && d <= n).length / 30);
  }
  assert.deepEqual(current.totals, prior.totals); assert.deepEqual(current.ratios, prior.ratios);
  assert(Object.values(summary.gates).every(Boolean));
});
