import { Art2Image } from '../art/Art2';
import { useId, useState, type ReactNode } from 'react';
import type { Rarity } from '@taskbar-hero/game-rules';
import { formatEther } from 'viem';
import { PixelIcon } from '../art/pixelIcons';
import { capitalize, relicName } from '../forge/forgeText';
import { ErrorNote } from '../game/LoadNotice';
import { EmptyState } from '../ui';
import { RELIC_IDS, rarityOf, relicImageUrl, shortAddress } from './marketText';
import { fujiContractUrl, isOwnListing, listingName, visibleListings, type Listing, type ListingFilter, type ListingSort, type SortDirection } from './marketViewModel';
import './market.css';

export const MARKET_TESTNET = 'Fuji testnet, test AVAX';
export interface RelicHolding { rarity: Rarity; relicId: bigint; balance: bigint; listed: bigint }
export interface MarketViewProps {
  nft: string;
  market: string;
  address: string;
  listings: readonly Listing[];
  holdings: readonly RelicHolding[];
  sellable: readonly RelicHolding[];
  loadingHoldings: boolean;
  holdingsFailed: boolean;
  readFailed: boolean;
  loadingListings: boolean;
  busy: string | null;
  message: string | null;
  form: { relicId: string; amount: string; price: string; canList: boolean };
  onRelicId: (id: string) => void;
  onAmount: (amount: string) => void;
  onPrice: (price: string) => void;
  onList: () => void;
  onBuy: (listing: Listing) => void;
  onCancel: (listing: Listing) => void;
  onRetry: () => void;
}
const columns: readonly { key: ListingSort; label: string }[] = [
  { key: 'name', label: 'Relic' }, { key: 'rarity', label: 'Rarity' },
  { key: 'quantity', label: 'Quantity' }, { key: 'seller', label: 'Seller' },
  { key: 'price', label: 'Total price (AVAX)' },
];
function ContractLinks({ nft, market }: { nft: string; market: string }) {
  return <div className="market-contract-links">
    <a href={fujiContractUrl(nft)} target="_blank" rel="noopener noreferrer" title={nft}>RelicNFT on Routescan</a>
    <a href={fujiContractUrl(market)} target="_blank" rel="noopener noreferrer" title={market}>RelicMarket on Routescan</a>
  </div>;
}
export function MarketGate({ nft, market, children }: { nft: string; market: string; children: ReactNode }) {
  return <div className="market market-gate"><div className="market-cols">
    <section className="market-card market-list-card"><h2>Relic market</h2><p className="market-hint">{MARKET_TESTNET}. On-chain Relics only.</p>
      <EmptyState title="Your Relic shelf" illustration={<><PixelIcon name="shop" size={6} /><Art2Image id="no-wallet" /></>}>{children}</EmptyState>
    </section>
    <aside className="market-card"><h3>Avalanche Fuji</h3><p className="market-hint">Chain 43113</p>
      <p>Relics are ERC-1155 collectibles. Equipment stays in your Bag.</p>
      <dl className="market-facts"><div><dt>RelicNFT</dt><dd title={nft}>{shortAddress(nft)}</dd></div><div><dt>RelicMarket</dt><dd title={market}>{shortAddress(market)}</dd></div></dl>
      <ContractLinks nft={nft} market={market} />
    </aside>
  </div></div>;
}

