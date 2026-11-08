// REFERENCE: A5 B2. Paired TRAIN kit comparison with the unchanged common-fixture04 receipt.
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const root = process.argv[2]; assert(root, 'Provide a registered kit candidate.');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const bytes = await readFile(root + '/results.json'), data = JSON.parse(bytes);
const method = JSON.parse(await readFile(root + '/REGISTERED-METHOD.json'));
assert.deepEqual(data.registration, method);
assert.equal(data.methodHash, sha(JSON.stringify(method)));
assert.equal(method.seedOffset, 0); assert.equal(method.count, 50);
assert.equal(sha(await readFile(root + '/matrix.mjs')), method.matrixSha256);
const parent = method.parentSuppression ? JSON.parse(await readFile(method.parentSuppression)) : null;
for (const [path, hash] of Object.entries(method.source)) {
  const archive = parent ? (parent.changed[path]
    ? method.parentSuppression.slice(0, method.parentSuppression.lastIndexOf('/')) + '/changed-source'
    : parent.parentSource.path) : (method.sourceSnapshot ?? root + '/source-snapshot');
  if (parent) assert.equal(parent.source[path], hash, path);
  assert.equal(sha(await readFile(archive + '/' + path)), hash, path);
}
const originalBytes = await readFile(method.original.path);
assert.equal(sha(originalBytes), method.original.sha256);
const original = JSON.parse(originalBytes), before = new Map(original.rows.map(row => [row.key, row]));
assert.deepEqual(method.scenarios, original.registration.scenarios);
assert.deepEqual(method.weights, original.registration.weights);
assert.equal(data.rows.length, 1840);
assert.equal(new Set(data.rows.map(row => row.key)).size, 1840);
for (const row of data.rows) {
  assert(row.complete); assert.equal(row.outcomes.length, method.count);
  assert.equal(sha(row.outcomes), row.digest);
  assert.match(row.outcomes, row.kind === 'crew' ? /^[0-3]+$/ : /^[01]+$/);
  assert.equal(row.wins, [...row.outcomes].filter(c => Number(c) % 2).length);
  assert.equal(row.rate, row.wins / method.count);
  assert(row.minPowerRatio >= .98 && row.maxPowerRatio <= 1.02);
  assert(Number.isSafeInteger(row.blackCup) && row.blackCup >= 0 && row.blackCup <= row.sootActions);
}
function paired(rows) {
  let improved = 0, worsened = 0, beforeWins = 0, afterWins = 0;
  for (const row of rows) {
    const old = before.get(row.key); assert(old, row.key);
    for (let seed = 0; seed < method.count; seed++) {
      beforeWins += Number(old.outcomes[seed]); afterWins += Number(row.outcomes[seed]);
      improved += Number(old.outcomes[seed] === '0' && row.outcomes[seed] === '1');
      worsened += Number(old.outcomes[seed] === '1' && row.outcomes[seed] === '0');
    }
  }
  const battles = rows.length * method.count;
  return { cells: rows.length, battles, beforeWins, afterWins, improved, worsened,
    beforeRate: beforeWins / battles, afterRate: afterWins / battles,
    gainPp: 100 * (improved - worsened) / battles,
    sootActions: rows.reduce((n, row) => n + row.sootActions, 0),
    blackCup: rows.reduce((n, row) => n + row.blackCup, 0) };
}
const teams = data.rows.filter(row => row.kind === 'teams'); assert.equal(teams.length, 1760);
const prefixChecks = [];
if (method.parent) {
  assert.equal(sha(await readFile(method.parent.path)), method.parent.sha256);
  const candidateRows = new Map(data.rows.map(row => [row.key, row]));
  for (const path of ['reports/cardrpg-big/a5/b2/scent-policy-06/partial.json', 'reports/cardrpg-big/a5/b2/scent-policy-crash-07/partial.json']) {
    const retainedBytes = await readFile(path), retained = JSON.parse(retainedBytes);
    let battles = 0;
    for (const row of retained.rows) {
      assert.equal(candidateRows.get(row.key).outcomes.slice(0, row.outcomes.length), row.outcomes, `Guard-only prefix drift: ${row.key}`);
      battles += row.outcomes.length;
    }
    prefixChecks.push({ path, sha256: sha(retainedBytes), cells: retained.rows.length, battles });
  }
}
const cats = [...new Set(teams.flatMap(row => row.team))].map(id => {
  const rows = teams.filter(row => row.team.includes(id)); assert.equal(rows.length, 440);
  const top = rows.filter(row => {
    const pair = row.team.filter(cat => cat !== id);
    return row.wins === Math.max(...teams.filter(other => other.scene === row.scene && pair.every(cat => other.team.includes(cat))).map(other => other.wins));
  });
  return { id, ...paired(rows), topPickCells: top.length };
});
const setRows = data.rows.filter(row => row.kind === 'sets'); assert.equal(setRows.length, 64);
const sets = [...new Set(setRows.map(row => row.setId))].map(id => {
  const rows = setRows.filter(row => row.setId === id); assert.equal(rows.length, 8);
  return { id, ...paired(rows), leads: rows.filter(row => row.wins === Math.max(...setRows.filter(other => other.scene === row.scene).map(other => other.wins))).map(row => row.scene) };
});
const diversity = method.scenarios.map((scene, index) => {
  const rows = teams.filter(row => row.scene === index), best = Math.max(...rows.map(row => row.rate));
  return { scene: index, best, withinFivePp: rows.filter(row => row.rate >= best - .05 - 1e-9).length };
});
const crewRows = data.rows.filter(row => row.kind === 'crew'); assert.equal(crewRows.length, 8);
for (const row of crewRows) {
  assert.equal(row.beforeWins, [...row.outcomes].filter(c => Number(c) >= 2).length);
  assert.equal(row.gainPp, 100 * (row.wins - row.beforeWins) / method.count);
}
const crew = { beforeTeam: original.chosenCrew, afterTeam: data.chosenCrew,
  beforeGainPp: original.rows.filter(row => row.kind === 'crew').reduce((n, row) => n + row.gainPp, 0) / 8,
  afterGainPp: crewRows.reduce((n, row) => n + row.gainPp, 0) / 8 };
