// Aggregate registered natural runs without replaying or replacing any sample.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';
const [directory, output, ...supplemental] = process.argv.slice(2);
const groups = ['oven', 'thread', 'night', 'tea'];
const runs = [], pending = [], errors = [];
for (const group of groups) {
  try {
    const data = JSON.parse(gunzipSync(await readFile(`${directory}/${group}/coverage.json.gz`)));
    errors.push(...data.errors.map(error => ({ group, error })));
    runs.push(...data.rows.map(row => ({ ...row, group, artifact: data.sha256 })));
  } catch (error) { if (error.code === 'ENOENT') pending.push(group); else throw error; }
}
// Keep earlier runs, including their narrow cleanup probe. A repair delta adds
// evidence; it never silently replaces a failed or unverified original sample.
for (const file of supplemental) {
  const data = JSON.parse(gunzipSync(await readFile(file)));
  const group = `delta-${supplemental.indexOf(file) + 1}`;
  errors.push(...data.errors.map(error => ({ group, error })));
  runs.push(...data.rows.map(row => ({ ...row, group, artifact: data.sha256, source: file })));
}
const cells = new Map();
for (const run of runs) for (const [key, cell] of Object.entries(run.cells)) {
  if (!cells.has(key)) cells.set(key, { ...cell, case: run.id, seed: run.seed, frame: `${run.group}/${cell.frame}` });
}
const core = ['scald', 'snag', 'bitter', 'scent', 'brittle', 'drowsy', 'steep', 'cozy'];
const signature = ['crumb', 'riposte', 'link', 'sprout', 'decoy', 'glaze', 'shelter'];
const reactions = ['crumb-burst', 'wildfire', 'rupture', 'spread'];
const shapes = ['single', 'pierce', 'row', 'splash', 'bounce', 'all', 'multi-hit'];
const expected = [
  ...core.flatMap(id => ['apply', 'tick', 'expire'].map(kind => `status:${id}:${kind}`)),
  ...signature.map(id => `active:${id}`), ...reactions.map(id => `reaction:${id}`),
  ...shapes.map(id => `shape:${id}`), ...['scald', 'snag', 'bitter'].map(id => `enemy-status:${id}:apply`),
];
const matrix = expected.map(key => ({ key, evidence: cells.get(key)
  ?? (key.endsWith(':tick') ? cells.get(key.replace(/:tick$/, ':trigger')) : null) ?? null }));
const plans = runs.flatMap(run => run.plans.map(plan => ({ case: run.id, ...plan })));
const result = {
  method: 'All original natural samples retained; repair deltas are additive and carry their own artifact hash. The tick/trigger column accepts a periodic tick or a matched direct-hit/heal/control trigger with an active exact-layer renderer submission. Active signature cells have actual canvas frames but not pixel segmentation. Submission is correlated with layer/target/alpha; visual inspection remains separate. Original narrow-probe uncleared endings remain explicitly unverified even when a later delta proves its own ending clear.',
  pending, runs: runs.map(({ plans, cells, ...run }) => ({ ...run, plans: plans.length, cells: Object.keys(cells).length })),
  errors, parity: runs.every(run => run.parity), plans: plans.length,
  uncleared: plans.filter(plan => !plan.cleared).map(({ case: id, round, actionId, skill }) => ({ case: id, round, actionId, skill })),
  matrix, observed: [...cells.values()], missing: matrix.filter(row => !row.evidence).map(row => row.key),
};
await mkdir(output, { recursive: true });
await writeFile(`${output}/coverage-summary.json`, JSON.stringify(result, null, 2));
const lines = ['# Natural live coverage', result.method, '', `${new Set(runs.map(run => run.id)).size}/18 registered battles; ${runs.length} retained samples including deltas; exact hashes: ${result.parity}; ${plans.length} plans; ${result.uncleared.length} original or current endings unverified by their recorded probe; browser errors: ${errors.length}.`, '', '| Requested cell | Observed live evidence |', '|---|---|'];
for (const row of matrix) lines.push(`| ${row.key} | ${row.evidence ? `${row.evidence.case}, seed ${row.evidence.seed}, round ${row.evidence.round}, action ${row.evidence.actionId}: [frame](${row.evidence.frame})` : 'NOT VERIFIED / not observed by this probe'} |`);
await writeFile(`${output}/COVERAGE.md`, lines.join('\n') + '\n');
console.log(JSON.stringify({ battles: runs.length, plans: plans.length, parity: result.parity, uncleared: result.uncleared.length, observed: matrix.filter(row => row.evidence).length, requested: matrix.length, missing: result.missing, pending, errors }));
