import { STACK_ITEMS } from '../catalog';
import { requireRule } from '../internal';
import { gameplayV4 } from './gameplay-v4';
import { battleCats, transactDepth } from './state';
import type { DepthAccount } from './contract';
export const SUPPLY_IDS_V4 = ['milk-tonic','shield-biscuit','quicken-yarn','cleanse-tea','ultimate-treat'] as const;
export type SupplyIdV4 = typeof SUPPLY_IDS_V4[number];
export interface PackedSupplyV4 { id: Exclude<SupplyIdV4,'milk-tonic'>; catId:string }
export const SUPPLY_TEXT_V4:Record<SupplyIdV4,string> = {
 'milk-tonic':'Restore up to 100 missing HP to one living companion between encounters.',
 'shield-biscuit':'Pack 20 opening shield for the next encounter.',
 'quicken-yarn':'Pack one opening Cozy stack for the next encounter.',
 'cleanse-tea':'Clear the first successfully applied debuff in the next encounter.',
 'ultimate-treat':'Restore 12 missing HP after the first automatic ultimate in the next encounter.',
};
export function stackCapV4(id:string):number{return id==='pantry-key'?99:id==='cafe-ribbon'?1:(SUPPLY_IDS_V4 as readonly string[]).includes(id)?20:Number.MAX_SAFE_INTEGER;}
/** Reserve one supply now; replacing/cancelling returns the unspent reservation. */
export function packSupplyV4(state:DepthAccount,id:SupplyIdV4|null,catId:string){return transactDepth(state,s=>{
 const run=s.run;
 requireRule(gameplayV4(s)&&run&&!run.complete&&!run.battle,'NOT_READY','Pack supplies between encounters, before opening Prepare.');
 if(id===null){if(run.packedSupply){const old=run.packedSupply;s.account.inventory.stacks[old.id]=(s.account.inventory.stacks[old.id]??0)+1;delete run.packedSupply;}return;}
 requireRule(SUPPLY_IDS_V4.includes(id),'UNKNOWN_ID','Choose an available pantry supply.');
 const cat=battleCats(s).find(c=>c.id===catId);
 requireRule(cat&&(run.hp[catId]??0)>0,'INVALID_TEAM','Choose a living member of this crew.');
 if(id==='milk-tonic'){
   requireRule((run.hp[catId]??0)<cat.stats.hp,'NOT_READY','This companion has no missing HP.');
   requireRule((s.account.inventory.stacks[id]??0)>0,'INSUFFICIENT_FUNDS','No milk tonic remains.');
   s.account.inventory.stacks[id]!--;run.hp[catId]=Math.min(cat.stats.hp,run.hp[catId]!+100);return;
 }
 if(run.packedSupply){const old=run.packedSupply;s.account.inventory.stacks[old.id]=(s.account.inventory.stacks[old.id]??0)+1;}
 requireRule((s.account.inventory.stacks[id]??0)>0,'INSUFFICIENT_FUNDS','No supply remains. The previous preparation is unchanged.');
 s.account.inventory.stacks[id]!--;run.packedSupply={id,catId};
});}
export function itemCatalogueV4(){return STACK_ITEMS.map(item=>({...item,cap:stackCapV4(item.id),description:SUPPLY_TEXT_V4[item.id as SupplyIdV4]??item.description,
 source:item.id==='boss-proof'?'Legacy-only stack; new boss rewards use the seals counter.':item.source,
 sink:SUPPLY_IDS_V4.includes(item.id as SupplyIdV4)?'Before an encounter':item.sink}));}
