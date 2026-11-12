import {HelpC2} from './TextDietC2';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { EIP1193Provider } from 'viem';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import type { DepthModel } from '../depth/model';
import { readConnectedRelics, RelicReadError } from '../depth/relic-reader';
import {RelicArtA6} from './KeepsakeArtA6';
import './relic-cabinet-a6.css';

export function RelicA6({ m }: { m: DepthModel }) {
  useSyncExternalStore(m.subscribe, m.snapshot);
  const [reading, setReading] = useState(false), [message, setMessage] = useState('');
  const [collectionRead, setCollectionRead] = useState(m.state.relics.length > 0);
  const request = useRef(0);
  const provider = (window as unknown as { ethereum?: EIP1193Provider }).ethereum;
  const active = !!m.state.run && !m.state.run.complete;
  const selected = R.RELIC_EFFECTS.find(relic => relic.id === m.state.selectedRelic);
  const bonus = R.relicBonusA6(m.state) / 100;
  useEffect(() => {
    const clear = () => {
      request.current++; setReading(false); setCollectionRead(false);
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
    const id = ++request.current; setReading(true); setCollectionRead(false); setMessage('Reading your Fuji collection…');
    m.apply(R.acceptRelicSnapshot(m.state, 43113, []));
    let timeout: ReturnType<typeof setTimeout> | undefined;
    try {
      if (!provider) throw new RelicReadError('Kết nối ví để dùng Relic Fuji. You can keep playing.');
      const snapshot = await Promise.race([
        readConnectedRelics(provider),
        new Promise<never>((_, reject) => { timeout = setTimeout(() => reject(new RelicReadError('Fuji is taking too long. Try again later; your game is ready.')), 8000); }),
      ]);
      if (id !== request.current) return;
      const accepted = R.acceptRelicSnapshot(m.state, snapshot.chainId, snapshot.holdings);
      if (!accepted.ok) {
        setMessage('This collection does not match the supported Fuji Relics. You can keep playing.');
        return;
      }
      m.apply(accepted);
      setCollectionRead(true);
      setMessage(accepted.state.relics.length ? `Collection read at Fuji block ${snapshot.block}. Choose one keepsake.` : 'No supported Relics in this wallet. Your team is ready to play.');
    } catch (error) { if (id === request.current) setMessage(error instanceof RelicReadError ? error.message : 'Could not read your Fuji collection. Try again; you can keep playing.'); }
    finally { clearTimeout(timeout); if (id === request.current) setReading(false); }
  }
  if(m.state.formationC2)return <div className="a6-relic a6-relic-cabinet c2-relic" data-reduced={m.state.settings.reducedMotion}><section className="a6-relic-slot" aria-label="Team treasure slot" data-empty={!bonus}><RelicArtA6 rarity={selected?.rarity??0}/><div><h2>Relic Fuji</h2><strong>♥ ⚔ 🛡 +{bonus}%</strong><p>{m.offline?'Demo':'Fuji'} · 43113</p></div>{bonus>0&&<button disabled={active||reading} aria-label="Unequip treasure" onClick={()=>m.apply(R.selectRelic(m.state,null),'Treasure slot cleared.')}>− Unequip</button>}<HelpC2 label="Relic Fuji"><p>One Relic supports the whole team, at most +8%. Extra copies add no power.</p><p>{active?'Finish your route to change the keepsake.':message||'Read your connected Fuji wallet or load the sample demo collection.'}</p></HelpC2></section><div className="a6-relic-gallery"><div className="a6-relic-actions">{m.offline?<button aria-label="Load demo relics" disabled={active} onClick={()=>{m.apply(R.acceptRelicSnapshot(m.state,43113,R.RELIC_FIXTURE));setCollectionRead(true);setMessage('Demo collection loaded. These are sample holdings.');}}>◇ Load demo</button>:<button aria-label="Read connected wallet" disabled={reading||active} onClick={()=>void read()}>{reading?'◷':'◇'} Read wallet</button>}<a href={'https://testnet.snowtrace.io/address/'+R.FUJI_RELIC_ADDRESS} target="_blank" rel="noreferrer">Fuji ↗</a><span role="status" aria-label={message}>{message?(reading?'◷':collectionRead?'✓':'!'):''}</span></div><div className="a6-relic-collection">{R.RELIC_EFFECTS.map(relic=><article key={relic.id} data-rarity={['common','rare','epic','legendary'][relic.rarity]} data-owned={m.state.relics.includes(relic.id)} data-selected={m.state.selectedRelic===relic.id}><RelicArtA6 rarity={relic.rarity}/><div className="a6-relic-card-copy"><b>{'★'.repeat(relic.rarity+1)}</b><strong>+{(relic.rarity+1)*2}%</strong></div><button aria-label={'Equip '+relic.name} title={relic.name} disabled={active||reading||!m.state.relics.includes(relic.id)||m.state.selectedRelic===relic.id} onClick={()=>m.apply(R.selectRelic(m.state,relic.id),'Relic equipped.')}>{m.state.selectedRelic===relic.id?'✓':m.state.relics.includes(relic.id)?'↑':'🔒'}</button></article>)}</div></div></div>;
  return <div className="a6-relic a6-relic-cabinet" data-reduced={m.state.settings.reducedMotion}>
    <header><small>ONE KEEPSAKE · EVERY CAT</small><h2>Relic Fuji</h2><p>A little luck from your other adventures.</p></header>
    <section className="a6-relic-slot" aria-label="Team treasure slot" data-empty={!bonus}>
      <small className="a6-relic-eyebrow">ONE KEEPSAKE · EVERY CAT</small>
      <RelicArtA6 rarity={selected?.rarity??0}/><div><small>{m.offline ? 'Demo wallet · fixture' : 'Avalanche Fuji'}</small><h3>{selected && bonus ? selected.name : 'An open place on the mantel'}</h3>
        <strong>Team bonus +{bonus}%</strong><p>HP, attack and defense · at most +8%</p>
        {!bonus && <p>{reading ? 'Reading your collection…' : collectionRead ? m.state.relics.length ? 'Choose a keepsake from your collection.' : 'No supported keepsakes found. You can keep playing.' : m.offline ? 'Load the demo collection and choose a keepsake.' : 'Read your connected Fuji wallet to choose a keepsake.'}</p>}
      </div>
      {bonus > 0 && <button disabled={active || reading} onClick={() => m.apply(R.selectRelic(m.state, null), 'Treasure slot cleared.')}>Unequip treasure</button>}
    </section>
    <div className="a6-relic-gallery">
    <div className="a6-relic-actions">{m.offline ? <button disabled={active} onClick={() => { m.apply(R.acceptRelicSnapshot(m.state, 43113, R.RELIC_FIXTURE)); setCollectionRead(true); setMessage('Demo collection loaded. These are sample holdings.'); }}>Load demo relics</button> : <button disabled={reading || active} onClick={() => void read()}>{reading ? 'Reading Fuji…' : 'Read connected wallet'}</button>}
      <a href={`https://testnet.snowtrace.io/address/${R.FUJI_RELIC_ADDRESS}`} target="_blank" rel="noreferrer">Relic Fuji ↗</a>
    </div>
    <p className="a6-relic-status" role="status">{active ? 'Finish your route to change the keepsake.' : message || (m.offline ? 'A sample wallet is available for this demo.' : 'Read a wallet already connected to Avalanche Fuji.')}</p>
    <div className="a6-relic-collection">{R.RELIC_EFFECTS.map(relic => <article key={relic.id} data-rarity={["common","rare","epic","legendary"][relic.rarity]} data-owned={m.state.relics.includes(relic.id)} data-selected={m.state.selectedRelic === relic.id}>
      <RelicArtA6 rarity={relic.rarity}/><div className="a6-relic-card-copy"><small>{['Common', 'Rare', 'Epic', 'Legendary'][relic.rarity]}</small><h3>{relic.name.replace(/^(Common|Rare|Epic|Legendary) /,'')}</h3><strong>Team +{(relic.rarity + 1) * 2}%</strong></div>
      <button disabled={active || reading || !m.state.relics.includes(relic.id) || m.state.selectedRelic === relic.id} onClick={() => m.apply(R.selectRelic(m.state, relic.id), `${relic.name} now supports the whole team.`)}>{m.state.selectedRelic === relic.id ? 'Equipped' : m.state.relics.includes(relic.id) ? `Equip ${relic.name}` : reading ? 'Reading collection…' : collectionRead ? 'Not in your wallet' : m.offline ? 'Load demo relics first' : 'Read wallet first'}</button>
    </article>)}</div>
    <p className="a6-relic-note">One Relic supports your whole team. Extra copies add no power. Cat gear stays equipped.</p>
    </div>
  </div>;
}
