import { describe, expect, it, vi } from 'vitest';
import { PROOF_CONTRACTS, createProofReader, readFujiProof, type ProofClient } from './fujiProof';
const hash = `0x${'ab'.repeat(32)}` as const;
function fixture() {
  const calls = {
    getChainId: vi.fn().mockResolvedValue(43113), getBlockNumber: vi.fn().mockResolvedValue(1000n),
    getBlock: vi.fn().mockResolvedValue({ hash }), getCode: vi.fn().mockResolvedValue('0x6001600055'),
    readContract: vi.fn().mockImplementation(async ({ functionName }: { functionName: string }) => functionName === 'relicNFT' ? PROOF_CONTRACTS.RelicNFT : 0n),
    getLogs: vi.fn().mockResolvedValue([]),
  };
  return { calls, client: calls as unknown as ProofClient };
}
describe('bounded Fuji snapshot', () => {
  it('pins the requested contracts and one block; reports real zero listings and an empty bounded window', async () => {
    expect(PROOF_CONTRACTS).toEqual({ RelicNFT: '0xB1a1edb7A75Db6e7067E747ddee32B39c2296f2D', RelicMarket: '0x10fcC46e439d3E31Fb1720B337C45CadB9b2ff93' });
    const { client, calls } = fixture(); const proof = await readFujiProof(client, 99);
    expect(proof).toMatchObject({ chainId: 43113, block: 1000n, fromBlock: 901n, checkedAt: 99, nftCodeBytes: { status: 'verified', value: 5 }, marketCodeBytes: { status: 'verified', value: 5 }, activeListings: { status: 'verified', value: 0n }, events: { status: 'verified', value: [] } });
    expect(calls.getCode.mock.calls.map(([args]) => args)).toEqual([{ address: PROOF_CONTRACTS.RelicNFT, blockNumber: 1000n }, { address: PROOF_CONTRACTS.RelicMarket, blockNumber: 1000n }]);
    expect(calls.getLogs).toHaveBeenCalledExactlyOnceWith({ address: [PROOF_CONTRACTS.RelicNFT, PROOF_CONTRACTS.RelicMarket], fromBlock: 901n, toBlock: 1000n });
    expect(calls.readContract.mock.calls.map(([args]) => args.functionName)).toEqual(['relicNFT', 'activeListingCount']);
    expect(calls.readContract.mock.calls.every(([args]) => args.blockNumber === 1000n && args.address === PROOF_CONTRACTS.RelicMarket)).toBe(true);
  });
  it('refuses a wrong RPC chain before reading any deployment facts', async () => {
    const { client, calls } = fixture(); calls.getChainId.mockResolvedValue(1);
    await expect(readFujiProof(client)).rejects.toThrow('did not confirm Avalanche Fuji');
    expect(calls.getBlockNumber).not.toHaveBeenCalled(); expect(calls.getCode).not.toHaveBeenCalled(); expect(calls.getLogs).not.toHaveBeenCalled();
  });
  it('keeps partial failures unavailable, never inventing zero counts or a total supply', async () => {
    const { client, calls } = fixture(); calls.getCode.mockRejectedValue(new Error('private endpoint token must not leak'));
    calls.getLogs.mockRejectedValue(new Error('429')); calls.readContract.mockRejectedValue(new Error('unavailable'));
    const proof = await readFujiProof(client);
    expect(proof.nftCodeBytes).toEqual({ status: 'unavailable' }); expect(proof.activeListings).toEqual({ status: 'unavailable' });
    expect(proof.events).toEqual({ status: 'unavailable' }); expect(proof).not.toHaveProperty('totalSupply');
    expect(JSON.stringify(proof, (_, value) => typeof value === 'bigint' ? String(value) : value)).not.toContain('private endpoint');
  });
  it('labels absent code as zero bytes and clamps the recent range at genesis', async () => {
    const { client, calls } = fixture(); calls.getCode.mockResolvedValue('0x'); calls.getBlockNumber.mockResolvedValue(3n);
    const proof = await readFujiProof(client); expect(proof.fromBlock).toBe(0n); expect(proof.nftCodeBytes).toEqual({ status: 'verified', value: 0 });
  });
  it('keeps only ten newest in-window events from the two contracts', async () => {
    const { client, calls } = fixture();
    const log = { address: PROOF_CONTRACTS.RelicNFT, transactionHash: hash, blockNumber: 990n, logIndex: 0, removed: false, topics: [], data: '0x' };
    const transaction = (index: number) => `0x${index.toString(16).padStart(64, '0')}`;
    calls.getLogs.mockResolvedValue([...Array.from({ length: 14 }, (_, i) => ({ ...log, logIndex: i, transactionHash: transaction(i) })), { ...log, blockNumber: 1001n, transactionHash: transaction(900) }, { ...log, blockNumber: 500n, transactionHash: transaction(901) }, { ...log, removed: true, blockNumber: 1000n, transactionHash: transaction(902) }, { ...log, address: '0x0000000000000000000000000000000000000001', blockNumber: 1000n, transactionHash: transaction(903) }]);
    const proof = await readFujiProof(client); expect(proof.events.status).toBe('verified');
    if (proof.events.status !== 'verified') throw new Error('Expected events');
    expect(proof.events.value.map(event => event.transaction)).toEqual(Array.from({ length: 10 }, (_, index) => transaction(13 - index)));
    expect(proof.events.value).toHaveLength(10); expect(proof.events.value.every(event => event.block === 990n && event.address === PROOF_CONTRACTS.RelicNFT && event.event === 'Contract event')).toBe(true);
  });
});

describe('30-second public snapshot cache', () => {
  it('coalesces in-flight reads and serves the same result for30 seconds before refreshing', async () => {
    let now = 1000; const read = createProofReader(() => now), { client, calls } = fixture();
    const first = read(client); expect(read(client)).toBe(first); await first;
    now += 29_999; expect(read(client)).toBe(first); expect(calls.getChainId).toHaveBeenCalledTimes(1);
    now++; await read(client); expect(calls.getChainId).toHaveBeenCalledTimes(2);
  });
  it('caches failures too and separates different clients', async () => {
    let now = 0; const read = createProofReader(() => now), a = fixture(), b = fixture();
    a.calls.getChainId.mockRejectedValue(new Error('offline'));
    await expect(read(a.client)).rejects.toThrow('offline'); now = 29_999;
    await expect(read(a.client)).rejects.toThrow('offline'); expect(a.calls.getChainId).toHaveBeenCalledTimes(1);
    await read(b.client); expect(b.calls.getChainId).toHaveBeenCalledTimes(1);
    now = 30_000; await expect(read(a.client)).rejects.toThrow('offline'); expect(a.calls.getChainId).toHaveBeenCalledTimes(2);
  });
});
