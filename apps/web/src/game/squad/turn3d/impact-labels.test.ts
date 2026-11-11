import {it,expect} from 'vitest';
import {impactLabels,visibleImpactLabel,fizzleLabel} from './impact-labels';
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
it('shows one failed-outcome word per reason and target without changing raw events',()=>{
 const event=createEffectFixture('milkFlask').events.find(e=>e.type==='heal')!,id=event.targetIds[0]!;
 const events=[{...event,type:'fizzle' as const,amount:0,note:'Button Guard resisted Burn'},
  {...event,type:'fizzle' as const,amount:0,note:'Button Guard resisted Crumb trail'},
  {...event,type:'fizzle' as const,amount:0,note:'Button Guard recovered control resistance'},
  {...event,type:'fizzle' as const,amount:0,note:'No valid target'},
  {...event,type:'fizzle' as const,amount:0,targetIds:['another'],note:'Another resisted Burn'}];
 const before=structuredClone(events),labels=impactLabels(events,id).filter(visibleImpactLabel);
 expect(labels.map(e=>e.note)).toEqual(['Resisted','Immune','No effect']);
 expect(labels.map(e=>e.amount)).toEqual([0,0,0]);
 expect(impactLabels(events,'another').filter(visibleImpactLabel).map(e=>e.note)).toEqual(['Resisted']);
 expect(events).toEqual(before);
 expect(visibleImpactLabel({...event,type:'damage',amount:0})).toBe(false);
 expect(fizzleLabel({note:'Effect resisted.'})).toBe('Resisted');
 expect(fizzleLabel({note:'Control resisted during recovery.'})).toBe('Immune');
});
