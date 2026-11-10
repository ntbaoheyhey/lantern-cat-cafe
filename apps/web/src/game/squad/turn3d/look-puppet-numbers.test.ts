import {expect,it} from 'vitest';
import {puppetNumberRows} from './look-puppet-numbers';
import {createEffectFixture} from './fixtures';
import type {EffectPlan} from './effects';
import type {StatusPresentation} from './card-status-beats';

it('keeps exact multi-hit totals and criticals while separating a damage-over-time tick',()=>{
  const {events}=createEffectFixture('lanternstorm');
  const hit=events.find(e=>e.type==='damage')!,target=hit.targetIds[0]!;
  const plan={targetIds:[target],events:[{...hit,seq:1,amount:20,critical:false},{...hit,seq:2,amount:30,critical:true},{...hit,seq:3,amount:7,critical:false}]} as EffectPlan;
  const copy=structuredClone(plan);
  const presentation:StatusPresentation={offsets:new Map(),beats:[],bursts:[],kinds:new Map([[3,'dot']])};
  const rows=puppetNumberRows(plan,presentation);
  expect(rows[0]!.labels.map(l=>[l.text,l.amount])).toEqual([['−50!',50],['−7',7]]);
  expect(rows[0]!.labels[0]!.critical).toBe(true);
  expect(plan).toEqual(copy);
});

it('retains heal penalty, shield gain, status name and KO without drawing shield expiry',()=>{
  const event=createEffectFixture('milkFlask').events.find(e=>e.type==='heal')!,id=event.targetIds[0]!;
  const plan={targetIds:[id],events:[{...event,type:'heal',amount:12},{...event,type:'shield',amount:40},{...event,type:'shield',amount:-40},{...event,type:'status_apply',amount:1,note:'Cozy'},{...event,type:'death',amount:0}]} as EffectPlan;
  const presentation:StatusPresentation={offsets:new Map(),beats:[],bursts:[],kinds:new Map(),bitterTargets:new Set([id])};
  expect(puppetNumberRows(plan,presentation)[0]!.labels.map(l=>l.text)).toEqual(['+12 −50%','◇40','Warm','KO']);
  expect(puppetNumberRows({...plan,targetIds:['absent']})).toEqual([]);
});
