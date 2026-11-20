// REFERENCE: PROMPT-A5 B1/B2/B3. Summarize complete TRAIN receipts without changing gates.
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

const root = process.argv[2];
assert(root, 'Provide the directory containing equipped/tiers/sets/teams results.');
const receipts = [], rows = [];
let count, source;
for (const scope of ['equipped', 'tiers', 'sets', 'teams']) {
  const path = `${root}/${scope}/results.json`, bytes = await readFile(path), data = JSON.parse(bytes);
  assert.equal(data.offset, 0, 'This report may read TRAIN only');
  assert(['pilot', 'train'].includes(data.sample));
  assert.equal(data.count, data.sample === 'pilot' ? 50 : 500);
  assert.equal(data.scope, scope);
  assert.equal(data.rows.length, { equipped: 384, tiers: 210, sets: 64, teams: 663 }[scope]);
  if (source) { assert.deepEqual(data.source, source); assert.equal(data.count, count); }
  source = data.source; count = data.count;
  for (const row of data.rows) {
    assert.equal(row.complete, true, `Incomplete cell: ${row.key}`);
    assert.equal(row.outcomes.length, count);
    assert.equal(row.digest, createHash('sha256').update(JSON.stringify(row.outcomes)).digest('hex'));
    const codes = [...row.outcomes].map(Number);
    const paired = ['pieces', 'pieces-equipped', 'crew'].includes(row.kind);
    assert(codes.every(n => paired ? n >= 0 && n <= 3 : n === 0 || n === 1));
    const wins = codes.filter(n => n % 2).length;
    const beforeWins = paired ? codes.filter(n => n >= 2).length : null;
    const improved = paired ? codes.filter(n => n === 1).length : null;
    const worsened = paired ? codes.filter(n => n === 2).length : null;
    const gainPp = paired ? 100 * (improved - worsened) / count : null;
    const stderr = paired ? 100 * Math.sqrt(((improved + worsened) / count - ((improved - worsened) / count) ** 2) / count) : null;
    assert([row.shareSum, row.maxShare, row.maxEnhancedShare].every(Number.isFinite));
    const summary = data.summaries.find(s => s.key === row.key);
    assert(summary, `Missing independent saved summary: ${row.key}`);
    assert.equal(summary.wins, wins);
    assert.equal(summary.beforeWins, beforeWins);
    if (paired) assert(Math.abs(summary.gainPp - gainPp) < 1e-9);
    rows.push({ ...row, wins, beforeWins, improved, worsened, gainPp,
      pairedNormal95Pp: paired ? [gainPp - 1.96 * stderr, gainPp + 1.96 * stderr] : null,
      rate: wins / count, meanShare: row.shareSum / count });
  }
  receipts.push({ path, sha256: createHash('sha256').update(bytes).digest('hex') });
}
assert.equal(new Set(rows.map(r => r.key)).size, rows.length);
const mean = xs => xs.reduce((a, b) => a + b, 0) / xs.length;
function ranks(xs) {
  const order = xs.map((value, index) => ({ value, index })).sort((a, b) => a.value - b.value);
  const result = [];
  for (let start = 0; start < order.length;) {
    let end = start + 1;
    while (end < order.length && order[end].value === order[start].value) end++;
    for (let i = start; i < end; i++) result[order[i].index] = (start + end - 1) / 2;
    start = end;
  }
  return result;
}
function spearman(xs, ys) {
  const x = ranks(xs), y = ranks(ys), xm = mean(x), ym = mean(y);
  const scale = Math.sqrt(x.reduce((s, n) => s + (n - xm) ** 2, 0) * y.reduce((s, n) => s + (n - ym) ** 2, 0));
  return scale ? x.reduce((s, n, i) => s + (n - xm) * (y[i] - ym), 0) / scale : null;
}
const pieces = rows.filter(r => r.kind === 'pieces-equipped');
assert.equal(pieces.length, 384);
const pieceSummary = {
  cells: pieces.length, misses: pieces.filter(r => r.gainPp > 12 + 1e-9).length,
  worst: [...pieces].sort((a, b) => b.gainPp - a.gainPp)[0],
  beforeSaturated: pieces.filter(r => r.beforeWins / count >= .95).length,
  afterSaturated: pieces.filter(r => r.rate >= .95).length,
  maxDisplayShare: Math.max(...pieces.map(r => Math.max(r.maxShare, r.maxEnhancedShare))),
  spearmanByChapter: [1, 2, 3].map(chapter => {
    const p = pieces.filter(r => r.chapter === chapter);
    return { chapter, rho: spearman(p.map(r => r.meanShare), p.map(r => r.gainPp)) };
  }),
};
const tiers = [], rarities = ['none', 'common', 'rare', 'epic', 'legendary'];
for (const level of [1, 6]) for (const chapter of [1, 2, 3]) for (let i = 1; i < rarities.length; i++) {
  const arm = rarity => rows.find(r => r.kind === 'tiers' && r.level === level && r.chapter === chapter && r.rarity === rarity);
  tiers.push({ level, chapter, from: rarities[i - 1], to: rarities[i], gainPp: 100 * (arm(rarities[i]).rate - arm(rarities[i - 1]).rate) });
}
const bands = [];
for (const level of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 50]) for (const chapter of [1, 2, 3]) {
  const group = rows.filter(r => r.kind === 'bands' && r.level === level && r.chapter === chapter);
  assert.equal(group.length, 5);
  bands.push({ level, chapter, spreadPp: 100 * (group.find(r => r.rarity === 'legendary').rate - group.find(r => r.rarity === 'none').rate),
    saturated: group.every(r => r.rate >= .95), rates: group.map(r => ({ rarity: r.rarity, rate: r.rate })) });
}
const setRows = rows.filter(r => r.kind === 'sets');
const sets = [...new Set(setRows.map(r => r.setId))].map(id => {
  const group = setRows.filter(r => r.setId === id);
  return { id, rate: mean(group.map(r => r.rate)), leadingSituations: group.filter(r => r.rate === Math.max(...setRows.filter(t => t.scene === r.scene).map(t => t.rate))).map(r => r.scene) };
});
const teamRows = rows.filter(r => r.kind === 'teams');
assert.equal(teamRows.length, 660);
const cats = [...new Set(teamRows.flatMap(r => r.team))].map(id => {
  const group = teamRows.filter(r => r.team.includes(id)), best = [...group].sort((a, b) => b.rate - a.rate)[0];
  const top = group.filter(r => {
    const pair = r.team.filter(c => c !== id);
    return r.rate === Math.max(...teamRows.filter(t => t.chapter === r.chapter && pair.every(c => t.team.includes(c))).map(t => t.rate));
  });
  return { id, rate: mean(group.map(r => r.rate)), bestTeam: best.team, bestChapter: best.chapter, bestRate: best.rate, topPickCells: top.length };
});
const bossDiversity = [1, 2, 3].map(chapter => {
  const group = teamRows.filter(r => r.chapter === chapter), best = Math.max(...group.map(r => r.rate));
  return { chapter, best, withinFivePp: group.filter(r => r.rate >= best - .05 - 1e-9).length };
});
const crewRows = rows.filter(r => r.kind === 'crew'), crew = { gainPp: mean(crewRows.map(r => r.gainPp)), rows: crewRows };
const result = { method: `TRAIN 1–${count}. Original fixtures, no acceptance or gate changes. Paired intervals are normal approximations, not Wilson intervals. Display correlation is Spearman with average tied ranks.`,
  source, count, receipts, pieces: pieceSummary,
  tiers: { positive: tiers.filter(r => r.gainPp >= 2 - 1e-9).length, reversals: tiers.filter(r => r.gainPp < -1e-9).length, total: 24, rows: tiers },
  bands, sets, cats, bossDiversity, crew,
  limitations: ['Bare 2304-piece cells and elite diversity are not covered by this diagnostic.', 'Training tiers report 24 steps; the registered 44/48 gate also requires acceptance.', 'Saturated fourth-slot outcomes remain visible; smaller gains alone do not establish healthy balance.'] };
await writeFile(process.argv[3] || `${root}/summary.json`, JSON.stringify(result, null, 2));
console.log(JSON.stringify({ count, pieceMisses: pieceSummary.misses, worstGainPp: pieceSummary.worst.gainPp,
  tierSteps: result.tiers.positive, tierReversals: result.tiers.reversals,
  bandMisses: bands.filter(r => r.spreadPp < 15 || r.saturated).length,
  catRange: [Math.min(...cats.map(r => r.rate)), Math.max(...cats.map(r => r.rate))],
  setRange: [Math.min(...sets.map(r => r.rate)), Math.max(...sets.map(r => r.rate))], crewGainPp: crew.gainPp }));
