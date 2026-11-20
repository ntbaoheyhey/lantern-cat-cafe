import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { relative, resolve } from 'node:path';
import { root, web, requireWeb } from '../visual-support.mjs';

const base = process.env.BIG_SCOPE_BASE || 'cd5edcc9895b42384578df9b040daac9ce51fccf';
const output = resolve(root, process.env.BIG_SCOPE_OUT || 'reports/cardrpg-big/integration/scope');
const git = args => execFileSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 }).trim();
const hash = value => createHash('sha256').update(value).digest('hex');
const protectedPaths = ['packages/chain', 'contracts', 'supabase', 'apps/web/src/wallet',
  'apps/web/src/forge', 'apps/web/src/market', 'packages/game-rules/src/config.ts',
  'packages/game-rules/src/v2/forge', 'packages/game-rules/src/cardrpg/depth/bridge.ts',
  'apps/web/src/main.tsx', 'apps/web/src/game/squad/gate.ts', 'docs/cardrpg2/index.html'];
const protectedChanges = git(['diff', '--name-only', base, '--', ...protectedPaths]).split('\n').filter(Boolean);
const ruleChanges = git(['diff', '--name-only', base, '--', 'packages/game-rules']).split('\n').filter(Boolean);
const unauthorizedRules = ruleChanges.filter(path => !path.startsWith('packages/game-rules/src/cardrpg/depth/'));
const utilityPath = 'apps/web/src/game/cardrpg/depth/Utility.tsx';
const oldUtility = git(['show', `${base}:${utilityPath}`]);
const currentUtility = await readFile(resolve(root, utilityPath), 'utf8');
function readerPanel(source) {
  const start = source.indexOf('export function Relics(');
  const end = source.indexOf('</section>', start);
  assert(start >= 0 && end > start, 'Expected the Fuji reader panel');
  return source.slice(start, end + '</section>'.length);
}
const reader = { beforeSha256: hash(readerPanel(oldUtility)), afterSha256: hash(readerPanel(currentUtility)) };

const { build } = await import(requireWeb.resolve('vite'));
const result = await build({ root: web, logLevel: 'warn', build: { write: false } });
const emitted = (Array.isArray(result) ? result : [result]).flatMap(bundle => bundle.output);
const chunks = emitted.filter(item => item.type === 'chunk');
const byName = new Map(chunks.map(chunk => [chunk.fileName, chunk]));
const rootChunk = chunks.find(chunk => chunk.isEntry && chunk.facadeModuleId?.endsWith('/index.html'));
const legacyChunk = chunks.find(chunk => /\/legacy-entry\.tsx$/.test(chunk.facadeModuleId || ''));
assert(rootChunk && legacyChunk, 'Expected the default main and legacy entries');
const startup = new Set();
function include(chunk) {
  if (startup.has(chunk.fileName)) return;
  startup.add(chunk.fileName);
  for (const imported of chunk.imports) {
    const dependency = byName.get(imported);
    assert(dependency, `Missing emitted static import ${imported}`);
    include(dependency);
  }
}
include(rootChunk);
include(legacyChunk);
const startupChunks = [...startup].map(name => {
  const chunk = byName.get(name);
  return { name, bytes: Buffer.byteLength(chunk.code), sha256: hash(chunk.code), imports: chunk.imports,
    dynamicImports: chunk.dynamicImports, modules: Object.keys(chunk.modules).map(id => relative(root, id)),
    assets: [...(chunk.viteMetadata?.importedAssets || [])] };
});
const forbiddenModules = startupChunks.flatMap(chunk => chunk.modules).filter(id =>
  /(?:\/three\/|\/three@|\/turn3d\/|\.(?:glb|gltf|fbx|ktx2?)(?:\?|$))/.test(id));
const forbiddenAssets = startupChunks.flatMap(chunk => chunk.assets).filter(id => /\.(glb|gltf|fbx|ktx2?)(?:\?|$)/.test(id));
const receipt = { base, head: git(['rev-parse', 'HEAD']), date: new Date().toISOString(),
  method: 'Production Vite output, main entry plus the default legacy branch and their recursive static imports. Optional dynamic branches are listed separately. This build-graph measurement does not measure browser requests.',
  protectedPaths, protectedChanges, ruleChanges, unauthorizedRules, reader, startupChunks,
  startupJavaScriptBytes: startupChunks.reduce((sum, chunk) => sum + chunk.bytes, 0),
  forbiddenModules, forbiddenAssets };
await mkdir(output, { recursive: true });
await writeFile(resolve(output, 'proof.json'), JSON.stringify(receipt, null, 2));
await writeFile(resolve(output, 'rules.diff'), git(['diff', base, '--', 'packages/game-rules']) + '\n');
await writeFile(resolve(output, 'rules-commits.txt'), git(['log', '--format=%H %s', '--name-only',
  `${base}..HEAD`, '--', 'packages/game-rules']) + '\n');
assert.deepEqual(protectedChanges, []);
assert.deepEqual(unauthorizedRules, []);
assert.equal(reader.beforeSha256, reader.afterSha256);
assert.deepEqual(forbiddenModules, []);
assert.deepEqual(forbiddenAssets, []);
console.log(JSON.stringify({ protectedChanges: protectedChanges.length, changedRuleFiles: ruleChanges.length,
  readerEqual: reader.beforeSha256 === reader.afterSha256, startupJavaScriptBytes: receipt.startupJavaScriptBytes,
  forbiddenModules: forbiddenModules.length, forbiddenAssets: forbiddenAssets.length }));
