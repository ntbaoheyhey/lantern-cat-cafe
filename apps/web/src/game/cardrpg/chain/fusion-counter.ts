import {decodeEventLog,type Address,type Hex} from 'viem';
import {relicNftAbi,yarnTokenAbi} from '@taskbar-hero/chain';
import {tradeRuleV3} from '@taskbar-hero/game-rules/src/cardrpg/trade';
import {ECONOMY_V3} from '@taskbar-hero/game-rules/src/cardrpg/economy-v3';
export interface CounterLog {address:Address;data:Hex;topics:readonly Hex[];transactionHash:Hex|null;removed?:boolean}
/** Match signed output nonce to its paid intent, including all-bound recipes.
 * Arbitrary dead-address transfers and unrelated Legendary seals do not count. */
export function countFusionReceipts(logs:CounterLog[],nft:Address,yarn:Address):number {
 const paid=new Set<string>(),minted=new Set<string>();
 for(const log of logs){
  if(log.removed)throw Error('Removed log in counter snapshot');
  try{
   if(log.address.toLowerCase()===yarn.toLowerCase()){
    const e=decodeEventLog({abi:yarnTokenAbi,data:log.data,topics:log.topics as [Hex,...Hex[]]});
    if(e.eventName==='SealPaid'&&e.args.amount===BigInt(ECONOMY_V3.fusion.legendary.yarn)*10n**18n)paid.add(`${e.args.player.toLowerCase()}:${BigInt(e.args.intent)}`);
   }else if(log.address.toLowerCase()===nft.toLowerCase()){
    const e=decodeEventLog({abi:relicNftAbi,data:log.data,topics:log.topics as [Hex,...Hex[]]});
    if(e.eventName==='RelicForged'){
     const rule=tradeRuleV3(Number(e.args.relicId));
     if(rule?.kind==='equipment'&&rule.rarity==='legendary')minted.add(`${e.args.player.toLowerCase()}:${e.args.nonce}`);
    }
   }
  }catch{/* Other contract events are irrelevant to this correlation. */}
 }
 return [...minted].filter(id=>paid.has(id)).length;
}
