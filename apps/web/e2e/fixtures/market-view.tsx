import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { getAddresses, FUJI_CHAIN_ID } from '@taskbar-hero/chain';
import { v2 } from '@taskbar-hero/game-rules';
import { parseEther } from 'viem';
import { ScreenFrame } from '../../src/shell';
import { WalletProvider } from '../../src/wallet/WalletProvider';
import { sampleStateV2 } from '../../src/layout/sampleState';
import { MarketView } from '../../src/market/MarketView';
import type { Listing } from '../../src/market/marketViewModel';
import '../../src/styles.css';
import '../../src/theme.css';
import '../../src/motion.css';
import '../../src/layout/layout.css';
import '../../src/forge/forge.css';

type Scenario = 'populated' | 'empty' | 'error' | 'loading' | 'extreme';
interface Call { kind: 'buy' | 'cancel' | 'list'; id: string; amount: string; price: string }
declare global { interface Window { __cxu3Market: { calls: Call[]; scenario: (value: Scenario) => void } } }
const calls: Call[] = [];
const me = `0x${'ab'.repeat(20)}` as const;
const other = `0x${'cd'.repeat(20)}` as const;
const listings: Listing[] = [
  { id: 7n, seller: other, relicId: 2n, amount: 1n, price: parseEther('0.05') },
  { id: 9n, seller: me, relicId: 1n, amount: 2n, price: parseEther('0.25') },
  { id: 11n, seller: other, relicId: 4n, amount: 1n, price: parseEther('0.5') },
];
const holdings = [
  { rarity: 'common' as const, relicId: 1n, balance: 3n, listed: 2n },
  { rarity: 'legendary' as const, relicId: 4n, balance: 1n, listed: 0n },
];
const uint256Max = (1n << 256n) - 1n;
const extremeListings = [{ id: 31n, seller: other, relicId: uint256Max, amount: uint256Max, price: uint256Max }, ...listings];
const extremeHoldings = [{ rarity: 'common' as const, relicId: 1n, balance: uint256Max, listed: 0n }];
const state = sampleStateV2();
const stats = v2.deriveStats({ classId: state.cat.classId!, level: state.cat.level }, state.inventory.filter(item => item.equipped).map(item => ({ itemId: item.itemKey, level: item.level, bonusLines: item.bonus })));
const addresses = getAddresses(FUJI_CHAIN_ID);
function Fixture() {
  const [scenario, setScenario] = useState<Scenario>('populated');
  const [id, setId] = useState(''); const [amount, setAmount] = useState('1'); const [price, setPrice] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  window.__cxu3Market = { calls, scenario: setScenario };
  const record = (kind: 'buy' | 'cancel', listing: Listing) => { calls.push({ kind, id: listing.id.toString(), amount: listing.amount.toString(), price: listing.price.toString() }); setMessage('Mock wallet request captured; no transaction sent.'); };
  return <ScreenFrame activeScreen="market" onSelectScreen={() => {}} dataLayout="desktop" hudProps={{ state, power: Math.round(v2.powerRating(stats)) }}>
    <div className="shell-panel-container"><div id="panel-market" role="tabpanel" aria-labelledby="tab-market" className="shell-panel-view screen-market" style={{ display: 'flex' }}><div className="v2-tabpanel">
      <h2 className="v2-tabpanel-title" data-testid="market-fixture-disclaimer">Local Market fixture — mock wallet data, no transactions</h2>
      <div className="v2-panel-body-inner"><MarketView nft={addresses.RelicNFT!} market={addresses.RelicMarket!} address={me}
        listings={scenario === 'empty' ? [] : scenario === 'extreme' ? extremeListings : listings}
        holdings={scenario === 'empty' ? [] : scenario === 'extreme' ? extremeHoldings : holdings} sellable={holdings}
        loadingHoldings={scenario === 'loading'} loadingListings={scenario === 'loading'} holdingsFailed={scenario === 'error'} readFailed={scenario === 'error'} busy={null} message={message}
        form={{ relicId: id, amount, price, canList: Boolean(id && amount && price) }}
        onRelicId={setId} onAmount={setAmount} onPrice={setPrice} onRetry={() => setScenario('populated')}
        onBuy={listing => record('buy', listing)} onCancel={listing => record('cancel', listing)}
        onList={() => { calls.push({ kind: 'list', id, amount, price }); setMessage('Mock wallet request captured; no transaction sent.'); }} />
      </div>
    </div></div></div>
  </ScreenFrame>;
}
createRoot(document.getElementById('root')!).render(<WalletProvider><Fixture /></WalletProvider>);