const gates = { everyCat55to75: cats.every(cat => cat.afterRate >= .55 && cat.afterRate <= .75),
  everyCatTopPick: cats.every(cat => cat.topPickCells > 0),
  everySet35to75: sets.every(set => set.afterRate >= .35 && set.afterRate <= .75),
  everySetLeads: sets.every(set => set.leads.length > 0),
  crew10to25: crew.afterGainPp >= 10 && crew.afterGainPp <= 25,
  diversityAtLeastFour: diversity.every(scene => scene.withinFivePp >= 4) };
const summary = { method: 'TRAIN1–50 only. Fixed original1840 common-fixture cells, weights, stats and budgets; no recalibration or acceptance change.',
  receipts: [{ path: root + '/results.json', sha256: sha(bytes) }, method.original],
  cats, sets, diversity, crew, gates, prefixChecks,
  sootByScene: method.scenarios.map((scene, index) => ({ scene: index, ...paired(teams.filter(row => row.scene === index && row.team.includes('soot'))) })),
  reference: data.rows.filter(row => row.kind === 'reference').map(row => ({ scene: row.scene, ...paired([row]) })),
  limitations: ['Overlapping cat teams are not independent trials; no pooled confidence-interval claim.',
    'Best crew is reselected on TRAIN by the unchanged procedure; both selections are explicit.',
    'Common-fixture rates and isolated kit performance do not close original B1 or B3 gates.',
    'No automatic adoption or fresh20001–20500 sampling. Negative paired outcomes remain visible.'] };
await writeFile(root + '/summary.json', JSON.stringify(summary, null, 2));
console.log(JSON.stringify({ gates, soot: cats.find(cat => cat.id === 'soot'), crew }));
