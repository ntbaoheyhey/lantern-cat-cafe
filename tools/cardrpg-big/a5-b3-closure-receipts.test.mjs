// REFERENCE: PROMPT-A5 B3. Assert measured earned-path results, never fabricated targets.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const root = 'reports/cardrpg-big/a5/b3/anchored-validation-03';
const read = async path => JSON.parse(await readFile(path, 'utf8'));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
test('newly earned day7 cohort binds all90 saves and reports both advised and unadvised retries', async () => {
  const data = await read(root + '/day7-checks/checks.json');
  assert.equal(data.accounts.length, 90);
  assert.equal(new Set(data.accounts.map(a => `${a.style}/${a.index}`)).size, 90);
  for (const a of data.accounts) {
    assert.equal(a.inputSaveSha256, sha(await readFile(`${root}/day7/${a.style}-${a.index}.save`)));
    if (!a.first.won && a.advice) {
      assert(a.second && a.withoutAdvice);
      assert(a.advice.label);
    }
  }
  const expected = {};
  for (const style of ['casual', 'regular', 'heavy']) {
    const rows = data.accounts.filter(a => a.style === style), saved = data.cohorts.find(c => c.style === style);
    assert.equal(rows.length, 30);
    const first = rows.filter(a => a.first.won).length;
    const two = rows.filter(a => a.first.won || a.second?.won).length;
    const losses = rows.filter(a => !a.first.won);
    assert.equal(saved.firstWins, first);
    assert.equal(saved.twoAttemptWins, two);
    assert.equal(saved.retryWinsWithAdvice, losses.filter(a => a.second?.won).length);
    assert.equal(saved.retryWinsWithoutAdvice, losses.filter(a => a.withoutAdvice?.won).length);
    assert.equal(saved.allLossesHaveAdvice, losses.every(a => a.advice));
    expected[style] = { first: first / 30, two: two / 30, advice: losses.every(a => a.advice) };
  }
  assert.deepEqual(data.gates, {
    casualFirstTwoAtLeast50: expected.casual.two >= .5,
    regularFirstTwoAtLeast70: expected.regular.two >= .7,
    heavyFirstAtMost95: expected.heavy.first <= .95,
    everyLossHasAvailableImprovement: Object.values(expected).every(x => x.advice),
  });
  assert(Object.values(data.gates).every(Boolean), 'A failing cohort cannot close the day7 phase.');
});

test('45day reward claims bind all4050 earned account-days and preserve the caps', async () => {
  const bytes = await readFile(root + '/progression.json'), data = JSON.parse(bytes);
  const summary = await read(root + '/summary.json');
  assert.equal(summary.sourceSha256, sha(bytes));
  assert.equal(data.accounts.length, 90);
  assert.equal(data.accounts.reduce((n, a) => n + a.days.length, 0), 4050);
  for (const a of data.accounts) {
    assert.equal(a.days.length, 45);
    a.days.forEach((day, i) => {
      assert.equal(day.day, i + 1);
      for (const [id, cap] of Object.entries({ fish: 420, threads: 90, stamps: 360, essence: 6 })) {
        assert(day.earned[id] >= 0 && day.earned[id] <= cap);
      }
    });
    const stars = a.events.filter(e => e.kind === 'star-reward');
    assert.equal(new Set(stars.map(e => e.id)).size, stars.length);
  }
  assert.deepEqual(summary.ratios, data.ratios);
  assert(Object.values(summary.gates).every(Boolean));
  assert(Object.values(data.ratios).every(n => n <= 3));
});

test('early-band report preserves actual unchanged stats and paired early progression', async () => {
  const audit = await read('reports/cardrpg-big/a5/b3/band-anchored-03/band-audit.json');
  assert.equal(audit.rows.length, 50);
  for (const r of audit.rows) {
    if (r.level <= 5 || r.level >= 10) assert.deepEqual(r.next, r.old);
    for (const id of Object.keys(r.old)) {
      assert(r.next[id].attack <= r.old[id].attack);
      assert(r.next[id].hp <= r.old[id].hp);
      assert.equal(r.next[id].defense, r.old[id].defense);
    }
  }
  const comparison = await read(root + '/paired-economy.json');
  assert.equal(comparison.rows.length, 3);
  for (const receipt of comparison.receipts) assert.equal(receipt.sha256, sha(await readFile(receipt.path)));
  for (const style of comparison.rows) {
    assert.equal(style.days.length, 45);
    // Day1 starts in the unchanged content band; later earned paths can legitimately diverge.
    const first = style.days[0];
    assert.equal(first.clearedChapters.meanPairedDelta, 0);
    assert.equal(first.paidPulls.meanPairedDelta, 0);
    for (const d of style.days) for (const m of [d.clearedChapters, d.crewLevel, d.stars, d.paidPulls, ...Object.values(d.earned)]) {
      assert.equal(m.improved + m.unchanged + m.worsened, 30);
      assert(Math.abs(m.afterMean - m.beforeMean - m.meanPairedDelta) < 1e-8);
    }
  }
});
