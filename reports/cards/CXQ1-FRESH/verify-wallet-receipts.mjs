#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { verifyWalletRun, validateManifest } from './wallet-receipts.mjs';

// CLI: node verify-wallet-receipts.mjs SOURCE_ROOT PUBLIC_MANIFEST NEW_REPORT
// The endpoint is fixed, public and Fuji-only. Never reads env keys or creates an account.
try {
  const [root, manifestPath, out, ...extra] = process.argv.slice(2);
  if (!root || !manifestPath || !out || extra.length) throw new Error('ARGUMENTS_INVALID');
  const text = await readFile(manifestPath, 'utf8');
  if (text.length > 4096) throw new Error('MANIFEST_TOO_LARGE');
  const manifest = JSON.parse(text);
  validateManifest(manifest);
  const require = createRequire(resolve(root, 'apps/web/package.json'));
  const { createPublicClient, http, decodeEventLog, decodeFunctionData } = require('viem');
  const { avalancheFuji } = require('viem/chains');
  const source = await readFile(resolve(root, 'packages/chain/src/abi.ts'), 'utf8');
  const abi = name => {
    const match = source.match(new RegExp('export const ' + name + ' = (\\[[\\s\\S]*?\\]) as const;'));
    if (!match) throw new Error('ABI_UNAVAILABLE');
    return JSON.parse(match[1]);
  };
  const client = createPublicClient({ chain: avalancheFuji, transport: http('https://api.avax-test.network/ext/bc/C/rpc', { timeout: 15000, retryCount: 0 }) });
  const report = await verifyWalletRun(manifest, { client, nftAbi: abi('relicNftAbi'), marketAbi: abi('relicMarketAbi'), decodeEventLog, decodeFunctionData });
  await writeFile(out, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
  console.log(report.status);
} catch (error) {
  // Never print RPC payloads, supplied manifest text, signatures, or raw errors.
  console.error('NOT_VERIFIED', /^[A-Z_]+$/.test(error?.message) ? error.message : 'INPUT_OR_RPC_UNAVAILABLE');
  process.exitCode = 1;
}
