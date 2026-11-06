import assert from 'node:assert/strict';
import { isDeepStrictEqual } from 'node:util';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const input = resolve(process.argv[2] || 'reports/cardrpg-big/sim');
const output = resolve(process.argv[3] || 'reports/cardrpg-big/integration/extras');
const read = async name => JSON.parse(await readFile(resolve(input, name), 'utf8'));
const tiers = ['none', 'common', 'rare', 'epic', 'legendary'];
const gearKeys = ['rows', 'sets', 'teams', 'cats', 'singleItems', 'powerBounds'];
const economyKeys = ['styles', 'summary', 'weekly', 'totals', 'heavyCasual45', 'accounts'];
const samples = [];

function verifyModes(off, on) {
  assert.equal(off.battleRunner.mode, 'off');
  assert.equal(on.battleRunner.mode, 'on');
  assert.deepEqual(off.battleRunner.options,
    { autoExtras: false, teaCloud: false, frontRelay: false, intentLens: false });
  assert.deepEqual(on.battleRunner.options,
    { autoExtras: true, teaCloud: true, frontRelay: true, intentLens: true });
  assert.deepEqual(off.sourceHashes, on.sourceHashes, 'ON and OFF must use identical rules source');
}

function pairedRows(off, on, keys) {
  assert.equal(off.length, on.length);
  return off.map((before, index) => {
    const after = on[index];
    for (const key of keys) assert.deepEqual(before[key], after[key], `Pair differs at ${key}`);
    return { before, after };
  });
}

function utilitySummary(receipt) {
  const pieces = receipt.singleItems.flatMap(item => item.outcomes.map(outcome => ({
    templateId: item.templateId, cardId: item.cardId, level: outcome.level, chapter: outcome.chapter,
    gainPoints: (outcome.afterWins - outcome.beforeWins) / outcome.count * 100,
  })));
  const cats = receipt.cats.map(cat => ({ id: cat.id, rate: cat.wins / cat.count * 100 }));
  const sets = [];
  for (const level of [1, 6]) for (const chapter of [1, 2, 3]) {
    const rates = receipt.sets.filter(row => row.level === level && row.chapter === chapter)
      .map(row => row.wins / row.count * 100);
    assert.equal(rates.length, 8, 'Full eight-set receipts are required');
    sets.push({ level, chapter, min: Math.min(...rates), max: Math.max(...rates) });
  }
  assert.equal(cats.length, 12);
  assert(pieces.length > 0 && receipt.powerBounds.length > 0, 'Full single-item receipts are required');
  return { cats, sets, strongestPiece: pieces.sort((left, right) => right.gainPoints - left.gainPoints)[0],
    maximumDisplayShare: Math.max(...receipt.powerBounds.map(piece => piece.contributionFraction)) };
}

for (const sample of ['train', 'heldout']) {
  const off = await read(`gear-extras-off-${sample}.json`);
  const on = await read(`gear-extras-on-${sample}.json`);
  const native = await read(`gear-encounter-${sample}.json`);
  verifyModes(off, on);
  for (const key of ['count', 'offset', 'scope', 'mainScale', 'affixScale', 'templateValues', 'affixValues']) {
    assert.deepEqual(off[key], on[key], `Gear fixture differs at ${key}`);
  }
  assert.equal(off.scope, 'all');
  assert.equal(off.count, 50);
  const rows = pairedRows(off.rows, on.rows, ['level', 'chapter', 'rarity', 'count']).map(({ before, after }) => {
    const runs = pairedRows(before.runs, after.runs, ['seed']);
    return { level: before.level, chapter: before.chapter, rarity: before.rarity, count: before.count,
      offWins: before.wins, onWins: after.wins,
      newWins: runs.filter(pair => !pair.before.won && pair.after.won).length,
      newLosses: runs.filter(pair => pair.before.won && !pair.after.won).length };
  });
  const steps = [];
  for (const level of [1, 6]) for (const chapter of [1, 2, 3]) {
    const group = tiers.map(rarity => rows.find(row => row.level === level && row.chapter === chapter && row.rarity === rarity));
    assert(group.every(Boolean));
    for (let index = 1; index < group.length; index++) {
      const low = group[index - 1], high = group[index];
      const offGain = (high.offWins - low.offWins) / high.count * 100;
      const onGain = (high.onWins - low.onWins) / high.count * 100;
      steps.push({ level, chapter, from: low.rarity, to: high.rarity, offGain, onGain,
        lostPositiveGain: offGain > 0 && onGain <= 0, newReversal: offGain >= 0 && onGain < 0 });
    }
  }
  samples.push({ sample, rows, steps, offUtility: utilitySummary(off), onUtility: utilitySummary(on),
    offNativeParity: Object.fromEntries(gearKeys.map(key => [key, isDeepStrictEqual(off[key], native[key])])) });
}

