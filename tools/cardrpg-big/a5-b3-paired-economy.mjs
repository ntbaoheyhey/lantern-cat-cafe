// REFERENCE: PROMPT-A5 B3. Compare the same earned accounts, including early regressions.
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

const [beforePath, afterPath, output] = process.argv.slice(2);
assert(beforePath && afterPath && output, 'Provide before/after progression.json and output.json.');
const receipts = await Promise.all([beforePath, afterPath].map(async path => {
  const bytes = await readFile(path);
  return { path, sha256: createHash('sha256').update(bytes).digest('hex'), data: JSON.parse(bytes) };
}));
const [before, after] = receipts.map(r => r.data);
const key = a => `${a.style}/${a.index}`;
for (const data of [before, after]) {
  assert.equal(data.accounts.length, 90);
  assert.equal(new Set(data.accounts.map(key)).size, 90);
  for (const a of data.accounts) {
    assert(['casual', 'regular', 'heavy'].includes(a.style));
    assert(Number.isInteger(a.index) && a.index >= 0 && a.index < 30);
    assert.equal(a.days.length, 45);
    a.days.forEach((d, i) => assert.equal(d.day, i + 1));
  }
}
const avg = ns => ns.reduce((a, b) => a + b, 0) / ns.length;
const summarize = (pairs, get) => {
  const deltas = pairs.map(([b, a]) => get(a) - get(b));
  return { beforeMean: avg(pairs.map(([b]) => get(b))), afterMean: avg(pairs.map(([, a]) => get(a))),
    meanPairedDelta: avg(deltas), improved: deltas.filter(n => n > 0).length,
    unchanged: deltas.filter(n => n === 0).length, worsened: deltas.filter(n => n < 0).length,
    minPairedDelta: Math.min(...deltas), maxPairedDelta: Math.max(...deltas) };
};
const rows = ['casual', 'regular', 'heavy'].map(style => {
  const accounts = after.accounts.filter(a => a.style === style);
  assert.equal(accounts.length, 30);
  const pairs = accounts.map(a => [before.accounts.find(b => key(b) === key(a)), a]);
  return { style, days: Array.from({ length: 45 }, (_, i) => {
    const dayPairs = pairs.map(([b, a]) => [b.days[i], a.days[i]]);
    return { day: i + 1, clearedChapters: summarize(dayPairs, d => d.clear.length),
      crewLevel: summarize(dayPairs, d => avg(d.levels)), stars: summarize(dayPairs, d => d.stars),
      paidPulls: summarize(dayPairs, d => d.paidPulls),
      earned: Object.fromEntries(['fish', 'threads', 'stamps', 'essence'].map(currency =>
        [currency, summarize(dayPairs, d => d.earned[currency])])) };
  }), firstRewards: Object.fromEntries(['firstAnyLegendary', 'firstChosen'].map(field => [field,
    pairs.map(([b, a]) => ({ index: a.index, beforeDay: b[field]?.day ?? null, afterDay: a[field]?.day ?? null }))])) };
});
const result = { method: 'Paired TRAIN progression comparison: identical account seeds, daily budgets and public-command policy; all 4050 account-days. Early losses remain visible. No fresh combat acceptance or human-playtest claim.',
  receipts: receipts.map(({ data, ...r }) => r), rows };
await writeFile(output, JSON.stringify(result, null, 2));
console.log(JSON.stringify(rows.map(r => ({ style: r.style, early: r.days.filter(d => [3, 5, 7, 14].includes(d.day)).map(d =>
  ({ day: d.day, clearedChapters: d.clearedChapters, paidPullDelta: d.paidPulls.meanPairedDelta })) }))));
