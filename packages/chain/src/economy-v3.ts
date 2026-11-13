/** Public, seed-free economy protocol. Amounts use 18-decimal token units. */
export interface EconomyGear {id:string;template:string;quality:number}
export interface EconomyIntent {
 id:string;kind:'seal'|'fusion'|'withdraw'|'sink';cost:string;token:number;rarity:number;
 gross?:string;net?:string;retained?:string;burnIds:number[];burnAmounts:number[];
 ready:boolean;created:number;burnTx?:string;minted?:boolean;
 recipe?:{id:'polish'|'decor'|'display';name:string;key:string;benefit:string;starThread:number;successBp:number;style?:string;item?:EconomyGear;quality?:number;slots?:number};
}
export interface EconomyState {
 spool:string;stars:number;bossSeals:number;level:number;quest:boolean;deed:number|null;
 credits:string[];gear:EconomyGear[];intents:EconomyIntent[];styles:string[];
 lastWithdraw:number;sealDay:number;sealsToday:number;
}
export type EconomyCommand =
 | {action:'state'|'quest'|'deed'}
 | {action:'withdraw';amount:string;deed:number}
 | {action:'import';instance:string}
 | {action:'seal';instance:string;deed?:number}
 | {action:'fusion';instances:string[];tokens:number[];sealedStars:number}
 | {action:'spend';sku:'lantern-skin'}
 | {action:'sink';sink:'polish'|'decor'|'display';instance?:string}
 | {action:'finalize';intent:string;burnTx?:string}
 | {action:'voucher';intent:string};
export interface EconomyVoucher {player:string;relicId:string;rarity:number;nonce:string;expiry:string;signature:string;used:boolean}
export interface EconomyClaim {player:string;amount:string;season:string;nonce:string;expiry:string}
export interface EconomyResponse {
 state:EconomyState;revision:number;certificate?:{message:string;signature:string};
 intent?:EconomyIntent;hash?:string;voucher?:EconomyVoucher;
 withdrawal?:{claim:EconomyClaim;signature:string;used:boolean};
}