const offEconomy = await read('economy-extras-off.json');
const onEconomy = await read('economy-extras-on.json');
const nativeEconomy = await read('economy-encounter.json');
verifyModes(offEconomy, onEconomy);
assert.deepEqual(offEconomy.styles, onEconomy.styles);
assert.equal(offEconomy.accounts.length, 90);
assert.equal(onEconomy.accounts.length, 90);
for (const receipt of [offEconomy, onEconomy]) {
  assert(receipt.accounts.every(account => account.days.length === 45));
}
const economy = Object.keys(offEconomy.heavyCasual45).map(currency => ({ currency,
  offRatio: offEconomy.heavyCasual45[currency], onRatio: onEconomy.heavyCasual45[currency],
  onPassesThree: onEconomy.heavyCasual45[currency] <= 3 }));
const receipt = { date: new Date().toISOString(), samples, economy,
  economyOffNativeParity: Object.fromEntries(economyKeys.map(key =>
    [key, isDeepStrictEqual(offEconomy[key], nativeEconomy[key])])),
  interpretation: 'All four options are toggled together. Any lost tier gain belongs to that combination. Identifying an individual cause requires an additional isolated-option run.' };
await mkdir(output, { recursive: true });
await writeFile(resolve(output, 'comparison.json'), JSON.stringify(receipt, null, 2));
const lines = ['# Experimental automatic-battle comparison',
  'REFERENCE: ../../memory/PROMPT.md ADDENDUM LANES, comparison.json, ../../sim/gear-extras-*.json, ../../sim/economy-extras-*.json',
  '', 'All four experimental options are toggled together against identical source, fixtures and seeds. Default gameplay keeps the options off. The user decides promotion.', ''];
for (const sample of samples) {
  lines.push(`## ${sample.sample} gear outcomes`, 'REFERENCE: comparison.json', '',
    '| Level | Chapter | Tier | OFF wins | ON wins | New wins / losses |',
    '| --- | --- | --- | --- | --- | --- |');
  for (const row of sample.rows) lines.push(`| ${row.level} | ${row.chapter} | ${row.rarity} | ${row.offWins}/${row.count} | ${row.onWins}/${row.count} | ${row.newWins}/${row.newLosses} |`);
  const lost = sample.steps.filter(step => step.lostPositiveGain || step.newReversal);
  lines.push('', `${sample.steps.filter(step => step.offGain > 0).length}/24 positive tier steps OFF, ${sample.steps.filter(step => step.onGain > 0).length}/24 ON. ${lost.length} steps lose a positive gain or acquire a reversal.`,
    `OFF/native full-array parity ${Object.values(sample.offNativeParity).every(Boolean) ? 'PASS' : 'FAIL'}.`,
    `Largest ON single-piece boss gain ${sample.onUtility.strongestPiece.gainPoints.toFixed(2)} percentage points. Maximum displayed share ${(sample.onUtility.maximumDisplayShare * 100).toFixed(4)}%.`, '');
  for (const step of lost) lines.push(`- Level${step.level},chapter${step.chapter},${step.from}→${step.to} moves from${step.offGain.toFixed(2)} to${step.onGain.toFixed(2)} percentage points.`);
}
lines.push('## Earned economy', 'REFERENCE: comparison.json', '', '| Earned measure | OFF heavy/casual | ON heavy/casual | ON ≤3× |', '| --- | --- | --- | --- |');
for (const row of economy) lines.push(`| ${row.currency} | ${row.offRatio.toFixed(6)}× | ${row.onRatio.toFixed(6)}× | ${row.onPassesThree ? 'PASS' : 'FAIL'} |`);
lines.push('', `Economy OFF/native parity ${Object.values(receipt.economyOffNativeParity).every(Boolean) ? 'PASS' : 'FAIL'}.`, '', receipt.interpretation);
await writeFile(resolve(output, 'README.md'), lines.join('\n') + '\n');
console.log(JSON.stringify({ samples: samples.map(sample => ({ sample: sample.sample,
  positiveOff: sample.steps.filter(step => step.offGain > 0).length,
  positiveOn: sample.steps.filter(step => step.onGain > 0).length,
  lostGains: sample.steps.filter(step => step.lostPositiveGain || step.newReversal).length })), economy }));
