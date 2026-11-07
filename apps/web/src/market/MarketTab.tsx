import { FUJI_CHAIN_ID, getAddresses, relicMarketAbi, relicNftAbi } from '@taskbar-hero/chain';
import { useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { formatEther, parseEther } from 'viem';
import { useAccount, usePublicClient, useReadContract, useReadContracts, useSwitchChain, useWriteContract } from 'wagmi';
import { PixelIcon } from '../art/pixelIcons';
import { relicName } from '../forge/forgeText';
import {
  RELIC_IDS,
  rarityOf,
  relicCategory,
  relicImageUrl,
  relicPower,
  routescanTokenUrl,
  shortAddress,
  txErrorText,
} from './marketText';
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

type FilterChip = 'All' | 'Weapon' | 'Armor' | 'Cheapest' | 'Common' | 'Rare' | 'Epic' | 'Legendary';
type SortField = 'name' | 'rarity' | 'power' | 'seller' | 'price' | 'id';
type SortDir = 'asc' | 'desc';

/** Parses a positive AVAX amount; undefined for anything invalid or zero. */
function parsePrice(text: string): bigint | undefined {
  try {
    const v = parseEther(text.trim());
    return v > 0n ? v : undefined;
  } catch {
    return undefined;
  }
}

const RARITY_ORDER: Record<string, number> = {
  common: 1,
  rare: 2,
  epic: 3,
  legendary: 4,
};

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

  // Market UI state
  const [activeFilter, setActiveFilter] = useState<FilterChip>('All');
  const [sortField, setSortField] = useState<SortField>('price');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [selectedListingId, setSelectedListingId] = useState<bigint | null>(null);

  // Shared Confirmation Modal State
  const [confirmBuyListing, setConfirmBuyListing] = useState<Listing | null>(null);
  const [confirmListPayload, setConfirmListPayload] = useState<{
    relicId: bigint;
    amount: bigint;
    price: bigint;
  } | null>(null);

  if (!nft || !market) {
    return <p className="forge-note">The Relic contracts are not deployed on Fuji yet, so the market is not available.</p>;
  }
  if (!isConnected || !address) {
    return <p className="forge-note">Connect your wallet to see your Relics and the market.</p>;
  }
  if (chainId !== FUJI_CHAIN_ID) {
    return (
      <div className="forge-mint">
        <p className="forge-note" role="alert">
          Wrong network. Switch to Avalanche Fuji to use the market.
        </p>
        <button
          type="button"
          className="forge-btn"
          disabled={switching}
          onClick={() => switchChain({ chainId: FUJI_CHAIN_ID })}
        >
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
  const allListings = [...byId.values()];
  const isMine = (l: Listing) => l.seller.toLowerCase() === address.toLowerCase();

  // Relics in escrow: the wallet balance no longer counts them, so show them as "listed"
  const listedCount = (relicId: bigint) =>
    allListings
      .filter((l) => isMine(l) && l.relicId === relicId)
      .reduce((sum, l) => sum + l.amount, 0n);

  const holdings = owned
    .map((r) => ({ ...r, listed: listedCount(r.relicId) }))
    .filter((r) => r.balance > 0n || r.listed > 0n);

  const sellable = owned.filter((r) => r.balance > 0n);
  const parsedPrice = parsePrice(listPrice);
  const parsedAmount = (() => {
    try {
      const v = BigInt(listAmount.trim());
      return v > 0n ? v : undefined;
    } catch {
      return undefined;
    }
  })();
  const selectedRelic = owned.find((r) => r.relicId.toString() === listId);
  const canList =
    !busy &&
    Boolean(
      selectedRelic &&
        parsedAmount &&
        parsedPrice &&
        parsedAmount <= selectedRelic.balance,
    );

  // Filtered and sorted listings
  const filteredListings = useMemo(() => {
    return allListings.filter((l) => {
      const rarity = rarityOf(l.relicId);
      const cat = relicCategory(l.relicId);
      if (activeFilter === 'All' || activeFilter === 'Cheapest') return true;
      if (activeFilter === 'Weapon') return cat === 'Weapon';
      if (activeFilter === 'Armor') return cat === 'Armor';
      if (activeFilter === 'Common') return rarity === 'common';
      if (activeFilter === 'Rare') return rarity === 'rare';
      if (activeFilter === 'Epic') return rarity === 'epic';
      if (activeFilter === 'Legendary') return rarity === 'legendary';
      return false;
    });
  }, [allListings, activeFilter]);

  const sortedListings = useMemo(() => {
    const list = [...filteredListings];
    list.sort((a, b) => {
      if (activeFilter === 'Cheapest') {
        return a.price < b.price ? -1 : a.price > b.price ? 1 : 0;
      }
      let cmp = 0;
      if (sortField === 'name') {
        const nameA = rarityOf(a.relicId) ? relicName(rarityOf(a.relicId)!) : `Relic #${a.relicId}`;
        const nameB = rarityOf(b.relicId) ? relicName(rarityOf(b.relicId)!) : `Relic #${b.relicId}`;
        cmp = nameA.localeCompare(nameB);
      } else if (sortField === 'rarity') {
        const orderA = RARITY_ORDER[rarityOf(a.relicId) ?? ''] ?? 0;
        const orderB = RARITY_ORDER[rarityOf(b.relicId) ?? ''] ?? 0;
        cmp = orderA - orderB;
      } else if (sortField === 'power') {
        cmp = relicPower(a.relicId) - relicPower(b.relicId);
      } else if (sortField === 'seller') {
        const sellerA = isMine(a) ? 'You' : a.seller;
        const sellerB = isMine(b) ? 'You' : b.seller;
        cmp = sellerA.localeCompare(sellerB);
      } else if (sortField === 'price') {
        cmp = a.price < b.price ? -1 : a.price > b.price ? 1 : 0;
      } else {
        cmp = a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [filteredListings, sortField, sortDir, activeFilter, address]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  // Currently selected listing for right detail card
  const activeDetailListing =
    sortedListings.find((l) => l.id === selectedListingId) ??
    sortedListings[0] ??
    null;

  // User's own listings
  const myListings = allListings.filter(isMine);

  const refreshAfterTx = async () => {
    await queryClient.invalidateQueries();
    await retryReads();
  };

  const executeBuy = async (l: Listing) => {
    setBusy('Confirm in your wallet…');
    setMessage(null);
    try {
      const hash = await writeContractAsync({
        address: market,
        abi: relicMarketAbi,
        functionName: 'buy',
        args: [l.id],
        value: l.price,
      });
      setBusy('Waiting for Avalanche…');
      if (client) await client.waitForTransactionReceipt({ hash });
      setMessage('Bought! The Relic is in your wallet.');
      await refreshAfterTx();
    } catch (e) {
      setMessage(txErrorText(e));
      await refreshAfterTx();
    } finally {
      setBusy(null);
    }
  };

  const cancel = async (l: Listing) => {
    setBusy('Confirm in your wallet…');
    setMessage(null);
    try {
      const hash = await writeContractAsync({
        address: market,
        abi: relicMarketAbi,
        functionName: 'cancel',
        args: [l.id],
      });
      setBusy('Waiting for Avalanche…');
      if (client) await client.waitForTransactionReceipt({ hash });
      setMessage('Listing cancelled.');
      await refreshAfterTx();
    } catch (e) {
      setMessage(txErrorText(e));
      await refreshAfterTx();
    } finally {
      setBusy(null);
    }
  };

  const executeList = async (targetRelicId: bigint, amount: bigint, price: bigint) => {
    setBusy('Confirm in your wallet…');
    setMessage(null);
    try {
      if (!approval.data) {
        setBusy('Step 1 of 2: approve the market contract in your wallet…');
        const approveHash = await writeContractAsync({
          address: nft,
          abi: relicNftAbi,
          functionName: 'setApprovalForAll',
          args: [market, true],
        });
        if (client) await client.waitForTransactionReceipt({ hash: approveHash });
      }

      setBusy('Step 2 of 2: create the listing in your wallet…');
      const listHash = await writeContractAsync({
        address: market,
        abi: relicMarketAbi,
        functionName: 'list',
        args: [targetRelicId, amount, price],
      });
      if (client) await client.waitForTransactionReceipt({ hash: listHash });
      setMessage('Listed!');
      setListId('');
      setListPrice('');
      await refreshAfterTx();
    } catch (e) {
      setMessage(txErrorText(e));
    } finally {
      setBusy(null);
    }
  };

  const handleListClick = () => {
    if (!canList || !selectedRelic || !parsedAmount || !parsedPrice) return;
    setConfirmListPayload({
      relicId: selectedRelic.relicId,
      amount: parsedAmount,
      price: parsedPrice,
    });
  };

  return (
    <div className="market">
      {readFailed && (
        <ErrorNote
          text="Mochi couldn't read the Relic shelf from Fuji just now. Check your connection and try again."
          onRetry={retryReads}
        />
      )}

      {/* 2-Column Desktop Layout */}
      <div className="market-cols">
        {/* Left Column: Market Table & Controls */}
        <div className="market-col-main">
          <section className="market-card" aria-labelledby="market-listings">
            <div className="market-header-row">
              <h2 id="market-listings">Relic market</h2>
              <div className="market-filter-chips" role="group" aria-label="Filter listings">
                {(['All', 'Weapon', 'Armor', 'Cheapest', 'Common', 'Rare', 'Epic', 'Legendary'] as FilterChip[]).map(
                  (f) => (
                    <button
                      key={f}
                      type="button"
                      className={`market-chip ${activeFilter === f ? 'active' : ''}`}
                      onClick={() => setActiveFilter(f)}
                    >
                      {f}
                    </button>
                  ),
                )}
              </div>
            </div>

            <p className="market-hint">Prices are in {TESTNET}.</p>

            {readFailed ? null : sortedListings.length === 0 ? (
              <p data-testid="listings-empty">No Relics for sale right now.</p>
            ) : (
              <div className="market-table-wrap">
                <table className="market-table" data-testid="listings" aria-label="Relic market listings">
                  <thead>
                    <tr>
                      <th className="market-art-cell" aria-label="Thumbnail" />
                      <th
                        className={`sortable ${sortField === 'name' ? 'sorted' : ''}`}
                        onClick={() => toggleSort('name')}
                      >
                        Relic {sortField === 'name' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                      </th>
                      <th
                        className={`sortable ${sortField === 'rarity' ? 'sorted' : ''}`}
                        onClick={() => toggleSort('rarity')}
                      >
                        Rarity {sortField === 'rarity' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                      </th>
                      <th
                        className={`sortable ${sortField === 'power' ? 'sorted' : ''}`}
                        onClick={() => toggleSort('power')}
                      >
                        Power {sortField === 'power' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                      </th>
                      <th
                        className={`sortable ${sortField === 'seller' ? 'sorted' : ''}`}
                        onClick={() => toggleSort('seller')}
                      >
                        Seller {sortField === 'seller' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                      </th>
                      <th
                        className={`sortable text-right ${sortField === 'price' ? 'sorted' : ''}`}
                        onClick={() => toggleSort('price')}
                      >
                        Price (AVAX) {sortField === 'price' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedListings.map((l) => {
                      const rarity = rarityOf(l.relicId);
                      const isSelected = activeDetailListing?.id === l.id;
                      const power = relicPower(l.relicId);
                      const relicTitle = rarity ? relicName(rarity) : `Relic #${l.relicId}`;

                      return (
                        <tr
                          key={l.id.toString()}
                          className={`market-row ${isSelected ? 'hl selected' : ''}`}
                          data-testid={`listing-${l.id}`}
                          onClick={() => setSelectedListingId(l.id)}
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setSelectedListingId(l.id);
                            }
                          }}
                        >
                          <td className="market-art-cell">
                            <span className="market-art-thumb">
                              {rarity ? (
                                <img
                                  src={relicImageUrl(l.relicId)}
                                  alt={relicName(rarity)}
                                  width={32}
                                  height={32}
                                />
                              ) : (
                                <PixelIcon name="bag" size={3} />
                              )}
                            </span>
                          </td>
                          <td>
                            <strong>{relicTitle}</strong>
                            {l.amount > 1n && <span className="muted"> × {l.amount.toString()}</span>}
                          </td>
                          <td>
                            {rarity && (
                              <span className={`rarity-pill ${rarity}`}>
                                {rarity}
                              </span>
                            )}
                          </td>
                          <td className="num">{power}</td>
                          <td className="num muted">{isMine(l) ? 'You' : shortAddress(l.seller)}</td>
                          <td className="num text-right">{formatEther(l.price)} AVAX</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* My Relics Shelf */}
          <section className="market-card" aria-labelledby="my-relics">
            <h3 id="my-relics">My Relics</h3>
            {balances.isLoading ? (
              <p>Loading…</p>
            ) : balances.isError ? null : holdings.length === 0 ? (
              <p data-testid="relics-empty">No Relics yet. Forge one in the Forge tab.</p>
            ) : (
              <ul className="market-relics" data-testid="my-relics">
                {holdings.map((r) => (
                  <li key={r.rarity} className={`pixel-card rarity-${r.rarity}`}>
                    <img src={relicImageUrl(r.relicId)} alt={relicName(r.rarity)} width={36} height={36} />
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

          {/* Sell Form */}
          <section className="market-card" aria-labelledby="market-sell">
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
                <input
                  inputMode="numeric"
                  value={listAmount}
                  onChange={(e) => setListAmount(e.target.value)}
                  aria-label="Amount"
                />
              </label>
              <label>
                Price (AVAX)
                <input
                  inputMode="decimal"
                  placeholder="0.1"
                  value={listPrice}
                  onChange={(e) => setListPrice(e.target.value)}
                  aria-label="Price (AVAX)"
                />
              </label>
              <button
                type="button"
                className="forge-btn btn"
                disabled={!canList}
                onClick={handleListClick}
              >
                List
              </button>
            </div>
            <p className="market-hint">{TESTNET}. The total price covers all copies in the listing.</p>
            <p className="market-hint">
              Approving lets the market contract transfer all Relics in your wallet, including future Relics, until
              you revoke approval.
            </p>
          </section>
        </div>

        {/* Right Column: Selected Relic Details & Your Listings */}
        <div className="market-col-side">
          {activeDetailListing ? (
            <div className="market-detail-card">
              {(() => {
                const rarity = rarityOf(activeDetailListing.relicId);
                const title = rarity
                  ? relicName(rarity)
                  : `Relic #${activeDetailListing.relicId}`;
                const power = relicPower(activeDetailListing.relicId);

                return (
                  <>
                    <div className="market-detail-hero">
                      <div className="market-detail-art">
                        {rarity ? (
                          <img
                            src={relicImageUrl(activeDetailListing.relicId)}
                            alt={title}
                            width={48}
                            height={48}
                          />
                        ) : (
                          <PixelIcon name="bag" size={4} />
                        )}
                      </div>
                      <div className="market-detail-meta">
                        <h3>{title}</h3>
                        {rarity && <span className={`rarity-pill ${rarity}`}>{rarity}</span>}
                      </div>
                    </div>

                    <div className="market-stat-rows">
                      <div className="market-stat-row">
                        <span>Token</span>
                        <span data-testid="token-id">#{activeDetailListing.relicId.toString()}</span>
                      </div>
                      <div className="market-stat-row">
                        <span>Contract</span>
                        <span data-testid="contract-addr">{shortAddress(nft)}</span>
                      </div>
                      <div className="market-stat-row">
                        <span>Price</span>
                        <span data-testid="market-detail-price" style={{ color: 'var(--gold, #ffb86b)' }}>
                          {formatEther(activeDetailListing.price)} AVAX
                        </span>
                      </div>
                      <div className="market-stat-row">
                        <span>Power</span>
                        <span>{power}</span>
                      </div>
                      <div className="market-stat-row">
                        <span>Seller</span>
                        <span>{isMine(activeDetailListing) ? 'You' : shortAddress(activeDetailListing.seller)}</span>
                      </div>
                    </div>

                    {isMine(activeDetailListing) ? (
                      <button
                        type="button"
                        className="btn sec"
                        data-testid="market-cancel-btn"
                        disabled={!!busy}
                        onClick={() => void cancel(activeDetailListing)}
                      >
                        Cancel Listing
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn"
                        data-testid="market-buy-btn"
                        disabled={!!busy}
                        onClick={() => setConfirmBuyListing(activeDetailListing)}
                      >
                        Buy Relic
                      </button>
                    )}

                    <a
                      href={routescanTokenUrl(nft, activeDetailListing.relicId)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="market-routescan-link"
                      data-testid="routescan-link"
                    >
                      View on Routescan ↗
                    </a>
                  </>
                );
              })()}
            </div>
          ) : null}

          {/* Your listings */}
          <div className="market-your-listings">
            <h3>Your listings</h3>
            {myListings.length === 0 ? (
              <div className="muted" data-testid="your-listings-empty" style={{ fontSize: '13px' }}>
                Nothing listed. Open the Bag and choose List on a Relic.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {myListings.map((l) => {
                  const rarity = rarityOf(l.relicId);
                  const title = rarity ? relicName(rarity) : `Relic #${l.relicId}`;
                  return (
                    <div key={l.id.toString()} className="market-user-listing-item">
                      <div>
                        <strong>{title}</strong>
                        <div className="muted" style={{ fontSize: '11px' }}>
                          {formatEther(l.price)} AVAX
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn sec sm"
                        data-testid={`cancel-listing-${l.id}`}
                        disabled={!!busy}
                        onClick={() => void cancel(l)}
                      >
                        Cancel
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {busy && <p role="status">{busy}</p>}
      {message && !busy && (
        <p className="forge-note" role="status" data-testid="market-message">
          {message}
        </p>
      )}

      {/* Shared Confirmation Modal for Buying */}
      {confirmBuyListing && (
        <div className="scrim" data-testid="market-confirm-modal" role="dialog" aria-modal="true">
          <div className="modal">
            <h2>Buy this Relic?</h2>
            <p>
              {rarityOf(confirmBuyListing.relicId)
                ? relicName(rarityOf(confirmBuyListing.relicId)!)
                : `Relic #${confirmBuyListing.relicId}`}{' '}
              (Token #{confirmBuyListing.relicId.toString()}) from {shortAddress(confirmBuyListing.seller)} for{' '}
              <b className="num" style={{ color: 'var(--gold, #ffb86b)' }}>
                {formatEther(confirmBuyListing.price)} AVAX
              </b>
              . Your wallet will ask you to sign.
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="btn ghost"
                onClick={() => setConfirmBuyListing(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn"
                data-testid="modal-confirm-btn"
                onClick={() => {
                  const item = confirmBuyListing;
                  setConfirmBuyListing(null);
                  void executeBuy(item);
                }}
              >
                Confirm Buy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shared Confirmation Modal for Listing */}
      {confirmListPayload && (
        <div className="scrim" data-testid="market-confirm-modal" role="dialog" aria-modal="true">
          <div className="modal">
            <h2>List this Relic?</h2>
            <p>
              {rarityOf(confirmListPayload.relicId)
                ? relicName(rarityOf(confirmListPayload.relicId)!)
                : `Relic #${confirmListPayload.relicId}`}{' '}
              #{confirmListPayload.relicId.toString()} will be listed for{' '}
              <b className="num" style={{ color: 'var(--gold, #ffb86b)' }}>
                {formatEther(confirmListPayload.price)} AVAX
              </b>
              . You can cancel the listing any time. Your wallet will ask you to sign.
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="btn ghost"
                onClick={() => setConfirmListPayload(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn"
                data-testid="modal-confirm-btn"
                onClick={() => {
                  const payload = confirmListPayload;
                  setConfirmListPayload(null);
                  void executeList(payload.relicId, payload.amount, payload.price);
                }}
              >
                Confirm Listing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
