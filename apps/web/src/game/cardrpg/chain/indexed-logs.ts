import {isAddress,type Address,type Hash,type Hex,type PublicClient} from 'viem';
import type {ChainConfig} from './runtime';
import snapshot from './fuji-snapshot.json';

export interface IndexedLog {address:Address;data:Hex;topics:Hex[];transactionHash:Hash;blockHash:Hash;blockNumber:string;transactionIndex:number;logIndex:number;removed:false}
export interface LogCheckpoint {chainId:43113;through:string;throughBlockHash:Hash;at:number;logs:IndexedLog[]}
const endpoint='https://api.routescan.io/v2/network/testnet/evm/43113/etherscan/api';
const hash=(v:unknown):v is Hash=>typeof v==='string'&&/^0x[\da-f]{64}$/i.test(v);
const hex=(v:unknown):v is Hex=>typeof v==='string'&&/^0x(?:[\da-f]{2})*$/i.test(v);
const pending=new Map<string,Promise<LogCheckpoint>>();
const memory=new Map<string,LogCheckpoint>();
export const localChain=(config:ChainConfig)=>['127.0.0.1','localhost','[::1]'].includes(new URL(config.rpcUrl).hostname);
export const indexedAddresses=(config:ChainConfig)=>[...new Set([config.RelicNFT,config.RelicMarket,config.YarnToken,config.RelicMarketV2,config.SeasonRewards,config.RelicForge].filter((a):a is Address=>!!a).map(a=>a.toLowerCase() as Address))].sort();
const cacheKey=(config:ChainConfig)=>`lantern.index.v1:${config.chainId}:${config.rpcUrl}:${indexedAddresses(config).join(',')}`;
export function normalizeIndexedLog(value:unknown,address:Address,from:bigint,to:bigint):IndexedLog {
 const r={...(value as Record<string,unknown>)};if(r.data==='')r.data='0x';
 if(!r||typeof r.address!=='string'||!isAddress(r.address)||r.address.toLowerCase()!==address.toLowerCase()||!hash(r.transactionHash)||!hash(r.blockHash)||!hex(r.data)||!Array.isArray(r.topics)||!r.topics.every(hash)||r.removed===true)throw Error('Invalid indexed event.');
 const integer=(v:unknown)=>{if(v==='0x')return 0n;if(typeof v!=='string'||!(/^(0x[\da-f]+|\d+)$/i.test(v)))throw Error('Invalid event position.');return BigInt(v);};
 const block=integer(r.blockNumber),transactionIndex=Number(integer(String(r.transactionIndex))),logIndex=Number(integer(String(r.logIndex)));
 if(block<from||block>to||![transactionIndex,logIndex].every(n=>Number.isSafeInteger(n)&&n>=0))throw Error('Indexed event outside requested range.');
 return {address:r.address,data:r.data,topics:r.topics,transactionHash:r.transactionHash,blockHash:r.blockHash,blockNumber:String(block),transactionIndex,logIndex,removed:false};
}
export async function fetchIndexedRange(addresses:Address[],from:bigint,to:bigint,fetcher:typeof fetch=fetch,pace:()=>Promise<void>=()=>new Promise(resolve=>setTimeout(resolve,650))):Promise<IndexedLog[]> {
 if(from>to)return [];
 const logs:IndexedLog[]=[],seen=new Set<string>();
 for(const address of addresses)for(let page=1;;page++){
  // Never expose a truncated range as complete. Unexpected growth needs a
  // reviewed backend index, rather than an unbounded browser request loop.
  if(page>100)throw Error('History is too large for this browser index.');
  await pace();
  const url=new URL(endpoint);url.search=new URLSearchParams({module:'logs',action:'getLogs',address,fromBlock:String(from),toBlock:String(to),page:String(page),offset:'1000'}).toString();
  const response=await fetcher(url,{signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw Error('Indexed history unavailable.');
  const data=await response.json();
  if(!Array.isArray(data.result)||(data.status!=='1'&&!(data.status==='0'&&data.result.length===0&&data.message==='No records found')))throw Error('Incomplete indexed history.');
  if(!data.result.length)break;
  for(const value of data.result){const log=normalizeIndexedLog(value,address,from,to),id=`${log.transactionHash}:${log.logIndex}`;if(seen.has(id))throw Error('Repeated indexed page.');seen.add(id);logs.push(log);}
 }
 return logs;
}
/** One shared contract index, not one full-chain scan for every wallet/view. */
export async function readIndexedLogs(client:Pick<PublicClient,'getBlock'|'getLogs'>,config:ChainConfig,head:bigint):Promise<LogCheckpoint> {
 if(localChain(config))throw Error('Public index cannot be used for local transactions.');
 const key=cacheKey(config),active=pending.get(key);if(active){const result=await active;return BigInt(result.through)>=head?result:readIndexedLogs(client,config,head);}
 const operation=(async()=>{
  let prior=memory.get(key);
  if(!prior)try{
   const value=JSON.parse(localStorage.getItem(key)??'null');
   if(value?.chainId===43113&&/^\d+$/.test(value.through)&&hash(value.throughBlockHash)&&Number.isFinite(value.at)&&Array.isArray(value.logs)){
    const addresses=indexedAddresses(config);
    const logs=value.logs.map((log:IndexedLog)=>{if(!addresses.includes(log.address.toLowerCase() as Address))throw Error('Wrong cached contract.');return normalizeIndexedLog(log,log.address,0n,BigInt(value.through));});
    prior={...value,logs};
   }
  }catch{/* Corrupt caches are replaced by a complete query. */}
  if(!prior&&snapshot.complete&&snapshot.chainId===43113){
   const wanted=indexedAddresses(config),recorded=Object.values(snapshot.contracts).map(a=>a.toLowerCase()).sort();
   if(JSON.stringify(wanted)===JSON.stringify(recorded))try{
    const logs=snapshot.logs.map(log=>normalizeIndexedLog(log,log.address as Address,0n,BigInt(snapshot.through)));
    prior={chainId:43113,through:snapshot.through,throughBlockHash:snapshot.throughBlockHash as Hash,at:Date.parse(snapshot.completedAt),logs};
   }catch{/* An invalid bundled checkpoint cannot supply history. */}
  }
  if(prior){
   if(BigInt(prior.through)>head||(await client.getBlock({blockNumber:BigInt(prior.through)})).hash!==prior.throughBlockHash)prior=undefined;
   else if(BigInt(prior.through)===head)return prior;
  }
  const from=prior?BigInt(prior.through)+1n:0n,addresses=indexedAddresses(config);
  const response=await fetch('https://api.routescan.io/v2/network/testnet/evm/43113/blocks?limit=1',{signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw Error('Indexer checkpoint unavailable.');
  const tip=(await response.json()).items?.[0];
  if(tip?.chainId!=='43113'||!Number.isSafeInteger(tip.number)||tip.number<0||!hash(tip.id))throw Error('Invalid indexer checkpoint.');
  if((await client.getBlock({blockNumber:BigInt(tip.number)})).hash!==tip.id)throw Error('Indexer checkpoint changed.');
  // Verify a small overlap directly on Fuji. An indexer lag must never hide
  // the just-confirmed transaction or cause us to cache a false empty tail.
  const cutoff=BigInt(tip.number)>head?head:BigInt(tip.number),stable=cutoff>20n?cutoff-20n:0n;
  if(head-stable>500n)throw Error('Indexer is behind Fuji; retry after it catches up.');
  const block=await client.getBlock({blockNumber:head});
  const added=await fetchIndexedRange(addresses,from,stable);
  for(let first=stable+1n>from?stable+1n:from;first<=head;first+=100n){
   const last=first+99n<head?first+99n:head;
   for(const log of await client.getLogs({address:addresses,fromBlock:first,toBlock:last})){
    if(log.blockNumber===null||log.logIndex===null||log.transactionIndex===null)throw Error('Pending event in final history.');
    added.push(normalizeIndexedLog({...log,blockNumber:String(log.blockNumber),logIndex:String(log.logIndex),transactionIndex:String(log.transactionIndex)},log.address,first,last));
   }
  }
  if(!block.hash)throw Error('Unconfirmed checkpoint.');
  const value:LogCheckpoint={chainId:43113,through:String(head),throughBlockHash:block.hash,at:Date.now(),logs:[...(prior?.logs??[]),...added]};
  memory.set(key,value);try{localStorage.setItem(key,JSON.stringify(value));}catch{/* Session cache remains available. */}
  return value;
 })().finally(()=>pending.delete(key));
 pending.set(key,operation);return operation;
}
