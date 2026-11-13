import {describe,expect,it} from 'vitest';
import {ECONOMY_V3} from './economy-v3';
import {ECONOMY_SINKS,ECONOMY_SINK_IDS,economySinkQuote,displaySlots,latestDecor} from './economy-sinks-v3';
const inventory={gear:[{id:'earned',template:'hearthloom-weapon-epic',quality:1200}],styles:[] as string[]};
describe('guaranteed Star Thread sinks',()=>{
  it('polishes only an owned item by exactly one published quality tier',()=>{
    const q=economySinkQuote('polish',inventory,'earned');
    expect(q.quality).toBe(ECONOMY_V3.quality[1]!.floorBp);
    expect(q.yarn).toBe(ECONOMY_SINKS.polish.yarn[0]);expect(q.starThread).toBe(ECONOMY_SINKS.polish.starThread[0]);
    expect(inventory.gear[0]!.quality).toBe(1200);
    expect(()=>economySinkQuote('polish',inventory,'invented')).toThrow('owned');
    expect(()=>economySinkQuote('polish',{...inventory,gear:[{...inventory.gear[0]!,quality:8500}]},'earned')).toThrow('Perfect');
  });
  it('retains a permanent decor unlock through a season rollover without repeating it',()=>{
    const first=economySinkQuote('decor',inventory,undefined,ECONOMY_V3.season.epoch),owned={...inventory,styles:[first.style!]};
    expect(latestDecor(owned.styles)).toBe('moon');
    expect(()=>economySinkQuote('decor',owned,undefined,ECONOMY_V3.season.epoch)).toThrow('owned');
    const next=economySinkQuote('decor',owned,undefined,ECONOMY_V3.season.epoch+ECONOMY_V3.season.days*86400000);
    expect(next.style).not.toBe(first.style);expect(latestDecor([...owned.styles,next.style!])).toBe('dawn');
  });
  it('adds a finite, useful set of showcase slots with published rising costs',()=>{
    let owned={...inventory,styles:[] as string[]};expect(displaySlots(owned.styles)).toBe(1);
    for(let n=1;n<=ECONOMY_SINKS.display.maxLevel;n++){
      const q=economySinkQuote('display',owned);expect(q.yarn).toBe(n*ECONOMY_SINKS.display.yarn);
      expect(q.starThread).toBe(ECONOMY_SINKS.display.starThread);owned.styles.push(q.style!);expect(displaySlots(owned.styles)).toBe(q.slots);
    }
    expect(()=>economySinkQuote('display',owned)).toThrow('complete');
  });
  it('never lets a transferable payment buy a roll or a random-payment currency',()=>{
    for(const id of ECONOMY_SINK_IDS){
      const q=economySinkQuote(id,inventory,'earned',ECONOMY_V3.season.epoch);
      expect(q.successBp).toBe(10000);expect(q.yarn).toBeGreaterThan(0);expect(q.starThread).toBeGreaterThan(0);
      expect(Object.keys(q).filter(k=>['bells','stamps','rolls','seed'].includes(k))).toEqual([]);
      expect(economySinkQuote(id,inventory,'earned',ECONOMY_V3.season.epoch)).toEqual(q);
    }
  });
});
