import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readdirSync, readFileSync } from 'node:fs';
import { classifyV2Response, checkV2, V2_FUNCTIONS } from './check-live.mjs';

const response = (status, headers = {}) => ({ status, headers: new Headers(headers) });
const origin = 'https://taskbarhero-eight.vercel.app';
const cors = {
  'access-control-allow-origin': origin,
  'access-control-allow-methods': 'POST, OPTIONS',
  'access-control-allow-headers': 'authorization, content-type',
};

test('unsigned POST requires exactly 401', () => {
  assert.equal(classifyV2Response('anonymous', response(401)).ok, true);
  for (const status of [200, 400, 403, 404, 429, 500]) {
    assert.equal(classifyV2Response('anonymous', response(status)).ok, false);
  }
});
test('503 fails with a budget migration hint for every probe', () => {
  for (const kind of ['options', 'anonymous', 'oversized']) {
    const result = classifyV2Response(kind, response(503));
    assert.equal(result.ok, false);
    assert.match(result.detail, /budgets migration missing\?/);
  }
});
test('network errors fail', () => {
  for (const kind of ['options', 'anonymous', 'oversized']) {
    assert.deepEqual(classifyV2Response(kind, new Error('offline')), { ok: false, detail: 'network error' });
    assert.equal(classifyV2Response(kind, undefined).ok, false);
  }
});
test('preflight requires 2xx and usable CORS headers', () => {
  for (const status of [200, 204]) assert.equal(classifyV2Response('options', response(status, cors)).ok, true);
  for (const status of [301, 401, 500]) assert.equal(classifyV2Response('options', response(status, cors)).ok, false);
  for (const header of Object.keys(cors)) {
    assert.equal(classifyV2Response('options', response(204, { ...cors, [header]: '' })).ok, false);
  }
  assert.equal(classifyV2Response('options', response(204, { ...cors, 'access-control-allow-origin': 'https://other.example' })).ok, false);
  assert.equal(classifyV2Response('options', response(204, { ...cors, 'access-control-allow-methods': 'GET, OPTIONS' })).ok, false);
  assert.equal(classifyV2Response('options', response(204, { ...cors, 'access-control-allow-headers': 'authorization' })).ok, false);
});
test('oversized body requires 400 or 413, and reports auth-before-body behavior', () => {
  for (const status of [400, 413]) assert.equal(classifyV2Response('oversized', response(status)).ok, true);
  for (const status of [200, 401, 500]) assert.equal(classifyV2Response('oversized', response(status)).ok, false);
  assert.match(classifyV2Response('oversized', response(401)).detail, /authentication may run before body validation/);
});
test('all nine routes get three probes without credentials; oversized JSON exceeds 8192 bytes', async () => {
  const requests = [];
  await checkV2(async (url, init) => {
    requests.push({ url, ...init });
    if (init.method === 'OPTIONS') return response(204, cors);
    return response(init.body === '{}' ? 401 : 413);
  });
  assert.equal(requests.length, 27);
  assert.equal(new Set(requests.map(r => r.url)).size, 9);
  const repositoryRoutes = readdirSync(new URL('../supabase/functions/', import.meta.url))
    .filter(name => name.startsWith('v2-')).sort();
  assert.deepEqual([...V2_FUNCTIONS].sort(), repositoryRoutes);
  for (const fn of V2_FUNCTIONS) assert.equal(requests.filter(r => r.url.endsWith(`/${fn}`)).length, 3);
  for (const request of requests) {
    assert.equal(new Headers(request.headers).has('authorization'), false);
    assert.equal(new Headers(request.headers).has('apikey'), false);
    if (request.body && request.body !== '{}') {
      assert.ok(Buffer.byteLength(request.body) > 8192);
      assert.equal(typeof JSON.parse(request.body).padding, 'string');
    }
  }
});

test('cut-over History contains the retired procedure; migration table matches the branch exactly', () => {
  const doc = readFileSync(new URL('../docs/cutover-v2.md', import.meta.url), 'utf8');
  const current = doc.split('## History')[0];
  assert.doesNotMatch(current, /code flag flip|ai\/codex-v29-founder-grant/);
  const expected = readdirSync(new URL('../supabase/migrations/', import.meta.url))
    .filter(f => f.endsWith('.sql') && f.slice(0, 14) > '20261102000000').sort();
  const listed = [...doc.matchAll(/^\| \[(\d{14}_[^\]]+\.sql)\]/gm)].map(m => m[1]);
  assert.deepEqual(listed, expected);
});
test('manual deploy lists the same 18 functions and options as the existing workflow', () => {
  const doc = readFileSync(new URL('../docs/cutover-v2.md', import.meta.url), 'utf8');
  const workflow = readFileSync(new URL('../.github/workflows/deploy-functions.yml', import.meta.url), 'utf8');
  const functions = workflow.match(/^  FUNCTIONS: (.+)$/m)[1];
  assert.ok(doc.includes(`supabase functions deploy ${functions} --project-ref qoalewtxflagoprrxrgh --use-api --no-verify-jwt`));
  assert.deepEqual(functions.split(' ').filter(f => f.startsWith('v2-')).sort(), [...V2_FUNCTIONS].sort());
});
test('optional release follows section 7 with local proof and default-OFF flags', () => {
  for (const file of ['cutover-v2.md', 'go-live.md', 'runbook.md']) {
    const doc = readFileSync(new URL(`../docs/${file}`, import.meta.url), 'utf8').split('## History')[0];
    assert.match(doc, /user-approved mission section 7/);
    assert.match(doc, /default-OFF/);
    assert.match(doc, /PGlite/);
    assert.doesNotMatch(doc, /user.only|not authorization for an agent/i);
  }
  const doc = readFileSync(new URL('../docs/cutover-v2.md', import.meta.url), 'utf8');
  assert.match(doc, /already-configured Supabase CLI login/);
  assert.match(doc, /Vercel CLI is already logged in/);
  assert.match(doc, /entire live go\/no-go checklist is green/);
  assert.match(doc, /rollback has been tested/);
});
