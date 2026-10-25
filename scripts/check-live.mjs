#!/usr/bin/env node
// Live health check for the deployed Taskbar Hero (docs/runbook.md). Dependency-free, Node 20+.
// Read-only: GET requests, anonymous POSTs that must be refused, and eth_call on Fuji.
// Usage: node scripts/check-live.mjs
// Optional overrides (names only): SITE_URL, SUPABASE_URL, FUJI_RPC_URL, CHECK_LIVE_V2.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { V2_MARKER, v2FunctionNames, classifyAnonPost, classifyPreflight, moduleScriptsFromHtml, bundleUsesRealApi, v2MarkerVerdict } from './check-live-v2.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = (process.env.SITE_URL || 'https://web-zeta-tan-13.vercel.app').replace(/\/$/, '');
const SUPABASE = (process.env.SUPABASE_URL || 'https://qoalewtxflagoprrxrgh.supabase.co').replace(/\/$/, '');
const RPC = process.env.FUJI_RPC_URL || 'https://api.avax-test.network/ext/bc/C/rpc';
const FUNCTIONS = ['auth-nonce', 'auth-verify', 'game-state', 'idle-claim', 'equip', 'boss-fight', 'upgrade', 'relic-forge', 'relic-mint-report'];
const TIMEOUT_MS = 15000;

// Contract addresses come from README.md (the "On-chain" table), the public record of the deployment.
const readme = readFileSync(join(root, 'README.md'), 'utf8');
const addressOf = (name) => {
  const m = readme.match(new RegExp(`\\|\\s*${name}[^|]*\\|[^|]*?(0x[0-9a-fA-F]{40})`));
  if (!m) throw new Error(`${name} address not found in README.md`);
  return m[1];
};

let failed = 0;
function report(ok, name, detail = '') {
  if (ok === 'skip') {
    console.log(`SKIP ${name}${detail ? ` - ${detail}` : ''}`);
    return;
  }
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` - ${detail}` : ''}`);
}
async function check(name, fn) {
  try {
    const detail = await fn();
    report(true, name, detail || '');
  } catch (e) {
    const cause = e?.cause?.code || e?.cause?.message;
    report(false, name, `${e?.message || e}${cause ? ` (${cause})` : ''}`);
  }
}
const fetchT = (url, init = {}) => fetch(url, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS) });

async function rpc(method, params) {
  const res = await fetchT(RPC, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
  if (!res.ok) throw new Error(`RPC HTTP ${res.status}`);
  const body = await res.json();
  if (body.error) throw new Error(`RPC error: ${body.error.message}`);
  return body.result;
}
const call = (to, data) => rpc('eth_call', [{ to, data }, 'latest']);
const word = (hex, i = 0) => hex.slice(2 + i * 64, 2 + (i + 1) * 64);
const addr = (hex) => `0x${word(hex).slice(24)}`.toLowerCase();
const decodeString = (hex) => {
  const len = parseInt(word(hex, 1), 16);
  return Buffer.from(hex.slice(2 + 128, 2 + 128 + len * 2), 'hex').toString('utf8');
};

console.log(`Site ${SITE}\nSupabase ${SUPABASE}\nFuji RPC ${RPC}\n`);

// 1. Web app
await check('site loads', async () => {
  const res = await fetchT(`${SITE}/`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  if (!/<div id="root"/.test(html)) throw new Error('no #root in the page');
  return `HTTP ${res.status}`;
});

// 2. Edge Functions: an anonymous POST must be refused (4xx), never a server error or unreachable.
for (const fn of FUNCTIONS) {
  await check(`function ${fn} refuses anonymous POST`, async () => {
    const res = await fetchT(`${SUPABASE}/functions/v1/${fn}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
    // auth-nonce is public and answers 200 with a nonce; every other function needs a session.
    if (fn === 'auth-nonce') {
      if (res.status !== 200) throw new Error(`HTTP ${res.status}, expected 200`);
    } else if (res.status < 400 || res.status >= 500) {
      throw new Error(`HTTP ${res.status}, expected a 4xx`);
    }
    return `HTTP ${res.status}`;
  });
}

