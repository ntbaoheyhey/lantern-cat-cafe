import {it,expect} from 'vitest';
import {impactLabels} from './impact-labels';
import {createEffectFixture} from './fixtures';
it('shows one exact total per target for a three-hit ultimate without mutating events',()=>{
 const {events}=createEffectFixture('lanternstorm'),copy=structuredClone(events);
 const damage=events.filter(e=>e.type==='damage');
 for(const id of new Set(damage.flatMap(e=>e.targetIds))){
  const hits=damage.filter(e=>e.targetIds.includes(id)),labels=impactLabels(damage,id);
  expect(labels).toHaveLength(1);expect(labels[0]!.amount).toBe(hits.reduce((sum,e)=>sum+e.amount,0));
  expect(labels[0]!.hits).toBe(3);expect(!!labels[0]!.critical).toBe(hits.some(e=>e.critical));
 }
 expect(events).toEqual(copy);
});
it('keeps healing, shield gain and shield expiry separate',()=>{
 const e=createEffectFixture('milkFlask').events.find(e=>e.type==='heal')!;
 const labels=impactLabels([e,{...e,type:'shield',amount:20},{...e,type:'shield',amount:10},{...e,type:'shield',amount:-30}],e.targetIds[0]!);
 expect(labels.map(e=>[e.type,e.amount])).toEqual([['heal',e.amount],['shield',30],['shield',-30]]);
});
