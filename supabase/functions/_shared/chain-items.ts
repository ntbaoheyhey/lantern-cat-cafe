import {ChainRequestError} from './chain-http.ts';
import { keccak256, toBytes, type Address } from 'viem';
import { TRADE_BY_ID, sealCost } from '../../../packages/game-rules/src/cardrpg/trade.ts';
import { RARITY_ORDER } from '../../../packages/game-rules/src/cardrpg/contract.ts';
import type { VoucherSigner } from './relic.ts';
export interface SealIntent {id:string;inventory_id:string;player_id:string;item_id:string;token_id:number;rarity:number;cost:string;paid:boolean}
export interface ChainInventory {id:string;item_id:string;earned_level:number;state:'available'|'reserved'|'consumed';seal:SealIntent|null}
export interface ItemStore {
  inventory(player:string,wallet:string):Promise<ChainInventory[]>;
  reserve(player:string,wallet:string,inventory:string,token:number,rarity:number,cost:string):Promise<SealIntent>;
  finalize(player:string,intent:string):Promise<SealIntent>;
}
export const sealIntentHash=(id:string)=>keccak256(toBytes(`taskbar-hero:seal:v1:${id}`));
export function createItems({store,signer,paid,nonceUsed,now=()=>Date.now()}:{
  store:ItemStore;signer:VoucherSigner;paid(wallet:Address,intent:`0x${string}`):Promise<bigint>;
  nonceUsed(nonce:bigint):Promise<boolean>;now?:()=>number;
}) {
  return async(player:string,wallet:Address,body:{action?:unknown;inventory?:unknown;intent?:unknown})=>{
    const items=await store.inventory(player,wallet.toLowerCase());
    if(body.action==='inventory')return {items};
    if(body.action==='reserve'){
      const item=items.find(i=>i.id===body.inventory);if(!item)throw new ChainRequestError('no_item');
      const rule=TRADE_BY_ID[item.item_id];
      if(!rule?.tradable||!rule.tokenId||rule.tokenId<10000)throw new ChainRequestError('bound_item');
      const intent=await store.reserve(player,wallet.toLowerCase(),item.id,rule.tokenId,RARITY_ORDER.indexOf(rule.rarity),sealCost(rule.id).toString());
      return {intent,hash:sealIntentHash(intent.id)};
    }
    if(body.action==='finalize'){
      const intent=items.map(i=>i.seal).find(s=>s?.id===body.intent);if(!intent)throw new ChainRequestError('no_intent');
      // Immutable, per-player receipt in the fixed YARN contract. Client hashes/amounts are not evidence.
      if(await paid(wallet,sealIntentHash(intent.id))!==BigInt(intent.cost))throw new ChainRequestError('seal_unpaid');
      await store.finalize(player,intent.id);
      const fields={player:wallet,relicId:BigInt(intent.token_id),rarity:intent.rarity,
        nonce:BigInt(sealIntentHash(intent.id)),expiry:BigInt(Math.floor(now()/1000)+600)};
      const used=await nonceUsed(fields.nonce);
      return {voucher:{...fields,signature:used?'0x':await signer.sign(fields),used,source:'sealed-item'}};
    }
    throw new ChainRequestError('invalid_action');
  };
}
