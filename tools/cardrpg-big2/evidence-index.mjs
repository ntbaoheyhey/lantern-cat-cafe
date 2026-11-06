// REFERENCE: phase-pinned raw JSON. Missing or incomplete evidence is never a pass.
import { readFile, writeFile } from 'node:fs/promises';
const root = 'reports/cardrpg-big2';
async function read(path) {
  try { return JSON.parse(await readFile(`${root}/${path}`, 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}
const maximum = values => values.length ? Math.max(...values) : null;
const minimum = values => values.length ? Math.min(...values) : null;
const phases = [
  ['B1', 'performance', 'b1-cold', 'b1-skills'],
  ...[1, 2, 3].map(i => [`B2${'abc'[i - 1]}`, `cats/batch${i}`, 'cold', 'skills']),
  ['B3', 'stage', 'cold', 'skills'], ['B5', 'b5', 'cold', 'skills'],
  ['B4', 'b4', 'cold', 'skills'],
  ...['e1', 'e2', 'e3', 'e4', 'boss'].map(p => [p, `enemies/${p}`, 'cold', 'skills']),
  ['review', 'review', 'cold', 'skills'],
];
const rows = [];
for (const [phase, directory, coldName, skillName] of phases) {
  const coldPath = `${directory}/${coldName}/summary.json`;
  const matrixPath = `${directory}/${skillName}/summary.json`;
  const cold = await read(coldPath), matrix = await read(matrixPath);
  const coldRows = cold?.rows ?? [], cases = matrix?.rows ?? [];
  const casts = cases.flatMap(r => r.casts ?? []);
  const first = casts.filter(c => c.use === 'first'), repeat = casts.filter(c => c.use === 'repeat');
  const expected = matrix?.actions?.length ? matrix.actions.length * 10 : null;
  const configurations = new Map();
  for (const row of cases) {
    const key = [row.width, row.height, row.dpr, row.cpu, row.quality].join('/');
    if (!configurations.has(key)) configurations.set(key, []);
    configurations.get(key).push(row);
  }
  const actionIds = matrix?.actions?.map(a => a.id) ?? [];
  const complete = !!matrix?.ended && expected === cases.length && configurations.size === 10
    && [...configurations.values()].every(group => group.length === actionIds.length
      && actionIds.every(id => group.filter(r => r.action.id === id).length === 1))
    && cases.every(r => r.casts?.length === 2
      && ['first', 'repeat'].every(use => r.casts.filter(c => c.use === use).length === 1));
  const timing = casts.map(c => c.summary);
  const configurationCastWindows = [...configurations].flatMap(([configuration, group]) =>
    ['first', 'repeat'].map(use => {
      const windows = group.flatMap(r => r.casts ?? []).filter(c => c.use === use).map(c => c.summary);
      const frames = windows.reduce((sum, c) => sum + c.frames, 0);
      const within20 = windows.reduce((sum, c) => sum + Math.round(c.frames * c.within20), 0);
      return { configuration, use, frames, within20: frames ? within20 / frames : null,
        max: maximum(windows.map(c => c.max)), draws: maximum(windows.map(c => c.calls)), triangles: maximum(windows.map(c => c.triangles)) };
    }));
  const errors = cases.flatMap(r => r.errors ?? []);
  const motion = await read(`${directory}/motion/variety.json`);
  const effects = await read(`${directory}/effects/uniqueness.json`);
  const lifecycle = await read(`${directory}/lifecycle/summary.json`);
  rows.push({ phase,
    cold: cold ? { source: coldPath, sha256: cold.sha256, scenarios: coldRows.length,
      pageMax: maximum(coldRows.map(r => r.max)), p95Worst: maximum(coldRows.map(r => r.p95)),
      postInteractiveMax: maximum(coldRows.flatMap(r => r.postInteractive ? [r.postInteractive.max] : [])),
      errors: coldRows.flatMap(r => r.errors ?? []), note: 'Cold sample only, never a full-roster cast verdict.' } : null,
    matrix: matrix ? { source: matrixPath, sha256: matrix.sha256, complete,
      scope: matrix.selection?.scope ?? 'full roster', owners: matrix.selection?.owners ?? null,
      cases: cases.length, expected, configurations: configurations.size,
      firstMax: maximum(first.map(c => c.summary.max)), repeatMax: maximum(repeat.map(c => c.summary.max)),
      wholePageMax: maximum(cases.map(r => r.pageOpen.max)),
      postInteractiveMax: maximum(cases.flatMap(r => r.postInteractive ? [r.postInteractive.max] : [])),
      postInteractiveAvailable: cases.length > 0 && cases.every(r => !!r.postInteractive),
      cpu4P95Worst: maximum(cases.filter(r => r.cpu === 4).map(r => r.pageOpen.p95)),
      castFramesWithin20WorstCase: minimum(timing.map(c => c.within20)),
      draws: maximum(timing.map(c => c.calls)), triangles: maximum(timing.map(c => c.triangles)),
      castFramesAbove50: timing.reduce((sum, c) => sum + c.above50, 0), errors,
      castGate: complete ? timing.every(c => c.max <= 50 && c.within20 >= .99 && c.calls <= 250 && c.triangles <= 150000) && !errors.length : null,
      castGateDefinition: 'Stricter diagnostic: every individual first/repeat cast must itself have 99% of frames <=20ms. This is distinct from the inherited per-configuration aggregate used in the phase report.',
      configurationCastWindows,
      inheritedConfigurationCastGate: complete ? configurationCastWindows.every(c => c.frames > 0 && c.within20 >= .99 && c.max <= 50 && c.draws <= 250 && c.triangles <= 150000) && !errors.length : null,
    } : null,
    motion: motion ? { source: `${directory}/motion/variety.json`, clips: motion.rows.length,
      requiredPairs: motion.pairs.filter(p => p.required).length, offenders: motion.offenders.length,
      errors: motion.errors ?? [], note: 'Trajectory distinction, not an art-quality score.' } : null,
    effects: effects ? { source: `${directory}/effects/uniqueness.json`, recipes: effects.rows.length,
      pairs: effects.pairs.length, offenders: effects.offenders.length, faceOffenders: effects.faceOffenders?.length ?? 0,
      errors: effects.errors ?? [], note: 'Declared grayscale/edge threshold, not semantic identity proof.' } : null,
    lifecycle: lifecycle ? { source: `${directory}/lifecycle/summary.json`, sha256: lifecycle.sha256,
      battles: lifecycle.rows.length, tolerance: lifecycle.tolerance, growth: lifecycle.growth,
      passed: lifecycle.passed, errors: lifecycle.errors } : null,
  });
}
const output = `${root}/EVIDENCE-INDEX.json`;
await writeFile(output, JSON.stringify({ generatedAt: new Date().toISOString(),
  method: 'Computed directly from phase raw receipts. Null means unmeasured or unavailable. Cold/visual/matrix artifacts remain separately identified; successful earlier builds do not certify the delivered HTML.', rows }, null, 2));
console.log(JSON.stringify(rows.map(r => ({ phase: r.phase, cold: r.cold?.scenarios ?? 0,
  cases: r.matrix?.cases ?? 0, complete: r.matrix?.complete ?? false,
  motion: r.motion?.clips ?? 0, effects: r.effects?.recipes ?? 0 }))));
