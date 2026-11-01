import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import { setTimeout } from 'node:timers/promises';
import { relicNftAbi, relicMarketAbi } from '../abi.ts';
import { TARGETS } from './proof.mjs';

// viem is already installed by the web workspace. Reuse it without changing package
// manifests or copying ABIs. Node 22.18+ can import the generated TypeScript ABI.
const requireWeb = createRequire(new URL('../../../../apps/web/package.json', import.meta.url));
const { createPublicClient, http, toFunctionSelector } = requireWeb('viem');
const { avalancheFuji } = requireWeb('viem/chains');

export async function loadRuntime() {
  const deployed = JSON.parse(await readFile(new URL('../../deployments/43113.json', import.meta.url), 'utf8'));
  for (const [name, address] of Object.entries(TARGETS)) {
    if (deployed[name]?.toLowerCase() !== address.toLowerCase()) throw new Error(`Repo deployment address mismatch: ${name}`);
  }
  const rpc = avalancheFuji.rpcUrls.default.http[0];
  // Rate-limit starts across ALL read actions, including concurrent log windows.
  // No JSON-RPC batching: Fuji caps the aggregate block range of a batch at 100.
  let nextStart = 0;
  let queue = Promise.resolve();
  const pacedFetch = async (...args) => {
    const turn = queue.then(async () => {
      await setTimeout(Math.max(0, nextStart - Date.now()));
      nextStart = Date.now() + 250;
    });
    queue = turn.catch(() => {});
    await turn;
    return fetch(...args);
  };
  return {
    rpc, toFunctionSelector, abis: { RelicNFT: relicNftAbi, RelicMarket: relicMarketAbi },
    client: createPublicClient({ chain: avalancheFuji, transport: http(rpc, { timeout: 15_000, retryCount: 0, fetchFn: pacedFetch }) }),
  };
}
