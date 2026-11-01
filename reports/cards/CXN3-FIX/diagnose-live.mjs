import { writeFileSync, appendFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { classifyV2Response } from '/Users/bao/.codex/worktrees/mega-cxn3-preflight-280ff4b/taskbar-hero/scripts/check-live.mjs';

const card = dirname(fileURLToPath(import.meta.url));
const out = resolve(card, 'diagnosis-2026-11-02');
mkdirSync(out, { recursive: true });
const resultsPath = resolve(out, 'probe-results.jsonl');
if (existsSync(resultsPath)) throw new Error('Refusing to overwrite previous probe evidence');
const origin = 'https://taskbarhero-eight.vercel.app';
const base = 'https://qoalewtxflagoprrxrgh.supabase.co/functions/v1/';
const plan = [
  ['v2-boss-fight', 'options'], ['v2-boss-fight', 'anonymous'],
  ['v2-boss-fight', 'oversized'], ['v2-state', 'anonymous'], ['v2-state', 'oversized'],
];
const results = [];
writeFileSync(resolve(out, 'runtime.json'), JSON.stringify({ status: 'RUNNING', pid: process.pid, startedAt: new Date().toISOString(), requestsPlanned: plan.length }, null, 2));
for (const [route, kind] of plan) {
  const headers = { Origin: origin };
  const init = kind === 'options'
    ? { method: 'OPTIONS', headers: { ...headers, 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'content-type' } }
    : { method: 'POST', headers: { ...headers, 'content-type': 'application/json' }, body: kind === 'oversized' ? JSON.stringify({ padding: 'x'.repeat(8193) }) : '{}' };
  const started = performance.now();
  const row = { route, kind, startedAt: new Date().toISOString(), timeoutMs: 15000, requestBytes: init.body ? Buffer.byteLength(init.body) : 0, credentialsSent: false, retryCount: 0 };
  try {
    const response = await fetch(base + route, { ...init, signal: AbortSignal.timeout(15000) });
    row.status = response.status;
    row.classification = classifyV2Response(kind, response, origin);
    row.allowOrigin = response.headers.get('access-control-allow-origin');
    row.contentType = response.headers.get('content-type');
    await response.body?.cancel();
  } catch (error) {
    row.status = null;
    row.errorName = error instanceof Error ? error.name : 'UnknownError';
    row.classification = classifyV2Response(kind, error instanceof Error ? error : new Error('UnknownError'), origin);
  }
  row.elapsedMs = Math.round(performance.now() - started);
  results.push(row);
  appendFileSync(resultsPath, JSON.stringify(row) + '\n');
}
writeFileSync(resolve(out, 'summary.json'), JSON.stringify({ observedAt: new Date().toISOString(), sourceHead: 'cd274ab9b95d355e08c61452694cc09052f17bb8', scope: 'Five read-only OPTIONS/unsigned refusal probes only. No auth, API key, session, nonce, wallet, SQL or game action. No retries. Not a full v2/live certificate.', results }, null, 2));
writeFileSync(resolve(out, 'runtime.json'), JSON.stringify({ status: 'DONE_DIAGNOSTIC', pid: null, completedAt: new Date().toISOString(), requests: results.length, passes: results.filter(r => r.classification.ok).length, failures: results.filter(r => !r.classification.ok).length }, null, 2));
console.log(JSON.stringify(results.map(({ route, kind, status, elapsedMs, classification, errorName }) => ({ route, kind, status, elapsedMs, ok: classification.ok, errorName }))));
