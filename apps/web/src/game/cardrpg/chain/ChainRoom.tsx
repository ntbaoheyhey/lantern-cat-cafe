import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { formatEther, parseEther, type Address, type Hash, type Hex } from 'viem';
import { useWalletClient } from 'wagmi';
import { relicMarketAbi, relicNftAbi } from '@taskbar-hero/chain';
import { useSession } from '../../../wallet/WalletProvider';
import { chainPost } from './api';
import { existingGuestAddress, guestClient, TESTNET_NOTICE } from './guest';
import { chainRuntime, loadChainConfig, txLink, type ChainConfig } from './runtime';

export const RELIC_IDS = [1n,2n,3n,4n];
export const RELIC_NAMES = ['Paw Charm','Star Bell','Moon Collar','Golden Maneki'];
type Tab = 'Judge'|'Market'|'Bag'|'History';
interface Voucher {player:Address;relicId:string;rarity:number;nonce:string;expiry:string;signature:Hex;used:boolean;source:string}
interface Pass {vouchers:Voucher[];battle?:{won:boolean;rounds:number;log:unknown[]}}
type Runtime=ReturnType<typeof chainRuntime>;
type Listing=Awaited<ReturnType<Runtime['listings']>>[number];
interface HistoryRow {hash:Hash;block:bigint;label:string}
const nameOf=(id:bigint|string)=>RELIC_NAMES[Number(id)-1]??`#${id}`;
const localTreasures=(address:string)=>`taskbar-hero.fuji-treasure.v1:${address.toLowerCase()}`;
export function openChainRoom(tab:Tab='Judge') {window.dispatchEvent(new CustomEvent('chain:open',{detail:tab}));}
function friendlyError(error:unknown) {
  const text=error instanceof Error?error.message:'';
  if(/Fuji|chain/i.test(text))return 'Switch to Fuji.';
  if(/insufficient funds/i.test(text))return 'No gas. Open faucet.';
  if(/reject|denied/i.test(text))return 'Cancelled. Retry.';
  if(/revert|Transaction failed/i.test(text))return 'Transaction failed. Retry.';
  return 'Unavailable. Retry.';
}

