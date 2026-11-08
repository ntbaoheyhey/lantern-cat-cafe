// REFERENCE: A5 B2 eligible-suppression17. Compare every registered arm without resampling.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';

const root = 'reports/cardrpg-big/a5/b2';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const receipts = [];
async function read(path) {
  const bytes = await readFile(path);
  receipts.push({ path, sha256: sha(bytes) });
  return JSON.parse(bytes);
}
const folders = {
  original: 'common-fixture-04', kit: 'kit-fit-14', hush: 'utility-suppression-15/common',
  eligible: 'eligible-suppression-17/eligible', rest: 'eligible-suppression-17/eligible-rest',
};
const arms = {};
for (const [id, folder] of Object.entries(folders)) {
  const data = await read(`${root}/${folder}/results.json`);
  const method = await read(`${root}/${folder}/REGISTERED-METHOD.json`);
  assert.deepEqual(data.registration, method, `${id}: registration`);
  assert.equal(data.methodHash, sha(JSON.stringify(method)));
  assert.equal(method.seedOffset, 0); assert.equal(method.count, 50);
  assert.equal(data.rows.length, 1840);
  const rows = new Map(data.rows.map(row => [row.key, row]));
  assert.equal(rows.size, 1840);
  for (const row of rows.values()) {
    assert(row.complete, `${id}: incomplete ${row.key}`);
    assert.equal(row.outcomes.length, 50);
    assert.match(row.outcomes, row.kind === 'crew' ? /^[0-3]+$/ : /^[01]+$/);
    assert.equal(row.digest, sha(row.outcomes));
    assert.equal(row.wins, [...row.outcomes].filter(code => Number(code) % 2).length);
    assert.equal(row.rate, row.wins / 50);
  }
  arms[id] = { data, method, rows };
}
for (const [id, arm] of Object.entries(arms)) {
  assert.deepEqual(arm.method.scenarios, arms.original.method.scenarios, `${id}: scenes`);
  assert.deepEqual(arm.method.weights, arms.original.method.weights, `${id}: weights`);
  for (const row of arm.rows.values()) if (row.kind !== 'crew')
    assert(arms.original.rows.has(row.key), `${id}: different cell ${row.key}`);
}
for (const id of ['eligible', 'rest']) assert.deepEqual(arms[id].method.kits, arms.kit.method.kits);

function paired(before, after, selected) {
  let beforeWins = 0, afterWins = 0, improved = 0, worsened = 0;
  for (const row of selected) {
    assert.notEqual(row.kind, 'crew', 'A reselected crew is not a same-build pair.');
    const a = arms[before].rows.get(row.key), b = arms[after].rows.get(row.key);
    assert(a && b, row.key);
    for (let i = 0; i < 50; i++) {
      beforeWins += Number(a.outcomes[i]); afterWins += Number(b.outcomes[i]);
      improved += Number(a.outcomes[i] === '0' && b.outcomes[i] === '1');
      worsened += Number(a.outcomes[i] === '1' && b.outcomes[i] === '0');
    }
  }
  const battles = selected.length * 50;
  assert.equal(afterWins - beforeWins, improved - worsened);
  return { cells: selected.length, battles, beforeWins, afterWins, improved, worsened,
    beforeRate: beforeWins / battles, afterRate: afterWins / battles,
    gainPp: 100 * (afterWins - beforeWins) / battles };
}
const teamRows = [...arms.original.rows.values()].filter(row => row.kind === 'teams');
assert.equal(teamRows.length, 1760);
const cats = [...new Set(teamRows.flatMap(row => row.team))]; assert.equal(cats.length, 12);
const comparisons = [];
for (const [before, after] of [
  ['original', 'eligible'], ['original', 'rest'], ['kit', 'eligible'], ['kit', 'rest'],
  ['hush', 'eligible'], ['hush', 'rest'], ['eligible', 'rest'],
]) {
  const rows = [...arms[after].rows.values()].filter(row => row.kind !== 'crew');
  const context = before === 'kit' && after === 'eligible' ? 'Hush correction with identical eligible gear.'
    : before === 'eligible' && after === 'rest' ? 'One intervening Comfort cup turn; all other source and gear fixed.'
    : before === 'hush' && after === 'eligible' ? 'Fixture gear assignments change for allies as well as the named cat.'
    : 'Combined differences; do not attribute the whole change to one cat, skill or item.';
  comparisons.push({ before, after, context, allNonCrew: paired(before, after, rows),
    teams: paired(before, after, teamRows),
    cats: cats.map(id => ({ id, ...paired(before, after, teamRows.filter(row => row.team.includes(id))) })),
    scenes: arms.original.method.scenarios.map((scene, index) => ({ scene: index, enemies: scene.enemies,
      ...paired(before, after, teamRows.filter(row => row.scene === index)) })) });
}
const results = {};
for (const id of ['eligible', 'rest']) {
  const summary = await read(`${root}/${folders[id]}/summary.json`);
  for (const receipt of summary.receipts) assert.equal(sha(await readFile(receipt.path)), receipt.sha256);
  const crewRows = [...arms[id].rows.values()].filter(row => row.kind === 'crew');
  assert.equal(crewRows.length, 8);
  let improved = 0, worsened = 0, randomWins = 0, selectedWins = 0;
  for (const row of crewRows) for (const code of row.outcomes) {
    randomWins += Number(Number(code) >= 2); selectedWins += Number(code) % 2;
    improved += Number(code === '1'); worsened += Number(code === '2');
  }
  const gainPp = 100 * (selectedWins - randomWins) / 400;
  assert(Math.abs(gainPp - summary.crew.afterGainPp) < 1e-9);
  results[id] = { gates: summary.gates, cats: summary.cats, sets: summary.sets,
    diversity: summary.diversity, crew: { selectedTeam: arms[id].data.chosenCrew,
      battles: 400, randomWins, selectedWins, improved, worsened, gainPp } };
}
const report = { method: 'TRAIN1–50 only; all1840 registered cells retained per arm; no new samples.',
  results, comparisons, receipts,
  limitations: [
    'Cat-containing teams overlap. Counts are paired observations, not independent confidence samples.',
    'Best crews are selected on TRAIN in each arm; changing selections is explicit.',
    'All homogeneous set outcomes remain present, but ineligible carriers cannot establish set niches.',
    'Neither kit assignments nor the optional cooldown are adopted by this report.',
    'Fresh acceptance 20001–20500 remains unused; saved-input day7 is separately scoped.',
  ] };
await writeFile(`${root}/eligible-suppression-17/comparison.json`, JSON.stringify(report, null, 2));
console.log(JSON.stringify(Object.fromEntries(Object.entries(results).map(([id, r]) =>
  [id, { gates: r.gates, cats: r.cats.map(c => ({ id: c.id, rate: c.afterRate })), crew: r.crew }]))));
