// REFERENCE: A5 B2. Independent receipt audit; a calibrated fixture is not a balance fix.
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const root = process.argv[2];
assert(root);
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const bytes = await readFile(root + '/results.json'), data = JSON.parse(bytes), m = data.registration;
assert.equal(data.methodHash, sha(JSON.stringify(m)));
assert.equal(m.seedOffset, 0); assert.equal(data.rows.length, 1840);
assert.equal(new Set(data.rows.map(r => r.key)).size, 1840);
const n = m.count, mean = xs => xs.reduce((a, b) => a + b, 0) / xs.length;
const wilson = wins => {
  const p = wins / n, z = 1.959963984540054, d = 1 + z * z / n, c = (p + z * z / (2 * n)) / d;
  const h = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / d;
  return [c - h, c + h];
};
for (const row of data.rows) {
  assert(row.complete); assert.equal(row.outcomes.length, n); assert.equal(row.digest, sha(row.outcomes));
  assert.match(row.outcomes, row.kind === 'crew' ? /^[0-3]+$/ : /^[01]+$/);
  assert.equal(row.wins, [...row.outcomes].filter(c => Number(c) % 2).length);
  assert.equal(row.rate, row.wins / n);
  assert(row.minPowerRatio >= .98 && row.maxPowerRatio <= 1.02);
  if (row.kind === 'crew') {
    assert.equal(row.beforeWins, [...row.outcomes].filter(c => Number(c) >= 2).length);
    assert.equal(row.gainPp, 100 * (row.wins - row.beforeWins) / n);
  }
}
const teams = data.rows.filter(r => r.kind === 'teams'), setRows = data.rows.filter(r => r.kind === 'sets');
assert.equal(teams.length, 1760); assert.equal(setRows.length, 64);
const sets = [...new Set(setRows.map(r => r.setId))].map(id => {
  const rows = setRows.filter(r => r.setId === id);
  assert.equal(rows.length, 8);
  return { id, rate: mean(rows.map(r => r.rate)), leads: rows.filter(r => r.wins === Math.max(...setRows.filter(o => o.scene === r.scene).map(o => o.wins))).map(r => r.scene) };
});
const cats = [...new Set(teams.flatMap(r => r.team))].map(id => {
  const rows = teams.filter(r => r.team.includes(id)); assert.equal(rows.length, 440);
  const best = [...rows].sort((a, b) => b.wins - a.wins || a.key.localeCompare(b.key))[0];
  const tops = rows.filter(r => {
    const pair = r.team.filter(cat => cat !== id);
    return r.wins === Math.max(...teams.filter(o => o.scene === r.scene && pair.every(cat => o.team.includes(cat))).map(o => o.wins));
  });
  return { id, rate: mean(rows.map(r => r.rate)), topPickCells: tops.length,
    best: { team: best.team, scene: best.scene, wins: best.wins, rate: best.rate, wilson95: wilson(best.wins) } };
});
const diversity = m.scenarios.map((s, scene) => {
  const rows = teams.filter(r => r.scene === scene); assert.equal(rows.length, 220);
  const best = Math.max(...rows.map(r => r.rate));
  return { scene, enemies: s.enemies, best, withinFivePp: rows.filter(r => r.rate >= best - .05 - 1e-9).length,
    saturatedTeams: rows.filter(r => r.rate >= .95).length };
});
const crew = { team: data.chosenCrew, gainPp: mean(data.rows.filter(r => r.kind === 'crew').map(r => r.gainPp)) };
const calibrationBytes = await readFile(m.calibration.path);
assert.equal(sha(calibrationBytes), m.calibration.sha256);
const calibration = JSON.parse(calibrationBytes);
const references = data.rows.filter(r => r.kind === 'reference').map(r => {
  const original = calibration.rows.find(o => o.scene === r.scene && o.factor === m.scenarios[r.scene].factor);
  assert(original); assert.equal(r.outcomes, original.outcomes.slice(0, n));
  return { scene: r.scene, rate: r.rate, calibration500Rate: original.rate, wilson95: wilson(r.wins) };
});
const gates = { everySet35to75: sets.every(s => s.rate >= .35 && s.rate <= .75), everySetLeads: sets.every(s => s.leads.length),
  everyCat55to75: cats.every(c => c.rate >= .55 && c.rate <= .75), everyCatTopPick: cats.every(c => c.topPickCells),
  crew10to25: crew.gainPp >= 10 && crew.gainPp <= 25, diversityAtLeastFour: diversity.every(s => s.withinFivePp >= 4) };
const result = { method: 'TRAIN diagnostic; common eight scenes weighted equally for sets, cats and crew. Frozen scenario stats, same utility budgets and exact paired seeds. This does not replace the original acceptance definition automatically.',
  receipt: { path: root + '/results.json', sha256: sha(bytes) }, count: n, references, sets, cats, diversity, crew, gates,
  limitations: ['Reference difficulty was chosen on TRAIN using only the starter role kit, before any new set/team cell.',
    'Per-cat averages pool overlapping teams; scene Wilson intervals do not imply independent pooled team trials.',
    'Each of the four catalog elites appears in one declared lineup; other companion lineups are not inferred.',
    'The best crew and best-at examples are TRAIN selections. They must be registered unchanged before fresh acceptance.'] };
await writeFile(root + '/summary.json', JSON.stringify(result, null, 2));
console.log(JSON.stringify({ count: n, gates, setRange: [Math.min(...sets.map(s => s.rate)), Math.max(...sets.map(s => s.rate))],
  catRange: [Math.min(...cats.map(c => c.rate)), Math.max(...cats.map(c => c.rate))], crewGainPp: crew.gainPp,
  diversity: diversity.map(d => d.withinFivePp) }));
