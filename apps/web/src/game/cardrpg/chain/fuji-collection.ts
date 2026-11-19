import {isAddress,type Address} from 'viem';
import {CHAIN_V3_ITEM_IDS,tradeRuleV3} from '@taskbar-hero/game-rules/src/cardrpg/trade';
import {publicChain,readHoldings,type ChainConfig} from './runtime';

export interface OwnedRelic {id:bigint;amount:bigint;name:string}
/** Ownership comes only from Fuji balanceOfBatch, never a save, session or backend index. */
export async function readFujiCollection(config:ChainConfig,address:Address,client=publicChain(config)):Promise<OwnedRelic[]> {
  if(!isAddress(address))throw Error('Enter a valid wallet address.');
  if(['localhost','127.0.0.1','[::1]'].includes(new URL(config.rpcUrl).hostname))throw Error('Choose a public Fuji RPC to read Avalanche ownership.');
  if(await client.getChainId()!==43113)throw Error('The RPC must be Avalanche Fuji (43113).');
  const rows=await readHoldings(client,config.RelicNFT,address,[...new Set([1n,2n,3n,4n,...CHAIN_V3_ITEM_IDS])]);
  return rows.map(row=>({...row,name:tradeRuleV3(Number(row.id))?.name??`Relic #${row.id}`}));
}