// 3. Relic metadata and images
for (const id of [1, 2, 3, 4]) {
  await check(`relic ${id} metadata and image`, async () => {
    const res = await fetchT(`${SITE}/relics/${id}.json`);
    if (!res.ok) throw new Error(`json HTTP ${res.status}`);
    const meta = await res.json();
    if (!meta.name || !meta.image) throw new Error('metadata missing name or image');
    const img = await fetchT(meta.image);
    if (!img.ok) throw new Error(`image HTTP ${img.status}`);
    const type = img.headers.get('content-type') || '';
    if (!type.startsWith('image/')) throw new Error(`image content-type ${type}`);
    return `${meta.name}, ${type}`;
  });
}
await check('relic 64-hex metadata path (what wallets request)', async () => {
  const res = await fetchT(`${SITE}/relics/${'0'.repeat(63)}1.json`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return `HTTP ${res.status}`;
});

// 4. Fuji, read-only
let nft;
let market;
await check('README has both contract addresses', async () => {
  nft = addressOf('RelicNFT');
  market = addressOf('RelicMarket');
  return `${nft}, ${market}`;
});
await check('Fuji RPC reports chain 43113', async () => {
  const id = parseInt(await rpc('eth_chainId', []), 16);
  if (id !== 43113) throw new Error(`chain id ${id}`);
});
if (nft && market) {
  await check('RelicNFT has code', async () => {
    const code = await rpc('eth_getCode', [nft, 'latest']);
    if (code === '0x') throw new Error('no contract at the address');
  });
  await check('RelicNFT signer() is set', async () => {
    const a = addr(await call(nft, '0x238ac933'));
    if (/^0x0{40}$/.test(a)) throw new Error('signer is the zero address');
    return a;
  });
  await check('RelicNFT owner() is set', async () => {
    const a = addr(await call(nft, '0x8da5cb5b'));
    if (/^0x0{40}$/.test(a)) throw new Error('owner is the zero address');
    return a;
  });
  await check('RelicNFT uri(1) points at the site', async () => {
    const uri = decodeString(await call(nft, `0x0e89341c${'0'.repeat(63)}1`));
    if (!uri.startsWith(SITE)) throw new Error(`uri is ${uri}`);
    return uri;
  });
  await check('RelicMarket relicNFT() is the RelicNFT', async () => {
    const a = addr(await call(market, '0x60c9c82b'));
    if (a !== nft.toLowerCase()) throw new Error(`points at ${a}`);
  });
}

// 5. v2 readiness before/after the cut-over. The v1 sections above stay unchanged.
const v2Mode = process.env.CHECK_LIVE_V2 ?? 'pre';
if (!['pre', 'post', 'off'].includes(v2Mode)) {
  report(false, 'CHECK_LIVE_V2 mode', 'expected pre, post or off');
} else if (v2Mode !== 'off') {
  let functions = [];
  await check('v2 function folders', async () => {
    functions = v2FunctionNames(join(root, 'supabase/functions'));
    if (!functions.length) throw new Error('no v2 function folders');
    return `${functions.length} folders`;
  });
  for (const fn of functions) {
    await check(`function ${fn} refuses anonymous POST`, async () => {
      const res = await fetchT(`${SUPABASE}/functions/v1/${fn}`, {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}',
      });
      const verdict = classifyAnonPost(res.status, await res.json().catch(() => null));
      if (!verdict.ok) throw new Error(verdict.detail);
      return verdict.detail;
    });
    await check(`function ${fn} CORS preflight`, async () => {
      const res = await fetchT(`${SUPABASE}/functions/v1/${fn}`, {
        method: 'OPTIONS', headers: { Origin: SITE, 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'content-type' },
      });
      const verdict = classifyPreflight(res.status, res.headers, SITE);
      if (!verdict.ok) throw new Error(verdict.detail);
      return verdict.detail;
    });
  }
  let bundle;
  await check('live bundle uses the real API', async () => {
    const page = await fetchT(`${SITE}/`);
    if (!page.ok) throw new Error(`HTML HTTP ${page.status}`);
    const scripts = moduleScriptsFromHtml(await page.text(), SITE);
    if (!scripts.length) throw new Error('no same-origin /assets/*.js module scripts');
    const chunks = [];
    for (const url of scripts) {
      // Reject redirects to keep every fetched module on the validated origin/path.
      const res = await fetchT(url, { redirect: 'error' });
      if (!res.ok) throw new Error(`module HTTP ${res.status}`);
      chunks.push(await res.text());
    }
    bundle = chunks.join('\n');
    if (!bundleUsesRealApi(bundle, SUPABASE)) throw new Error('bundle has no Supabase URL: mock API?');
    return `${scripts.length} module script(s)`;
  });
  if (!V2_MARKER) {
    report('skip', 'live bundle v2 flag', 'no v2-only marker (see reports/check-live-v2.md)');
  } else {
    await check('live bundle v2 flag', async () => {
      if (bundle === undefined) throw new Error('bundle unavailable');
      if (v2MarkerVerdict(bundle, V2_MARKER, v2Mode) !== 'pass') {
        throw new Error(`${v2Mode}: expected marker ${V2_MARKER} ${v2Mode === 'post' ? 'present' : 'absent'}`);
      }
      return `${v2Mode}: marker ${V2_MARKER} ${v2Mode === 'post' ? 'present' : 'absent'}`;
    });
  }
}

console.log(`\n${failed === 0 ? 'ALL CHECKS PASSED' : `${failed} CHECK(S) FAILED`}`);
process.exit(failed === 0 ? 0 : 1);
