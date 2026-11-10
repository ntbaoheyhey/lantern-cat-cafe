import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { EIP1193Provider } from 'viem';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import type { DepthModel } from '../depth/model';
import { readConnectedRelics } from '../depth/relic-reader';
import { Icon } from './Icon';

export function RelicA6({ m }: { m: DepthModel }) {
  useSyncExternalStore(m.subscribe, m.snapshot);
  const [reading, setReading] = useState(false), [message, setMessage] = useState('');
  const request = useRef(0);
  const provider = (window as unknown as { ethereum?: EIP1193Provider }).ethereum;
  const active = !!m.state.run && !m.state.run.complete;
  const selected = R.RELIC_EFFECTS.find(relic => relic.id === m.state.selectedRelic);
  const bonus = R.relicBonusA6(m.state) / 100;
  useEffect(() => {
    const clear = () => {
      request.current++; setReading(false);
      m.apply(R.acceptRelicSnapshot(m.state, 43113, []));
      setMessage('Wallet changed. Read your Fuji Relics again.');
    };
    if (!m.offline) {
      provider?.on?.('accountsChanged', clear); provider?.on?.('chainChanged', clear); provider?.on?.('disconnect', clear);
    }
    return () => {
      request.current++;
      if (!m.offline) {
        provider?.removeListener?.('accountsChanged', clear); provider?.removeListener?.('chainChanged', clear); provider?.removeListener?.('disconnect', clear);
      }
    };
  }, [m, provider]);
  async function read() {
    if (active || reading) return;
    const id = ++request.current; setReading(true); setMessage('Reading your Fuji collection…');
    m.apply(R.acceptRelicSnapshot(m.state, 43113, []));
    let timeout: ReturnType<typeof setTimeout> | undefined;
    try {
      if (!provider) throw Error('Kết nối ví để dùng Relic Fuji. You can keep playing.');
      const snapshot = await Promise.race([
        readConnectedRelics(provider),
        new Promise<never>((_, reject) => { timeout = setTimeout(() => reject(Error('Fuji is taking too long. Try again later; your game is ready.')), 8000); }),
      ]);
      if (id !== request.current) return;
      m.apply(R.acceptRelicSnapshot(m.state, snapshot.chainId, snapshot.holdings));
      setMessage(snapshot.holdings.length ? `Collection read at Fuji block ${snapshot.block}. Choose one keepsake.` : 'No supported Relics in this wallet. Your team is ready to play.');
    } catch (error) { if (id === request.current) setMessage(error instanceof Error ? error.message : 'Unable to read Fuji. Try again later.'); }
    finally { clearTimeout(timeout); if (id === request.current) setReading(false); }
  }
  return <div className="a6-relic">
    <header><small>ONE KEEPSAKE · EVERY CAT</small><h2>Relic Fuji</h2><p>A little luck from your other adventures.</p></header>
    <section className="a6-relic-slot" aria-label="Team treasure slot">
      <Icon name="relic"/><div><small>{m.offline ? 'Demo wallet · fixture' : 'Avalanche Fuji'}</small><h3>{selected && bonus ? selected.name : 'An open place on the mantel'}</h3>
        <strong>Team bonus +{bonus}%</strong><p>HP, attack and defense · at most +8%</p>
        {!bonus && <p>{m.offline ? 'Load the demo collection and choose a keepsake.' : 'Kết nối ví để dùng Relic Fuji'}</p>}
      </div>
      {bonus > 0 && <button disabled={active || reading} onClick={() => m.apply(R.selectRelic(m.state, null), 'Treasure slot cleared.')}>Unequip treasure</button>}
    </section>
    <div className="a6-relic-actions">{m.offline ? <button disabled={active} onClick={() => { m.apply(R.acceptRelicSnapshot(m.state, 43113, R.RELIC_FIXTURE)); setMessage('Demo collection loaded. These are sample holdings.'); }}>Load demo relics</button> : <button disabled={reading || active} onClick={() => void read()}>{reading ? 'Reading Fuji…' : 'Read connected wallet'}</button>}
      <a href={`https://testnet.snowtrace.io/address/${R.FUJI_RELIC_ADDRESS}`} target="_blank" rel="noreferrer">Relic Fuji ↗</a>
    </div>
    <p className="a6-relic-status" role="status">{active ? 'Finish your route to change the keepsake.' : message || (m.offline ? 'A sample wallet is available for this demo.' : 'Read a wallet already connected to Avalanche Fuji.')}</p>
    <div className="a6-relic-collection">{R.RELIC_EFFECTS.map(relic => <article key={relic.id} data-owned={m.state.relics.includes(relic.id)} data-selected={m.state.selectedRelic === relic.id}>
      <Icon name="relic"/><small>{['Common', 'Rare', 'Epic', 'Legendary'][relic.rarity]}</small><h3>{relic.name}</h3><strong>Team +{(relic.rarity + 1) * 2}%</strong>
      <button disabled={active || reading || !m.state.relics.includes(relic.id) || m.state.selectedRelic === relic.id} onClick={() => m.apply(R.selectRelic(m.state, relic.id), `${relic.name} now supports the whole team.`)}>{m.state.selectedRelic === relic.id ? 'Equipped' : m.state.relics.includes(relic.id) ? `Equip ${relic.name}` : 'Not in your wallet'}</button>
    </article>)}</div>
    <p className="a6-relic-note">One Relic supports your whole team. Extra copies add no power. Cat gear stays equipped.</p>
  </div>;
}