/** Actual chain rows and existing transaction callbacks; no invented stats or wallet calls. */
export function MarketView(props: MarketViewProps) {
  const relicLabelId = useId();
  const [filter, setFilter] = useState<ListingFilter>('all');
  const [sort, setSort] = useState<ListingSort>('price');
  const [direction, setDirection] = useState<SortDirection>('asc');
  const [selectedId, setSelectedId] = useState<bigint | null>(null);
  const [mode, setMode] = useState<'inspect' | 'sell'>('inspect');
  const rows = props.readFailed || props.loadingListings ? [] : visibleListings(props.listings, filter, sort, direction, props.address);
  const selected = rows.find(row => row.id === selectedId) ?? rows[0];
  const mine = props.listings.filter(row => isOwnListing(row, props.address));
  const select = (row: Listing) => { setSelectedId(row.id); setMode('inspect'); };
  const sortBy = (key: ListingSort) => { if (sort === key) setDirection(value => value === 'asc' ? 'desc' : 'asc'); else { setSort(key); setDirection('asc'); } };
  const rarity = selected ? rarityOf(selected.relicId) : undefined;
  return <div className="market">
    {props.readFailed && <ErrorNote text="Mochi couldn't read the Relic shelf from Fuji just now. Check your connection and try again." onRetry={props.onRetry} />}
    <div className="market-cols">
      <div className="market-col-main">
        <section className="market-card market-list-card" aria-labelledby="market-listings">
          <div className="market-header-row"><h2 id="market-listings">Relic market</h2>
          </div>
          <div className="market-filters" role="group" aria-label="Filter listings">
            {([{ id: 'all', label: 'All Relics' }, ...RELIC_IDS.map(row => ({ id: row.rarity, label: capitalize(row.rarity) })), { id: 'mine', label: 'Your listings' }] as const).map(option =>
              <button key={option.id} type="button" aria-pressed={filter === option.id} onClick={() => setFilter(option.id as ListingFilter)}>{option.label}</button>)}
          </div>
          <p className="market-hint">Prices are in {MARKET_TESTNET}. Select a listing to inspect it.</p>
          {props.readFailed ? null : props.loadingListings ? <p role="status">Loading listings…</p> : rows.length === 0 ?
            <EmptyState title={filter === 'all' ? 'No active listings' : 'No matching listings'} illustration={<Art2Image id="market-empty" />}><p data-testid="listings-empty">{filter === 'all' ? 'No Relics for sale right now.' : 'Try another rarity or show all Relics.'}</p></EmptyState> :
            <div className="market-table-wrap" tabIndex={0} role="region" aria-label="Scrollable Relic listings"><table className="market-table" data-testid="listings" aria-label="Relic market listings">
              <thead><tr><th scope="col" aria-label="Artwork" />{columns.map(column => <th key={column.key} scope="col" aria-sort={sort === column.key ? direction === 'asc' ? 'ascending' : 'descending' : 'none'}>
                <button type="button" className="market-sort" aria-label={`Sort by ${column.label.toLowerCase()}`} onClick={() => sortBy(column.key)}>{column.label}{sort === column.key && <span aria-hidden="true"> {direction === 'asc' ? '↑' : '↓'}</span>}</button>
              </th>)}</tr></thead>
              <tbody>{rows.map(row => { const quality = rarityOf(row.relicId); return <tr key={row.id.toString()} data-testid={`listing-${row.id}`} className={selected?.id === row.id ? 'selected' : ''} onClick={() => select(row)}>
                <td>{quality ? <img src={relicImageUrl(row.relicId)} alt={relicName(quality)} width={32} height={32} /> : <PixelIcon name="bag" size={3} />}</td>
                <td><button type="button" className="market-select" aria-label={`Select ${listingName(row)} listing ${row.id}`} aria-pressed={selected?.id === row.id} onClick={() => select(row)}>{listingName(row)}{row.amount > 1n && ` × ${row.amount}`}</button></td>
                <td>{quality ? capitalize(quality) : 'Unknown'}</td><td className="num">{row.amount.toString()}</td>
                <td className="num" title={row.seller}>{isOwnListing(row, props.address) ? 'You' : shortAddress(row.seller)}</td><td className="num market-price">{formatEther(row.price)} AVAX</td>
              </tr>; })}</tbody>
            </table></div>}
        </section>
        <section className="market-card market-holdings" aria-labelledby="my-relics"><h3 id="my-relics">My Relics</h3>
          {props.loadingHoldings ? <p>Loading…</p> : props.holdingsFailed ? null : props.holdings.length === 0 ? <p data-testid="relics-empty">No Relics yet. Forge one in the Forge tab.</p> :
            <ul className="market-relics" data-testid="my-relics">{props.holdings.map(row => <li key={row.rarity}><img src={relicImageUrl(row.relicId)} alt={relicName(row.rarity)} width={32} height={32} /><span>{relicName(row.rarity)}{row.balance > 0n && <> × {row.balance.toString()}</>}{row.listed > 0n && <small> × {row.listed.toString()} listed</small>}</span></li>)}</ul>}
        </section>
      </div>
      <aside className="market-col-side">
        <div className="market-modes" role="group" aria-label="Market action">
          <button type="button" aria-pressed={mode === 'inspect'} onClick={() => setMode('inspect')}>Inspect listing</button>
          <button type="button" aria-pressed={mode === 'sell'} onClick={() => setMode('sell')}>Sell a Relic</button>
        </div>
        {mode === 'inspect' ? <section className="market-card market-detail-card" aria-label="Listing details">
          {selected ? <><div className="market-detail-hero">{rarity ? <img src={relicImageUrl(selected.relicId)} alt={listingName(selected)} width={64} height={64} /> : <PixelIcon name="bag" size={6} />}<div><h3>{listingName(selected)}</h3><p>{rarity ? capitalize(rarity) : 'Unknown Relic'}</p></div></div>
            <div className="market-facts-scroll" tabIndex={0} role="region" aria-label="Scrollable listing facts"><dl className="market-facts"><div><dt>Listing</dt><dd>#{selected.id.toString()}</dd></div><div><dt>Token</dt><dd data-testid="token-id">#{selected.relicId.toString()}</dd></div><div><dt>Quantity</dt><dd>{selected.amount.toString()}</dd></div><div><dt>Total price</dt><dd data-testid="market-detail-price">{formatEther(selected.price)} AVAX</dd></div><div><dt>Seller</dt><dd title={selected.seller}>{isOwnListing(selected, props.address) ? 'You' : shortAddress(selected.seller)}</dd></div><div><dt>RelicNFT</dt><dd title={props.nft} data-testid="contract-addr">{shortAddress(props.nft)}</dd></div></dl></div>
            {isOwnListing(selected, props.address) ? <button type="button" className="forge-btn" disabled={!!props.busy} onClick={() => props.onCancel(selected)}>Cancel</button> : <button type="button" className="forge-btn pixel-btn" disabled={!!props.busy} onClick={() => props.onBuy(selected)}>Buy</button>}
          </> : <EmptyState title="Inspect a Relic">Select a listing to see its on-chain details.</EmptyState>}
          <ContractLinks nft={props.nft} market={props.market} />
        </section> : <section className="market-card" aria-labelledby="market-sell"><h3 id="market-sell">Sell a Relic</h3>
          <div className="market-form"><label><span id={relicLabelId}>Relic</span><select aria-labelledby={relicLabelId} value={props.form.relicId} onChange={event => props.onRelicId(event.target.value)}><option value="">Choose…</option>{props.sellable.map(row => <option key={row.rarity} value={row.relicId.toString()}>{relicName(row.rarity)} (you have {row.balance.toString()})</option>)}</select></label>
            <div className="market-form-amounts"><label>Amount<input inputMode="numeric" value={props.form.amount} onChange={event => props.onAmount(event.target.value)} /></label><label>Price (AVAX)<input inputMode="decimal" placeholder="0.1" value={props.form.price} onChange={event => props.onPrice(event.target.value)} /></label></div>
            <button type="button" className="forge-btn pixel-btn" disabled={!props.form.canList || props.readFailed || props.loadingHoldings} onClick={props.onList}>List</button>
          </div><p className="market-hint">{MARKET_TESTNET}. The total price covers all copies in the listing.</p><p className="market-hint">Approving lets the market contract transfer all Relics in your wallet, including future Relics, until you revoke approval.</p>
        </section>}
        <section className="market-card market-your-listings" aria-labelledby="your-listings"><h3 id="your-listings">Your listings</h3>
          {props.readFailed ? <p>Listings are unavailable until the chain read succeeds.</p> : props.loadingListings ? <p role="status">Loading your listings…</p> : mine.length ? <ul>{mine.map(row => <li key={row.id.toString()}><button type="button" className="market-select" onClick={() => { setFilter('all'); select(row); }}>{listingName(row)} · {formatEther(row.price)} AVAX</button></li>)}</ul> : <p data-testid="your-listings-empty">Nothing listed. Use Sell a Relic to create a listing.</p>}
        </section>
      </aside>
    </div>
    {props.busy && <p role="status" className="market-status">{props.busy}</p>}
    {props.message && !props.busy && <p className="forge-note market-status" role="status" data-testid="market-message">{props.message}</p>}
  </div>;
}
