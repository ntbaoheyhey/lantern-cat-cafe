/** Replay served label layout against the explicit R3 recovery snapshot schedule. */
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '../..');
const [rawPath, rulesPath, output] = process.argv.slice(2).map(p => resolve(p));
assert(rawPath && rulesPath && output && !existsSync(output));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const rawBytes = await readFile(rawPath), raw = JSON.parse(rawBytes);
const rulesBytes = await readFile(rulesPath), rules = JSON.parse(rulesBytes);
assert.deepEqual(rules.raw, { path: rawPath, sha256: sha(rawBytes) });
assert.equal(rules.suite, 'recovery');
assert.equal(rules.actions, 4);
assert(rules.fullBattleExact && rules.normalReducedParity);
assert.deepEqual(raw.viewport, [1280, 720]);
for (const key of ['sourceCommit', 'indexSha256', 'url']) assert.equal(raw[key], rules[key]);
const layoutPath = 'apps/web/src/game/cardrpg/battle-v3/world-label-layout.ts';
const source = execFileSync('git', ['show', `${raw.sourceCommit}:${layoutPath}`], { cwd: root });
const require = createRequire(resolve(root, 'apps/web/package.json')), ts = require('typescript');
const js = ts.transpileModule(source.toString(), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const { layoutWorldLabels } = await import('data:text/javascript;base64,' + Buffer.from(js).toString('base64'));
const expectedRows = [], expectedPixels = [];
for (const mode of ['normal', 'reduced']) {
  for (const [cat, skill, times] of [
    ['panko', 1, [0, 175, 250, 350, 600, 799.9999, 800]],
    ['mallow', 4, [0, 175, 250, 350, 600, 1100, 2199.9999, 2200]],
  ]) for (const ms of times) {
    expectedRows.push(`${mode}-${cat}-${skill}-${ms}`);
    if (cat === 'panko' || ms === 1100) expectedPixels.push(`${mode}-${cat}-${skill}-${ms}`);
  }
}
const key = row => `${row.mode}-${row.cat}-${row.skill}-${row.ms}`;
assert.deepEqual(raw.rows.map(key), expectedRows);
assert.deepEqual(raw.cases.map(key), expectedPixels);
const samples = [
  ...raw.rows.map(row => ({ ...row, key: key(row), kind: 'geometry' })),
  ...raw.cases.map(row => ({ ...row, snapshot: row.before, key: key(row), kind: 'pixel' })),
];
const results = samples.map(({ snapshot: s, key, kind }) => {
  const actors = JSON.parse(s.battle).actors, offsets = new Map();
  for (const label of s.labels) {
    const node = s.labelPaintState.find(p => p.actor === label.id && p.class === 'b3-world');
    const matrix = node.transform.match(/^matrix\(([^)]+)\)$/)[1].split(',').map(Number);
    assert.deepEqual(matrix.slice(0, 4), [1, 0, 0, 1]);
    offsets.set(label.id, { x: label.rect.x - node.rect.x + matrix[4], y: label.rect.y - node.rect.y + matrix[5], width: label.rect.width, height: label.rect.height });
  }
  const project = box => ({ ...box, x: box.x + s.host.x, y: box.y + s.host.y });
  const faces = s.anchors.filter(a => a.visible && a.face).map(a => ({ ...project(a.face), id: a.id }));
  const labels = s.anchors.filter(a => a.visible && offsets.has(a.id)).map(a => {
    const e = offsets.get(a.id), target = a.labelTarget;
    return { id: a.id, side: actors.find(x => x.id === a.id).side,
      rect: { ...e, x: a.labelX + s.host.x + e.x, y: a.labelY + s.host.y + e.y },
      ...(target ? { anchorPlacement: { rect: { ...e, x: target.x + s.host.x + e.x, y: target.y + s.host.y + e.y }, avoid: project(target.avoid) } } : {}) };
  });
  const replay = layoutWorldLabels(labels, 1280, 720, s.hud.map(h => h.rect), faces);
  assert.equal(replay.length, s.labels.length);
  const errors = replay.map(label => {
    const observed = s.labels.find(l => l.id === label.id).rect;
    const error = Math.max(...['x', 'y', 'width', 'height'].map(k => Math.abs(label.rect[k] - observed[k])));
    assert(Number.isFinite(error));
    return { id: label.id, errorCSSpx: error, ...(error > 1 / 64 ? { observed, replayed: label.rect } : {}) };
  });
  return { key, kind, maxErrorCSSpx: Math.max(...errors.map(e => e.errorCSSpx)), labels: errors };
});
const failures = results.filter(r => r.maxErrorCSSpx > 1 / 64);
const result = { utc: new Date().toISOString(), raw: rules.raw,
  rulesAudit: { path: rulesPath, sha256: sha(rulesBytes) }, toolSha256: sha(await readFile(import.meta.filename)),
  sourceCommit: raw.sourceCommit, indexSha256: raw.indexSha256, url: raw.url, viewport: raw.viewport,
  layoutSource: { path: layoutPath, sha256: sha(source) }, suite: 'recovery',
  samples: results.length, labels: results.reduce((n, r) => n + r.labels.length, 0), toleranceCSSpx: 1 / 64,
  maxErrorCSSpx: Math.max(...results.map(r => r.maxErrorCSSpx)), failedSamples: failures.length,
  failedGeometrySamples: failures.filter(r => r.kind === 'geometry').length, failedPixelSamples: failures.filter(r => r.kind === 'pixel').length,
  baselineReproduced: failures.length === 0, results, productionAcceptance: false,
  limits: ['Observed DOM sizes are inputs; this verifies layout synchronization, not CSS measurement independently.',
    'R7 with temporary label-target offset; four seeded actions and this explicit schedule only.',
    'No painted-body clearance, association, motion, art, performance or release acceptance.'] };
await writeFile(output, JSON.stringify(result, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ samples: result.samples, labels: result.labels, maxErrorCSSpx: result.maxErrorCSSpx,
  failedGeometrySamples: result.failedGeometrySamples, failedPixelSamples: result.failedPixelSamples }));
