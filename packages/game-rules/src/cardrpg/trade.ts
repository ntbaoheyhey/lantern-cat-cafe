import { CARDS, ITEMS, STACK_ITEMS } from './catalog';
import { EQUIPMENT_SLOTS, RARITY_ORDER, type Item, type Rarity } from './contract';
import { AFFIX_BY_ID, GEAR, GEAR_BY_ID } from './depth/equipment';
import type { GearInstance, GearTemplate } from './depth/contract';
import { ECONOMY_V3 } from './economy-v3';

export const TRADE_POLICY = Object.freeze({sealBps:1000,saleBps:500,burnShareBps:4000,sealsPerDay:3,minLevel:2,relistSeconds:600});
export interface TradeRule {id:string;name:string;kind:'equipment'|'material'|'relic'|'cosmetic'|'bound';rarity:Rarity;tradable:boolean;reason:string;tokenId?:number;referenceYarn:number}
// Append explicit codes; never derive IDs from the order of SETS or GEAR.
const setCodes:Readonly<Record<string,number>>={hearthloom:0,moonwick:1,mossbrew:2,rainlace:3,crumbweave:4,bellsteel:5,emberfelt:6,velvetrim:7};
// IDs are semantic, never array position in an evolving catalog. Unknown gear fails closed.
export function equipmentTokenId(item:Pick<Item,'id'|'setId'|'slot'|'rarity'>):number|undefined {
  const set=Object.hasOwn(setCodes,item.setId)?setCodes[item.setId]:undefined;
  const slot=EQUIPMENT_SLOTS.indexOf(item.slot),tier=RARITY_ORDER.indexOf(item.rarity);
  return set!==undefined&&slot>=0&&tier>=2&&item.id===`${item.setId}-${item.slot}-${item.rarity}`?20000+set*100+tier*10+slot:undefined;
}
export const TRADE_RULES:readonly TradeRule[]=[
  ...GEAR.map(item=>{const tokenId=equipmentTokenId(item);return {id:item.id,name:item.name,kind:'equipment' as const,rarity:item.rarity,tradable:tokenId!==undefined,tokenId,referenceYarn:tokenId?(item.rarity==='legendary'?300:100):0,reason:tokenId?'Epic+ catalog eligibility; authoritative source required. Canonical unenhanced template, minimum affix rolls; rarity alone does not prove scarcity.':'Repeatable ordinary gear; keep routine progression bound.'};}),
  ...STACK_ITEMS.map(item=>({id:item.id,name:item.name,kind:'bound' as const,rarity:item.rarity,tradable:false,referenceYarn:0,reason:item.id==='boss-proof'?'Achievement evidence, not a transferable substitute for boss completion.':item.id==='cafe-ribbon'?'Repeatable permanent collection unlock, not a scarce issue.':'Repeatable consumable/key; routine farming must not mint supply.'})),
  ...CARDS.map(card=>({id:`cat:${card.id}`,name:card.name,kind:'bound' as const,rarity:card.rarity,tradable:false,referenceYarn:0,reason:'Cats and their XP/shards are account progression; never sold.'})),
  ...['fish','threads','essence','stamps','xp','shards','materials','seals','selector-marks','route-points'].map(id=>({id,name:id,kind:'bound' as const,rarity:'common' as const,tradable:false,referenceYarn:0,reason:'Soft currency, common material or progression; never a transferable earning receipt.'})),
  {id:'star-thread',name:'Star Thread',kind:'material',rarity:'rare',tradable:true,tokenId:10001,referenceYarn:20,reason:'One authoritative judge boss drop/account; reserved rare-material fixture, no combat power.'},
  ...['Paw Charm','Star Bell','Moon Collar','Golden Maneki'].map((name,i)=>({id:['relic:1','relic:2','moon-collar','golden-maneki'][i]!,name,kind:'relic' as const,rarity:RARITY_ORDER[i]!,tradable:true,tokenId:i+1,referenceYarn:[50,100,200,400][i]!,reason:'Existing signed-voucher collection; cosmetic Treasure only. Judge mints are free test allocations.'})),
];
export const TRADE_BY_ID=Object.fromEntries(TRADE_RULES.map(r=>[r.id,r])) as Record<string,TradeRule>;
export const TRADE_BY_TOKEN=Object.fromEntries(TRADE_RULES.filter(r=>r.tokenId!==undefined).map(r=>[r.tokenId!,r])) as Record<number,TradeRule>;
export const CHAIN_ITEM_IDS=TRADE_RULES.filter(r=>r.tradable).map(r=>BigInt(r.tokenId!));
/** V3 IDs are disjoint from the historical minimum-roll catalog. */
export function tradeRuleV3(token:number):TradeRule|undefined {
  if(token>=30001&&token<=33000)return {id:`deed:${token}`,name:`Café Deed #${token-30000}`,kind:'relic',rarity:'legendary',tradable:true,tokenId:token,referenceYarn:0,reason:'Withdraw rights and café skin. Hosting is roadmap.'};
  if(TRADE_BY_TOKEN[token])return TRADE_BY_TOKEN[token];
  for(const [offset,name] of [[1000,'Fine'],[2000,'Perfect']] as const){const base=TRADE_BY_TOKEN[token-offset];if(base?.kind==='equipment')return {...base,name:`${name} ${base.name}`,tokenId:token,reason:`${name} quality; affix rolls snap to the published bucket floor.`};}
}
export const V3_QUALITY_IDS=TRADE_RULES.filter(r=>r.kind==='equipment'&&r.tokenId!==undefined).flatMap(r=>[BigInt(r.tokenId!+1000),BigInt(r.tokenId!+2000)]);
export const V3_DEED_IDS=Array.from({length:ECONOMY_V3.deed.supply},(_,i)=>BigInt(ECONOMY_V3.deed.firstId+i));
export const CHAIN_V3_ITEM_IDS=[...CHAIN_ITEM_IDS,...V3_QUALITY_IDS,...V3_DEED_IDS];
export function sealCost(id:string):bigint {const r=TRADE_BY_ID[id];if(!r?.tradable)throw new Error('Bound item');return BigInt(r.referenceYarn)*10n**18n*BigInt(TRADE_POLICY.sealBps)/10000n;}
/** Canonical catalog template only. Chain ownership never introduces enhancement/affix rolls. */
export function sealedEquipment(tokenId:number):Item|undefined {const r=TRADE_BY_TOKEN[tokenId];return r?.kind==='equipment'?ITEMS.find(i=>i.id===r.id):undefined;}
/** Depth is the complete catalog. Legacy lookup above remains available for old previews. */
export function sealedDepthEquipment(tokenId:number):GearTemplate|undefined {
  const r=tradeRuleV3(tokenId);return r?.kind==='equipment'?GEAR_BY_ID[r.id]:undefined;
}
/** Normalized preview, not an inventory grant or combat attachment. Rolled/enhanced
 * source gear must not be silently converted; an authority adapter must disclose normalization. */
export function sealedGearInstance(tokenId:number):GearInstance|undefined {
  const template=sealedDepthEquipment(tokenId);if(!template)return;
  const tier=Math.min(3,Math.max(1,Math.floor(template.level/10)+1)) as 1|2|3;
  const offset=tokenId-equipmentTokenId(template)!,floor=offset===2000?.85:offset===1000?.4:0;
  return {id:`chain:${tokenId}`,templateId:template.id,enhancement:0,tier,affixes:[...template.affixes],
    rolls:Object.fromEntries(template.affixes.map(id=>{const [lo,hi]=AFFIX_BY_ID[id]!.tiers[tier-1]!;return [id,lo+Math.floor((hi-lo)*floor)];}))};
}
