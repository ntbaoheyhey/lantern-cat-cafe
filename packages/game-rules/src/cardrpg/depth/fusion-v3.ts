import {ECONOMY_V3 as E,qualityBucket} from '../economy-v3';
import {requireRule} from '../internal';
import {GEAR_BY_ID,AFFIX_BY_ID,makeGear} from './equipment';
import {transactDepth,requireHome} from './state';
import type {DepthAccount,GearInstance} from './contract';

/** Quality uses normalized affix rolls, not enhancement or browser Power. */
export function gearQualityBp(item:GearInstance):number {
  if(!item.affixes.length)return 0;
  return Math.round(item.affixes.reduce((sum,id)=>{const [lo,hi]=AFFIX_BY_ID[id]!.tiers[item.tier-1]!;
    return sum+(hi===lo?0:Math.max(0,Math.min(1,((item.rolls[id]??lo)-lo)/(hi-lo)))*10000);},0)/item.affixes.length);
}
export function snapGearQuality(item:GearInstance,bp:number):GearInstance {
  const floor=qualityBucket(bp).floorBp;
  return {...item,enhancement:0,rolls:Object.fromEntries(item.affixes.map(id=>{const [lo,hi]=AFFIX_BY_ID[id]!.tiers[item.tier-1]!;return [id,lo+Math.floor((hi-lo)*floor/10000)];}))};
}
/** Bound recipes are deterministic. Legendary fees are authorized by the server. */
export function fuseBoundV3(state:DepthAccount,ids:string[]){return transactDepth(state,s=>{
  requireHome(s);requireRule(s.economyV3,'LOCKED','Economy v3 is disabled.');
  requireRule(new Set(ids).size===ids.length,'INVALID_AMOUNT','Choose distinct gear.');
  const inputs=ids.map(id=>s.gear.find(g=>g.id===id));
  requireRule(inputs.length>0&&inputs.every(Boolean),'UNKNOWN_ID','Choose available gear.');
  const first=GEAR_BY_ID[inputs[0]!.templateId]!,target=first.rarity==='common'?'rare':first.rarity==='rare'?'epic':null;
  requireRule(target,'LOCKED','Legendary fusion opens in the on-chain forge.');
  requireRule(inputs.length===E.fusion[target].count&&inputs.every(g=>{const t=GEAR_BY_ID[g!.templateId]!;return t.setId===first.setId&&t.rarity===first.rarity;}),'INVALID_AMOUNT','Use matching rarity and set.');
  requireRule(!Object.values(s.equipment).some(slots=>Object.values(slots).some(id=>ids.includes(id!))),'EQUIPPED','Unequip inputs first.');
  const template=`${first.setId}-${first.slot}-${target}`;requireRule(GEAR_BY_ID[template],'UNKNOWN_ID','Recipe unavailable.');
  const best=Math.max(...inputs.map(g=>qualityBucket(gearQualityBp(g!)).offset/1000));
  const output=snapGearQuality(makeGear(s,template,0),E.quality[Math.max(0,best-1)]!.floorBp);
  s.gear=s.gear.filter(g=>!ids.includes(g.id));s.gear.push(output);
});}
