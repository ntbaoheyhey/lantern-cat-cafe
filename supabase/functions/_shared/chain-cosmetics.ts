import {keccak256,toBytes,type Address,type Hex} from 'viem';
import {YARN_STYLES,cosmeticIntentText,type CosmeticOrder,type CosmeticState} from '../../../packages/chain/src/cosmetics.ts';
import {ChainRequestError} from './chain-http.ts';

// Domain separation prevents item-sealing receipts from purchasing cosmetics.
export const cosmeticIntentHash=(token:Address,id:string)=>
  keccak256(toBytes(cosmeticIntentText(token,id)));
export interface CosmeticStore {
  state(player:string,wallet:string):Promise<CosmeticState>;
  reserve(player:string,wallet:string,sku:string,token:string):Promise<CosmeticOrder>;
  finalize(player:string,wallet:string,id:string):Promise<CosmeticState>;
  equip(player:string,wallet:string,sku:string):Promise<CosmeticState>;
}
export function createCosmetics({enabled=false,token,store,paid}:{
  enabled?:boolean;token:Address;store:CosmeticStore;
  paid(wallet:Address,intent:Hex):Promise<bigint>;
}) {
  return async(player:string,wallet:Address,body:Record<string,unknown>)=>{
    if(!enabled)throw new Error('cosmetics_disabled');
    const owner=wallet.toLowerCase();
    if(body.action==='state')return store.state(player,owner);
    if(body.action==='equip'){
      if(body.sku!=='none'&&!YARN_STYLES.some(s=>s.id===body.sku))throw new ChainRequestError('invalid_request');
      return store.equip(player,owner,String(body.sku));
    }
    let order:CosmeticOrder;
    if(body.action==='reserve'){
      if(!YARN_STYLES.some(s=>s.id===body.sku))throw new ChainRequestError('invalid_request');
      order=await store.reserve(player,owner,String(body.sku),token.toLowerCase());
    }else if(body.action==='finalize'){
      const state=await store.state(player,owner);
      const found=state.orders.find(o=>o.id===body.intent);
      if(!found)throw new ChainRequestError('no_intent');
      order=found;
    }else throw new ChainRequestError('invalid_action');
    const entry=YARN_STYLES.find(s=>s.id===order.sku);
    if((body.action==='reserve'&&order.sku!==body.sku)||!entry||order.cost!==entry.cost||order.player_id!==player||order.wallet!==owner||
      order.token!==token.toLowerCase()||!/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/.test(order.id))
      throw new Error('cosmetic_store_conflict');
    const hash=cosmeticIntentHash(token,order.id);
    if(body.action==='reserve')return {order,hash};
    // The contract stores the immutable amount burned by THIS authenticated
    // wallet, on THIS deployment, for THIS order. No client tx hash is trusted.
    if(await paid(wallet,hash)!==BigInt(order.cost))throw new ChainRequestError('cosmetic_unpaid');
    return store.finalize(player,owner,order.id);
  };
}
