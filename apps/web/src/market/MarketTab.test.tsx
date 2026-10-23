// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { FUJI_CHAIN_ID, getAddresses } from '@taskbar-hero/chain';
import { parseEther } from 'viem';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { MarketTab } from './MarketTab';
import { txErrorText } from './marketText';

const ME = `0x${'ab'.repeat(20)}` as const;
const OTHER = `0x${'cd'.repeat(20)}` as const;
const HASH = `0x${'ef'.repeat(32)}` as const;

interface Item { seller: `0x${string}`; relicId: bigint; amount: bigint; price: bigint }

const chain = vi.hoisted(() => ({
  isConnected: true,
  chainId: 43113,
  balances: [0n, 0n, 0n, 0n] as bigint[],
  approved: false,
  listings: [] as [bigint, Item][],
  writeContractAsync: vi.fn(),
  waitForTransactionReceipt: vi.fn(),
  switchChain: vi.fn(),
  invalidateQueries: vi.fn(),
}));

vi.mock('wagmi', () => ({
  useAccount: () => ({ isConnected: chain.isConnected, chainId: chain.chainId, address: chain.isConnected ? ME : undefined }),
  useSwitchChain: () => ({ switchChain: chain.switchChain, isPending: false }),
  useWriteContract: () => ({ writeContractAsync: chain.writeContractAsync }),
  usePublicClient: () => ({ waitForTransactionReceipt: chain.waitForTransactionReceipt }),
  useReadContract: ({ functionName }: { functionName: string }) => {
    const data =
      functionName === 'balanceOfBatch' ? chain.balances
      : functionName === 'isApprovedForAll' ? chain.approved
      : BigInt(chain.listings.length);
    return { data, isLoading: false };
  },
  useReadContracts: ({ contracts }: { contracts: unknown[] }) => ({
    data: contracts.map(() => ({
      status: 'success',
      result: [chain.listings.map(([id]) => id), chain.listings.map(([, item]) => item)],
    })),
  }),
}));

vi.mock('@tanstack/react-query', () => ({ useQueryClient: () => ({ invalidateQueries: chain.invalidateQueries }) }));

const { RelicNFT, RelicMarket } = getAddresses(FUJI_CHAIN_ID);

beforeEach(() => {
  chain.isConnected = true;
  chain.chainId = FUJI_CHAIN_ID;
  chain.balances = [0n, 0n, 0n, 0n];
  chain.approved = false;
  chain.listings = [];
  chain.writeContractAsync.mockReset().mockResolvedValue(HASH);
  chain.waitForTransactionReceipt.mockReset().mockResolvedValue({ status: 'success' });
  chain.switchChain.mockReset();
  chain.invalidateQueries.mockReset().mockResolvedValue(undefined);
});

afterEach(cleanup);

it('shows My Relics counts per rarity', () => {
  chain.balances = [3n, 0n, 1n, 0n];
  render(<MarketTab />);
  const relics = screen.getByTestId('my-relics');
  expect(relics.textContent).toContain('Paw Charm × 3');
  expect(relics.textContent).toContain('Moon Collar × 1');
  expect(relics.textContent).not.toContain('Silver Bell');
});

it('shows listed Relics as "× n listed" instead of the empty state', () => {
  chain.listings = [[3n, { seller: ME, relicId: 1n, amount: 1n, price: parseEther('0.1') }]];
  render(<MarketTab />);
  expect(screen.queryByTestId('relics-empty')).toBeNull();
  expect(screen.getByTestId('my-relics').textContent).toContain('Paw Charm × 1 listed');
});

it('renders Relic images with the right src and rarity alt text', () => {
  chain.balances = [1n, 0n, 0n, 1n];
  chain.listings = [[5n, { seller: OTHER, relicId: 3n, amount: 1n, price: 1n }]];
  render(<MarketTab />);
  const mine = within(screen.getByTestId('my-relics'));
  expect(mine.getByAltText('Paw Charm').getAttribute('src')).toBe('/relics/1.svg');
  expect(mine.getByAltText('Golden Maneki').getAttribute('src')).toBe('/relics/4.svg');
  expect(within(screen.getByTestId('listing-5')).getByAltText('Moon Collar').getAttribute('src')).toBe('/relics/3.svg');
});

it('shows the empty state without Relics', () => {
  render(<MarketTab />);
  expect(screen.getByTestId('relics-empty').textContent).toContain('No Relics yet. Forge one in the Forge tab.');
});

it('renders listings; own listing has Cancel, others have Buy', () => {
  chain.listings = [
    [7n, { seller: OTHER, relicId: 4n, amount: 2n, price: parseEther('0.25') }],
    [9n, { seller: ME, relicId: 1n, amount: 1n, price: parseEther('1') }],
  ];
  render(<MarketTab />);
  const other = screen.getByTestId('listing-7');
  expect(other.textContent).toContain('Golden Maneki × 2');
  expect(other.textContent).toContain('0.25 AVAX');
  expect(within(other).getByRole('button', { name: 'Buy' })).toBeTruthy();
  const mine = screen.getByTestId('listing-9');
  expect(mine.textContent).toContain('You');
  expect(within(mine).getByRole('button', { name: 'Cancel' })).toBeTruthy();
  expect(within(mine).queryByRole('button', { name: 'Buy' })).toBeNull();
  expect(screen.getAllByText(/Fuji testnet, test AVAX/).length).toBeGreaterThan(0);
});

