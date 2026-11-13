import {decodeEventLog, type Abi, type Address, type Hash, type Hex, type PublicClient} from 'viem';
import {relicNftAbi,relicMarketAbi,relicMarketV2Abi,yarnTokenAbi,seasonRewardsAbi,relicForgeAbi} from '@taskbar-hero/chain';

export type HistoryKind='Activity'|'Transfer'|'Approval'|'Mint'|'Burn'|'Claim'|'Listing'|'Purchase'|'Cancel'|'Forge';
export interface HistoryRow { hash: Hash; block: bigint; index: number; kind:HistoryKind }
const events=[...relicNftAbi,...relicMarketAbi,...relicMarketV2Abi,...yarnTokenAbi,...seasonRewardsAbi,...relicForgeAbi].filter(item=>item.type==='event') as Abi;
const priorities:Record<HistoryKind,number>={Activity:0,Approval:1,Transfer:2,Mint:3,Burn:4,Claim:5,Listing:6,Purchase:7,Cancel:8,Forge:9};
/** Name actual receipt events, preferring the action over its supporting transfers. */
export function historyKind(log:{data:Hex;topics:readonly Hex[]}):HistoryKind{
 try{
  const event=decodeEventLog({abi:events,data:log.data,topics:log.topics as [Hex,...Hex[]]});
  if(!event.eventName)return 'Activity';
  const named:Record<string,HistoryKind>={Forged:'Forge',Bought:'Purchase',Listed:'Listing',Cancelled:'Cancel',Claimed:'Claim',SealPaid:'Burn',RelicForged:'Mint',Approval:'Approval',ApprovalForAll:'Approval'};
  if(named[event.eventName])return named[event.eventName]!;
  if(['Transfer','TransferSingle','TransferBatch'].includes(event.eventName)){
   const args=event.args as unknown as {from?:Address;to?:Address},from=String(args?.from).toLowerCase(),to=String(args?.to).toLowerCase();
   if(/^0x0{40}$/.test(from))return 'Mint';
   if(/^0x0{40}$/.test(to)||to==='0x000000000000000000000000000000000000dead')return 'Burn';
   return 'Transfer';
  }
 }catch{/* An unrecognised event stays visibly generic, never guessed. */}
 return 'Activity';
}

export async function readChainHistory(
  client: Pick<PublicClient, 'getBlockNumber' | 'getLogs'>,
  addresses: Address[], start = 0n,
): Promise<HistoryRow[]> {
  // A transaction may confirm inside viem's head-cache lifetime. Using that cached
  // head as toBlock would permanently omit the receipt from this history snapshot.
  let to = await client.getBlockNumber({cacheTime: 0});
  const found = new Map<Hash, HistoryRow>();
  for (let windows = 0; windows < 12 && to >= start && found.size < 20; windows++) {
    const from = to - start > 9999n ? to - 9999n : start;
    const logs = await client.getLogs({address: addresses, fromBlock: from, toBlock: to});
    for (const log of logs) if (log.transactionHash && log.blockNumber !== null) {
      const previous=found.get(log.transactionHash),kind=historyKind(log);
      found.set(log.transactionHash, {hash: log.transactionHash, block: log.blockNumber, index: log.transactionIndex ?? 0,kind:previous&&priorities[previous.kind]>priorities[kind]?previous.kind:kind});
    }
    if (from === start) break;
    to = from - 1n;
  }
  return [...found.values()].sort((a, b) => a.block === b.block ? b.index - a.index : a.block > b.block ? -1 : 1).slice(0, 20);
}
