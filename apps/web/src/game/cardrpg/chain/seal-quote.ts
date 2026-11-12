import {keccak256,toBytes,type Hex} from 'viem';
import {sealPrice,forgePreparationCost,type SealPricePolicy} from '@taskbar-hero/chain';
import {TRADE_BY_ID,RARITY_ORDER} from '@taskbar-hero/game-rules/cardrpg';

export interface SealInventory {id:string;item_id:string;state:string;seal:{id:string;cost:string}|null}
const uuid=/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/;
const fail=()=>{throw new Error('Quote changed. Retry.');};
export function displayedSealCost(item:SealInventory,policy:SealPricePolicy):bigint {
  const rule=Object.hasOwn(TRADE_BY_ID,item.item_id)?TRADE_BY_ID[item.item_id]:undefined;
  if(!rule?.tradable||!rule.tokenId||rule.tokenId<10000)return fail();
  if(item.seal){
    // An old reservation stays payable after a policy switch, at either known rate.
    const cost=item.seal.cost;
    if(!uuid.test(item.seal.id)||![sealPrice(rule.referenceYarn),sealPrice(rule.referenceYarn,'basket-trial-v1')].some(n=>String(n)===cost))return fail();
    return BigInt(cost);
  }
  return sealPrice(rule.referenceYarn,policy);
}
/** Prefer available source items, including older reservations. Where source
 * items are still missing, disclose the current preparation cost, not authority. */
export function displayedForgeBudget(sealedEpics:bigint,inventory:SealInventory[],policy:SealPricePolicy) {
  const fee=sealPrice(100,policy),base=forgePreparationCost(sealedEpics,fee);
  const quotes=inventory.filter(i=>i.state!=='consumed'&&TRADE_BY_ID[i.item_id]?.kind==='equipment'&&TRADE_BY_ID[i.item_id]?.rarity==='epic')
    .map(i=>displayedSealCost(i,policy)).sort((a,b)=>a<b?-1:a>b?1:0).slice(0,Number(base.missing));
  const preparation=quotes.reduce((n,q)=>n+q,0n)+(base.missing-BigInt(quotes.length))*fee;
  return {...base,preparation,total:preparation+base.fee};
}
/** Bind the debit to the item and exact amount the player just saw. A changed
 * quote requires a fresh display and another click; even a lower price is new. */
export function validateSealQuote(input:unknown,item:SealInventory,expectedCost:bigint) {
  if(!input||typeof input!=='object'||Array.isArray(input))return fail();
  const quote=input as {intent?:Record<string,unknown>;hash?:unknown},intent=quote.intent;
  const rule=Object.hasOwn(TRADE_BY_ID,item.item_id)?TRADE_BY_ID[item.item_id]:undefined;
  if(!intent||!rule?.tradable||!rule.tokenId||rule.tokenId<10000||
     typeof intent.id!=='string'||!uuid.test(intent.id)||intent.inventory_id!==item.id||
     intent.item_id!==item.item_id||intent.token_id!==rule.tokenId||
     intent.rarity!==RARITY_ORDER.indexOf(rule.rarity)||intent.cost!==String(expectedCost)||
     (item.seal&&intent.id!==item.seal.id))return fail();
  const hash=keccak256(toBytes(`taskbar-hero:seal:v1:${intent.id}`));
  if(quote.hash!==hash)return fail();
  return {id:intent.id,cost:expectedCost,hash:hash as Hex};
}
