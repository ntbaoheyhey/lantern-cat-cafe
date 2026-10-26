import { FUJI_CHAIN_ID, getAddresses, relicMarketAbi, relicNftAbi } from '@taskbar-hero/chain';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { formatEther, parseEther } from 'viem';
import { useAccount, usePublicClient, useReadContract, useReadContracts, useSwitchChain, useWriteContract } from 'wagmi';
import { PixelIcon } from '../art/pixelIcons';
import { relicName } from '../forge/forgeText';
import { RELIC_IDS, rarityOf, relicImageUrl, shortAddress, txErrorText } from './marketText';
import { ErrorNote } from '../game/LoadNotice';
import '../forge/forge.css';
import '../inventory/inventory.css';
import './market.css';

const PAGE = 50n;
const TESTNET = 'Fuji testnet, test AVAX';

type Address = `0x${string}`;
interface Listing {
  id: bigint;
  seller: Address;
  relicId: bigint;
  amount: bigint;
  price: bigint;
}

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
    return <p className="forge-note">Connect your wallet to see your Relics and the market.</p>;
  }
  if (chainId !== FUJI_CHAIN_ID) {
    return (
      <div className="forge-mint">
        <p className="forge-note" role="alert">Wrong network. Switch to Avalanche Fuji to use the market.</p>
        <button type="button" className="forge-btn" disabled={switching} onClick={() => switchChain({ chainId: FUJI_CHAIN_ID })}>
          Switch to Fuji
        </button>
      </div>
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

  return (
    <div className="market">
      {readFailed && (
        <ErrorNote text="Mochi couldn't read the Relic shelf from Fuji just now. Check your connection and try again." onRetry={retryReads} />
      )}
      <section aria-labelledby="my-relics">
        <h3 id="my-relics">My Relics</h3>
        {balances.isLoading ? (
          <p>Loading…</p>
        ) : balances.isError ? null : holdings.length === 0 ? (
          <p data-testid="relics-empty">No Relics yet. Forge one in the Forge tab.</p>
        ) : (
          <ul className="market-relics" data-testid="my-relics">
            {holdings.map((r) => (
              <li key={r.rarity} className={`pixel-card rarity-${r.rarity}`}>
                <img src={relicImageUrl(r.relicId)} alt={relicName(r.rarity)} width={40} height={40} />
                <span>
                  {relicName(r.rarity)}
                  {r.balance > 0n && <> × {r.balance.toString()}</>}
                  {r.listed > 0n && <small> × {r.listed.toString()} listed</small>}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="market-listings">
        <h3 id="market-listings">Market</h3>
        <p className="market-hint">Prices are in {TESTNET}.</p>
        {readFailed ? null : listings.length === 0 ? (
          <p data-testid="listings-empty">No Relics for sale right now.</p>
        ) : (
          <ul className="market-listings" data-testid="listings">
            {listings.map((l) => {
              const rarity = rarityOf(l.relicId);
              return (
                <li key={l.id.toString()} className="pixel-card market-listing" data-testid={`listing-${l.id}`}>
                  <span className={`market-relic${rarity ? ` rarity-${rarity}` : ''}`}>
                    <span className="market-art">
                      {rarity ? (
                        <img src={relicImageUrl(l.relicId)} alt={relicName(rarity)} width={56} height={56} />
                      ) : (
                        <PixelIcon name="bag" size={5} />
                      )}
                    </span>
                    <span className="market-relic-info">
                      <strong>{rarity ? relicName(rarity) : `Relic #${l.relicId}`}</strong>
                      <small> × {l.amount.toString()} listed</small>
                    </span>
                  </span>
                  <span className="market-price">
                    <PixelIcon name="shop" size={2} />
                    <span>{formatEther(l.price)} AVAX</span>
                  </span>
                  <span className="market-seller">Seller · {isMine(l) ? 'You' : shortAddress(l.seller)}</span>
                  {isMine(l) ? (
                    <button type="button" className="forge-btn" disabled={!!busy} onClick={() => void cancel(l)}>
                      Cancel
                    </button>
                  ) : (
                    <button type="button" className="forge-btn pixel-btn" disabled={!!busy} onClick={() => void buy(l)}>
                      Buy
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section aria-labelledby="market-sell">
        <h3 id="market-sell">Sell a Relic</h3>
        <div className="market-form">
          <label>
            Relic
            <select value={listId} onChange={(e) => setListId(e.target.value)}>
              <option value="">Choose…</option>
              {sellable.map((r) => (
                <option key={r.rarity} value={r.relicId.toString()}>
                  {relicName(r.rarity)} (you have {r.balance.toString()})
                </option>
              ))}
            </select>
          </label>
          <label>
            Amount
            <input inputMode="numeric" value={listAmount} onChange={(e) => setListAmount(e.target.value)} />
          </label>
          <label>
            Price (AVAX)
            <input inputMode="decimal" placeholder="0.1" value={listPrice} onChange={(e) => setListPrice(e.target.value)} />
          </label>
          <button type="button" className="forge-btn" disabled={!canList} onClick={list}>
            List
          </button>
        </div>
        <p className="market-hint">{TESTNET}. The total price covers all copies in the listing.</p>
        <p className="market-hint">Approving lets the market contract transfer all Relics in your wallet, including future Relics, until you revoke approval.</p>
      </section>

      {busy && <p role="status">{busy}</p>}
      {message && !busy && (
        <p className="forge-note" role="status" data-testid="market-message">
          {message}
        </p>
      )}
    </div>
  );
}