export function ChainRoom({initialTab='Judge',onClose}:{initialTab?:Tab;onClose?:()=>void}) {
  const session=useSession(),{data:externalWallet}=useWalletClient();
  const [config,setConfig]=useState<ChainConfig>(),[tab,setTab]=useState<Tab>(initialTab);
  const [pass,setPass]=useState<Pass>(),[listings,setListings]=useState<Listing[]>([]),[holdings,setHoldings]=useState<{id:bigint;amount:bigint}[]>([]);
  const [busy,setBusy]=useState(false),[status,setStatus]=useState(''),[offline,setOffline]=useState(false);
  const [own,setOwn]=useState(false),[price,setPrice]=useState('0.001'),[selected,setSelected]=useState('');
  const [success,setSuccess]=useState<{hash:Hash;id?:bigint}>(),[history,setHistory]=useState<HistoryRow[]>([]);
  const [treasures,setTreasures]=useState<Record<string,string>>({}),[cat,setCat]=useState('Mochi');
  const [page,setPage]=useState(0),[checks,setChecks]=useState<Record<string,boolean>>({});
  const requestId=useRef(0),actionLock=useRef(false);
  const guest=!!session&&existingGuestAddress()?.toLowerCase()===session.wallet.toLowerCase();
  const runtime=useMemo(()=>{
    if(!config||!session)return;
    const wallet=guest?guestClient(config.rpcUrl):externalWallet;
    if(!wallet||wallet.account?.address.toLowerCase()!==session.wallet.toLowerCase())return;
    return chainRuntime(config,wallet,session.wallet as Address);
  },[config,session,guest,externalWallet]);
  const connect=useCallback(async()=>{try{setConfig(await loadChainConfig());}catch(e){setStatus(friendlyError(e));setOffline(true);}},[]);
  useEffect(()=>{void connect();},[connect]);
  const refresh=useCallback(async()=>{
    if(!runtime||!session)return;
    const id=++requestId.current;
    try {
      await runtime.guard();
      const [items,balances]=await Promise.all([runtime.listings(),runtime.holdings(RELIC_IDS)]);
      if(id!==requestId.current)return;
      setListings(items);setHoldings(balances);setOffline(false);
      const saved=JSON.parse(localStorage.getItem(localTreasures(session.wallet))||'{}') as Record<string,string>;
      const valid=Object.fromEntries(Object.entries(saved).filter(([,token])=>balances.some(b=>String(b.id)===token)));
      setTreasures(valid);localStorage.setItem(localTreasures(session.wallet),JSON.stringify(valid));
    } catch(e){if(id===requestId.current){setStatus(friendlyError(e));setOffline(true);setHoldings([]);setTreasures({});}}
  },[runtime,session]);
  useEffect(()=>{
    if(!runtime||!session)return;
    setPass(undefined);setChecks({});void refresh();
    const timer=setInterval(()=>void refresh(),5000);
    const stop=runtime.client.watchContractEvent({address:config!.RelicNFT,abi:relicNftAbi,onLogs:()=>void refresh(),pollingInterval:1500});
    return()=>{requestId.current++;clearInterval(timer);stop();};
  },[runtime,session,refresh,config]);
  useEffect(()=>{setPage(0);setSelected('');},[tab,own]);
  const run=async(action:()=>Promise<void>)=>{
    if(actionLock.current)return;
    actionLock.current=true;setBusy(true);setStatus('Pending…');
    try{await action();setStatus('');await refresh();}catch(e){setStatus(friendlyError(e));}
    finally{actionLock.current=false;setBusy(false);}
  };
  const grant=async(action:'pass'|'boss')=>{
    const result=await chainPost<Pass>('chain-judge',session!.token,{action});setPass(result);
  };
  const mint=async(v:Voucher)=>{
    const fields={player:v.player,relicId:BigInt(v.relicId),rarity:v.rarity,nonce:BigInt(v.nonce),expiry:BigInt(v.expiry)};
    const hash=await runtime!.write({address:config!.RelicNFT,abi:relicNftAbi,functionName:'mint',args:[fields,v.signature]});
    setSuccess({hash,id:fields.relicId});setChecks(c=>({...c,Mint:true}));
    setPass(p=>p?{...p,vouchers:p.vouchers.map(row=>row.nonce===v.nonce?{...row,used:true}:row)}:p);
  };
  const list=async(id:bigint)=>{
    const wei=parseEther(price);
    if(wei<=0n)throw new Error('Choose a positive price.');
    await runtime!.write({address:config!.RelicNFT,abi:relicNftAbi,functionName:'setApprovalForAll',args:[config!.RelicMarket,true]});
    const hash=await runtime!.write({address:config!.RelicMarket,abi:relicMarketAbi,functionName:'list',args:[id,1n,wei]});
    setSuccess({hash});setSelected('');setChecks(c=>({...c,List:true}));
  };
  const buy=async(l:Listing)=>{
    const hash=await runtime!.write({address:config!.RelicMarket,abi:relicMarketAbi,functionName:'buy',args:[l.id],value:l.price});
    setSuccess({hash,id:l.relicId});setChecks(c=>({...c,Buy:true}));
  };
  const cancel=async(l:Listing)=>{
    const hash=await runtime!.write({address:config!.RelicMarket,abi:relicMarketAbi,functionName:'cancel',args:[l.id]});setSuccess({hash});
  };
  const historyPage=async()=>{
    const client=runtime!.client,latest=await client.getBlockNumber();
    let to=latest;const found=new Map<Hash,HistoryRow>();
    const start=BigInt(config!.startBlock??'0');
    // Bounded public-RPC windows. The History screen states the scan limit in help.
    for(let windows=0;windows<12&&to>=start&&found.size<20;windows++){
      const from=to-start>9999n?to-9999n:start;
      const logs=await client.getLogs({address:[config!.RelicNFT,config!.RelicMarket],fromBlock:from,toBlock:to});
      for(const log of logs)if(log.transactionHash&&log.blockNumber!==null)found.set(log.transactionHash,{hash:log.transactionHash,block:log.blockNumber,label:'↗'});
      if(from===start)break;to=from-1n;
    }
    setHistory([...found.values()].sort((a,b)=>a.block>b.block?-1:1).slice(0,20));
  };
  const disabled=busy||!runtime||offline;
  const mine=(l:Listing)=>l.seller.toLowerCase()===session?.wallet.toLowerCase();
  const shown=listings.filter(l=>!own||mine(l));
  return <section className="chain-room" aria-label="Fuji game">
    <header><h2>◈ Fuji</h2><small>{TESTNET_NOTICE}</small>{onClose&&<button aria-label="Close market" onClick={onClose}>×</button>}</header>
    <nav aria-label="Chain screens">{(['Judge','Market','Bag','History'] as const).map(t=><button key={t} aria-pressed={tab===t} onClick={()=>{setTab(t);if(t==='History'&&runtime)void run(historyPage);}}>{t}</button>)}</nav>
    {!session?<p>Play as guest.</p>:<>
      {tab==='Judge'&&<>
        <ol className="chain-checklist" aria-label="Judge checklist">{['Mint','List','Buy','Snowtrace'].map(c=><li key={c} data-done={!!checks[c]}>{checks[c]?'✓':'○'} {c}</li>)}</ol>
        {!pass?<button disabled={disabled} onClick={()=>void run(()=>grant('pass'))}>🎟 Judge pass</button>:<>
          <div className="chain-grid">{pass.vouchers.filter(v=>!v.used).slice(page*2,page*2+2).map(v=><article key={v.nonce} data-testid={`voucher-${v.relicId}`}><img src={`/relics/${v.relicId}.svg`} alt={nameOf(v.relicId)}/><button disabled={disabled} onClick={()=>void run(()=>mint(v))}>✦ Mint to Fuji</button></article>)}</div>
          {pass.vouchers.filter(v=>!v.used).length>2&&<button aria-label="Next vouchers" onClick={()=>setPage(p=>p===0?1:0)}>→</button>}
          <button disabled={disabled||!!pass.battle?.won} onClick={()=>void run(()=>grant('boss'))}>{pass.battle?.won?'✓ Victory':'⚔ Fight boss'}</button>
        </>}
      </>}
      {tab==='Market'&&<>
        <button aria-pressed={own} onClick={()=>setOwn(!own)}>{own?'☑ Mine':'☐ Mine'}</button>
        <div className="chain-grid">{shown.slice(page*3,page*3+3).map(l=><article key={String(l.id)} data-testid={`listing-${l.id}`} data-relic={String(l.relicId)} data-seller={l.seller.toLowerCase()}>
          <img src={`/relics/${l.relicId}.svg`} alt={nameOf(l.relicId)}/><strong>{nameOf(l.relicId)}</strong><output>▲ {formatEther(l.price)}</output>
          <button disabled={disabled} onClick={()=>void run(()=>mine(l)?cancel(l):buy(l))}>{mine(l)?'↩ Cancel':'↓ Buy'}</button></article>)}</div>
        {shown.length>3&&<div><button aria-label="Previous listings" disabled={page===0} onClick={()=>setPage(p=>p-1)}>←</button><button aria-label="Next listings" disabled={(page+1)*3>=shown.length} onClick={()=>setPage(p=>p+1)}>→</button></div>}
      </>}
      {tab==='Bag'&&<>
        <div className="chain-grid">{holdings.slice(page*3,page*3+3).map(h=><article key={String(h.id)} data-testid={`holding-${h.id}`}>
          <img src={`/relics/${h.id}.svg`} alt={nameOf(h.id)}/><strong>{nameOf(h.id)}</strong><output>{h.amount.toString()}</output>
          <button disabled={disabled} onClick={()=>setSelected(String(h.id))}>↑ List</button>
          <button disabled={disabled} aria-pressed={treasures[cat]===String(h.id)} onClick={()=>{
            const next={...treasures,[cat]:treasures[cat]===String(h.id)?'':String(h.id)};setTreasures(next);localStorage.setItem(localTreasures(session.wallet),JSON.stringify(next));
          }}>◇ Treasure</button>
        </article>)}</div>
        <select aria-label="Treasure companion" value={cat} onChange={e=>setCat(e.target.value)}>{['Mochi','Soot','Clover'].map(c=><option key={c}>{c}</option>)}</select>
        {treasures[cat]&&<img className="chain-treasure" src={`/relics/${treasures[cat]}.svg`} alt={`${cat} Treasure`}/>}
        {selected&&<form onSubmit={e=>{e.preventDefault();void run(()=>list(BigInt(selected)));}}><label>▲<input aria-label="Price in AVAX" value={price} onChange={e=>setPrice(e.target.value)} inputMode="decimal"/></label><button disabled={disabled}>✓ Confirm</button></form>}
        {holdings.length>3&&<button aria-label="Next holdings" onClick={()=>setPage(p=>p===0?1:0)}>→</button>}
      </>}
      {tab==='History'&&<ol className="chain-history">{history.map(h=><li key={h.hash}><a href={txLink(h.hash)} target="_blank" rel="noreferrer" title={h.hash}>{h.label} {h.hash.slice(0,10)}…</a></li>)}</ol>}
    </>}
    <footer><p role="status">{status}</p><button aria-label="Refresh chain" disabled={busy} onClick={()=>void run(async()=>{if(!config)await connect();else await refresh();})}>↻</button><details><summary>?</summary><p>Prices are AVAX. Treasure is cosmetic and clears when ownership leaves. History shows the latest 20 transactions found within 120,000 blocks. The judge boss uses a fixed server-run starter encounter; offline saves cannot issue vouchers. Relics 1–4 use the existing deployed collection. Testnet only.</p></details></footer>
    {success&&<div className="chain-success" role="dialog" aria-label="Transaction confirmed" aria-modal="true">
      <button aria-label="Close receipt" onClick={()=>setSuccess(undefined)}>×</button><b>✓ Confirmed</b>{success.id&&<img src={`/relics/${success.id}.svg`} alt={nameOf(success.id)}/>}
      <code>{success.hash}</code><a href={txLink(success.hash)} target="_blank" rel="noreferrer" onClick={()=>setChecks(c=>({...c,Snowtrace:true}))}>↗ Snowtrace</a>
    </div>}
  </section>;
}
