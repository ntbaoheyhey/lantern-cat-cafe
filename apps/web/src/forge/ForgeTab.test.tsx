// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { FUJI_CHAIN_ID, getAddresses } from '@taskbar-hero/chain';
import { CONFIG } from '@taskbar-hero/game-rules';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { GameApiError, type GameApi, type RelicVoucher, type ServerState } from '../api/GameApi';
import { MockGameApi, type MockGameApiOptions } from '../api/MockGameApi';
import { GameLoop } from '../game/gameState';
import { ForgeTab } from './ForgeTab';
import { loadUnreported, saveUnreported } from './mintStore';

const wallet = vi.hoisted(() => ({
  isConnected: true,
  address: `0x${'AB'.repeat(20)}` as string | undefined,
  chainId: 43113 as number,
  writeContractAsync: vi.fn(),
  waitForTransactionReceipt: vi.fn(),
  switchChain: vi.fn(),
}));

vi.mock('wagmi', () => ({
  useAccount: () => ({ isConnected: wallet.isConnected, chainId: wallet.chainId, address: wallet.address }),
  useSwitchChain: () => ({ switchChain: wallet.switchChain, isPending: false }),
  useWriteContract: () => ({ writeContractAsync: wallet.writeContractAsync }),
  usePublicClient: () => ({ waitForTransactionReceipt: wallet.waitForTransactionReceipt }),
}));

const PLAYER = `0x${'ab'.repeat(20)}` as const;
const SIG = `0x${'11'.repeat(65)}` as const;
const HASH = `0x${'cd'.repeat(32)}` as const;
const RICH = { shards: 100, bossKeys: 1 };

let loop: GameLoop | null = null;

beforeEach(() => {
  localStorage.clear();
  wallet.isConnected = true;
  wallet.address = `0x${'AB'.repeat(20)}`; // same as PLAYER, different case
  wallet.chainId = FUJI_CHAIN_ID;
  wallet.writeContractAsync.mockReset().mockResolvedValue(HASH);
  wallet.waitForTransactionReceipt.mockReset().mockResolvedValue({ status: 'success' });
  wallet.switchChain.mockReset();
});

afterEach(() => {
  loop?.stop();
  loop = null;
  cleanup();
});

/** The mock API, but with "real" vouchers (non-demo signature and player) unless `demoVouchers`. */
function makeApi(opts: MockGameApiOptions, demoVouchers = false) {
  const mock = new MockGameApi(opts);
  const real = (v: RelicVoucher): RelicVoucher => (demoVouchers ? v : { ...v, player: PLAYER, signature: SIG });
  const fix = <T extends ServerState>(s: T): T =>
    s.forge.pending ? { ...s, forge: { ...s.forge, pending: real(s.forge.pending) } } : s;
  const api: GameApi = {
    getState: async () => fix(await mock.getState()),
    claim: async () => fix(await mock.claim()),
    equip: async (id) => fix(await mock.equip(id)),
    fightBoss: () => mock.fightBoss(),
    forgeRelic: async () => {
      const r = await mock.forgeRelic();
      return { voucher: real(r.voucher), state: fix(r.state) };
    },
    reportMint: vi.fn(async (nonce: string, hash: `0x${string}`) => fix(await mock.reportMint(nonce, hash))),
  };
  return { api, mock };
}

async function setup(api: GameApi, demo = false) {
  loop = new GameLoop({ api });
  await loop.start(document);
  render(<ForgeTab api={api} loop={loop} demo={demo} revealMs={20} />);
}

async function forge() {
  fireEvent.click(screen.getByRole('button', { name: 'Forge' }));
  return screen.findByTestId('forge-rarity');
}

it('shows each blocked reason and disables Forge', async () => {
  const cases: [MockGameApiOptions['start'], RegExp][] = [
    [{ shards: 100, bossKeys: 0 }, /need a Boss Key/],
    [{ shards: 10, bossKeys: 1 }, new RegExp(`need ${CONFIG.relic.shardCost} shards \\(you have 10\\)`)],
  ];
  for (const [start, text] of cases) {
    await setup(makeApi({ start }).api);
    expect(screen.getByTestId('forge-blocked').textContent).toMatch(text);
    expect((screen.getByRole('button', { name: 'Forge' }) as HTMLButtonElement).disabled).toBe(true);
    loop!.stop();
    cleanup();
  }
});

