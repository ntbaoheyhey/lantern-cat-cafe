import {useEffect,useState} from 'react';
import {GameIcon} from '../../../ui/GameIcon';
import {formatEther,parseAbi,parseAbiItem} from 'viem';
import {loadChainConfig,publicChain} from '../chain/runtime';
import {chainFlags} from '../chain/flags';
import {ECONOMY_V3,v3Season} from '@taskbar-hero/game-rules/src/cardrpg/economy-v3';
export interface Counters{burned?:string;deeds?:number;fused?:number;transactions?:number;emitted?:string;seasonBurned?:string;burnEmission?:string;rewardSeason?:number;editionMinted?:number}
const mintEvent=parseAbiItem('event TransferSingle(address indexed operator,address indexed from,address indexed to,uint256 id,uint256 value)');
const ZERO='0x0000000000000000000000000000000000000000';
let index:{address:string;first:bigint;next:bigint;deeds:Set<string>;transactions:Set<string>}|undefined;
const tokens=(value:bigint)=>Number(formatEther(value)).toLocaleString('en-US',{maximumFractionDigits:2});
export async function readCounters():Promise<Counters>{
 const config=await loadChainConfig(),client=publicChain(config);
 if(await client.getChainId()!==43113)throw new Error('Wrong network');
 const result:Counters={},blockNumber=await client.getBlockNumber({cacheTime:0});
 if(config.YarnToken)try{const supply=await client.readContract({address:config.YarnToken,abi:parseAbi(['function totalSupply() view returns (uint256)']),functionName:'totalSupply',blockNumber});result.burned=tokens(1_000_000_000n*10n**18n-supply);}catch{/* Keep other independently verified counters. */}
 if(config.SeasonRewards)try{
  const abi=parseAbi(['function currentSeason() view returns (uint256)','function emittedInSeason(uint256) view returns (uint256)','function burnedInSeason(uint256) view returns (uint256)']);
  const season=await client.readContract({address:config.SeasonRewards,abi,functionName:'currentSeason',blockNumber});
  const [emitted,burned]=await Promise.all(['emittedInSeason','burnedInSeason'].map(functionName=>client.readContract({address:config.SeasonRewards!,abi,functionName:functionName as 'emittedInSeason'|'burnedInSeason',args:[season],blockNumber})));
  result.rewardSeason=Number(season);result.emitted=tokens(emitted!);result.seasonBurned=tokens(burned!);
  result.burnEmission=emitted===0n?'No claims':(Number(burned)/Number(emitted)).toFixed(2);
 }catch{/* A missing reward reader must not invent emissions. */}
 // Explicit activation block is set before the first V3 mint. Partial scans
 // never masquerade as a total. Values are derived only from confirmed logs.
 const start=import.meta.env.VITE_V3_START_BLOCK;
 if(typeof start==='string'&&/^\d+$/.test(start)){
  const head=blockNumber,first=BigInt(start);
  if(!index||index.address!==config.RelicNFT||index.first!==first)index={address:config.RelicNFT,first,next:first,deeds:new Set(),transactions:new Set()};
  if(index.next<=head&&head-index.next<=200000n){
   for(let fromBlock=index.next;fromBlock<=head;fromBlock+=2000n){const toBlock=fromBlock+1999n<head?fromBlock+1999n:head;
    const [mints,logs]=await Promise.all([client.getLogs({address:config.RelicNFT,event:mintEvent,args:{from:ZERO},fromBlock,toBlock}),client.getLogs({address:[config.RelicNFT,...(config.YarnToken?[config.YarnToken]:[]),...(config.RelicMarketV2?[config.RelicMarketV2]:[]),...(config.SeasonRewards?[config.SeasonRewards]:[])],fromBlock,toBlock})]);
    for(const m of mints)if(m.args.id!>=30001n&&m.args.id!<=33000n)index.deeds.add(String(m.args.id));for(const l of logs)index.transactions.add(l.transactionHash!);index.next=toBlock+1n;
   }
  }
  if(first<=head&&index.next>head){result.deeds=index.deeds.size;result.transactions=index.transactions.size;}
 }
 // No ERC1155 supply enumerator exists. Only use the verified indexer's values;
 // never substitute local save counters for on-chain issuance.
 const endpoint=import.meta.env.VITE_CHAIN_STATS_URL;
 if(endpoint)try{const response=await fetch(endpoint,{signal:AbortSignal.timeout(8000)});if(response.ok){const stats=await response.json();if(stats.chainId===43113&&stats.relicNFT?.toLowerCase()===config.RelicNFT.toLowerCase()&&Number.isFinite(stats.indexedAt)&&Date.now()-stats.indexedAt<120000&&stats.indexedAt<=Date.now()){
  for(const key of ['deeds','fused','transactions'] as const)if(Number.isSafeInteger(stats[key])&&stats[key]>=0&&(key!=='deeds'||stats[key]<=3000))result[key]=stats[key];
  const edition=stats.edition;if(edition?.season===v3Season().number&&edition.supply===ECONOMY_V3.season.editionSupply&&Number.isSafeInteger(edition.minted)&&edition.minted>=0&&edition.minted<=edition.supply)result.editionMinted=edition.minted;
 }}}catch{/* An offline indexer leaves its own values Offline. */}
 return result;
}
function useLiveCounters(){const [stats,setStats]=useState<Counters>({});useEffect(()=>{if(!chainFlags().chainLoop)return;let live=true;const update=()=>void readCounters().then(v=>{if(live)setStats(v);}).catch(()=>{if(live)setStats({});});update();const id=setInterval(update,60000);return()=>{live=false;clearInterval(id);};},[]);return stats;}
export function LiveCounters(){const stats=useLiveCounters();return <div className="b-live" aria-label="Live Fuji counters">{([['deeds','Deeds',' / 3,000'],['burned','YARN burned',''],['fused','Fused',''],['transactions','Fuji tx','']] as const).map(([key,label,suffix])=><a key={key} aria-label={label} title={label} href="https://testnet.snowtrace.io" target="_blank" rel="noreferrer"><strong className="t-number">{stats[key]===undefined?'Offline':`${stats[key]}${suffix}`}</strong><GameIcon name={{deeds:"deed",burned:"yarn",fused:"fuse",transactions:"history"}[key]} size={28}/></a>)}</div>;}
export function EconomyVitals(){const stats=useLiveCounters();return <details><summary><GameIcon name="economy" size={24}/>Live ratio</summary><p>Burned {stats.seasonBurned??'Offline'} · Claimed {stats.emitted??'Offline'} YARN · Ratio {stats.burnEmission??'Offline'}</p><small>Contract season {stats.rewardSeason??'Offline'} · 13 weeks · includes tester claims</small></details>;}
export function SeasonEdition(){const stats=useLiveCounters();return <p>{stats.editionMinted??'Offline'} / {ECONOMY_V3.season.editionSupply}</p>;}
