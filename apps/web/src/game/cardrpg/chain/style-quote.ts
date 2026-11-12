import {keccak256,toBytes,type Address,type Hex} from 'viem';
import {YARN_STYLES,cosmeticIntentText,type CosmeticOrder,type YarnStyle} from '@taskbar-hero/chain';

/** The displayed price is the signing limit, even if the API returns bad data. */
export function validateStyleQuote(input:unknown,{wallet,token,sku}:{wallet:Address;token:Address;sku:YarnStyle}) {
  const fail=()=>{throw new Error('Quote changed. Retry.');};
  if(!input||typeof input!=='object'||Array.isArray(input))return fail();
  const quote=input as {order?:Partial<CosmeticOrder>;hash?:unknown},order=quote.order;
  const uuid=/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/;
  const style=YARN_STYLES.find(s=>s.id===sku);
  if(!order||!style||order.sku!==sku||order.cost!==style.cost||
     order.wallet!==wallet.toLowerCase()||order.token!==token.toLowerCase()||
     typeof order.id!=='string'||!uuid.test(order.id)||
     typeof order.player_id!=='string'||!uuid.test(order.player_id)||
     !(order.paid_at===null||(typeof order.paid_at==='string'&&Number.isFinite(Date.parse(order.paid_at)))))return fail();
  const hash=keccak256(toBytes(cosmeticIntentText(token,order.id)));
  if(quote.hash!==hash)return fail();
  return {order:order as CosmeticOrder,hash:hash as Hex};
}
