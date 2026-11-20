// REFERENCE: A5 B2 suppression15. Audit paired carrier outcomes; never select or discard seeds.
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const root = 'reports/cardrpg-big/a5/b2/utility-suppression-15';
const sha = data => createHash('sha256').update(data).digest('hex');
const receipts = [];
async function read(path) {
  const bytes = await readFile(path);
  receipts.push({ path, sha256: sha(bytes) });
  return JSON.parse(bytes);
}
const before = await read('reports/cardrpg-big/a5/b2/set-carriers-12/results.json');
const after = await read(root + '/carriers/results.json');
const method = await read(root + '/carriers/REGISTERED-METHOD.json');
assert.deepEqual(after.registration, method);
assert.equal(after.methodHash, sha(JSON.stringify(method)));
for (const key of ['contexts', 'scenarios', 'modes', 'count', 'seedOffset', 'cases'])
  assert.deepEqual(method[key], before.registration[key], key);
assert.equal(method.seedOffset, 0); assert.equal(method.count, 50);
assert.equal(before.rows.length, 1024); assert.equal(after.rows.length, 1024);
const old = new Map(before.rows.map(row => [row.key, row]));
assert.equal(old.size, 1024); assert.equal(new Set(after.rows.map(row => row.key)).size, 1024);
const rows = after.rows.map(row => {
  const previous = old.get(row.key); assert(previous, row.key);
  let improved = 0, worsened = 0;
  for (const sample of [previous, row]) {
    assert(sample.complete); assert.match(sample.outcomes, /^[01]{50}$/);
    assert.equal(sample.digest, sha(sample.outcomes));
    assert.equal(sample.wins, [...sample.outcomes].filter(c => c === '1').length);
  }
  for (let i = 0; i < method.count; i++) {
    improved += Number(previous.outcomes[i] === '0' && row.outcomes[i] === '1');
    worsened += Number(previous.outcomes[i] === '1' && row.outcomes[i] === '0');
  }
  const delta = (improved-worsened)/method.count;
  const variance = ((improved+worsened)-method.count*delta*delta)/(method.count-1);
  const half = 1.959963984540054*Math.sqrt(variance/method.count);
  return { key: row.key, context: row.context, scene: row.scene, mode: row.mode, setId: row.setId,
    beforeWins: previous.wins, afterWins: row.wins, battles: method.count, improved, worsened,
    gainPp: 100*delta, pairedNormal95Pp: [100*(delta-half),100*(delta+half)] };
});
const totals = method.modes.map(mode => {
  const cells = rows.filter(row => row.mode === mode);
  return { mode, cells: cells.length, battles: cells.length*method.count,
    improved: cells.reduce((n,r) => n+r.improved,0), worsened: cells.reduce((n,r) => n+r.worsened,0),
    positiveCells: cells.filter(row => row.gainPp > 0).length,
    negativeCells: cells.filter(row => row.gainPp < 0).length,
    sameOutcomeCells: cells.filter(row => row.improved+row.worsened === 0).length };
});
const primary = method.contexts.flatMap(context => method.modes.map(mode => {
  const row = rows.find(r => r.context === context.id && r.scene === context.primaryScene
    && r.mode === mode && r.setId === context.intendedSet);
  assert(row); return row;
}));
const output = { status: 'TRAIN paired diagnostic; not acceptance or broad balance closure', receipts,
  totals, primary, rows, limitations: [
    'Same 1024 cells and TRAIN seeds 1–50; every negative outcome is retained.',
    'Overlapping contexts are not independent. Totals are descriptive, without pooled confidence intervals.',
    'The original fixed common scenes do not incorporate the later anchored progression curve.',
    'No other kit, cooldown, fixture or AI trial is combined with suppression15.'
  ] };
await writeFile(root + '/paired-carriers.json', JSON.stringify(output,null,2));
console.log(JSON.stringify({ totals, primary }));
