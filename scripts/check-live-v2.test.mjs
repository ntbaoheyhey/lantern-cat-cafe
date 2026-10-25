import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { v2FunctionNames, classifyAnonPost, classifyPreflight, moduleScriptsFromHtml, bundleUsesRealApi, v2MarkerVerdict } from './check-live-v2.mjs';

const site = 'https://example.test';
test('discovers only v2 directories, sorted, including a future boss function', () => {
  const dir = mkdtempSync(join(tmpdir(), 'check-live-v2-'));
  try {
    for (const name of ['v2-b', 'v2-a', 'boss-fight', '_shared']) mkdirSync(join(dir, name));
    writeFileSync(join(dir, 'v2-file'), '');
    assert.deepEqual(v2FunctionNames(dir), ['v2-a', 'v2-b']);
    mkdirSync(join(dir, 'v2-boss-fight'));
    assert.deepEqual(v2FunctionNames(dir), ['v2-a', 'v2-b', 'v2-boss-fight']);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
test('anonymous POST requires exactly 401 and distinguishes function from gateway', () => {
  assert.deepEqual(classifyAnonPost(401, { error: 'unauthenticated' }), { ok: true, detail: 'function' });
  for (const body of [{ msg: 'Missing authorization header' }, null, 'Unauthorized']) {
    assert.deepEqual(classifyAnonPost(401, body), { ok: true, detail: 'gateway' });
  }
  assert.deepEqual(classifyAnonPost(404, {}), { ok: false, detail: 'not deployed' });
  for (const status of [200, 204, 400, 403, 429, 500]) assert.equal(classifyAnonPost(status, {}).ok, false);
});
test('CORS requires a 2xx and the matching or wildcard origin', () => {
  for (const origin of [site, '*']) {
    const verdict = classifyPreflight(204, new Headers({ 'Access-Control-Allow-Origin': origin }), site);
    assert.equal(verdict.ok, true);
    assert.ok(verdict.detail.includes(origin));
  }
  assert.equal(classifyPreflight(200, new Headers({ 'access-control-allow-origin': site }), site).ok, true);
  assert.equal(classifyPreflight(204, new Headers(), site).ok, false);
  assert.equal(classifyPreflight(204, new Headers({ 'access-control-allow-origin': 'https://other.test' }), site).ok, false);
  for (const status of [301, 401, 404, 500]) {
    assert.equal(classifyPreflight(status, new Headers({ 'access-control-allow-origin': site }), site).ok, false);
  }
});
test('HTML modules resolve against SITE and ignore external, classic and non-asset scripts', () => {
  const html = `<script type="module" src="/assets/index-abc.js"></script>
    <script src='/assets/second.js' type='module'></script>
    <script TYPE=module SRC=/assets/third.js></script>
    <script type="module" src="https://evil.test/assets/evil.js"></script>
    <script type="module" src="//evil.test/assets/evil.js"></script>
    <script src="/assets/classic.js"></script>
    <script type="module" src="/outside.js"></script>
    <script type="module" src="/assets/style.css"></script>
    <script type="module" src="http://["></script>
    <!-- <script type="module" src="/assets/comment.js"></script> -->`;
  assert.deepEqual(moduleScriptsFromHtml(html, site), ['index-abc', 'second', 'third'].map((name) => `${site}/assets/${name}.js`));
  assert.deepEqual(moduleScriptsFromHtml(`<script type="module" src="${site}/assets/absolute.js"></script>`, site), [`${site}/assets/absolute.js`]);
  const many = Array.from({ length: 12 }, (_, i) => `<script type="module" src="/assets/${i}.js"></script>`).join('');
  assert.deepEqual(moduleScriptsFromHtml(many, site), Array.from({ length: 10 }, (_, i) => `${site}/assets/${i}.js`));
  const duplicate = '<script type="module" src="/assets/index.js"></script>';
  assert.deepEqual(moduleScriptsFromHtml(duplicate + duplicate, site), [`${site}/assets/index.js`]);
});
test('real API detection looks for the configured Supabase host', () => {
  assert.equal(bundleUsesRealApi('const url="https://project.supabase.co"', 'https://project.supabase.co/'), true);
  assert.equal(bundleUsesRealApi('mock API', 'https://project.supabase.co'), false);
  assert.equal(bundleUsesRealApi('https://other.supabase.co', 'https://project.supabase.co'), false);
});
test('marker verdict covers pre/post with present/absent markers, and skip', () => {
  for (const mode of ['pre', 'post']) {
    assert.equal(v2MarkerVerdict('v2-shell', 'v2-shell', mode), mode === 'post' ? 'pass' : 'fail');
    assert.equal(v2MarkerVerdict('v1 only', 'v2-shell', mode), mode === 'pre' ? 'pass' : 'fail');
    assert.equal(v2MarkerVerdict('anything', '', mode), 'skip');
  }
  assert.equal(v2MarkerVerdict('v2-shell', 'v2-shell', 'off'), 'skip');
});
test('fresh import makes no network request', async () => {
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = () => { calls++; throw new Error('network forbidden'); };
  try { await import('./check-live-v2.mjs?no-network'); }
  finally { globalThis.fetch = original; }
  assert.equal(calls, 0);
});
test('real repository has v2-state and valid v2 directory names', () => {
  const names = v2FunctionNames(fileURLToPath(new URL('../supabase/functions', import.meta.url)));
  assert.ok(names.includes('v2-state'));
  for (const name of names) assert.match(name, /^v2-[a-z-]+$/);
});

test('live runner preserves v1 lines in off mode and counts v2 failures in its exit status', async () => {
  const { spawnSync } = await import('node:child_process');
  const script = new URL('./check-live.mjs', import.meta.url).href;
  const run = (mode) => spawnSync(process.execPath, ['--input-type=module', '-e',
    `globalThis.fetch = async () => { throw new Error('offline fixture'); }; await import(${JSON.stringify(script)});`],
  { encoding: 'utf8', env: { ...process.env, CHECK_LIVE_V2: mode } });
  const off = run('off');
  const pre = run('pre');
  assert.equal(off.status, 1, off.stderr);
  assert.equal(pre.status, 1, pre.stderr);
  assert.doesNotMatch(off.stdout, /v2 function|function v2-|live bundle/);
  const oldLines = off.stdout.trimEnd().split('\n').slice(0, -2);
  assert.deepEqual(pre.stdout.split('\n').slice(0, oldLines.length), oldLines);
  assert.match(pre.stdout, /FAIL  function v2-state refuses anonymous POST - offline fixture/);
  assert.match(pre.stdout, /FAIL  function v2-state CORS preflight - offline fixture/);
  assert.match(pre.stdout, /FAIL  live bundle uses the real API - offline fixture/);
  for (const result of [off, pre]) {
    const failures = result.stdout.split('\n').filter((line) => line.startsWith('FAIL  ')).length;
    assert.ok(result.stdout.includes(`${failures} CHECK(S) FAILED`), result.stdout);
  }
});
