// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { FUJI_CHAIN_ID } from '@taskbar-hero/chain';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { RelicVoucher } from '@taskbar-hero/api-contract';
import { MintPanel } from './MintPanel';
import type { GameApi } from '../api/GameApi';
import type { GameLoop } from '../game/gameState';

const mockWallet = vi.hoisted(() => ({
  isConnected: true,
  address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8' as string | undefined,
  chainId: 43113,
  writeContractAsync: vi.fn(),
  waitForTransactionReceipt: vi.fn(),
  switchChain: vi.fn(),
}));

vi.mock('wagmi', () => ({
  useAccount: () => ({
    isConnected: mockWallet.isConnected,
    chainId: mockWallet.chainId,
    address: mockWallet.address,
  }),
  useSwitchChain: () => ({
    switchChain: mockWallet.switchChain,
    isPending: false,
  }),
  useWriteContract: () => ({
    writeContractAsync: mockWallet.writeContractAsync,
  }),
  usePublicClient: () => ({
    waitForTransactionReceipt: mockWallet.waitForTransactionReceipt,
  }),
}));

const mockApi = {} as GameApi;
const mockLoop = {} as GameLoop;
const onMinted = vi.fn();

const baseVoucher: RelicVoucher = {
  relicId: '1',
  rarity: 0,
  rarityName: 'common',
  player: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
  nonce: '100',
  expiry: Math.floor(Date.now() / 1000) + 3600,
  signature: '0x1111111111111111111111111111111111111111',
};

describe('MintPanel - Wrong wallet behavior', () => {
  beforeEach(() => {
    mockWallet.isConnected = true;
    mockWallet.chainId = FUJI_CHAIN_ID;
    mockWallet.address = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
    mockWallet.writeContractAsync.mockReset();
    mockWallet.waitForTransactionReceipt.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders normal Mint button when connected address matches voucher.player exactly', () => {
    render(
      <MintPanel
        voucher={baseVoucher}
        api={mockApi}
        loop={mockLoop}
        onMinted={onMinted}
      />
    );

    expect(screen.queryByTestId('mint-wrong-wallet')).toBeNull();
    expect(screen.getByRole('button', { name: 'Mint to wallet' })).toBeTruthy();
  });

  it('renders normal Mint button when same address differs only by case (checksum vs lowercase)', () => {
    // voucher.player is checksummed, connected wallet address is lowercase
    mockWallet.address = '0x70997970c51812dc3a010c7d01b50e0d17dc79c8';

    render(
      <MintPanel
        voucher={baseVoucher}
        api={mockApi}
        loop={mockLoop}
        onMinted={onMinted}
      />
    );

    expect(screen.queryByTestId('mint-wrong-wallet')).toBeNull();
    expect(screen.getByRole('button', { name: 'Mint to wallet' })).toBeTruthy();
  });

  it('shows mint-wrong-wallet and hides Mint button when connected address is different', () => {
    mockWallet.address = '0x1234567890123456789012345678901234567890';

    render(
      <MintPanel
        voucher={baseVoucher}
        api={mockApi}
        loop={mockLoop}
        onMinted={onMinted}
      />
    );

    const wrongWallet = screen.getByTestId('mint-wrong-wallet');
    expect(wrongWallet).toBeTruthy();
    expect(wrongWallet.textContent).toBe(
      'This Relic belongs to 0x7099...79C8. Switch to that wallet to mint it.'
    );
    expect(screen.queryByRole('button', { name: 'Mint to wallet' })).toBeNull();
    expect(mockWallet.writeContractAsync).not.toHaveBeenCalled();
  });

  it('shows connect message when wallet is not connected', () => {
    mockWallet.isConnected = false;

    render(
      <MintPanel
        voucher={baseVoucher}
        api={mockApi}
        loop={mockLoop}
        onMinted={onMinted}
      />
    );

    expect(screen.getByText('Connect your wallet to mint this Relic.')).toBeTruthy();
    expect(screen.queryByTestId('mint-wrong-wallet')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Mint to wallet' })).toBeNull();
  });
});
