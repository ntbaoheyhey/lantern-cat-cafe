import { describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { relicNftAbi, relicMarketAbi } from '../abi';
import { formatEvent, friendlyError, humanTable, json, proveChain, recentEvents, selectorChecks, TARGETS } from './proof.mjs';
import { runCli } from './cli.mjs';

const requireWeb = createRequire(new URL('../../../../apps/web/package.json', import.meta.url));
const { toFunctionSelector } = requireWeb('viem');
const abis = { RelicNFT: relicNftAbi, RelicMarket: relicMarketAbi };
const hash = `0x${'ab'.repeat(32)}`;
const owner = `0x${'12'.repeat(20)}`;
const signer = `0x${'34'.repeat(20)}`;
const codeFor = (abi) => `0x${abi.filter((item) => item.type === 'function').map((item) => `8063${toFunctionSelector(item).slice(2)}1461000057`).join('')}00`;
const log = (eventName, blockNumber = 90n, logIndex = 0, args = { relicId: 42n }) => ({ eventName, blockNumber, logIndex, transactionHash: hash, args });

function fixture(overrides = {}) {
  const client = {
    getChainId: vi.fn(async () => 43113),
    getBlockNumber: vi.fn(async () => 100n),
    getCode: vi.fn(async ({ address, blockNumber }) => blockNumber < 80n ? '0x' : codeFor(address === TARGETS.RelicNFT ? relicNftAbi : relicMarketAbi)),
    readContract: vi.fn(async ({ functionName }) => functionName === 'relicNFT' ? TARGETS.RelicNFT : functionName === 'owner' ? owner : signer),
    getLogs: vi.fn(async ({ address, fromBlock, toBlock }) => {
      const logs = address === TARGETS.RelicNFT
        ? [log('TransferSingle', 90n, 1, { id: 42n }), log('TransferBatch', 90n, 0, { ids: [7n, 8n] })]
        : [log('Listed', 91n), log('Bought', 92n)];
      return logs.filter((item) => item.blockNumber >= fromBlock && item.blockNumber <= toBlock);
    }),
    ...overrides,
  };
  return { client, abis, toFunctionSelector, rpc: 'https://public-fuji.invalid', now: () => '2026-11-01T00:00:00.000Z' };
}

async function cli(runtime, args = [], save = vi.fn()) {
  let output = '';
  let table = '';
  const exitCode = await runCli(args, {
    loadRuntime: async () => runtime,
    stdout: (text) => { output += text; }, stderr: (text) => { table += text; }, save,
  });
  return { exitCode, output, table, save, report: JSON.parse(output) };
}

describe('read-only Fuji proof', () => {
  it('passes every check on a fixture using the actual repo ABIs', async () => {
    const runtime = fixture();
    const report = await proveChain(runtime);
    expect(report.status).toBe('VERIFIED');
    expect(report.checks.every((item) => item.ok)).toBe(true);
    expect(report.contracts.RelicNFT.metadata.owner.value).toBe(owner);
    expect(report.contracts.RelicNFT.metadata.signer.value).toBe(signer);
    for (const name of ['name', 'symbol', 'totalSupply']) expect(report.contracts.RelicNFT.metadata[name].status).toBe('NOT EXPOSED');
    expect(report.contracts.RelicMarket.relicNFT).toBe(TARGETS.RelicNFT);
    expect(report.contracts.RelicNFT.events.deploymentBlock).toBe('80');
    expect(report.contracts.RelicNFT.events.historyExhausted).toBe(true);
    expect(report.contracts.RelicNFT.events.groups.Transfer).toHaveLength(2);
    expect(JSON.parse(json(report)).contracts.RelicMarket.events.groups.Sold[0].args.relicId).toBe('42');
    for (const [params] of runtime.client.readContract.mock.calls) expect(params.blockNumber).toBe(100n);
    expect(Object.keys(runtime.client).sort()).toEqual(['getBlockNumber', 'getChainId', 'getCode', 'getLogs', 'readContract']);
  });

  it('fails wrong chain id and stops before reading target addresses', async () => {
    const runtime = fixture({ getChainId: vi.fn(async () => 1) });
    const report = await proveChain(runtime);
    expect(report.status).toBe('NOT VERIFIED');
    expect(report.checks[0]).toMatchObject({ ok: false, detail: 'Wrong chain id: expected 43113, received 1' });
    expect(runtime.client.getCode).not.toHaveBeenCalled();
  });

  it.each([undefined, '0x'])('fails missing code (%s)', async (code) => {
    const report = await proveChain(fixture({ getCode: async () => code }));
    expect(report.status).toBe('NOT VERIFIED');
    expect(report.checks.filter((item) => !item.ok)).toHaveLength(2);
    expect(report.contracts.RelicNFT.selectors).toBeUndefined();
  });

  it('fails a selector mismatch', async () => {
    const report = await proveChain(fixture({ getCode: async () => '0x600000' }));
    expect(report.status).toBe('NOT VERIFIED');
    expect(report.contracts.RelicNFT.selectors.ok).toBe(false);
    expect(report.checks.some((item) => !item.ok && item.detail.includes('Selector mismatch'))).toBe(true);
  });

  it('accepts Solidity zero-trimmed selectors (PUSH3 for balanceOf)', () => {
    const abi = [relicNftAbi.find((item) => item.type === 'function' && item.name === 'balanceOf')];
    expect(toFunctionSelector(abi[0])).toBe('0x00fdd58e');
    expect(selectorChecks(abi, '0x8062fdd58e146100005700', toFunctionSelector).ok).toBe(true);
  });

  it('does not mistake arbitrary PUSH data or metadata for selector evidence', () => {
    const abi = [relicNftAbi.find((item) => item.type === 'function' && item.name === 'mint')];
    const selector = toFunctionSelector(abi[0]).slice(2);
    expect(selectorChecks(abi, `0x7f63${selector}14${'00'.repeat(26)}`, toFunctionSelector).ok).toBe(false);
    expect(selectorChecks(abi, `0x0063${selector}00`, toFunctionSelector).ok).toBe(false);
    const metadata = `a163${selector}14`;
    expect(selectorChecks(abi, `0x00${metadata}${(metadata.length / 2).toString(16).padStart(4, '0')}`, toFunctionSelector).ok).toBe(false);
  });

  it('fails RPC timeout without a stack trace', async () => {
    const report = await proveChain(fixture({ getChainId: async () => { throw new Error('request timed out'); } }));
    expect(report.status).toBe('NOT VERIFIED');
    expect(report.checks[0].detail).toBe('RPC timeout: Fuji could not be verified. Retry the command.');
    expect(json(report)).not.toContain(' at ');
    expect(friendlyError(new TypeError('fetch failed'))).toContain('RPC unreachable');
    expect(friendlyError({ status: 429, shortMessage: 'HTTP request failed.' })).toContain('RPC rate limited (HTTP 429)');
  });

  it('fails getter, market binding, historical code and log RPC errors', async () => {
    for (const overrides of [
      { readContract: async () => { throw new Error('getter reverted'); } },
      { readContract: async () => owner },
      { getLogs: async () => { throw new Error('RPC timeout'); } },
      { getCode: async ({ blockNumber }) => { if (blockNumber < 100n) throw new Error('historical state unavailable'); return codeFor(relicNftAbi); } },
    ]) {
      const report = await proveChain(fixture(overrides));
      expect(report.status).toBe('NOT VERIFIED');
      expect(report.checks.some((item) => !item.ok)).toBe(true);
    }
  });

  it('formats actual transfer and sale events, including large ids and explorer links', () => {
    const id = 9007199254740993000n;
    expect(formatEvent(log('TransferSingle', 90n, 2, { id }), 'RelicNFT')).toMatchObject({
      event: 'TransferSingle', category: 'Transfer', block: '90', txHash: hash,
      tokenIds: [String(id)], explorer: `https://testnet.snowtrace.io/tx/${hash}`, logIndex: 2,
    });
    expect(formatEvent(log('TransferBatch', 90n, 0, { ids: [1n, id] }), 'RelicNFT').tokenIds).toEqual(['1', String(id)]);
    expect(formatEvent(log('Bought'), 'RelicMarket').category).toBe('Sold');
    expect(() => formatEvent({ ...log('Listed'), transactionHash: null }, 'RelicMarket')).toThrow('Incomplete event');
    expect(() => formatEvent(log('Listed', 90n, 0, {}), 'RelicMarket')).toThrow('Missing token id');
  });

  it('pages contiguous inclusive ranges, sorts and limits each category to the last 20', async () => {
    const all = Array.from({ length: 50 }, (_, i) => log(i % 2 ? 'Bought' : 'Listed', BigInt(i + 1), i));
    const client = { getLogs: vi.fn(async ({ fromBlock, toBlock }) => all.filter((item) => item.blockNumber >= fromBlock && item.blockNumber <= toBlock)) };
    const result = await recentEvents(client, { address: TARGETS.RelicMarket, abi: relicMarketAbi, contract: 'RelicMarket', head: 50n, start: 0n, chunkSize: 10n, concurrency: 1 });
    expect(result.groups.Listed).toHaveLength(20);
    expect(result.groups.Sold).toHaveLength(20);
    expect(result.groups.Listed[0].block).toBe('49');
    expect(result.groups.Sold[0].block).toBe('50');
    expect(result.historyExhausted).toBe(false);
    expect(client.getLogs.mock.calls.map(([p]) => [p.fromBlock, p.toBlock])).toEqual([[41n, 50n], [31n, 40n], [21n, 30n], [11n, 20n]]);
  });

  it('default log requests respect the public 100-block limit and finish on sparse history', async () => {
    const client = { getLogs: vi.fn(async ({ fromBlock, toBlock }) => {
      expect(toBlock - fromBlock + 1n).toBeLessThanOrEqual(100n);
      return [];
    }) };
    const result = await recentEvents(client, { address: TARGETS.RelicMarket, abi: relicMarketAbi, contract: 'RelicMarket', head: 999n, start: 0n });
    expect(result.historyExhausted).toBe(true);
    expect(client.getLogs).toHaveBeenCalledTimes(10);
  });

  it('exhausts history when a category has no events; reports zero honestly', async () => {
    const client = { getLogs: vi.fn(async () => []) };
    const result = await recentEvents(client, { address: TARGETS.RelicMarket, abi: relicMarketAbi, contract: 'RelicMarket', head: 10n, start: 5n, chunkSize: 4n });
    expect(result).toMatchObject({ historyExhausted: true, fromBlock: '5', groups: { Listed: [], Sold: [] } });
    expect(client.getLogs.mock.calls.map(([p]) => [p.fromBlock, p.toBlock])).toEqual([[7n, 10n], [5n, 6n]]);
  });

  it('human table includes checks, unsupported fields, events, tx hashes and URLs', async () => {
    const table = humanTable(await proveChain(fixture()));
    expect(table).toContain('| RelicNFT: code exists | PASS |');
    expect(table).toContain('| RelicNFT | totalSupply | NOT EXPOSED |');
    expect(table).toContain('| Bought (Sold) | 92 |');
    expect(table).toContain(hash);
    expect(table).toContain(`https://testnet.snowtrace.io/tx/${hash}`);
  });
});

describe('proof CLI offline', () => {
  it('returns exit 0, parseable stdout JSON, stderr table and identical optional file', async () => {
    const result = await cli(fixture(), ['--out', 'proof.json']);
    expect(result.exitCode).toBe(0);
    expect(result.report.status).toBe('VERIFIED');
    expect(result.table).toContain('Fuji chain proof: VERIFIED');
    expect(result.save).toHaveBeenCalledWith('proof.json', result.output, 'utf8');
  });

  it.each([
    { getChainId: async () => 1 },
    { getCode: async () => '0x' },
    { getCode: async () => '0x00' },
    { getChainId: async () => { throw new Error('RPC timeout'); } },
  ])('returns exit 1 and JSON when a check fails', async (overrides) => {
    const result = await cli(fixture(overrides));
    expect(result.exitCode).toBe(1);
    expect(result.report.status).toBe('NOT VERIFIED');
    expect(result.table).toContain('FAIL');
  });

  it.each([['--out'], ['--unknown'], ['--out', '--bad'], ['--out', 'a', '--out', 'b']])('rejects invalid arguments before RPC: %s', async (...args) => {
    const loadRuntime = vi.fn();
    let output;
    expect(await runCli(args, { loadRuntime, stdout: (text) => { output = text; }, stderr: () => {} })).toBe(1);
    expect(loadRuntime).not.toHaveBeenCalled();
    expect(JSON.parse(output).checks[0].detail).toContain('Usage:');
  });

  it('returns exit 1 and clear output for startup or output-file failure', async () => {
    const loadRuntime = async () => { throw new Error('dependency unavailable'); };
    let output;
    expect(await runCli([], { loadRuntime, stdout: (text) => { output = text; }, stderr: () => {} })).toBe(1);
    expect(JSON.parse(output).checks[0].detail).toBe('dependency unavailable');
    const result = await cli(fixture(), ['--out', 'no-directory/proof.json'], async () => { throw new Error('Output directory does not exist'); });
    expect(result.exitCode).toBe(1);
    expect(result.report.checks.at(-1).ok).toBe(false);
  });

  it('entrypoint sets real process exit code 1 without network for invalid args', () => {
    const path = fileURLToPath(new URL('../../../../scripts/chain-proof.mjs', import.meta.url));
    const result = spawnSync(process.execPath, [path, '--invalid'], { encoding: 'utf8' });
    expect(result.status).toBe(1);
    expect(JSON.parse(result.stdout).status).toBe('NOT VERIFIED');
    expect(result.stderr).not.toContain(' at ');
  });
});
