import {useEffect,useState} from 'react';
import {GameIcon} from '../../../ui/GameIcon';
import {formatEther,parseAbi} from 'viem';
import {loadChainConfig,publicChain} from '../chain/runtime';
import {ECONOMY_V3,v3Season} from '@taskbar-hero/game-rules/src/cardrpg/economy-v3';
export const COUNTER_POLICY={timeoutMs:6000,cacheMs:60000,retries:2,logWindow:100,deedBatchSize:500} as const;
type CounterKey='burned'|'deeds'|'fused'|'transactions';
export interface Counters{reasons?:Partial<Record<CounterKey,string>>;links?:Partial<Record<CounterKey,string>>;transactionRange?:{from:string;to:string;complete:boolean};burned?:string;deeds?:number;fused?:number;transactions?:number;emitted?:string;seasonBurned?:string;burnEmission?:string;rewardSeason?:number;editionMinted?:number}
const tokens=(value:bigint)=>Number(formatEther(value)).toLocaleString('en-US',{maximumFractionDigits:2});
let cached:{at:number;value:Counters}|undefined,pending:Promise<Counters>|undefined;
async function fetchCounters():Promise<Counters>{
 const config=await loadChainConfig(),client=publicChain(config,{timeout:COUNTER_POLICY.timeoutMs,retryCount:COUNTER_POLICY.retries,batch:{batchSize:5,wait:50}});
 if(await client.getChainId()!==43113)throw new Error('Wrong network');
 const blockNumber=await client.getBlockNumber({cacheTime:0});
 const contractLink=(address:string)=>`https://testnet.snowtrace.io/address/${address}`;
 const result:Counters={reasons:{fused:'Fusion totals need a verified indexer.'},links:{deeds:contractLink(config.RelicNFT),burned:contractLink(config.YarnToken??config.RelicNFT),transactions:contractLink(config.RelicNFT),fused:contractLink(config.RelicForge??config.RelicNFT)}};
 await Promise.all([
  (async()=>{if(!config.YarnToken){result.reasons!.burned='YARN registry address unavailable.';return;}try{
   const supply=await client.readContract({address:config.YarnToken,abi:parseAbi(['function totalSupply() view returns (uint256)']),functionName:'totalSupply',blockNumber});
   const initial=1_000_000_000n*10n**18n;if(supply<0n||supply>initial)throw Error('Invalid supply');result.burned=tokens(initial-supply);
  }catch{result.reasons!.burned='YARN supply RPC unavailable.';}})(),
  (async()=>{try{
   // Enumerate the complete fixed Deed ID range at one block. No local save or
   // recent log sample can establish this lifetime issuance count.
   const abi=parseAbi(['function relicExists(uint256) view returns (bool)']);let deeds=0;
   for(let first=ECONOMY_V3.deed.firstId;first<=ECONOMY_V3.deed.lastId;first+=COUNTER_POLICY.deedBatchSize){
    const size=Math.min(COUNTER_POLICY.deedBatchSize,ECONOMY_V3.deed.lastId-first+1);
    const values=await client.multicall({contracts:Array.from({length:size},(_,i)=>({address:config.RelicNFT,abi,functionName:'relicExists' as const,args:[BigInt(first+i)] as const})),allowFailure:false,batchSize:0,blockNumber});
    if(values.length!==size||values.some(v=>typeof v!=='boolean'))throw Error('Incomplete Deed enumeration');
    deeds+=values.filter(Boolean).length;
   }
   result.deeds=deeds;
  }catch{result.reasons!.deeds='Deed enumeration RPC unavailable.';}})(),
  (async()=>{try{
   const addresses=[...new Set([config.RelicNFT,config.RelicMarket,config.YarnToken,config.RelicMarketV2,config.SeasonRewards,config.RelicForge].filter((v):v is `0x${string}`=>!!v))];
   const configured=config.startBlock??import.meta.env.VITE_V3_START_BLOCK;
   const complete=typeof configured==='string'&&/^\d+$/.test(configured);
   const first=complete?BigInt(configured):blockNumber>999n?blockNumber-999n:0n;
   if(first>blockNumber||blockNumber-first>200000n)throw Error('Index required');
   const transactions=new Set<string>();
   // Fuji applies its 100-block ceiling across the entire HTTP batch too.
   // Await each page so two log windows can never share a transport batch.
   for(let fromBlock=first;fromBlock<=blockNumber;fromBlock+=100n){
    const toBlock=fromBlock+99n<blockNumber?fromBlock+99n:blockNumber;
    const logs=await client.getLogs({address:addresses,fromBlock,toBlock});
    for(const log of logs){if(!log.transactionHash||log.removed)throw Error('Incomplete log');transactions.add(log.transactionHash);}
   }
   result.transactions=transactions.size;result.transactionRange={from:String(first),to:String(blockNumber),complete};
  }catch{result.reasons!.transactions='Transaction log RPC unavailable; no partial count shown.';}})(),
  (async()=>{if(!config.SeasonRewards)return;try{
   const abi=parseAbi(['function currentSeason() view returns (uint256)','function emittedInSeason(uint256) view returns (uint256)','function burnedInSeason(uint256) view returns (uint256)']);
   const season=await client.readContract({address:config.SeasonRewards,abi,functionName:'currentSeason',blockNumber});
   const [emitted,burned]=await Promise.all(['emittedInSeason','burnedInSeason'].map(functionName=>client.readContract({address:config.SeasonRewards!,abi,functionName:functionName as 'emittedInSeason'|'burnedInSeason',args:[season],blockNumber})));
   result.rewardSeason=Number(season);result.emitted=tokens(emitted!);result.seasonBurned=tokens(burned!);result.burnEmission=emitted===0n?'No claims':(Number(burned)/Number(emitted)).toFixed(2);
  }catch{/* Independent metrics keep their verified values. */}})(),
 ]);
 // Optional fusion and edition totals require a matching, fresh indexer;
 // never substitute local save counters for on-chain issuance.
 const endpoint=import.meta.env.VITE_CHAIN_STATS_URL;
 if(endpoint)try{const response=await fetch(endpoint,{signal:AbortSignal.timeout(COUNTER_POLICY.timeoutMs)});if(response.ok){const stats=await response.json();if(stats.chainId===43113&&stats.relicNFT?.toLowerCase()===config.RelicNFT.toLowerCase()&&Number.isFinite(stats.indexedAt)&&Date.now()-stats.indexedAt<120000&&stats.indexedAt<=Date.now()){
  for(const key of ['deeds','fused','transactions'] as const)if(Number.isSafeInteger(stats[key])&&stats[key]>=0&&(key!=='deeds'||stats[key]<=3000)){result[key]=stats[key];delete result.reasons![key];}
  const edition=stats.edition;if(edition?.season===v3Season().number&&edition.supply===ECONOMY_V3.season.editionSupply&&Number.isSafeInteger(edition.minted)&&edition.minted>=0&&edition.minted<=edition.supply)result.editionMinted=edition.minted;
 }}}catch{/* An offline indexer leaves its own values Offline. */}
 return result;
}
export function readCounters({force=false}:{force?:boolean}={}):Promise<Counters>{
 if(pending)return pending;
 if(!force&&cached&&Date.now()-cached.at<COUNTER_POLICY.cacheMs)return Promise.resolve(cached.value);
 pending=fetchCounters().then(value=>{cached={at:Date.now(),value};return value;}).finally(()=>{pending=undefined;});return pending;
}
function useLiveCounters(){const [stats,setStats]=useState<Counters>({}),[revision,retry]=useState(0),[loading,setLoading]=useState(true);useEffect(()=>{let live=true;const update=()=>{setLoading(true);void readCounters({force:revision>0}).then(v=>{if(live)setStats(v);}).catch(()=>{if(live)setStats({reasons:{deeds:'Fuji RPC unavailable.',burned:'Fuji RPC unavailable.',fused:'Fuji RPC unavailable.',transactions:'Fuji RPC unavailable.'}});}).finally(()=>{if(live)setLoading(false);});};update();const id=setInterval(update,COUNTER_POLICY.cacheMs);return()=>{live=false;clearInterval(id);};},[revision]);return {stats,loading,retry:()=>retry(n=>n+1)};}
export function LiveCounters(){const {stats,loading,retry}=useLiveCounters();return <div className="b-live" aria-label="Live Fuji counters" aria-busy={loading}>{([['deeds','Deeds',' / 3,000'],['burned','YARN burned',''],['fused','Fused',''],['transactions','Fuji tx','']] as const).map(([key,label,suffix])=><div key={key} className="b-live-counter" data-counter={key}><a aria-label={label} title={stats.reasons?.[key]??(key==='transactions'&&stats.transactionRange?`Event transactions, blocks ${stats.transactionRange.from}–${stats.transactionRange.to}`:label)} href={stats.links?.[key]??'https://testnet.snowtrace.io'} target="_blank" rel="noreferrer"><strong className="t-number">{stats[key]===undefined?loading?'…':'Offline':`${stats[key]}${suffix}`}</strong><GameIcon name={{deeds:'deed',burned:'yarn',fused:'fuse',transactions:'history'}[key]} size={28}/><small>{key==='transactions'&&stats.transactionRange&&!stats.transactionRange.complete?'Tx · 1k blocks':label}</small></a>{stats[key]===undefined&&!loading&&<button aria-label={`Retry ${label}`} title={stats.reasons?.[key]} onClick={retry}><GameIcon name="refresh" size={16}/></button>}</div>)}</div>;}
export function EconomyVitals(){const {stats}=useLiveCounters();return <details><summary><GameIcon name="economy" size={24}/>Live ratio</summary><p>Burned {stats.seasonBurned??'Offline'} · Claimed {stats.emitted??'Offline'} YARN · Ratio {stats.burnEmission??'Offline'}</p><small>Contract season {stats.rewardSeason??'Offline'} · 13 weeks · includes tester claims</small></details>;}
export function SeasonEdition(){const {stats}=useLiveCounters();return <p>{stats.editionMinted??'Offline'} / {ECONOMY_V3.season.editionSupply}</p>;}
