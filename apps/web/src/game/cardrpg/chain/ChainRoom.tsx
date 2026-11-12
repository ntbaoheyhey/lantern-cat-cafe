import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { formatEther, parseEther, type Address, type Hash, type Hex } from 'viem';
import { useWalletClient } from 'wagmi';
import { relicMarketAbi, relicNftAbi, relicMarketV2Abi, yarnTokenAbi, seasonRewardsAbi } from '@taskbar-hero/chain';
import { CHAIN_ITEM_IDS, TRADE_BY_TOKEN, TRADE_BY_ID, sealedDepthEquipment, sealCost } from '@taskbar-hero/game-rules/cardrpg';
import { useSession } from '../../../wallet/WalletProvider';
import { chainPost } from './api';
import { chainFlags } from './flags';
import { friendlyError } from './errors';
import { existingGuestAddress, guestClient, TESTNET_NOTICE } from './guest';
import { chainRuntime, loadChainConfig, txLink, type ChainConfig, type ChainListing } from './runtime';
import { readChainHistory, type HistoryRow } from './history';
export const RELIC_IDS = [1n,2n,3n,4n];
export const RELIC_NAMES = ['Paw Charm','Star Bell','Moon Collar','Golden Maneki'];
export type Tab='Judge'|'Market'|'Bag'|'Seal'|'History';
interface Voucher {player:Address;relicId:string;rarity:number;nonce:string;expiry:string;signature:Hex;used:boolean;source:string}
interface Pass {vouchers:Voucher[];battle?:{won:boolean;rounds:number;log:unknown[]}}
interface Inventory {id:string;item_id:string;state:string;seal:{id:string;cost:string}|null}
interface Reward {claim:{player:Address;amount:string;season:string;nonce:string;expiry:string};signature:Hex;used:boolean}
const nameOf=(id:bigint|string)=>TRADE_BY_TOKEN[Number(id)]?.name??`#${id}`;
const artOf=(id:bigint|string|number)=>Number(id)<10000?`/relics/${id}.svg`:Number(id)<20000?'/chain/star-thread.svg':'/chain/sealed-gear.svg';
const localTreasures=(address:string)=>`taskbar-hero.fuji-treasure.v1:${address.toLowerCase()}`;
export function openChainRoom(tab:Tab='Judge'){window.dispatchEvent(new CustomEvent('chain:open',{detail:tab}));}
export function ChainRoom({initialTab='Judge',onClose}:{initialTab?:Tab;onClose?:()=>void}){
  const session=useSession(),{data:externalWallet}=useWalletClient(),flags=chainFlags();
  const [config,setConfig]=useState<ChainConfig>(),[tab,setTab]=useState<Tab>(initialTab);
  const [pass,setPass]=useState<Pass>(),[listings,setListings]=useState<ChainListing[]>([]),[holdings,setHoldings]=useState<{id:bigint;amount:bigint}[]>([]);
  const [busy,setBusy]=useState(false),[status,setStatus]=useState(''),[offline,setOffline]=useState(false);
  const [own,setOwn]=useState(false),[price,setPrice]=useState('0.001'),[selected,setSelected]=useState('');
  const [version,setVersion]=useState<'v1'|'v2'>('v2'),[currency,setCurrency]=useState(0),[kind,setKind]=useState(''),[rarity,setRarity]=useState('');
  const [yarn,setYarn]=useState(0n),[claimed,setClaimed]=useState(false),[feeBps,setFeeBps]=useState(500n),[proceeds,setProceeds]=useState([0n,0n]);
  const [inventory,setInventory]=useState<Inventory[]>([]);
  const [success,setSuccess]=useState<{hash:Hash;id?:bigint}>(),[history,setHistory]=useState<HistoryRow[]>([]);
  const [treasures,setTreasures]=useState<Record<string,string>>({}),[cat,setCat]=useState('Mochi');
  const [page,setPage]=useState(0),[checks,setChecks]=useState<Record<string,boolean>>({});
  const requestId=useRef(0),actionLock=useRef(false);
  const guest=!!session&&existingGuestAddress()?.toLowerCase()===session.wallet.toLowerCase();
  const yarnOn=flags.yarnToken&&!!config?.YarnToken&&!!config.SeasonRewards;
  const v2=yarnOn&&!!config?.RelicMarketV2&&version==='v2';
  const market=v2?config?.RelicMarketV2:config?.RelicMarket,marketAbi=v2?relicMarketV2Abi:relicMarketAbi;
  const runtime=useMemo(()=>{
    if(!config||!session)return;
    const wallet=guest?guestClient(config.rpcUrl):externalWallet;
    if(!wallet||wallet.account?.address.toLowerCase()!==session.wallet.toLowerCase())return;
    return chainRuntime(config,wallet,session.wallet as Address);
  },[config,session,guest,externalWallet]);
  const connect=useCallback(async()=>{try{setConfig(await loadChainConfig());}catch(e){setStatus(friendlyError(e));setOffline(true);}},[]);
  useEffect(()=>{void connect();},[connect]);
  const loadInventory=useCallback(async()=>{
    if(!session||!flags.itemTrading||!yarnOn)return;
    const result=await chainPost<{items:Inventory[]}>('chain-items',session.token,{action:'inventory'});setInventory(result.items);
  },[session,flags.itemTrading,yarnOn]);
  const refresh=useCallback(async()=>{
    if(!runtime||!session)return;const id=++requestId.current;
    try{
      await runtime.guard();
      const [items,balances,balance,fees,owing]=await Promise.all([
        runtime.listings(v2?'v2':'v1'),runtime.holdings(flags.itemTrading?CHAIN_ITEM_IDS:RELIC_IDS),
        yarnOn?runtime.client.readContract({address:config!.YarnToken!,abi:yarnTokenAbi,functionName:'balanceOf',args:[session.wallet as Address]}):0n,
        v2?runtime.client.readContract({address:market!,abi:relicMarketV2Abi,functionName:'feeBps'}):0n,
        v2?Promise.all([0,1].map(c=>runtime.client.readContract({address:market!,abi:relicMarketV2Abi,functionName:'proceeds',args:[session.wallet as Address,c]}))):[0n,0n],
      ]);
      if(id!==requestId.current)return;
      setListings(items);setHoldings(balances);setYarn(balance);setFeeBps(fees);setProceeds(owing);setOffline(false);
      const saved=JSON.parse(localStorage.getItem(localTreasures(session.wallet))||'{}') as Record<string,string>;
      const valid=Object.fromEntries(Object.entries(saved).filter(([,token])=>balances.some(b=>String(b.id)===token)));
      setTreasures(valid);localStorage.setItem(localTreasures(session.wallet),JSON.stringify(valid));
    }catch(e){if(id===requestId.current){setStatus(friendlyError(e));setOffline(true);setHoldings([]);setTreasures({});}}
  },[runtime,session,v2,flags.itemTrading,yarnOn,config,market]);
  useEffect(()=>{setPass(undefined);setChecks({});setClaimed(false);setInventory([]);},[session]);
  useEffect(()=>{
    if(!runtime||!session)return;void refresh();
    const timer=setInterval(()=>void refresh(),5000);
    const stops=[runtime.client.watchContractEvent({address:config!.RelicNFT,abi:relicNftAbi,onLogs:()=>void refresh(),pollingInterval:1500})];
    if(yarnOn)stops.push(runtime.client.watchContractEvent({address:config!.YarnToken!,abi:yarnTokenAbi,onLogs:()=>void refresh(),pollingInterval:1500}));
    return()=>{requestId.current++;clearInterval(timer);stops.forEach(stop=>stop());};
  },[runtime,session,refresh,config,yarnOn]);
  useEffect(()=>{setPage(0);setSelected('');},[tab,own,kind,rarity,currency,version]);
  const run=async(action:()=>Promise<void>)=>{
    if(actionLock.current)return;actionLock.current=true;setBusy(true);setStatus('Pending…');
    try{await action();setStatus('');await refresh();window.dispatchEvent(new Event('chain:changed'));}
    catch(e){setStatus(friendlyError(e));}finally{actionLock.current=false;setBusy(false);}
  };
  const grant=async(action:'pass'|'boss')=>{setPass(await chainPost<Pass>('chain-judge',session!.token,{action}));};
  const mint=async(v:Voucher)=>{
    if(v.used)return;
    if (v.source !== 'sealed-item' && BigInt(v.expiry) <= BigInt(Math.floor(Date.now()/1000) + 30)) {
      const renewed = await chainPost<Pass>('chain-judge',session!.token,{action:'pass'});
      setPass(previous=>({...renewed,battle:previous?.battle??renewed.battle}));
      const current = renewed.vouchers.find(row=>row.nonce===v.nonce);
      if (!current) throw new Error('Voucher unavailable. Retry.');
      if (current.used) return;
      v = current;
    }
    const fields={player:v.player,relicId:BigInt(v.relicId),rarity:v.rarity,nonce:BigInt(v.nonce),expiry:BigInt(v.expiry)};
    const hash=await runtime!.write({address:config!.RelicNFT,abi:relicNftAbi,functionName:'mint',args:[fields,v.signature]});
    setSuccess({hash,id:fields.relicId});setChecks(c=>({...c,Mint:true}));
    setPass(p=>p?{...p,vouchers:p.vouchers.map(row=>row.nonce===v.nonce?{...row,used:true}:row)}:p);
  };
  const claim=async()=>{
    const result=await chainPost<Reward>('chain-items',session!.token,{action:'reward'});
    if(!result.used){const c=result.claim;const hash=await runtime!.write({address:config!.SeasonRewards!,abi:seasonRewardsAbi,functionName:'claimTester',args:[{...c,amount:BigInt(c.amount),season:BigInt(c.season),nonce:BigInt(c.nonce),expiry:BigInt(c.expiry)},result.signature]});setSuccess({hash});}
    setClaimed(true);
  };
  const seal=async(item:Inventory)=>{
    const {intent,hash}=await chainPost<{intent:{id:string;cost:string};hash:Hex}>('chain-items',session!.token,{action:'reserve',inventory:item.id});
    const paid=await runtime!.client.readContract({address:config!.YarnToken!,abi:yarnTokenAbi,functionName:'sealPayments',args:[session!.wallet as Address,hash]});
    if(paid===0n)await runtime!.write({address:config!.YarnToken!,abi:yarnTokenAbi,functionName:'seal',args:[hash,BigInt(intent.cost)]});
    const result=await chainPost<{voucher:Voucher}>('chain-items',session!.token,{action:'finalize',intent:intent.id});
    await mint(result.voucher);await loadInventory();
  };
  const list=async(id:bigint)=>{
    const wei=parseEther(price);if(wei<0n||(!v2&&wei===0n))throw new Error('Invalid price.');
    await runtime!.write({address:config!.RelicNFT,abi:relicNftAbi,functionName:'setApprovalForAll',args:[market!,true]});
    const hash=await runtime!.write({address:market!,abi:marketAbi,functionName:'list',args:v2?[id,1n,wei,currency]:[id,1n,wei]});
    setSuccess({hash});setSelected('');setChecks(c=>({...c,List:true}));
  };
  const buy=async(l:ChainListing)=>{
    if(l.currency===1&&l.price>0n)await runtime!.write({address:config!.YarnToken!,abi:yarnTokenAbi,functionName:'approve',args:[market!,l.price]});
    const hash=await runtime!.write({address:market!,abi:marketAbi,functionName:'buy',args:[l.id],value:l.currency===0?l.price:0n});
    setSuccess({hash,id:l.relicId});setChecks(c=>({...c,Buy:true}));
  };
  const cancel=async(l:ChainListing)=>{setSuccess({hash:await runtime!.write({address:market!,abi:marketAbi,functionName:'cancel',args:[l.id]})});};
  const withdraw=async(c:number)=>{setSuccess({hash:await runtime!.write({address:market!,abi:relicMarketV2Abi,functionName:'withdraw',args:[c,session!.wallet]})});};
  const historyPage=async()=>{
    const addresses=[config!.RelicNFT,config!.RelicMarket,...(yarnOn?[config!.YarnToken!,config!.SeasonRewards!]:[]),...(config!.RelicMarketV2&&yarnOn?[config!.RelicMarketV2]:[])];
    setHistory(await readChainHistory(runtime!.client,addresses,BigInt(config!.startBlock??'0')));
  };
  const disabled=busy||!runtime||offline;
  const mine=(l:ChainListing)=>l.seller.toLowerCase()===session?.wallet.toLowerCase();
  const filter=(id:bigint)=>{const r=TRADE_BY_TOKEN[Number(id)];return (!kind||r?.kind===kind)&&(!rarity||r?.rarity===rarity);};
  const shown=listings.filter(l=>(!own||mine(l))&&(!v2||l.currency===currency)&&filter(l.relicId));
  const owned=holdings.filter(h=>filter(h.id));
  const sealable=inventory.filter(i=>TRADE_BY_ID[i.item_id]?.tradable);
  const tabs:Tab[]=['Judge','Market','Bag',...(flags.itemTrading&&yarnOn?['Seal' as const]:[]),'History'];
  const pages=(length:number,label:string)=><div className="chain-pagination"><button aria-label={`Previous ${label}`} disabled={page===0} onClick={()=>setPage(p=>p-1)}>←</button><button aria-label={`Next ${label}`} disabled={(page+1)*2>=length} onClick={()=>setPage(p=>p+1)}>→</button></div>;
  const stats=(id:bigint)=>{const item=sealedDepthEquipment(Number(id));return item?<small title="Template main stat scales with companion level. Unenhanced; minimum affix rolls. Chain ownership currently has no combat effect.">{item.main} ×{item.rarity==='legendary'?1.75:1.5}</small>:null;};
  return <section className="chain-room" aria-label="Fuji game">
    <header><h2>◈ Fuji</h2><small>{TESTNET_NOTICE}</small>{yarnOn&&<output data-testid="yarn-balance">🧶 {formatEther(yarn)}</output>}{onClose&&<button aria-label="Close market" onClick={onClose}>×</button>}</header>
    <nav aria-label="Chain screens">{tabs.map(t=><button key={t} aria-pressed={tab===t} onClick={()=>{setTab(t);if(t==='History'&&runtime)void run(historyPage);if(t==='Seal')void run(loadInventory);}}>{t}</button>)}</nav>
    {!session?<p>Play as guest.</p>:<>
      {(tab==='Market'||tab==='Bag')&&<div className="chain-filters">
        {yarnOn&&config?.RelicMarketV2&&<select aria-label="Market version" value={version} onChange={e=>setVersion(e.target.value as 'v1'|'v2')}><option value="v2">V2</option><option value="v1">V1</option></select>}
        {v2&&<select aria-label="Currency" value={currency} onChange={e=>setCurrency(Number(e.target.value))}><option value={0}>AVAX</option><option value={1}>YARN</option></select>}
        {flags.itemTrading&&<><select aria-label="Item type" value={kind} onChange={e=>setKind(e.target.value)}><option value="">All</option><option value="relic">Relic</option><option value="material">Material</option><option value="equipment">Gear</option></select><select aria-label="Item rarity" value={rarity} onChange={e=>setRarity(e.target.value)}><option value="">All</option>{['common','rare','epic','legendary'].map(r=><option key={r}>{r}</option>)}</select></>}
        {v2&&<output aria-label="Sale fee">{Number(feeBps)/100}%</output>}
      </div>}
      {tab==='Judge'&&<>
        <ol className="chain-checklist" aria-label="Judge checklist">{['Mint','List','Buy','Snowtrace'].map(c=><li key={c} data-done={!!checks[c]}>{checks[c]?'✓':'○'} {c}</li>)}</ol>
        {!pass?<button disabled={disabled} onClick={()=>void run(()=>grant('pass'))}>🎟 Judge pass</button>:<>
          <div className="chain-grid">{pass.vouchers.filter(v=>!v.used).slice(page*2,page*2+2).map(v=><article key={v.nonce} data-testid={`voucher-${v.relicId}`}><img src={artOf(v.relicId)} alt={nameOf(v.relicId)}/><button disabled={disabled} onClick={()=>void run(()=>mint(v))}>✦ Mint to Fuji</button></article>)}</div>
          {pass.vouchers.filter(v=>!v.used).length>2&&pages(pass.vouchers.filter(v=>!v.used).length,'vouchers')}
          <button disabled={disabled||!!pass.battle?.won} onClick={()=>void run(()=>grant('boss'))}>{pass.battle?.won?'✓ Victory':'⚔ Fight boss'}</button>
          {yarnOn&&<button disabled={disabled||claimed} onClick={()=>void run(claim)}>{claimed?'✓ 20':'🧶 Claim'}</button>}
        </>}
      </>}
      {tab==='Market'&&<>
        <button aria-pressed={own} onClick={()=>setOwn(!own)}>{own?'☑ Mine':'☐ Mine'}</button>
        {own&&v2&&proceeds.map((p,c)=>p>0n?<button key={c} disabled={disabled} aria-label={`Withdraw ${c?'YARN':'AVAX'}`} onClick={()=>void run(()=>withdraw(c))}>↓ {c?'🧶':'▲'} {formatEther(p)}</button>:null)}
        <div className="chain-grid">{shown.slice(page*2,page*2+2).map(l=><article key={String(l.id)} data-testid={`listing-${l.id}`} data-relic={String(l.relicId)} data-seller={l.seller.toLowerCase()}>
          <img src={artOf(l.relicId)} alt={nameOf(l.relicId)}/><strong>{nameOf(l.relicId)}</strong>{stats(l.relicId)}<output>{l.currency?'🧶':'▲'} {formatEther(l.price)}</output><button disabled={disabled} onClick={()=>void run(()=>mine(l)?cancel(l):buy(l))}>{mine(l)?'↩ Cancel':'↓ Buy'}</button></article>)}</div>
        {shown.length>2&&pages(shown.length,'listings')}
      </>}
      {tab==='Bag'&&<>
        <div className="chain-grid">{owned.slice(page*2,page*2+2).map(h=><article key={String(h.id)} data-testid={`holding-${h.id}`}>
          <img src={artOf(h.id)} alt={nameOf(h.id)}/><strong>{nameOf(h.id)}</strong>{stats(h.id)}<output>{h.amount.toString()}</output><button disabled={disabled} onClick={()=>setSelected(String(h.id))}>↑ List</button>
          {h.id<10000n&&<button disabled={disabled} aria-pressed={treasures[cat]===String(h.id)} onClick={()=>{const next={...treasures,[cat]:treasures[cat]===String(h.id)?'':String(h.id)};setTreasures(next);localStorage.setItem(localTreasures(session.wallet),JSON.stringify(next));}}>◇ Treasure</button>}
        </article>)}</div>
        <select aria-label="Treasure companion" value={cat} onChange={e=>setCat(e.target.value)}>{['Mochi','Soot','Clover'].map(c=><option key={c}>{c}</option>)}</select>
        {treasures[cat]&&<img className="chain-treasure" src={artOf(treasures[cat]!)} alt={`${cat} Treasure`}/>}
        {selected&&<form onSubmit={e=>{e.preventDefault();void run(()=>list(BigInt(selected)));}}><label>{currency&&v2?'🧶':'▲'}<input aria-label={`Price in ${currency&&v2?'YARN':'AVAX'}`} value={price} onChange={e=>setPrice(e.target.value)} inputMode="decimal"/></label><button disabled={disabled}>✓ Confirm</button></form>}
        {owned.length>2&&pages(owned.length,'holdings')}
      </>}
      {tab==='Seal'&&<><div className="chain-grid">{sealable.slice(page*2,page*2+2).map(item=><article key={item.id} data-testid={`drop-${item.item_id}`}><img src={artOf(TRADE_BY_ID[item.item_id]?.tokenId??10001)} alt={TRADE_BY_ID[item.item_id]?.name}/><strong>{TRADE_BY_ID[item.item_id]?.name}</strong><output>🧶 {formatEther(sealCost(item.item_id))}</output><button disabled={disabled} onClick={()=>void run(()=>seal(item))}>{item.state==='available'?'✦ Seal to Fuji':'↻ Recover'}</button></article>)}</div>{sealable.length>2&&pages(sealable.length,'seal items')}</>}
      {tab==='History'&&<ol className="chain-history">{history.map(h=><li key={h.hash}><a href={txLink(h.hash)} target="_blank" rel="noreferrer" title={h.hash}>↗ {h.hash.slice(0,10)}…</a></li>)}</ol>}
    </>}
    <footer><p role="status">{status}</p><button aria-label="Refresh chain" disabled={busy} onClick={()=>void run(async()=>{if(!config)await connect();else await refresh();if(tab==='Judge'&&pass)await grant('pass');if(tab==='Seal')await loadInventory();if(tab==='History'&&runtime)await historyPage();})}>↻</button><details><summary>?</summary><p>V2: any price, including gifts. The seller pays the displayed fee; 40% of that fee is burned, 60% goes to treasury. AVAX sink is not YARN burn. Claim sale proceeds under Mine. Bought items wait ten minutes before V2 relisting. V1 stays fee-free. Seal costs 10% of fixed reference YARN, burned once. Recovery renews the same mint nonce without paying again. Only the server-run boss creates this test drop; offline saves never authorize minting. Treasure is cosmetic and clears on transfer. History scans 120,000 blocks. All assets are Fuji testnet only, with no real value.</p></details></footer>
    {success&&<div className="chain-success" role="dialog" aria-label="Transaction confirmed" aria-modal="true"><button aria-label="Close receipt" onClick={()=>setSuccess(undefined)}>×</button><b>✓ Confirmed</b><small>{TESTNET_NOTICE}</small>{success.id&&<img src={artOf(success.id)} alt={nameOf(success.id)}/>}<code>{success.hash}</code><a href={txLink(success.hash)} target="_blank" rel="noreferrer" onClick={()=>setChecks(c=>({...c,Snowtrace:true}))}>↗ Snowtrace</a></div>}
  </section>;
}
