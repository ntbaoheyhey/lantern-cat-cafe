import {useMenuClose} from '../shell/motion-b2';
import {GameIcon} from '../../../ui/GameIcon';
import {PaintedAction,PaintedButton,PaintedIcon,GuideMascot,RibbonTitle,type KitIcon} from '../shell/PaintedKit';
import {MenuDialogB2} from '../shell/MenuDialogB2';
import {HelpC2,TextDietContext} from '../ui-v3/TextDietC2';
import './chain-b2.css';
import {tradeRuleV3,CHAIN_V3_ITEM_IDS} from '@taskbar-hero/game-rules/src/cardrpg/trade';
import {EconomyV3Panel} from './EconomyV3Panel';
import {GasBalance} from './GasBalance';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { formatEther, parseEther, type Address, type Hash, type Hex } from 'viem';
import { useWalletClient } from 'wagmi';
import { FORGE_DESIGNS, relicForgeAbi, relicMarketAbi, relicNftAbi, relicMarketV2Abi, yarnTokenAbi, seasonRewardsAbi, readSealPolicy, type SealPricePolicy, type CosmeticState, type YarnStyle } from '@taskbar-hero/chain';
import { CHAIN_ITEM_IDS, TRADE_BY_TOKEN, TRADE_BY_ID, sealedDepthEquipment } from '@taskbar-hero/game-rules/cardrpg';
import { useSession } from '../../../wallet/WalletProvider';
import { chainPost } from './api';
import {YarnStyles} from './YarnStyles';
import {CampaignPanel} from './CampaignPanel';
import {CampaignRewardPanel} from './CampaignRewardPanel';
import {validateCampaignQuote,claimCampaignReward} from './campaign-reward-client';
import {RelicForgePanel,ForgeMark} from './RelicForgePanel';
import {craftDesign} from './forge-client';
import {validateStyleQuote} from './style-quote';
import {displayedSealCost,validateSealQuote,type SealInventory as Inventory} from './seal-quote';
import { chainFlags } from './flags';
import { friendlyError } from './errors';
import { existingGuestAddress, guestClient, TESTNET_NOTICE } from './guest';
import { chainRuntime, loadChainConfig, txLink, type ChainConfig, type ChainListing } from './runtime';
import type {HistoryRow} from './history';
import {readWalletHistory} from './chain-index';
export const RELIC_IDS = [1n,2n,3n,4n];
export const RELIC_NAMES = ['Paw Charm','Star Bell','Moon Collar','Golden Maneki'];
export type Tab='Judge'|'Market'|'Bag'|'Seal'|'History'|'Style'|'Forge'|'Campaign'|'Café';
interface Voucher {player:Address;relicId:string;rarity:number;nonce:string;expiry:string;signature:Hex;used:boolean;source:string}
interface Pass {vouchers:Voucher[];battle?:{won:boolean;rounds:number;log:unknown[]}}
interface Reward {claim:{player:Address;amount:string;season:string;nonce:string;expiry:string};signature:Hex;used:boolean}
const nameOf=(id:bigint|string)=>tradeRuleV3(Number(id))?.name??`#${id}`;
const artOf=(id:bigint|string|number)=>Number(id)>=30001&&Number(id)<=33000?'/icons/deed-128.webp':Number(id)<10000?`/relics/${id}.svg`:Number(id)<20000?'/chain/star-thread.svg':'/chain/sealed-gear.svg';
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
  const [cosmetics,setCosmetics]=useState<CosmeticState>();
  const [forgeOwned,setForgeOwned]=useState<boolean[]>([]);
  const [inventory,setInventory]=useState<Inventory[]>([]);
  const [sealPolicy,setSealPolicy]=useState<SealPricePolicy>('standard-v1');
  const [success,setSuccess]=useState<{hash:Hash;id?:bigint}>(),[history,setHistory]=useState<HistoryRow[]>([]);
  const [treasures,setTreasures]=useState<Record<string,string>>({}),[cat,setCat]=useState('Mochi');
  const [page,setPage]=useState(0),[checks,setChecks]=useState<Record<string,boolean>>({});
  const [more,setMore]=useState(false),[purchase,setPurchase]=useState<ChainListing>();
  const requestId=useRef(0),actionLock=useRef(false),roomElement=useRef<HTMLElement>(null);
  const closeRoom=useMenuClose(roomElement,()=>onClose?.());
  const guest=!!session&&existingGuestAddress()?.toLowerCase()===session.wallet.toLowerCase();
  const yarnOn=flags.yarnToken&&!!config?.YarnToken&&!!config.SeasonRewards;
  const stylesOn=flags.yarnCosmetics&&yarnOn;
  const forgeOn=flags.relicForge&&flags.itemTrading&&yarnOn&&!!config?.RelicForge;
  const v2=yarnOn&&!!config?.RelicMarketV2&&version==='v2';
  const market=v2?config?.RelicMarketV2:config?.RelicMarket,marketAbi=v2?relicMarketV2Abi:relicMarketAbi;
  const runtime=useMemo(()=>{
    if(!config||!session)return;
    const wallet=guest?guestClient(config.rpcUrl):externalWallet;
    if(!wallet||wallet.account?.address.toLowerCase()!==session.wallet.toLowerCase())return;
    return chainRuntime(config,wallet,session.wallet as Address);
  },[config,session,guest,externalWallet]);
  useEffect(()=>()=>runtime?.silenceSounds?.(),[runtime]);
  const connect=useCallback(async()=>{try{setConfig(await loadChainConfig());}catch(e){setStatus(friendlyError(e));setOffline(true);}},[]);
  useEffect(()=>{void connect();},[connect]);
  const loadInventory=useCallback(async()=>{
    if(!session||!flags.itemTrading||!yarnOn)return;
    const result=await chainPost<{items:Inventory[];sealPolicy?:unknown}>('chain-items',session.token,{action:'inventory'});
    const policy=readSealPolicy(result.sealPolicy);
    result.items.forEach(item=>{if(TRADE_BY_ID[item.item_id]?.tradable)displayedSealCost(item,policy);});
    setSealPolicy(policy);setInventory(result.items);
  },[session,flags.itemTrading,yarnOn]);
  const loadStyles=async()=>{
    if(!session||!stylesOn)return;
    setCosmetics(await chainPost<CosmeticState>('chain-cosmetics',session.token,{action:'state'}));
  };
  useEffect(()=>{
    let current=true;setCosmetics(undefined);
    if(session&&stylesOn)void chainPost<CosmeticState>('chain-cosmetics',session.token,{action:'state'})
      .then(s=>{if(current)setCosmetics(s);}).catch(()=>{});
    return()=>{current=false;};
  },[session,stylesOn]);
  const refresh=useCallback(async()=>{
    if(!runtime||!session)return;const id=++requestId.current;
    try{
      await runtime.guard();
      const [items,balances,balance,fees,owing,designs]=await Promise.all([
        runtime.listings(v2?'v2':'v1'),runtime.holdings(flags.itemTrading?(flags.economyV3?CHAIN_V3_ITEM_IDS:CHAIN_ITEM_IDS):RELIC_IDS),
        yarnOn?runtime.client.readContract({address:config!.YarnToken!,abi:yarnTokenAbi,functionName:'balanceOf',args:[session.wallet as Address]}):0n,
        v2?runtime.client.readContract({address:market!,abi:relicMarketV2Abi,functionName:'feeBps'}):0n,
        v2?Promise.all([0,1].map(c=>runtime.client.readContract({address:market!,abi:relicMarketV2Abi,functionName:'proceeds',args:[session.wallet as Address,c]}))):[0n,0n],
        forgeOn?Promise.all(FORGE_DESIGNS.map(d=>runtime.client.readContract({address:config!.RelicForge!,abi:relicForgeAbi,functionName:'hasDesign',args:[session.wallet as Address,d.id]}))):[],
      ]);
      if(id!==requestId.current)return;
      setForgeOwned(designs);setListings(items);setHoldings(balances);setYarn(balance);setFeeBps(fees);setProceeds(owing);setOffline(false);
      window.dispatchEvent(new CustomEvent('chain:holdings',{detail:{wallet:session.wallet,items:balances}}));
      const saved=JSON.parse(localStorage.getItem(localTreasures(session.wallet))||'{}') as Record<string,string>;
      const valid=Object.fromEntries(Object.entries(saved).filter(([,token])=>balances.some(b=>String(b.id)===token)));
      setTreasures(valid);localStorage.setItem(localTreasures(session.wallet),JSON.stringify(valid));
    }catch(e){if(id===requestId.current){setStatus(friendlyError(e));setOffline(true);setHoldings([]);setTreasures({});setForgeOwned([]);}}
  },[runtime,session,v2,flags.itemTrading,flags.economyV3,yarnOn,forgeOn,config,market]);
  useEffect(()=>{setPass(undefined);setChecks({});setClaimed(false);setInventory([]);setForgeOwned([]);setSealPolicy('standard-v1');},[session]);
  useEffect(()=>{
    if(!runtime||!session)return;void refresh();
    const timer=setInterval(()=>void refresh(),30000);
    const stops=[runtime.client.watchContractEvent({address:config!.RelicNFT,abi:relicNftAbi,onLogs:()=>void refresh(),pollingInterval:1500})];
    if(yarnOn)stops.push(runtime.client.watchContractEvent({address:config!.YarnToken!,abi:yarnTokenAbi,onLogs:()=>void refresh(),pollingInterval:1500}));
    return()=>{requestId.current++;clearInterval(timer);stops.forEach(stop=>stop());};
  },[runtime,session,refresh,config,yarnOn]);
  useEffect(()=>{setPage(0);setSelected('');},[tab,own,kind,rarity,currency,version]);
  const run=async(action:()=>Promise<void>,propagate=false)=>{
    if(actionLock.current){if(propagate)throw new Error('Pending…');return;}actionLock.current=true;setBusy(true);setStatus('Pending…');
    try{await action();setStatus('');await refresh();window.dispatchEvent(new Event('chain:changed'));}
    catch(e){setStatus(friendlyError(e));if(propagate)throw e;}finally{actionLock.current=false;setBusy(false);}
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
    const expectedCost=displayedSealCost(item,sealPolicy);
    const response=await chainPost<unknown>('chain-items',session!.token,{action:'reserve',inventory:item.id});
    let intent;
    try{intent=validateSealQuote(response,item,expectedCost);}catch(error){await loadInventory();throw error;}
    const {hash}=intent;
    const paid=await runtime!.client.readContract({address:config!.YarnToken!,abi:yarnTokenAbi,functionName:'sealPayments',args:[session!.wallet as Address,hash]});
    if(paid!==0n&&paid!==intent.cost)throw new Error('Quote changed. Retry.');
    if(paid===0n)await runtime!.write({address:config!.YarnToken!,abi:yarnTokenAbi,functionName:'seal',args:[hash,intent.cost]});
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
  const equipStyle=async(sku:YarnStyle|'none')=>{
    setCosmetics(await chainPost<CosmeticState>('chain-cosmetics',session!.token,{action:'equip',sku}));
  };
  const buyStyle=async(sku:YarnStyle)=>{
    const quote=await chainPost<unknown>('chain-cosmetics',session!.token,{action:'reserve',sku});
    const {order,hash}=validateStyleQuote(quote,{wallet:session!.wallet as Address,token:config!.YarnToken!,sku});
    const paid=await runtime!.client.readContract({address:config!.YarnToken!,abi:yarnTokenAbi,functionName:'sealPayments',args:[session!.wallet as Address,hash]});
    if(paid!==0n&&paid!==BigInt(order.cost))throw new Error('Payment mismatch.');
    let tx:Hash|undefined;
    if(paid===0n)tx=await runtime!.write({address:config!.YarnToken!,abi:yarnTokenAbi,functionName:'seal',args:[hash,BigInt(order.cost)]});
    setCosmetics(await chainPost<CosmeticState>('chain-cosmetics',session!.token,{action:'finalize',intent:order.id}));
    await equipStyle(sku);
    if(tx)setSuccess({hash:tx});
  };
  const forge=async(design:number,first:bigint,second:bigint)=>{
    const hash=await craftDesign(runtime!,config!,session!.wallet as Address,design,first,second);if(hash)setSuccess({hash});
  };
  const cancel=async(l:ChainListing)=>{setSuccess({hash:await runtime!.write({address:market!,abi:marketAbi,functionName:'cancel',args:[l.id]})});};
  const withdraw=async(c:number)=>{setSuccess({hash:await runtime!.write({address:market!,abi:relicMarketV2Abi,functionName:'withdraw',args:[c,session!.wallet]})});};
  const historyPage=async()=>{
    setHistory(await readWalletHistory(runtime!.client,config!,session!.wallet as Address));
  };
  const disabled=busy||!runtime||offline;
  const mine=(l:ChainListing)=>l.seller.toLowerCase()===session?.wallet.toLowerCase();
  const filter=(id:bigint)=>{const r=tradeRuleV3(Number(id));return (!kind||r?.kind===kind)&&(!rarity||r?.rarity===rarity);};
  const shown=listings.filter(l=>(!own||mine(l))&&(!v2||l.currency===currency)&&filter(l.relicId));
  const owned=holdings.filter(h=>filter(h.id));
  const sealable=inventory.filter(i=>TRADE_BY_ID[i.item_id]?.tradable);
  const tabs:Tab[]=[...(flags.economyV3?['Café' as const]:[]),'Judge','Market','Bag',...(flags.itemTrading&&yarnOn&&!flags.economyV3?['Seal' as const]:[]),...(stylesOn?['Style' as const]:[]),...(forgeOn?['Forge' as const]:[]),...(flags.campaign?['Campaign' as const]:[]),'History'];
  const tabIcons:Record<Tab,KitIcon>={Café:'deed',Judge:'quest',Market:'market',Bag:'bag',Seal:'seal',History:'history',Style:'season',Forge:'forge',Campaign:'chapter'};
  const rail=tabs.filter(t=>['Café','Market','Bag','History','Style'].includes(t)),extra=tabs.filter(t=>!rail.includes(t));
  const selectTab=(t:Tab)=>{setTab(t);setMore(false);if(t==='History'&&runtime)void run(historyPage);if(t==='Seal'||t==='Forge')void run(loadInventory);if(t==='Style')void run(loadStyles);};
  const pages=(length:number,label:string)=><div className="chain-pagination"><button aria-label={`Previous ${label}`} disabled={page===0} onClick={()=>setPage(p=>p-1)}><GameIcon name="arrow-left" size={18}/></button><button aria-label={`Next ${label}`} disabled={(page+1)*2>=length} onClick={()=>setPage(p=>p+1)}><GameIcon name="arrow" size={18}/></button></div>;
  const stats=(id:bigint)=>{const item=sealedDepthEquipment(Number(id));return item?<small title="Template main stat scales with companion level. Unenhanced; minimum affix rolls. Chain ownership currently has no combat effect.">{item.main} <GameIcon name="close" size={20}/>{item.rarity==='legendary'?1.75:1.5}</small>:null;};
  return <TextDietContext.Provider value={true}><section ref={roomElement} className="chain-room b2-chain-room" data-tab={tab} data-style={stylesOn?cosmetics?.active??undefined:undefined} aria-label="Fuji game">
    <header className="b2-chain-heading"><RibbonTitle>Fuji</RibbonTitle><small title={TESTNET_NOTICE}>Testnet · no value</small>{yarnOn&&<output data-testid="yarn-balance"><GameIcon name="yarn" size={28}/> {formatEther(yarn)}</output>}{guest&&<GasBalance/>}{onClose&&<button aria-label="Close market" onClick={closeRoom}><GameIcon name="close" size={24}/></button>}</header>
    <nav className="b2-chain-rail" aria-label="Chain screens">{rail.map(t=><PaintedAction key={t} icon={tabIcons[t]} active={tab===t} onClick={()=>selectTab(t)}>{t}</PaintedAction>)}{extra.length>0&&<PaintedAction icon="guide" active={extra.includes(tab)} onClick={()=>setMore(true)}>More</PaintedAction>}</nav>
    {more&&<MenuDialogB2 title="More" onClose={()=>setMore(false)}><div className="b2-chain-more">{extra.map(t=><PaintedAction key={t} icon={tabIcons[t]} active={tab===t} onClick={()=>selectTab(t)}>{t}</PaintedAction>)}</div></MenuDialogB2>}
    {!session?<p>Play as guest.</p>:<>
      {(tab==='Market'||tab==='Bag')&&<div className="chain-filters">
        {yarnOn&&config?.RelicMarketV2&&<select aria-label="Market version" value={version} onChange={e=>setVersion(e.target.value as 'v1'|'v2')}><option value="v2">V2</option><option value="v1">V1</option></select>}
        {v2&&<select aria-label="Currency" value={currency} onChange={e=>setCurrency(Number(e.target.value))}><option value={0}>AVAX</option><option value={1}>YARN</option></select>}
        {flags.itemTrading&&<><select aria-label="Item type" value={kind} onChange={e=>setKind(e.target.value)}><option value="">All</option><option value="relic">Relic</option><option value="material">Material</option><option value="equipment">Gear</option></select><select aria-label="Item rarity" value={rarity} onChange={e=>setRarity(e.target.value)}><option value="">All</option>{['common','rare','epic','legendary'].map(r=><option key={r}>{r}</option>)}</select></>}
        {v2&&<output aria-label="Sale fee">{Number(feeBps)/100}%</output>}
      </div>}
      {tab==='Café'&&flags.economyV3&&runtime&&config&&<EconomyV3Panel key={session.wallet} wallet={session.wallet} token={session.token} config={config} runtime={runtime} onHistory={()=>selectTab('History')}/>}
      {tab==='Campaign'&&flags.campaign&&<><CampaignPanel key={session.wallet} wallet={session.wallet} token={session.token} onSeal={()=>{setTab(flags.economyV3?'Café':'Seal');if(!flags.economyV3)void run(loadInventory);}}/>
        {flags.campaignRewards&&!flags.economyV3&&yarnOn&&runtime&&<CampaignRewardPanel key={'reward:'+session.wallet} disabled={busy}
          onQuote={async kind=>validateCampaignQuote(await chainPost('chain-campaign-reward',session.token,{action:'quote',kind}),{contract:config!.SeasonRewards!,wallet:session.wallet,kind})}
          onClaim={quote=>run(async()=>{const hash=await claimCampaignReward(runtime,quote,()=>chainPost('chain-campaign-reward',session.token,{action:'claim',kind:quote.kind}));if(hash)setSuccess({hash});},true)}/>}</>}
      {tab==='Judge'&&<>
        <ol className="chain-checklist" aria-label="Judge checklist">{['Mint','List','Buy','Snowtrace'].map(c=><li key={c} data-done={!!checks[c]} title={checks[c]?'Done':'Pending'}><GameIcon name={c==='Mint'?'mint':c==='List'?'list':c==='Buy'?'buy':'external'} size={36}/>{c}</li>)}</ol>
        {!pass?<button disabled={disabled} onClick={()=>void run(()=>grant('pass'))}><GameIcon name="key" size={18}/> Judge pass</button>:<>
          <div className="chain-grid">{pass.vouchers.filter(v=>!v.used).slice(page*2,page*2+2).map(v=><article key={v.nonce} data-testid={`voucher-${v.relicId}`}><img src={artOf(v.relicId)} alt={nameOf(v.relicId)}/><button disabled={disabled} onClick={()=>void run(()=>mint(v))}><GameIcon name="season" size={18}/> Mint to Fuji</button></article>)}</div>
          {pass.vouchers.filter(v=>!v.used).length>2&&pages(pass.vouchers.filter(v=>!v.used).length,'vouchers')}
          <button disabled={disabled||!!pass.battle?.won} onClick={()=>void run(()=>grant('boss'))}><GameIcon name="fight" size={24}/>{pass.battle?.won?'Victory':'Fight boss'}</button>
          {yarnOn&&<button disabled={disabled||claimed} onClick={()=>void run(claim)}><GameIcon name="yarn" size={24}/>{claimed?'20':'Claim'}</button>}
        </>}
      </>}
      {tab==='Market'&&<>
        <button className="b2-mine" aria-pressed={own} onClick={()=>setOwn(!own)}><GameIcon name="bag" size={24}/> Mine</button>
        {own&&v2&&proceeds.map((p,c)=>p>0n?<button key={c} disabled={disabled} aria-label={`Withdraw ${c?'YARN':'AVAX'}`} onClick={()=>void run(()=>withdraw(c))}><GameIcon name="download" size={18}/> {c?'YARN':'AVAX'} {formatEther(p)}</button>:null)}
        <div className="chain-grid">{shown.slice(page*2,page*2+2).map(l=><article key={String(l.id)} data-testid={`listing-${l.id}`} data-relic={String(l.relicId)} data-seller={l.seller.toLowerCase()}>
          <button className="b2-chain-art" aria-label={`Inspect ${nameOf(l.relicId)}`} onClick={()=>setPurchase(l)}><img src={artOf(l.relicId)} alt=""/></button><strong>{nameOf(l.relicId)}</strong>{stats(l.relicId)}<output aria-label={`${formatEther(l.price)} ${l.currency?'YARN':'AVAX'}`}><GameIcon name={l.currency?'yarn':'wallet'} size={24}/> {formatEther(l.price)}</output><PaintedButton icon={mine(l)?'list':'buy'} disabled={disabled} onClick={()=>mine(l)?void run(()=>cancel(l)):setPurchase(l)}>{mine(l)?'Cancel':'Buy'}</PaintedButton></article>)}</div>
        {shown.length===0&&<div className="b2-chain-empty"><GuideMascot pose="shop"/><p>No listings</p></div>}{shown.length>2&&pages(shown.length,'listings')}
      </>}
      {tab==='Bag'&&<>
        <div className="chain-grid">{owned.slice(page*2,page*2+2).map(h=><article key={String(h.id)} data-testid={`holding-${h.id}`}>
          <img src={artOf(h.id)} alt={nameOf(h.id)}/><strong>{nameOf(h.id)}</strong>{stats(h.id)}<output>{h.amount.toString()}</output><button disabled={disabled} onClick={()=>setSelected(String(h.id))}><GameIcon name="upgrade" size={18}/> List</button>
          {h.id<10000n&&<button disabled={disabled} aria-pressed={treasures[cat]===String(h.id)} onClick={()=>{const next={...treasures,[cat]:treasures[cat]===String(h.id)?'':String(h.id)};setTreasures(next);localStorage.setItem(localTreasures(session.wallet),JSON.stringify(next));}}><GameIcon name="bag" size={18}/> Treasure</button>}
        </article>)}</div>
        <select aria-label="Treasure companion" value={cat} onChange={e=>setCat(e.target.value)}>{['Mochi','Soot','Clover'].map(c=><option key={c}>{c}</option>)}</select>
        {treasures[cat]&&<img className="chain-treasure" src={artOf(treasures[cat]!)} alt={`${cat} Treasure`}/>}
        {selected&&<MenuDialogB2 title="List" className="b2-chain-list" onClose={()=>setSelected('')}><div className="b2-chain-item"><img src={artOf(selected)} alt=""/><h3>{nameOf(selected)}</h3></div><form onSubmit={e=>{e.preventDefault();void run(()=>list(BigInt(selected)));}}><label>{currency&&v2?'YARN':'AVAX'}<input aria-label={`Price in ${currency&&v2?'YARN':'AVAX'}`} value={price} onChange={e=>setPrice(e.target.value)} inputMode="decimal"/></label>{v2&&<span>Fee {Number(feeBps)/100}%</span>}<button className="b2-button" disabled={disabled}><GameIcon name="check" size={24}/>Confirm</button></form>{status&&<p role="status">{status}</p>}</MenuDialogB2>}
        {owned.length>2&&pages(owned.length,'holdings')}
      </>}
      {tab==='Seal'&&<><div className="chain-grid">{sealable.slice(page*2,page*2+2).map(item=><article key={item.id} data-testid={`drop-${item.item_id}`}><img src={artOf(TRADE_BY_ID[item.item_id]?.tokenId??10001)} alt={TRADE_BY_ID[item.item_id]?.name}/><strong>{TRADE_BY_ID[item.item_id]?.name}</strong><output><GameIcon name="yarn" size={18}/> {formatEther(displayedSealCost(item,sealPolicy))}</output><button disabled={disabled} onClick={()=>void run(()=>seal(item))}><GameIcon name="seal" size={24}/>{item.state==='available'?'Seal to Fuji':'Recover'}</button></article>)}</div>{sealable.length>2&&pages(sealable.length,'seal items')}</>}
      {tab==='Forge'&&forgeOn&&<RelicForgePanel holdings={holdings} owned={forgeOwned} busy={disabled} balance={yarn} sealPolicy={sealPolicy} inventory={inventory} craft={(d,a,b)=>void run(()=>forge(d,a,b))}/>}
      {tab==='Style'&&stylesOn&&<YarnStyles state={cosmetics} busy={disabled} balance={yarn} buy={sku=>void run(()=>buyStyle(sku))} equip={sku=>void run(()=>equipStyle(sku))}/>}
      {tab==='History'&&<div className="b2-history-desk"><GuideMascot pose="explain"/><ol className="chain-history">{history.map(h=><li key={h.hash}><a href={txLink(h.hash)} target="_blank" rel="noreferrer" title={h.hash} aria-label={`${h.kind} transaction ${h.hash}`}><PaintedIcon name={h.kind==='Mint'?'mint':h.kind==='Burn'?'yarn':h.kind==='Purchase'?'buy':h.kind==='Forge'?'forge':'history'} size={48}/><span><b>{h.kind}</b><small aria-label={`Block ${h.block}`}>{String(h.block)}</small></span><GameIcon name="external" size={20}/></a></li>)}</ol>{!history.length&&!busy&&<p>No receipts yet.</p>}</div>}
    </>}
    <footer><p role="status">{status}</p><button aria-label="Refresh chain" disabled={busy} onClick={()=>void run(async()=>{if(!config)await connect();else await refresh();if(tab==='Judge'&&pass)await grant('pass');if(tab==='Seal')await loadInventory();if(tab==='Style')await loadStyles();if(tab==='History'&&runtime)await historyPage();})}><GameIcon name="refresh" size={18}/></button><HelpC2 label="Fuji guide">{forgeOn&&<p>Forge: choose two owned, sealed Epic units. Both enter irreversible custody and 3 YARN burns atomically. No refund or exit. Inputs bought from the market have their own cost; self-sealing two costs another 20 YARN. Each ornament unlocks once per wallet, with zero Power or rewards. Three designs total; preview is free. Ornaments stay with this wallet when assets move.</p>}{stylesOn&&<p>Style: permanent room and card decoration, bound to this account, zero combat or reward benefit. Preview freely; each style burns 4 YARN once. Recovery never pays twice. Reset is free. Styles do not move with wallet assets. Three styles total; no subscription or expiry.</p>}<p>V2: any price, including gifts. The seller pays the displayed fee; 40% of that fee is burned, 60% goes to treasury. AVAX sink is not YARN burn. Claim sale proceeds under Mine. Bought items wait ten minutes before V2 relisting. V1 stays fee-free. Seal costs 10% of fixed reference YARN, burned once. Recovery renews the same mint nonce without paying again. Only the server-run boss creates this test drop; offline saves never authorize minting. Treasure is cosmetic and clears on transfer. History shows this wallet’s game-contract activity. All assets are Fuji testnet only, with no real value.</p></HelpC2></footer>
    {purchase&&<MenuDialogB2 title="Buy" className="b2-chain-purchase" onClose={()=>setPurchase(undefined)}><div className="b2-chain-item"><img src={artOf(purchase.relicId)} alt=""/><h3>{nameOf(purchase.relicId)}</h3><p><GameIcon name={purchase.currency?'yarn':'wallet'} size={36}/>{formatEther(purchase.price)}</p></div><div className="b2-dialog-actions"><PaintedButton icon="buy" disabled={disabled||mine(purchase)} onClick={()=>void run(async()=>{await buy(purchase);setPurchase(undefined);})}>Confirm purchase</PaintedButton></div>{status&&<p role="status">{status}</p>}</MenuDialogB2>}
    {success&&<MenuDialogB2 title="Confirmed" className="b2-chain-success" onClose={()=>setSuccess(undefined)}><div className="chain-success" role="status"><GuideMascot pose="celebrate"/>{success.id&&<img src={artOf(success.id)} alt={nameOf(success.id)}/>}<a href={txLink(success.hash)} target="_blank" rel="noreferrer" title={success.hash} onClick={()=>setChecks(c=>({...c,Snowtrace:true}))}><GameIcon name="external" size={28}/> Snowtrace</a><button aria-label="Close receipt" onClick={()=>setSuccess(undefined)}><GameIcon name="check" size={24}/> Done</button></div></MenuDialogB2>}
  </section></TextDietContext.Provider>;
}
