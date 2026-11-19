import {useEffect,useState} from 'react';
import {isAddress,type Address} from 'viem';
import {loadChainConfig,type ChainConfig} from './runtime';
import {readFujiCollection,type OwnedRelic} from './fuji-collection';
import './fuji-collection.css';

export function FujiCollection({initialAddress=''}:{initialAddress?:string}) {
  const [input,setInput]=useState(initialAddress),[address,setAddress]=useState(initialAddress),[revision,setRevision]=useState(0);
  const [items,setItems]=useState<OwnedRelic[]>(),[config,setConfig]=useState<ChainConfig>(),[error,setError]=useState('');
  useEffect(()=>{const update=()=>setRevision(n=>n+1);window.addEventListener('chain:changed',update);return()=>window.removeEventListener('chain:changed',update);},[]);
  useEffect(()=>{
    let active=true;setItems(undefined);setConfig(undefined);setError('');
    if(!address)return;
    if(!isAddress(address)){setError('Enter a valid wallet address.');return;}
    void (async()=>{
      const c=await loadChainConfig(),owned=await readFujiCollection(c,address as Address);
      if(active){setConfig(c);setItems(owned);}
    })().catch(()=>{if(active)setError('Fuji RPC unavailable. Retry to read ownership.');});
    return()=>{active=false;};
  },[address,revision]);
  return <section className="fuji-collection" aria-label="Avalanche Relic Collection">
    <h2>Your Relics</h2><p>Read a wallet directly from Avalanche Fuji. No sign-in needed.</p>
    <form onSubmit={e=>{e.preventDefault();setAddress(input.trim());setRevision(n=>n+1);}}><label>Wallet address<input value={input} onChange={e=>setInput(e.target.value)} placeholder="0x…" spellCheck={false}/></label><button type="submit">Read Fuji Relics</button></form>
    {address&&items===undefined&&!error&&<p role="status">Reading Fuji RPC…</p>}
    {error&&<p role="alert">{error}</p>}
    {items!==undefined&&config&&<><strong>Owned on Avalanche Fuji</strong><small className="fuji-owner">{address}</small>
      {items.length?<ul>{items.map(item=><li key={String(item.id)}><a href={`https://testnet.snowtrace.io/token/${config.RelicNFT}?a=${item.id}`} target="_blank" rel="noreferrer">{item.name}</a><span> × {String(item.amount)}</span></li>)}</ul>:<p>No Relics in this wallet.</p>}
    </>}
  </section>;
}
