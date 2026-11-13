import {useEffect,useRef,useState} from 'react';
import {formatEther,parseEther,type Address,type Hex} from 'viem';
import {ECONOMY_V3 as E,qualityBucket,withdrawalQuote} from '@taskbar-hero/game-rules/src/cardrpg/economy-v3';
import {GEAR_BY_ID} from '@taskbar-hero/game-rules/src/cardrpg/depth/equipment';
import type {EconomyCommand,EconomyResponse,EconomyIntent} from '@taskbar-hero/chain/src/economy-v3';
import {relicNftAbi,yarnTokenAbi,seasonRewardsAbi} from '@taskbar-hero/chain';
import {GameIcon} from '../../../ui/GameIcon';
import {chainPost} from './api';
import {friendlyError} from './errors';
import {txLink,type ChainConfig,chainRuntime} from './runtime';
import {playCue} from '../contracts/audio-cues';
type Runtime=ReturnType<typeof chainRuntime>;
const DEAD='0x000000000000000000000000000000000000dEaD' as Address;
const amount=(n:string)=>Number(formatEther(BigInt(n))).toLocaleString('en-US',{maximumFractionDigits:4});
export function EconomyV3Panel({wallet,token,config,runtime}:{wallet:string;token:string;config:ChainConfig;runtime:Runtime}){
 const [data,setData]=useState<EconomyResponse>(),[tab,setTab]=useState('Café'),[error,setError]=useState(''),[busy,setBusy]=useState(false),[gross,setGross]=useState('16'),[deed,setDeed]=useState(''),[selection,setSelection]=useState<string[]>([]),[sealed,setSealed]=useState(''),[sealedStars,setSealedStars]=useState(0),[links,setLinks]=useState<string[]>([]),[active,setActive]=useState<EconomyResponse>(),[revealed,setRevealed]=useState(false);
 const lock=useRef(false),mounted=useRef(true);
 const post=async(command:EconomyCommand)=>{
  const key=`lantern.v3.request:${wallet}:${JSON.stringify(command)}`;let id:string;
  try{id=localStorage.getItem(key)??crypto.randomUUID();localStorage.setItem(key,id);}catch{id=crypto.randomUUID();}
  const r=await chainPost<EconomyResponse>('chain-economy-v3',token,{id,command});
  try{localStorage.removeItem(key);}catch{/* retries keep the same server intent */}
  if(mounted.current){setData(r);window.dispatchEvent(new CustomEvent('economy:v3',{detail:{wallet,state:r.state}}));}
  return r;
 };
 const run=async(work:()=>Promise<void>)=>{if(lock.current)return;lock.current=true;setBusy(true);setError('');try{await runtime.guard();await work();}catch(e){if(mounted.current)setError(friendlyError(e));}finally{lock.current=false;if(mounted.current)setBusy(false);}};
 useEffect(()=>{mounted.current=true;void run(async()=>{const r=await post({action:'state'});setDeed(r.state.deed?String(r.state.deed):'');});return()=>{mounted.current=false;};},[wallet,token]);
 const record=(hash:string)=>{setLinks(xs=>[...xs,hash]);};
 const mint=async(r:EconomyResponse)=>{
  const v=r.voucher;if(!v||v.used)return;record(await runtime.write({address:config.RelicNFT,abi:relicNftAbi,functionName:'mint',args:[{player:v.player as Address,relicId:BigInt(v.relicId),rarity:v.rarity,nonce:BigInt(v.nonce),expiry:BigInt(v.expiry)},v.signature as Hex]}));
  playCue('ui.reward');await post({action:'state'});setActive(undefined);
 };
 const finish=async(i:EconomyIntent)=>{
  if(i.kind==='withdraw'){
   const r=await post({action:'voucher',intent:i.id}),w=r.withdrawal;if(!w||w.used){setActive(undefined);return;}
   record(await runtime.write({address:config.SeasonRewards!,abi:seasonRewardsAbi,functionName:'claim',args:[{player:w.claim.player as Address,amount:BigInt(w.claim.amount),season:BigInt(w.claim.season),nonce:BigInt(w.claim.nonce),expiry:BigInt(w.claim.expiry)},w.signature as Hex]}));setActive(undefined);await post({action:'state'});return;
  }
  let burnTx:string|undefined=i.burnTx;
  if(!i.ready){

   // The server hash belongs to the reserved intent; recover it without reserving inputs again.
   const {keccak256,toBytes}=await import('viem');const paymentHash=keccak256(toBytes(`lantern:economy:v3:${i.id}`));
   const paid=await runtime.client.readContract({address:config.YarnToken!,abi:yarnTokenAbi,functionName:'sealPayments',args:[wallet as Address,paymentHash]});
   if(paid===0n)record(await runtime.write({address:config.YarnToken!,abi:yarnTokenAbi,functionName:'seal',args:[paymentHash,BigInt(i.cost)]}));
   if(i.burnIds.length&&!burnTx){
    const cached=localStorage.getItem(`lantern.v3.burn:${wallet}:${i.id}`);burnTx=cached??await runtime.write({address:config.RelicNFT,abi:relicNftAbi,functionName:'safeBatchTransferFrom',args:[wallet as Address,DEAD,i.burnIds.map(BigInt),i.burnAmounts.map(BigInt),paymentHash]});
    localStorage.setItem(`lantern.v3.burn:${wallet}:${i.id}`,burnTx);record(burnTx);
   }
  }
  const r=await post(i.ready?{action:'voucher',intent:i.id}:{action:'finalize',intent:i.id,...(burnTx?{burnTx}:{})});await mint(r);playCue('ui.forge-success');if(i.kind==='fusion')setRevealed(true);
 };
 let quote;try{quote=withdrawalQuote(parseEther(gross));}catch{/* invalid input disables confirm */}
 const state=data?.state;
 return <section className="b-economy-play" aria-label="On-chain café"><nav>{['Café','Withdraw','Seal','Fusion','Spool'].map(t=><button key={t} aria-pressed={tab===t} onClick={()=>{setTab(t);setActive(undefined);}}>{t}</button>)}</nav>
 {!state?<button disabled={busy} onClick={()=>void run(async()=>{await post({action:'state'});})}>Refresh</button>:<>
 <output><GameIcon name="spool" size={24}/>{amount(state.spool)} <GameIcon name="star-thread" size={24}/>{state.stars} <GameIcon name="boss-seal" size={24}/>{state.bossSeals}</output>
 {tab==='Café'&&<article className="b-deed-card"><GameIcon name="deed" size={128}/><h3>Genesis Café</h3><p>{state.quest?'Quest complete':'On-chain café quest'}</p>{!state.quest?<button disabled={busy} onClick={()=>void run(async()=>{await post({action:'quest'});})}>Complete quest</button>:<button disabled={busy} onClick={()=>void run(async()=>{const r=await post({action:'deed'});setDeed(String(r.state.deed));await mint(r);})}>{state.deed?'Recover Deed mint':'Mint free Deed'}</button>}<details><summary>Perks</summary><p>Withdraw rights · Café skin</p><p>Hosting seats: roadmap</p><p>Demo: Judge boss. Launch: level {E.deed.level} and boss clear.</p></details></article>}
 {tab==='Withdraw'&&<article><label>Spool<input aria-label="Withdraw Spool" inputMode="decimal" value={gross} onChange={e=>setGross(e.target.value)}/></label><label>Held Deed<input aria-label="Held Deed" value={deed} onChange={e=>setDeed(e.target.value)}/></label>{quote&&<p>Retained {formatEther(quote.retained)} · Burned 0 · Receive {formatEther(quote.net)} YARN</p>}<button disabled={busy||!quote||!/^3[0-9]{4}$/.test(deed)} onClick={()=>void run(async()=>setActive(await post({action:'withdraw',amount:parseEther(gross).toString(),deed:Number(deed)})))}>Reserve withdrawal</button><small>Seven-day cooldown. Testnet only.</small></article>}
 {tab==='Seal'&&<article><p>One Boss Seal · {state.sealsToday}/{E.seal.perDay} today</p>{state.gear.map(g=><button disabled={busy} key={g.id} onClick={()=>void run(async()=>setActive(await post({action:'seal',instance:g.id,...(deed?{deed:Number(deed)}:{})})))}><GameIcon name={GEAR_BY_ID[g.template]!.slot}/>{qualityBucket(g.quality).name} · {GEAR_BY_ID[g.template]!.rarity==='epic'?10:30} YARN</button>)}{state.stars>0&&<button disabled={busy} onClick={()=>void run(async()=>setActive(await post({action:'seal',instance:'star-thread',...(deed?{deed:Number(deed)}:{})})))}>Star Thread · 2 YARN</button>}<details><summary>Import earned gear</summary><input id="b-import-gear" aria-label="Campaign gear ID" placeholder="Campaign gear ID"/><button disabled={busy} onClick={()=>void run(async()=>{await post({action:'import',instance:(document.getElementById('b-import-gear') as HTMLInputElement).value});})}>Import</button></details></article>}
 {tab==='Fusion'&&<article><p>3 matching Epics + 2 Star Thread + {E.fusion.legendary.yarn} YARN</p><small>Success {E.fusion.successBp/100}% · best quality minus one</small><div className="b-fusion-inputs">{state.gear.filter(g=>GEAR_BY_ID[g.template]?.rarity==='epic').map(g=><label key={g.id}><input type="checkbox" aria-label={GEAR_BY_ID[g.template]!.name+' · '+qualityBucket(g.quality).name} checked={selection.includes(g.id)} onChange={e=>setSelection(xs=>e.target.checked?[...xs,g.id]:xs.filter(x=>x!==g.id))}/><GameIcon name={GEAR_BY_ID[g.template]!.slot} size={48}/><span>{GEAR_BY_ID[g.template]!.slot} · {qualityBucket(g.quality).name}</span></label>)}</div><details><summary>Sealed inputs</summary><label>Token IDs<input aria-label="Sealed gear IDs" value={sealed} onChange={e=>setSealed(e.target.value)} placeholder="22020, 22021"/></label><label>Sealed Star Thread<select aria-label="Sealed Star Thread" value={sealedStars} onChange={e=>setSealedStars(Number(e.target.value))}><option>0</option><option>1</option><option>2</option></select></label></details><button disabled={busy} onClick={()=>void run(async()=>setActive(await post({action:'fusion',instances:selection,tokens:sealed.trim()?sealed.split(',').map(x=>Number(x.trim())):[],sealedStars})))}>Reserve fusion</button></article>}
 {tab==='Spool'&&<article><GameIcon name="deed" size={64}/><p>Lantern café skin · 5 Spool</p><button disabled={busy||state.styles.includes('lantern-skin')} onClick={()=>void run(async()=>{await post({action:'spend',sku:'lantern-skin'});playCue('ui.reward');})}>{state.styles.includes('lantern-skin')?'Owned':'Unlock'}</button><small>Spool spends at equal YARN value.</small></article>}
 {active?.intent&&<aside role="status"><p>{active.intent.kind==='withdraw'?`Receive ${amount(active.intent.net!)} YARN`:`Burn ${amount(active.intent.cost)} YARN${active.intent.burnIds.length?' + sealed inputs':''}`}</p><button disabled={busy} onClick={()=>void run(()=>finish(active.intent!))}>{active.intent.kind==='withdraw'?'Confirm claim':'Confirm & mint'}</button></aside>}
 <details><summary>Recover reserved actions</summary>{state.intents.slice(-8).map(i=><button key={i.id} disabled={busy} onClick={()=>setActive({state,revision:data.revision,intent:i})}>{i.kind} · {i.id.slice(0,6)}</button>)}</details>
 </>}
 {revealed&&<div className="b-legendary-reveal" role="dialog" aria-label="Fusion complete" aria-modal="true"><GameIcon name="relic" size={128}/><h2 className="t-title">Legendary</h2><button autoFocus onClick={()=>setRevealed(false)}>Continue</button></div>}
 {error&&<p role="alert">{error}</p>}{links.length>0&&<div className="b-chain-receipts">{links.map((h,i)=><a key={h+i} href={txLink(h)} target="_blank" rel="noreferrer">Receipt {i+1}</a>)}</div>}
 </section>;
}
