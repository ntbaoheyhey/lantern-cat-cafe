#!/usr/bin/env node
// Live health check for the deployed Lantern Cat Café (docs/runbook.md). Dependency-free, Node 20+.
// Read-only: GET requests, anonymous POSTs that must be refused, and eth_call on Fuji.
// Usage: node scripts/check-live.mjs
// Optional overrides (names only): SITE_URL, SUPABASE_URL, FUJI_RPC_URL.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = (process.env.SITE_URL || 'https://taskbarhero-eight.vercel.app').replace(/\/$/, '');
const SUPABASE = (process.env.SUPABASE_URL || 'https://qoalewtxflagoprrxrgh.supabase.co').replace(/\/$/, '');
const RPC = process.env.FUJI_RPC_URL || 'https://api.avax-test.network/ext/bc/C/rpc';
const FUNCTIONS = ['auth-nonce', 'auth-verify', 'game-state', 'idle-claim', 'equip', 'boss-fight', 'upgrade', 'relic-forge', 'relic-mint-report'];
const TIMEOUT_MS = 15000;

const registry = JSON.parse(readFileSync(join(root, 'packages/chain/deployments/43113.json'), 'utf8'));
const readme = readFileSync(join(root, 'README.md'), 'utf8');
const readmeRows = new Map(readme.split('\n')
  .filter(line => line.startsWith('| '))
  .map(line => [line.split('|')[1].trim(), line]));

let failed = 0;
function report(ok, name, detail = '') {
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
const { RelicNFT: nft, RelicMarket: market } = registry;
for (const [name, address] of Object.entries(registry)) {
  await check(`README links the registered ${name} on Fuji`, async () => {
    const expected = `[${address}](https://testnet.snowtrace.io/address/${address}/contract/43113/code)`;
    if (!readmeRows.get(name)?.includes(expected)) throw new Error('Missing or mismatched address or explorer link');
    return address;
  });
}
await check('Fuji RPC reports chain 43113', async () => {
  const id = parseInt(await rpc('eth_chainId', []), 16);
  if (id !== 43113) throw new Error(`chain id ${id}`);
});
if (nft && market) {
  for (const [name, address] of Object.entries(registry)) {
    await check(`${name} has code on Fuji`, async () => {
      const code = await rpc('eth_getCode', [address, 'latest']);
      if (!code || code === '0x') throw new Error('No bytecode at the registered address');
    });
  }
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

console.log(`\n${failed === 0 ? 'ALL CHECKS PASSED' : `${failed} CHECK(S) FAILED`}`);
process.exit(failed === 0 ? 0 : 1);