it('buys with value equal to the price, then refreshes', async () => {
  const price = parseEther('0.25');
  chain.listings = [[7n, { seller: OTHER, relicId: 2n, amount: 1n, price }]];
  render(<MarketTab />);
  fireEvent.click(screen.getByRole('button', { name: 'Buy' }));
  await screen.findByText('Bought! The Relic is in your wallet.');
  expect(chain.writeContractAsync).toHaveBeenCalledWith(
    expect.objectContaining({ address: RelicMarket, functionName: 'buy', args: [7n], value: price }),
  );
  expect(chain.invalidateQueries).toHaveBeenCalled();
});

it('explains ListingNotActive when someone bought first', async () => {
  chain.listings = [[7n, { seller: OTHER, relicId: 2n, amount: 1n, price: 1n }]];
  chain.writeContractAsync.mockRejectedValue({ name: 'ContractFunctionExecutionError', cause: { errorName: 'ListingNotActive' } });
  render(<MarketTab />);
  fireEvent.click(screen.getByRole('button', { name: 'Buy' }));
  expect((await screen.findByTestId('market-message')).textContent).toMatch(/someone bought or cancelled it first/);
  expect(chain.invalidateQueries).toHaveBeenCalled();
});

function fillList(relicId: string, amount: string, price: string) {
  fireEvent.change(screen.getByLabelText('Relic'), { target: { value: relicId } });
  fireEvent.change(screen.getByLabelText('Amount'), { target: { value: amount } });
  fireEvent.change(screen.getByLabelText('Price (AVAX)'), { target: { value: price } });
}

it('approves the market first when needed, then lists with parseEther(price)', async () => {
  chain.balances = [0n, 2n, 0n, 0n];
  render(<MarketTab />);
  fillList('2', '2', '0.5');
  fireEvent.click(screen.getByRole('button', { name: 'List' }));
  await screen.findByText('Listed!');
  expect(chain.writeContractAsync.mock.calls.map(([c]) => c.functionName)).toEqual(['setApprovalForAll', 'list']);
  expect(chain.writeContractAsync.mock.calls[0]?.[0]).toMatchObject({ address: RelicNFT, args: [RelicMarket, true] });
  expect(chain.writeContractAsync.mock.calls[1]?.[0]).toMatchObject({ address: RelicMarket, args: [2n, 2n, parseEther('0.5')] });
  expect(chain.waitForTransactionReceipt).toHaveBeenCalledTimes(2);
});

it('lists directly when already approved', async () => {
  chain.balances = [1n, 0n, 0n, 0n];
  chain.approved = true;
  render(<MarketTab />);
  fillList('1', '1', '0.1');
  fireEvent.click(screen.getByRole('button', { name: 'List' }));
  await waitFor(() => expect(chain.writeContractAsync).toHaveBeenCalledTimes(1));
  expect(chain.writeContractAsync.mock.calls[0]?.[0]).toMatchObject({ functionName: 'list', args: [1n, 1n, parseEther('0.1')] });
});

it.each([
  ['amount 0', '0', '0.1'],
  ['amount above balance', '3', '0.1'],
  ['price 0', '1', '0'],
  ['price not a number', '1', 'abc'],
])('disables List for %s', (_, amount, price) => {
  chain.balances = [2n, 0n, 0n, 0n];
  render(<MarketTab />);
  fillList('1', amount, price);
  expect(screen.getByRole<HTMLButtonElement>('button', { name: 'List' }).disabled).toBe(true);
});

it('shows Switch to Fuji on the wrong network', () => {
  chain.chainId = 1;
  render(<MarketTab />);
  fireEvent.click(screen.getByRole('button', { name: 'Switch to Fuji' }));
  expect(chain.switchChain).toHaveBeenCalledWith({ chainId: FUJI_CHAIN_ID });
});

it('asks to connect a wallet when disconnected', () => {
  chain.isConnected = false;
  render(<MarketTab />);
  expect(screen.getByText(/Connect your wallet/)).toBeTruthy();
});

it('maps wallet and revert errors to friendly text', () => {
  expect(txErrorText({ code: 4001 })).toMatch(/Cancelled/);
  expect(txErrorText({ cause: { data: { errorName: 'WrongPayment' } } })).toMatch(/price changed/);
  expect(txErrorText({ name: 'InsufficientFundsError' })).toMatch(/Not enough test AVAX/);
  expect(txErrorText(new Error('boom'))).toBe('Transaction failed. Please try again.');
});
