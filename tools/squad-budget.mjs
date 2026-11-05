// Compare the same V2 guest build against P0. Run after the normal production build.
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import { root } from './squad-support.mjs';
const walk = path => readdirSync(path, { withFileTypes: true }).flatMap(f => f.isDirectory() ? walk(resolve(path, f.name)) : [resolve(path, f.name)]);
const bytes = files => files.reduce((n, f) => n + statSync(f).size, 0);
const base = JSON.parse(readFileSync(resolve(root, 'reports/squad/base-size.json')));
const chunks = walk(resolve(root, 'apps/web/dist/assets')).filter(f => f.endsWith('.js'));
const gzipJs = chunks.reduce((n, f) => n + gzipSync(readFileSync(f)).length, 0);
const runtimeImageBytes = bytes(walk(resolve(root, 'apps/web/public/art/squad')).filter(f => f.endsWith('.png')));
const proofImageBytes = bytes(walk(resolve(root, 'reports/squad')).filter(f => /\.(png|webp)$/.test(f)));
const result = {
  runtimeSha: execFileSync('git', ['rev-parse', 'codex/squad-ui-2026-11-05'], { cwd: root, encoding: 'utf8' }).trim(), baseSha: base.sha,
  method: 'V2 guest build, gzip each JS chunk with Node default compression, sum including lazy chunks. Image bytes count unique files; embedded duplicates/base64 in the offline document are disclosed separately.',
  baseGzipJs: base.gzipJs, gzipJs, addedGzipJs: gzipJs - base.gzipJs, jsBudgetBytes: 150000,
  runtimeImageBytes, proofImageBytes, totalNewImageBytes: runtimeImageBytes + proofImageBytes,
  imageBudgetBytes: 2000000, chunks: chunks.length,
};
assert(result.addedGzipJs <= result.jsBudgetBytes);
assert(result.totalNewImageBytes <= result.imageBudgetBytes);
writeFileSync(resolve(root, 'reports/squad/budgets.json'), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result));
