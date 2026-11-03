import { expect, test, type Page } from '../support/test';
import { relicMarketAbi, relicNftAbi } from '../../../../packages/chain/src/abi';
import { encodeAbiParameters, encodeEventTopics, encodeFunctionData, encodeFunctionResult, parseAbiParameters, zeroAddress } from 'viem';
import { mockV2Save } from '../../src/api/mockV2Fixtures';
import fs from 'node:fs';
import path from 'node:path';
const storageKey = fs.readFileSync('src/api/MockGameApiV2.ts', 'utf8').match(/export const MOCK_V2_STORAGE_KEY = '([^']+)'/)![1]!;
const contracts = JSON.parse(fs.readFileSync(path.resolve('../../packages/chain/deployments/43113.json'), 'utf8')) as { RelicNFT: `0x${string}`; RelicMarket: `0x${string}` };
const hash = `0x${'ab'.repeat(32)}` as const;
const tx = `0x${'cd'.repeat(32)}` as const;
const actor = `0x${'ef'.repeat(20)}` as const;
const linkedCall = encodeFunctionData({ abi: relicMarketAbi, functionName: 'relicNFT' });
const countCall = encodeFunctionData({ abi: relicMarketAbi, functionName: 'activeListingCount' });
interface Rpc { id: number; method: string; params?: unknown[] }
async function fixture(page: Page) {
  const save = mockV2Save('midGame', { nowMs: Date.now() });
  await page.addInitScript(({ key, save }) => { localStorage.setItem(key, save); localStorage.setItem('taskbar-hero.howToPlaySeen', '1'); }, { key: storageKey, save: JSON.stringify(save) });
  const requests: Rpc[] = [];
  let mode: 'good' | 'partial' | 'wrong-chain' = 'good';
  await page.route('https://api.avax-test.network/ext/bc/C/rpc', async route => {
    const payload = route.request().postDataJSON() as Rpc | Rpc[];
    const response = (rpc: Rpc) => {
      requests.push(rpc); let result: unknown;
      switch (rpc.method) {
        case 'eth_chainId': result = mode === 'wrong-chain' ? '0x1' : '0xa869'; break;
        case 'eth_blockNumber': result = '0x3e8'; break;
        case 'eth_getBlockByNumber': result = { number: '0x3e8', hash, timestamp: '0x6726a000', transactions: [], gasLimit: '0x989680', gasUsed: '0x0', size: '0x200', difficulty: '0x0', totalDifficulty: '0x0', nonce: '0x0000000000000000', miner: actor, baseFeePerGas: '0x1', logsBloom: `0x${'00'.repeat(256)}`, extraData: '0x', parentHash: hash, receiptsRoot: hash, sha3Uncles: hash, stateRoot: hash, transactionsRoot: hash, uncles: [], mixHash: hash }; break;
        case 'eth_getCode': result = '0x6001600055'; break;
        case 'eth_call': {
          const call = rpc.params![0] as { to: string; data: string };
          expect(call.to.toLowerCase()).toBe(contracts.RelicMarket!.toLowerCase());
          if (call.data === linkedCall) result = encodeFunctionResult({ abi: relicMarketAbi, functionName: 'relicNFT', result: contracts.RelicNFT! });
          else { expect(call.data).toBe(countCall); result = encodeFunctionResult({ abi: relicMarketAbi, functionName: 'activeListingCount', result: 1n }); }
          break;
        }
        case 'eth_getLogs':
          if (mode === 'partial') return { jsonrpc: '2.0', id: rpc.id, error: { code: -32000, message: 'Recent event read unavailable' } };
          result = [{ address: contracts.RelicNFT, blockNumber: '0x3e8', blockHash: hash, transactionHash: tx, transactionIndex: '0x0', logIndex: '0x0', removed: false,
            topics: encodeEventTopics({ abi: relicNftAbi, eventName: 'TransferSingle', args: { operator: actor, from: zeroAddress, to: actor } }), data: encodeAbiParameters(parseAbiParameters('uint256 id, uint256 value'), [1n, 1n]) }]; break;
        default: throw new Error(`Unexpected RPC method: ${rpc.method}`);
      }
      return { jsonrpc: '2.0', id: rpc.id, result };
    };
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(Array.isArray(payload) ? payload.map(response) : response(payload)) });
  });
  return { requests, mode: (value: typeof mode) => { mode = value; } };
}
async function fit(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth || document.documentElement.scrollHeight > innerHeight)).toBe(false);
  const header = page.getByRole('button', { name: 'Refresh proof' }); await expect(header).toBeInViewport({ ratio: 1 });
  const bad = await page.locator('.fuji-proof a').evaluateAll(nodes => nodes.filter(node => { const box = node.getBoundingClientRect(); return box.left < 0 || box.right > innerWidth + 1; }).map(node => node.textContent));
  expect(bad).toEqual([]);
}
async function captureReview(page: Page, state: string, width: number) {
  if (!process.env.CXR2_SCREENSHOTS) return;
  fs.mkdirSync(process.env.CXR2_SCREENSHOTS, { recursive: true });
  await page.screenshot({ path: path.join(process.env.CXR2_SCREENSHOTS, `proof-fixture-${state}-${width}.png`) });
}
for (const size of [{ width: 1280, height: 720 }, { width: 1600, height: 900 }]) {
  test(`CXC2 lazy guest proof, bounded read RPC and cache ${size.width}`, async ({ page }) => {
    await page.setViewportSize(size); await page.clock.install(); const fx = await fixture(page); const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message)); page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.goto('/'); await page.getByRole('tab', { name: 'Help', exact: true }).click();
    await expect(page.getByRole('tab', { name: 'Guide', exact: true })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('region', { name: 'Avalanche Fuji on-chain proof' })).toHaveCount(0); expect(fx.requests).toEqual([]);
    await page.getByRole('tab', { name: 'On-chain proof' }).focus(); await page.keyboard.press('Enter');
    await expect(page.getByTestId('proof-snapshot')).toContainText('1000'); await expect(page.getByTestId('proof-linkage')).toContainText('Matches');
    await expect(page.getByRole('link', { name: `View transaction ${tx.slice(0, 8)}…${tx.slice(-6)}` })).toHaveAttribute('href', `https://testnet.snowtrace.io/tx/${tx}`);
    await expect(page.getByText('Not exposed by this NFT contract')).toBeVisible(); await fit(page);
    await captureReview(page, 'loaded', size.width);
    const logRead = fx.requests.find(request => request.method === 'eth_getLogs')!;
    expect(logRead.params).toEqual([{ address: [contracts.RelicNFT, contracts.RelicMarket], fromBlock: '0x385', toBlock: '0x3e8', topics: [] }]);
    for (let i = 0; i < 5; i++) await page.getByRole('button', { name: 'Refresh proof' }).click();
    expect(fx.requests.filter(request => request.method === 'eth_chainId')).toHaveLength(1);
    if (process.env.CXC2_SCREENSHOTS) { fs.mkdirSync(process.env.CXC2_SCREENSHOTS, { recursive: true }); await page.screenshot({ path: path.join(process.env.CXC2_SCREENSHOTS, `proof-${size.width}.png`) }); }
    await page.getByRole('tab', { name: 'Home', exact: true }).click(); await page.clock.fastForward(31_000);
    expect(fx.requests.filter(request => request.method === 'eth_chainId')).toHaveLength(1);
    fx.mode('partial'); await page.getByRole('tab', { name: 'Help', exact: true }).click();
    await expect(page.getByText(/Recent events unavailable/)).toBeVisible(); await expect(page.getByTestId('proof-code-RelicNFT')).toContainText('5 bytes'); await fit(page);
    await captureReview(page, 'partial-error', size.width);
    expect(fx.requests.filter(request => request.method === 'eth_chainId')).toHaveLength(2);
    expect([...new Set(fx.requests.map(request => request.method))].sort()).toEqual(['eth_blockNumber', 'eth_call', 'eth_chainId', 'eth_getBlockByNumber', 'eth_getCode', 'eth_getLogs'].sort()); expect(errors).toEqual([]);
  });
  test(`CXC2 wrong-chain RPC keeps proof unavailable ${size.width}`, async ({ page }) => {
    await page.setViewportSize(size); const fx = await fixture(page); fx.mode('wrong-chain');
    await page.goto('/'); await page.getByRole('tab', { name: 'Help', exact: true }).click(); await page.getByRole('tab', { name: 'On-chain proof' }).click();
    await expect(page.getByRole('alert')).toContainText('unavailable'); await expect(page.getByTestId('proof-snapshot')).toHaveCount(0);
    expect(fx.requests.map(request => request.method)).toEqual(['eth_chainId']); await fit(page);
    await captureReview(page, 'unavailable', size.width);
  });
}
