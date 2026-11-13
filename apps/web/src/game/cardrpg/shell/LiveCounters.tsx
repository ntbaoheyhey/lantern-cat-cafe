import {useEffect,useState} from 'react';
import {formatEther,parseAbi} from 'viem';
import {loadChainConfig,publicChain} from '../chain/runtime';
import {chainFlags} from '../chain/flags';
export interface Counters{burned?:string;deeds?:number;fused?:number;transactions?:number}
export async function readCounters():Promise<Counters>{
 const config=await loadChainConfig(),client=publicChain(config);
 if(await client.getChainId()!==43113)throw new Error('Wrong network');
 const result:Counters={};
 if(config.YarnToken){const supply=await client.readContract({address:config.YarnToken,abi:parseAbi(['function totalSupply() view returns (uint256)']),functionName:'totalSupply'});result.burned=Number(formatEther(1_000_000_000n*10n**18n-supply)).toLocaleString('en-US',{maximumFractionDigits:2});}
 // No ERC1155 supply enumerator exists. Only use the verified indexer's values;
 // never substitute local save counters for on-chain issuance.
 const endpoint=import.meta.env.VITE_CHAIN_STATS_URL;
 if(endpoint){const response=await fetch(endpoint,{signal:AbortSignal.timeout(8000)});if(!response.ok)throw new Error('Indexer offline');const stats=await response.json();if(stats.chainId===43113&&stats.relicNFT?.toLowerCase()===config.RelicNFT.toLowerCase()&&Number.isFinite(stats.indexedAt)&&Date.now()-stats.indexedAt<120000&&stats.indexedAt<=Date.now()){for(const key of ['deeds','fused','transactions'] as const)if(Number.isSafeInteger(stats[key])&&stats[key]>=0&&(key!=='deeds'||stats[key]<=3000))result[key]=stats[key];}}
 return result;
}
export function LiveCounters(){const [stats,setStats]=useState<Counters>({});useEffect(()=>{if(!chainFlags().chainLoop)return;let live=true;const update=()=>void readCounters().then(v=>{if(live)setStats(v);}).catch(()=>{if(live)setStats({});});update();const id=setInterval(update,60000);return()=>{live=false;clearInterval(id);};},[]);return <div className="b-live" aria-label="Live Fuji counters">{([['deeds','Deeds',' / 3,000'],['burned','YARN burned',''],['fused','Fused',''],['transactions','Fuji tx','']] as const).map(([key,label,suffix])=><a key={key} href="https://testnet.snowtrace.io" target="_blank" rel="noreferrer"><strong className="t-number">{stats[key]===undefined?'Offline':`${stats[key]}${suffix}`}</strong><small>{label}</small></a>)}</div>;}
