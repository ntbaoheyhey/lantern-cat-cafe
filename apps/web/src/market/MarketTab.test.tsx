// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { FUJI_CHAIN_ID, getAddresses } from '@taskbar-hero/chain';
import { parseEther } from 'viem';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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
  readFailed: false,
  refetch: vi.fn(),
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
    return { data, isLoading: false, isError: chain.readFailed, refetch: chain.refetch };
  },
  useReadContracts: ({ contracts }: { contracts: unknown[] }) => ({
    isError: chain.readFailed,
    refetch: chain.refetch,
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
  chain.readFailed = false;
  chain.refetch.mockReset().mockResolvedValue(undefined);
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
  expect(other.textContent).toContain('Golden Maneki');
  expect(other.textContent).toContain('0.25 AVAX');
  // Right detail panel displays buy button for listing 7
  expect(screen.getByTestId('market-buy-btn')).toBeTruthy();

  const mine = screen.getByTestId('listing-9');
  expect(mine.textContent).toContain('You');
  fireEvent.click(mine);
  expect(screen.getByTestId('market-cancel-btn')).toBeTruthy();
  expect(screen.getAllByText(/Fuji testnet, test AVAX/).length).toBeGreaterThan(0);
});

it('buys with value equal to the price, then refreshes', async () => {
  const price = parseEther('0.25');
  chain.listings = [[7n, { seller: OTHER, relicId: 2n, amount: 1n, price }]];
  render(<MarketTab />);
  fireEvent.click(screen.getByTestId('market-buy-btn'));
  // Shared confirmation modal pops up
  expect(screen.getByTestId('market-confirm-modal')).toBeTruthy();
  fireEvent.click(screen.getByTestId('modal-confirm-btn'));

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
  fireEvent.click(screen.getByTestId('market-buy-btn'));
  expect(screen.getByTestId('market-confirm-modal')).toBeTruthy();
  fireEvent.click(screen.getByTestId('modal-confirm-btn'));

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
  expect(screen.getByText('Approving lets the market contract transfer all Relics in your wallet, including future Relics, until you revoke approval.')).toBeTruthy();
  expect(chain.writeContractAsync).not.toHaveBeenCalled();
  fillList('2', '2', '0.5');
  fireEvent.click(screen.getByRole('button', { name: 'List' }));
  expect(screen.getByTestId('market-confirm-modal')).toBeTruthy();
  fireEvent.click(screen.getByTestId('modal-confirm-btn'));

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
  expect(screen.getByTestId('market-confirm-modal')).toBeTruthy();
  fireEvent.click(screen.getByTestId('modal-confirm-btn'));

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

it('a failed chain read shows a plain message and Retry, not an empty shelf', () => {
  chain.readFailed = true;
  render(<MarketTab />);
  expect(screen.getByRole('alert').textContent).toContain("Mochi couldn't read the Relic shelf");
  expect(screen.queryByTestId('relics-empty')).toBeNull();
  expect(screen.queryByTestId('listings-empty')).toBeNull();

  fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
  expect(chain.refetch).toHaveBeenCalledTimes(3);
});

describe('Mission AGR3 Acceptance Criteria: Market Redesign', () => {
  it('T3: Market sort and filter work on sample data', () => {
    chain.listings = [
      [1n, { seller: OTHER, relicId: 1n, amount: 1n, price: parseEther('0.1') }], // Common, Weapon
      [2n, { seller: OTHER, relicId: 2n, amount: 1n, price: parseEther('0.4') }], // Rare, Armor
      [3n, { seller: OTHER, relicId: 4n, amount: 1n, price: parseEther('0.05') }], // Legendary, Armor
    ];
    render(<MarketTab />);

    // Table renders 3 rows
    expect(screen.getByTestId('listing-1')).toBeTruthy();
    expect(screen.getByTestId('listing-2')).toBeTruthy();
    expect(screen.getByTestId('listing-3')).toBeTruthy();

    // Filter by Weapon (relic 1)
    fireEvent.click(screen.getByRole('button', { name: 'Weapon' }));
    expect(screen.getByTestId('listing-1')).toBeTruthy();
    expect(screen.queryByTestId('listing-2')).toBeNull();
    expect(screen.queryByTestId('listing-3')).toBeNull();

    // Filter by Armor (relics 2 and 4)
    fireEvent.click(screen.getByRole('button', { name: 'Armor' }));
    expect(screen.queryByTestId('listing-1')).toBeNull();
    expect(screen.getByTestId('listing-2')).toBeTruthy();
    expect(screen.getByTestId('listing-3')).toBeTruthy();

    // Filter by Legendary
    fireEvent.click(screen.getByRole('button', { name: 'Legendary' }));
    expect(screen.queryByTestId('listing-1')).toBeNull();
    expect(screen.queryByTestId('listing-2')).toBeNull();
    expect(screen.getByTestId('listing-3')).toBeTruthy();

    // Reset to All
    fireEvent.click(screen.getByRole('button', { name: 'All' }));
    expect(screen.getByTestId('listing-1')).toBeTruthy();
    expect(screen.getByTestId('listing-2')).toBeTruthy();
    expect(screen.getByTestId('listing-3')).toBeTruthy();

    // Sorting by Price
    const priceHeader = screen.getByRole('columnheader', { name: /Price \(AVAX\)/ });
    fireEvent.click(priceHeader); // toggle direction
    expect(priceHeader.textContent).toContain('Price (AVAX)');
  });

  it('T4: Buy and List open confirmation modal; cancel aborts without calling wallet', () => {
    chain.balances = [1n, 0n, 0n, 0n];
    chain.approved = true;
    chain.listings = [[10n, { seller: OTHER, relicId: 1n, amount: 1n, price: parseEther('0.2') }]];
    render(<MarketTab />);

    // Click Buy opens modal
    fireEvent.click(screen.getByTestId('market-buy-btn'));
    expect(screen.getByTestId('market-confirm-modal')).toBeTruthy();
    // Click Cancel inside modal
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByTestId('market-confirm-modal')).toBeNull();
    expect(chain.writeContractAsync).not.toHaveBeenCalled();

    // Click List opens modal
    fillList('1', '1', '0.1');
    fireEvent.click(screen.getByRole('button', { name: 'List' }));
    expect(screen.getByTestId('market-confirm-modal')).toBeTruthy();
    // Click Cancel inside modal
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByTestId('market-confirm-modal')).toBeNull();
    expect(chain.writeContractAsync).not.toHaveBeenCalled();
  });

  it('T5: Empty listings state renders "Your listings" empty card', () => {
    chain.listings = [];
    render(<MarketTab />);

    expect(screen.getByTestId('listings-empty').textContent).toContain('No Relics for sale right now.');
    expect(screen.getByTestId('your-listings-empty').textContent).toContain('Nothing listed. Open the Bag and choose List on a Relic.');
  });

  it('renders visible rarity pill text in table and detail panel', () => {
    chain.listings = [[15n, { seller: OTHER, relicId: 4n, amount: 1n, price: parseEther('0.5') }]];
    const { container } = render(<MarketTab />);

    const pills = container.querySelectorAll('.rarity-pill');
    expect(pills.length).toBeGreaterThanOrEqual(1);
    expect(pills[0]?.textContent).toContain('legendary');
  });

  it('renders Routescan link and token details in right detail card', () => {
    chain.listings = [[20n, { seller: OTHER, relicId: 3n, amount: 1n, price: parseEther('0.4') }]];
    render(<MarketTab />);

    expect(screen.getByTestId('token-id').textContent).toContain('#3');
    expect(screen.getByTestId('contract-addr')).toBeTruthy();
    expect(screen.getByTestId('market-detail-price').textContent).toContain('0.4 AVAX');
    const link = screen.getByTestId('routescan-link');
    expect(link.getAttribute('href')).toContain('routescan.io');
    expect(link.getAttribute('href')).toContain('?a=3');
  });

  it('renders active listings under Your listings when user has listed items', () => {
    chain.listings = [[25n, { seller: ME, relicId: 1n, amount: 1n, price: parseEther('0.08') }]];
    render(<MarketTab />);

    expect(screen.queryByTestId('your-listings-empty')).toBeNull();
    expect(screen.getByTestId('cancel-listing-25')).toBeTruthy();
  });
});
