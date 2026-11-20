import type {Address,PublicClient} from 'viem';
import {historyKind,readChainHistory,walletInLog,mergeHistoryRows,type HistoryRow} from './history';
import type {ChainConfig} from './runtime';
import {readIndexedLogs} from './indexed-logs';
export async function readWalletHistory(client:Pick<PublicClient,'getBlockNumber'|'getLogs'|'getBlock'>,config:ChainConfig,wallet:Address):Promise<HistoryRow[]> {
 const addresses=[config.RelicNFT,config.RelicMarket,config.YarnToken,config.RelicMarketV2,config.SeasonRewards,config.RelicForge].filter((v):v is Address=>!!v);
 if(['127.0.0.1','localhost','[::1]'].includes(new URL(config.rpcUrl).hostname))return readChainHistory(client,addresses,BigInt(config.startBlock??'0'),wallet);
 const index=await readIndexedLogs(client,config,await client.getBlockNumber({cacheTime:0}));
 const rows=mergeHistoryRows(index.logs!.filter(log=>!log.removed&&walletInLog(log,wallet)).map(log=>({hash:log.transactionHash,block:BigInt(log.blockNumber),index:log.transactionIndex,kind:historyKind(log)})));
 return rows;
}