it('shows the daily limit once today\'s Relic is forged and minted', async () => {
  const { api, mock } = makeApi({ start: RICH });
  const { voucher } = await mock.forgeRelic();
  await mock.reportMint(voucher.nonce, HASH);
  await setup(api);
  expect(screen.getByTestId('forge-blocked').textContent).toMatch(/already forged today's Relic/);
  expect((screen.getByRole('button', { name: 'Forge' }) as HTMLButtonElement).disabled).toBe(true);
});

it('forging reveals the rarity and updates shards and keys from the returned state', async () => {
  await setup(makeApi({ start: RICH }).api);
  expect(screen.getByTestId('forge-shards').textContent).toBe('100');
  expect((await forge()).textContent).toMatch(/You forged a (Common|Rare|Epic|Legendary) Relic!/);
  await waitFor(() => expect(screen.getByTestId('forge-shards').textContent).toBe(String(100 - CONFIG.relic.shardCost)));
  expect(screen.getByTestId('forge-keys').textContent).toBe('0');
});

it('a demo voucher hides the mint button', async () => {
  await setup(makeApi({ start: RICH }, true).api, true);
  await forge();
  expect(screen.getByTestId('forge-demo').textContent).toMatch(/Sign in to mint on Fuji/);
  expect(screen.queryByRole('button', { name: 'Mint to wallet' })).toBeNull();
});

it('mints with the voucher fields converted, waits for the receipt, then reports the mint', async () => {
  const { api } = makeApi({ start: RICH });
  await setup(api);
  await forge();
  fireEvent.click(await screen.findByRole('button', { name: 'Mint to wallet' }));
  await screen.findByTestId('forge-minted');

  const call = wallet.writeContractAsync.mock.calls[0]![0];
  expect(call).toMatchObject({ address: getAddresses(FUJI_CHAIN_ID).RelicNFT, functionName: 'mint', chainId: FUJI_CHAIN_ID });
  const [v, sig] = call.args;
  expect(sig).toBe(SIG);
  expect(v.player).toBe(PLAYER);
  expect(typeof v.relicId).toBe('bigint');
  expect(typeof v.nonce).toBe('bigint');
  expect(typeof v.expiry).toBe('bigint');
  expect(typeof v.rarity).toBe('number');
  expect(v.relicId).toBe(BigInt(v.rarity + 1));

  expect(wallet.waitForTransactionReceipt).toHaveBeenCalledWith({ hash: HASH });
  expect(api.reportMint).toHaveBeenCalledWith(String(v.nonce), HASH);
  expect(loop!.getSnapshot().server?.forge.pending).toBeNull();
  expect(loadUnreported()).toBeNull();
  expect(screen.queryByRole('button', { name: 'Mint to wallet' })).toBeNull();
});

it('a wallet rejection keeps the voucher and the mint button', async () => {
  wallet.writeContractAsync.mockRejectedValue(Object.assign(new Error('User rejected the request.'), { name: 'UserRejectedRequestError' }));
  const { api } = makeApi({ start: RICH });
  await setup(api);
  await forge();
  fireEvent.click(await screen.findByRole('button', { name: 'Mint to wallet' }));
  expect((await screen.findByTestId('mint-message')).textContent).toBe('Mint cancelled, you can try again.');
  expect(screen.getByRole('button', { name: 'Mint to wallet' })).toBeTruthy();
  expect(api.reportMint).not.toHaveBeenCalled();
  expect(loop!.getSnapshot().server?.forge.pending).not.toBeNull();
});

it('a reverted mint clears the stored hash and keeps the mint button', async () => {
  wallet.waitForTransactionReceipt.mockResolvedValue({ status: 'reverted' });
  const { api } = makeApi({ start: RICH });
  await setup(api);
  await forge();
  fireEvent.click(await screen.findByRole('button', { name: 'Mint to wallet' }));
  expect((await screen.findByTestId('mint-message')).textContent).toMatch(/failed on chain/);
  expect(loadUnreported()).toBeNull();
  expect(api.reportMint).not.toHaveBeenCalled();
  expect(screen.getByRole('button', { name: 'Mint to wallet' })).toBeTruthy();
});

it('asks to switch accounts when the wallet is not the voucher player', async () => {
  wallet.address = `0x${'12'.repeat(20)}`;
  await setup(makeApi({ start: RICH }).api);
  await forge();
  expect((await screen.findByTestId('mint-wrong-account')).textContent).toBe(
    'Switch your wallet to 0xabab…abab to mint this Relic.',
  );
  expect(screen.queryByRole('button', { name: 'Mint to wallet' })).toBeNull();
});

it('asks to switch to Fuji on the wrong network', async () => {
  wallet.chainId = 1;
  await setup(makeApi({ start: RICH }).api);
  await forge();
  fireEvent.click(await screen.findByRole('button', { name: 'Switch to Fuji' }));
  expect(wallet.switchChain).toHaveBeenCalledWith({ chainId: FUJI_CHAIN_ID });
  expect(screen.queryByRole('button', { name: 'Mint to wallet' })).toBeNull();
});

it('shows an unminted Relic from the server with the mint button', async () => {
  const { api, mock } = makeApi({ start: RICH });
  await mock.forgeRelic(); // paid earlier, never minted
  await setup(api);
  expect(screen.getByTestId('forge-pending').textContent).toMatch(/You have an unminted .* Relic/);
  expect(screen.getByRole('button', { name: 'Mint to wallet' })).toBeTruthy();
});

it('reports a stored unreported mint on mount', async () => {
  const { api, mock } = makeApi({ start: RICH });
  const { voucher } = await mock.forgeRelic();
  saveUnreported({ nonce: voucher.nonce, hash: HASH });
  await setup(api);
  await screen.findByTestId('forge-minted');
  expect(api.reportMint).toHaveBeenCalledWith(voucher.nonce, HASH);
  expect(loadUnreported()).toBeNull();
  expect(loop!.getSnapshot().server?.forge.pending).toBeNull();
});

it('keeps an unconfirmed mint and lets the player check again', async () => {
  const { api, mock } = makeApi({ start: RICH });
  const { voucher } = await mock.forgeRelic();
  saveUnreported({ nonce: voucher.nonce, hash: HASH });
  vi.mocked(api.reportMint).mockRejectedValueOnce(new GameApiError('mint_not_confirmed'));
  await setup(api);
  const check = await screen.findByRole('button', { name: 'Check again' });
  expect(loadUnreported()).toEqual({ nonce: voucher.nonce, hash: HASH });
  fireEvent.click(check);
  await screen.findByTestId('forge-minted');
  expect(loadUnreported()).toBeNull();
});

it('does not report stored mints in demo mode', async () => {
  const { api } = makeApi({ start: RICH }, true);
  saveUnreported({ nonce: '1', hash: HASH });
  await setup(api, true);
  expect(api.reportMint).not.toHaveBeenCalled();
  expect(loadUnreported()).not.toBeNull();
});
