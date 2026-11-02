import { FUJI_CHAIN_ID, getAddresses, relicMarketAbi, relicNftAbi } from '@taskbar-hero/chain';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { parseEther } from 'viem';
import { useAccount, usePublicClient, useReadContract, useReadContracts, useSwitchChain, useWriteContract } from 'wagmi';
import { RELIC_IDS, txErrorText } from './marketText';
import { MarketGate, MarketView } from './MarketView';
import type { Listing } from './marketViewModel';
import '../forge/forge.css';
import '../inventory/inventory.css';
import './market.css';

const PAGE = 50n;

type Address = `0x${string}`;

/** Parses a positive AVAX amount; undefined for anything invalid or zero. */
function parsePrice(text: string): bigint | undefined {
  try {
    const v = parseEther(text.trim());
    return v > 0n ? v : undefined;
  } catch {
    return undefined;
  }
}

/** My Relics (on-chain balances) and the RelicMarket: browse, buy, cancel and list. Fully on chain. */
export function MarketTab() {
  const { isConnected, chainId, address } = useAccount();
  const { switchChain, isPending: switching } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const client = usePublicClient({ chainId: FUJI_CHAIN_ID });
  const queryClient = useQueryClient();
  const { RelicNFT: nft, RelicMarket: market } = getAddresses(FUJI_CHAIN_ID);
  const ready = Boolean(nft && market && isConnected && address);

  const balances = useReadContract({
    address: nft,
    abi: relicNftAbi,
    functionName: 'balanceOfBatch',
    args: address ? [RELIC_IDS.map(() => address), RELIC_IDS.map((r) => r.relicId)] : undefined,
    chainId: FUJI_CHAIN_ID,
    query: { enabled: ready },
  });
  const approval = useReadContract({
    address: nft,
    abi: relicNftAbi,
    functionName: 'isApprovedForAll',
    args: address && market ? [address, market] : undefined,
    chainId: FUJI_CHAIN_ID,
    query: { enabled: ready },
  });
  const count = useReadContract({
    address: market,
    abi: relicMarketAbi,
    functionName: 'activeListingCount',
    chainId: FUJI_CHAIN_ID,
    query: { enabled: ready },
  });
  const total = count.data ?? 0n;
  const pages: bigint[] = [];
  for (let offset = 0n; offset < total; offset += PAGE) pages.push(offset);
  const listingPages = useReadContracts({
    contracts: pages.map((offset) => ({
      address: market,
      abi: relicMarketAbi,
      functionName: 'getListings',
      args: [offset, PAGE],
      chainId: FUJI_CHAIN_ID,
    })),
    query: { enabled: ready && pages.length > 0 },
  });

  const readFailed = balances.isError || count.isError || listingPages.isError;
  const retryReads = () => void Promise.all([balances.refetch(), count.refetch(), listingPages.refetch()]);

  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [listId, setListId] = useState<string>('');
  const [listAmount, setListAmount] = useState('1');
  const [listPrice, setListPrice] = useState('');

  if (!nft || !market) {
    return <p className="forge-note">The Relic contracts are not deployed on Fuji yet, so the market is not available.</p>;
  }
  if (!isConnected || !address) {
    return <MarketGate nft={nft} market={market}><p className="forge-note">Connect your wallet to see your Relics and the market.</p></MarketGate>;
  }
  if (chainId !== FUJI_CHAIN_ID) {
    return (
      <MarketGate nft={nft} market={market}>
        <p className="forge-note" role="alert">Wrong network. Switch to Avalanche Fuji to use the market.</p>
        <button type="button" className="forge-btn" disabled={switching} onClick={() => switchChain({ chainId: FUJI_CHAIN_ID })}>
          Switch to Fuji
        </button>
      </MarketGate>
    );
  }

  const owned = RELIC_IDS.map((r, i) => ({ ...r, balance: balances.data?.[i] ?? 0n }));

  // Keyed by id: getListings order is not stable, so pages can overlap or shift between reads.
  const byId = new Map<bigint, Listing>();
  for (const page of listingPages.data ?? []) {
    if (page.status !== 'success' || !page.result) continue;
    const [ids, items] = page.result as readonly [readonly bigint[], readonly Omit<Listing, 'id'>[]];
    ids.forEach((id, i) => {
      const item = items[i];
      if (item) byId.set(id, { id, ...item });
    });
  }
  const listings = [...byId.values()].sort((a, b) => (a.id < b.id ? -1 : 1));
  const isMine = (l: Listing) => l.seller.toLowerCase() === address.toLowerCase();
  // Relics in escrow: the wallet balance no longer counts them, so show them as "listed".
  const listedBy = (relicId: bigint) =>
    listings.filter((l) => isMine(l) && l.relicId === relicId).reduce((sum, l) => sum + l.amount, 0n);
  const holdings = owned.map((r) => ({ ...r, listed: listedBy(r.relicId) })).filter((r) => r.balance > 0n || r.listed > 0n);
  const sellable = holdings.filter((r) => r.balance > 0n);

  const selected = owned.find((r) => r.relicId.toString() === listId);
  const amount = /^\d+$/.test(listAmount.trim()) ? BigInt(listAmount.trim()) : 0n;
  const price = parsePrice(listPrice);
  const canList = !busy && !!selected && amount > 0n && amount <= selected.balance && price !== undefined;

  const send = async (label: string, write: () => Promise<Address>) => {
    if (!client) throw new Error('No Fuji connection');
    setBusy(label);
    const hash = await write();
    const receipt = await client.waitForTransactionReceipt({ hash });
    if (receipt.status !== 'success') throw new Error('Transaction reverted');
  };

  const run = async (steps: () => Promise<string>) => {
    setMessage(null);
    try {
      setMessage(await steps());
    } catch (e) {
      setMessage(txErrorText(e));
    } finally {
      setBusy(null);
      await queryClient.invalidateQueries();
    }
  };

  const buy = (l: Listing) =>
    run(async () => {
      await send('Buying…', () =>
        writeContractAsync({ address: market, abi: relicMarketAbi, functionName: 'buy', args: [l.id], value: l.price, chainId: FUJI_CHAIN_ID }),
      );
      return 'Bought! The Relic is in your wallet.';
    });

  const cancel = (l: Listing) =>
    run(async () => {
      await send('Cancelling…', () =>
        writeContractAsync({ address: market, abi: relicMarketAbi, functionName: 'cancel', args: [l.id], chainId: FUJI_CHAIN_ID }),
      );
      return 'Listing cancelled. The Relic is back in your wallet.';
    });

  const list = () => {
    if (!canList || !selected || price === undefined) return;
    void run(async () => {
      if (approval.data !== true) {
        await send('Approving the market…', () =>
          writeContractAsync({ address: nft, abi: relicNftAbi, functionName: 'setApprovalForAll', args: [market, true], chainId: FUJI_CHAIN_ID }),
        );
      }
      await send('Listing…', () =>
        writeContractAsync({
          address: market,
          abi: relicMarketAbi,
          functionName: 'list',
          args: [selected.relicId, amount, price],
          chainId: FUJI_CHAIN_ID,
        }),
      );
      setListPrice('');
      return 'Listed!';
    });
  };

  return <MarketView nft={nft} market={market} address={address} listings={listings} holdings={holdings} sellable={sellable}
    loadingHoldings={balances.isLoading} holdingsFailed={balances.isError} readFailed={readFailed}
    loadingListings={count.isLoading || listingPages.isLoading} busy={busy} message={message}
    form={{ relicId: listId, amount: listAmount, price: listPrice, canList }}
    onRelicId={setListId} onAmount={setListAmount} onPrice={setListPrice} onList={list}
    onBuy={listing => { void buy(listing); }} onCancel={listing => { void cancel(listing); }} onRetry={retryReads} />;
}
