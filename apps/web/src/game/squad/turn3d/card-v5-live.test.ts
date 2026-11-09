import {describe,it,expect} from 'vitest';
import {createCardActionPlan} from '../../cardrpg/depth/card-action-plan';
import {v5SourceForPlan,applyV5Presentation} from './card-v5-events';
import {statusPresentation} from './card-status-beats';
import {presentationEventV4} from './card-v4-presentation';
import type {BattleEvent} from '@taskbar-hero/game-rules/src/cardrpg/depth/contract';

describe('live v2 presentation boundary',()=>{
 it('matches the whole action even when an earlier heal shares its numbers and the label is Clutch heal',()=>{
  const log=[{kind:'heal',actorId:'cat',targetId:'ally',amount:42,text:'Old heal'},{kind:'status',actorId:'cat',targetId:'ally',amount:1,text:'Old buff'},{kind:'heal',actorId:'cat',targetId:'ally',amount:42,text:'New heal'},{kind:'status',actorId:'cat',targetId:'ally',amount:1,text:'Warm'}] as BattleEvent[];
  const plan=createCardActionPlan([
   {version:3,seq:1,turn:1,round:1,actionId:4,beat:2,type:'heal',actorId:'cat',skillId:'cinnamon-2',targetIds:['ally'],amount:42,note:'Clutch heal'},
   {version:3,seq:2,turn:1,round:1,actionId:4,beat:2,type:'status_apply',actorId:'cat',skillId:'cinnamon-2',targetIds:['ally'],amount:1,note:'Warm'},
  ],'cinnamon-2');
  const event={version:2,sequence:8,actionId:4,round:1,stage:'action',logIndex:4,kind:'multi-hit',skillId:'cinnamon-2',shape:'ally-splash',targets:['ally','cat']};
  const before={actors:[{id:'ally',statuses:[{id:'bitter',stacks:1,remaining:1}]}]};
  const battle={log,actors:[{id:'ally',statuses:[]}],v4:{version:1,events:[event]}};
  const serialized=JSON.stringify({plan,battle,before});const source=v5SourceForPlan(plan,battle,before);
  expect(source?.logStart).toBe(2);expect(source?.events).toEqual([event]);
  const view=applyV5Presentation(plan,statusPresentation(plan,log),source);
  expect(view.landings?.map(l=>l.scale)).toEqual([1,.6]);expect(view.bitterTargets?.has('ally')).toBe(true);
  expect(view.beats.some(b=>b.kind==='expire'&&b.statusId==='bitter')).toBe(true);
  expect(JSON.stringify({plan,battle,before})).toBe(serialized);
 });
 it('accepts published boss envelopes and rejects incomplete or future envelopes',()=>{
  const e={version:2,sequence:4,round:3,actionId:7,stage:'action',logIndex:22,kind:'boss-phase',text:'Unravelling',bossId:'yarn-giant',from:1,to:2,threshold:.5};
  expect(presentationEventV4(e)).toBe(true);
  expect(presentationEventV4({...e,version:99})).toBe(false);
  expect(presentationEventV4({...e,logIndex:undefined})).toBe(false);
  expect(presentationEventV4({...e,stage:'unrecognised'})).toBe(false);
 });
});
