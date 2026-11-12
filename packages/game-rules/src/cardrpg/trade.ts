import { CARDS, ITEMS, STACK_ITEMS } from './catalog';
import { EQUIPMENT_SLOTS, RARITY_ORDER, type Item, type Rarity } from './contract';

export const TRADE_POLICY = Object.freeze({sealBps:1000,saleBps:500,burnShareBps:4000,sealsPerDay:3,minLevel:2,relistSeconds:600});
export interface TradeRule {id:string;name:string;kind:'equipment'|'material'|'relic'|'cosmetic'|'bound';rarity:Rarity;tradable:boolean;reason:string;tokenId?:number;referenceYarn:number}
const sets=['hearthloom','moonwick','mossbrew'];
// IDs are semantic, never array position in an evolving catalog. Unknown gear fails closed.
export function equipmentTokenId(item:Item):number|undefined {
  const set=sets.indexOf(item.setId),slot=EQUIPMENT_SLOTS.indexOf(item.slot),tier=RARITY_ORDER.indexOf(item.rarity);
  return set>=0&&slot>=0&&tier>=2?20000+set*100+tier*10+slot:undefined;
}
export const TRADE_RULES:readonly TradeRule[]=[
  ...ITEMS.map(item=>{const tokenId=equipmentTokenId(item);return {id:item.id,name:item.name,kind:'equipment' as const,rarity:item.rarity,tradable:tokenId!==undefined,tokenId,referenceYarn:item.rarity==='legendary'?300:100,reason:tokenId?'Scarce earned gear; identical grindable template; no token premium.':'Repeatable ordinary gear; keep routine progression bound.'};}),
  ...STACK_ITEMS.map(item=>({id:item.id,name:item.name,kind:'bound' as const,rarity:item.rarity,tradable:false,referenceYarn:0,reason:item.id==='boss-proof'?'Achievement evidence, not a transferable substitute for boss completion.':item.id==='cafe-ribbon'?'Repeatable permanent collection unlock, not a scarce issue.':'Repeatable consumable/key; routine farming must not mint supply.'})),
  ...CARDS.map(card=>({id:`cat:${card.id}`,name:card.name,kind:'bound' as const,rarity:card.rarity,tradable:false,referenceYarn:0,reason:'Cats and their XP/shards are account progression; never sold.'})),
  ...['fish','threads','essence','stamps','xp','shards'].map(id=>({id,name:id,kind:'bound' as const,rarity:'common' as const,tradable:false,referenceYarn:0,reason:'Soft currency, common material or progression; unlimited/off chain.'})),
  {id:'star-thread',name:'Star Thread',kind:'material',rarity:'rare',tradable:true,tokenId:10001,referenceYarn:20,reason:'One authoritative judge boss drop/account; reserved rare-material fixture, no combat power.'},
  ...['Paw Charm','Star Bell','Moon Collar','Golden Maneki'].map((name,i)=>({id:['relic:1','relic:2','moon-collar','golden-maneki'][i]!,name,kind:'relic' as const,rarity:RARITY_ORDER[i]!,tradable:true,tokenId:i+1,referenceYarn:[50,100,200,400][i]!,reason:'Existing signed-voucher collection; cosmetic Treasure only. Judge mints are free test allocations.'})),
];
export const TRADE_BY_ID=Object.fromEntries(TRADE_RULES.map(r=>[r.id,r])) as Record<string,TradeRule>;
export const TRADE_BY_TOKEN=Object.fromEntries(TRADE_RULES.filter(r=>r.tokenId!==undefined).map(r=>[r.tokenId!,r])) as Record<number,TradeRule>;
export const CHAIN_ITEM_IDS=TRADE_RULES.filter(r=>r.tradable).map(r=>BigInt(r.tokenId!));
export function sealCost(id:string):bigint {const r=TRADE_BY_ID[id];if(!r?.tradable)throw new Error('Bound item');return BigInt(r.referenceYarn)*10n**18n*BigInt(TRADE_POLICY.sealBps)/10000n;}
/** Canonical catalog template only. Chain ownership never introduces enhancement/affix rolls. */
export function sealedEquipment(tokenId:number):Item|undefined {const r=TRADE_BY_TOKEN[tokenId];return r?.kind==='equipment'?ITEMS.find(i=>i.id===r.id):undefined;}
