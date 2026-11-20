// Compare the optimized placement with the published L7 algorithm, unchanged inputs.
import { execFileSync } from 'node:child_process';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { requireWeb } from '../visual-support.mjs';
import { withTimingLock } from './lock.mjs';
const ts = requireWeb('typescript');
const path = 'apps/web/src/game/squad/turn3d/label-layout.ts';
const before = execFileSync('git', ['show', `29699ca45:${path}`], { encoding: 'utf8' });
const after = await readFile(path, 'utf8');
const compile = async source => (await import('data:text/javascript;base64,' + Buffer.from(ts.transpileModule(source,
  { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText).toString('base64'))).layoutLabels;
const oldLayout = await compile(before), newLayout = await compile(after);
let seed = 731;
const random = () => ((seed = Math.imul(seed, 1664525) + 1013904223 >>> 0) / 4294967296);
const cases = [];
for (const [width, height] of [[864, 285], [1096, 380], [1256, 540]]) for (let n = 0; n < 40; n++) {
  const count = 1 + n % 9;
  const labels = Array.from({ length: count }, (_, i) => ({ id: `actor-${i}`, x: 80 + random() * (width - 160),
    y: 55 + random() * (height - 100), height: 48, head: { x: random() * (width - 120), y: 70 + random() * (height - 160), width: 60 + random() * 85, height: 60 + random() * 70 } }));
  cases.push([labels, width, height, 138, [{ x: width * .16, y: height * .4, width: 120, height: 120 }]]);
}
for (const args of cases) assert.deepEqual([...newLayout(...args)], [...oldLayout(...args)]);
const measure = fn => { const start = performance.now(); for (let repeat = 0; repeat < 8; repeat++) for (const args of cases) fn(...args); return performance.now() - start; };
const samples = [];
await withTimingLock('LOOK label placement parity and microbenchmark', async () => {
  measure(oldLayout); measure(newLayout);
  for (let i = 0; i < 7; i++) {
    if (i % 2) { const afterMs = measure(newLayout); samples.push({ beforeMs: measure(oldLayout), afterMs }); }
    else { const beforeMs = measure(oldLayout); samples.push({ beforeMs, afterMs: measure(newLayout) }); }
  }
});
const median = key => samples.map(s => s[key]).sort((a, b) => a - b)[3];
const out = 'reports/cardrpg-look/closure/labels'; await mkdir(out, { recursive: true });
await writeFile(`${out}/checks.json`, JSON.stringify({ baseline: '29699ca45', source: path,
  hashes: [before, after].map(s => createHash('sha256').update(s).digest('hex')), cases: cases.length, parity: true,
  method: 'Deterministic desktop/dense/impossible placement inputs, exact result Map equality, alternating native Node batches. Not a browser cast or GC measurement.',
  callsPerSample: cases.length * 8, samples, beforeMedianMs: median('beforeMs'), afterMedianMs: median('afterMs') }, null, 2));
console.log(JSON.stringify({ cases: cases.length, parity: true, beforeMedianMs: median('beforeMs'), afterMedianMs: median('afterMs') }));
