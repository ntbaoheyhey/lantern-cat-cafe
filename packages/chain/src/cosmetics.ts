/** A finite, permanent cosmetic catalog. No combat, reward or trade entitlement. */
export const YARN_STYLES = [
  {id:'fern',name:'Fern',accent:'#8bd6a5',cost:'4000000000000000000'},
  {id:'tide',name:'Tide',accent:'#8dccea',cost:'4000000000000000000'},
  {id:'ember',name:'Ember',accent:'#f0b080',cost:'4000000000000000000'},
] as const;
export type YarnStyle = typeof YARN_STYLES[number]['id'];
export interface CosmeticOrder {
  id:string;player_id:string;wallet:string;sku:YarnStyle;token:string;cost:string;paid_at:string|null;
}
export interface CosmeticState {orders:CosmeticOrder[];active:YarnStyle|null}

/** Shared payment domain: the client checks the same intent before signing. */
export const cosmeticIntentText=(token:string,id:string)=>
  `taskbar-hero:cosmetic:v1:43113:${token.toLowerCase()}:${id}`;
