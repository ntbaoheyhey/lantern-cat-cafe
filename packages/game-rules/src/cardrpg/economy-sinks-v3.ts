import {ECONOMY_V3, qualityBucket, v3Season} from './economy-v3';

/** Named, guaranteed outputs only. These recipes never grant Bells, attempts,
 * random affixes, or access to a random reward. All Star Thread is earned/bound. */
export const ECONOMY_SINKS = {
  successBp:10000,
  polish:{yarn:[4,8],starThread:[1,2]},
  decor:{yarn:4,starThread:2,patterns:['moon','dawn','rain','ember']},
  display:{yarn:3,starThread:1,maxLevel:3,baseSlots:1,slotsPerLevel:2},
} as const;
export type EconomySinkId = 'polish'|'decor'|'display';
export interface SinkGear {id:string;template:string;quality:number}
export interface SinkInventory {gear:readonly SinkGear[];styles:readonly string[]}
export interface EconomySinkQuote {
  id:EconomySinkId;name:string;benefit:string;yarn:number;starThread:number;successBp:number;
  key:string;style?:string;item?:SinkGear;quality?:number;level?:number;slots?:number;
}
export function displayLevel(styles:readonly string[]) {
  return Math.min(ECONOMY_SINKS.display.maxLevel,Math.max(0,...styles.map(s=>/^display:[1-3]$/.test(s)?Number(s.split(':')[1]):0)));
}
export function displaySlots(styles:readonly string[]) {
  return ECONOMY_SINKS.display.baseSlots+displayLevel(styles)*ECONOMY_SINKS.display.slotsPerLevel;
}
export function decorPattern(season:number) {
  if(!Number.isSafeInteger(season)||season<1)throw new Error('Invalid season.');
  return ECONOMY_SINKS.decor.patterns[(season-1)%ECONOMY_SINKS.decor.patterns.length]!;
}
export function latestDecor(styles:readonly string[]) {
  const season=Math.max(0,...styles.map(s=>/^decor:[1-9][0-9]*$/.test(s)?Number(s.split(':')[1]):0));
  return season?decorPattern(season):undefined;
}
export function economySinkQuote(id:EconomySinkId,inventory:SinkInventory,instance?:string,now=Date.now()):EconomySinkQuote {
  const base={id,successBp:ECONOMY_SINKS.successBp};
  if(id==='polish') {
    const item=inventory.gear.find(g=>g.id===instance);if(!item)throw new Error('Choose owned gear.');
    const current=ECONOMY_V3.quality.findIndex(q=>q.name===qualityBucket(item.quality).name);
    const target=ECONOMY_V3.quality[current+1];if(!target)throw new Error('Already Perfect.');
    return {...base,name:'Quality polish',benefit:`Guaranteed ${target.name} quality`,key:`polish:${item.id}`,item:{...item},quality:target.floorBp,yarn:ECONOMY_SINKS.polish.yarn[current]!,starThread:ECONOMY_SINKS.polish.starThread[current]!};
  }
  if(id==='decor') {
    const season=v3Season(now).number,style=`decor:${season}`;if(inventory.styles.includes(style))throw new Error('Already owned.');
    return {...base,name:'Season decor',benefit:`Permanent ${decorPattern(season)} café scene`,key:style,style,yarn:ECONOMY_SINKS.decor.yarn,starThread:ECONOMY_SINKS.decor.starThread};
  }
  if(id==='display') {
    const level=displayLevel(inventory.styles)+1;if(level>ECONOMY_SINKS.display.maxLevel)throw new Error('Showcase complete.');
    const style=`display:${level}`,slots=ECONOMY_SINKS.display.baseSlots+level*ECONOMY_SINKS.display.slotsPerLevel;
    return {...base,name:'Café showcase',benefit:`Permanent ${slots} display slots`,key:style,style,level,slots,yarn:ECONOMY_SINKS.display.yarn*level,starThread:ECONOMY_SINKS.display.starThread*level};
  }
  throw new Error('Unknown recipe.');
}

/** Search and ledger consumers share these definitions by reference. */
export const ECONOMY_SINK_IDS = ['polish','decor','display'] as const;
