import { describe, expect, it } from 'vitest';
import { createCardActionPlan } from '../../cardrpg/depth/card-action-plan';
import { applyV5Presentation, v5SourceForPlan } from './card-v5-events';
import { statusImpactLabels, type StatusPresentation } from './card-status-beats';

const event = { version:2, kind:'status-applied', sequence:1, actionId:1, logIndex:1, stage:'action', round:1, sourceId:'cat', targetId:'foe', statusId:'scent', stacks:1 };
function sample(kind:string, statuses:string[], text='hit', skillsV5=true) {
  const log = [{kind:'status',actorId:'cat',targetId:'foe',amount:1,text:'Mark'},
    {kind,actorId:'cat',targetId:'foe',amount:24,text}];
  const plan = createCardActionPlan([{version:3,seq:1,turn:1,round:1,actionId:2,beat:2,
    type:kind==='heal'?'heal':kind==='shield'?'shield':'damage',actorId:'cat',skillId:'mochi-1',targetIds:['foe'],amount:24,note:text}], 'mochi-1');
  const before = {actors:[{id:'foe',statuses:statuses.map(id=>({id,stacks:1,remaining:2}))}]};
  const battle = {initial:{skillsV5},log,actors:before.actors,v4:{version:1,events:[event]}};
  const legacy:StatusPresentation={offsets:new Map(),beats:[],kinds:new Map(),bursts:[]};
  return {plan,before,battle,legacy};
}
describe('non-periodic V5 status annotations',()=>{
  it('keeps Bitter on a plain heal with no current v2 cue and leaves the source exact',()=>{
    const s=sample('heal',['bitter']),before=JSON.stringify(s);
    const source=v5SourceForPlan(s.plan,s.battle,s.before);
    expect(source?.events).toEqual([]);
    const view=applyV5Presentation(s.plan,s.legacy,source);
    expect(view.beats.map(b=>[b.kind,b.statusId])).toEqual([['trigger','bitter']]);
    expect(statusImpactLabels(s.plan,'foe',view)[0]?.bitter).toBe(true);
    expect(JSON.stringify(s)).toBe(before);
    expect(view.beats.every(b=>b.at+b.duration<=s.plan.duration)).toBe(true);
  });
  it('pulses direct-hit modifiers from the pre-hit snapshot only',()=>{
    const s=sample('damage',['scent','brittle','cozy']);
    const view=applyV5Presentation(s.plan,s.legacy,v5SourceForPlan(s.plan,s.battle,s.before));
    expect(view.beats.filter(b=>b.kind==='trigger').map(b=>b.statusId)).toEqual(['scent','brittle','cozy']);
    const emptyBefore={actors:[{id:'foe',statuses:[]}]};
    expect(applyV5Presentation(s.plan,s.legacy,v5SourceForPlan(s.plan,s.battle,emptyBefore)).beats).toEqual([]);
  });
  it.each(['dot','reaction-damage','reflect','shared','detonate'])('does not advertise direct modifiers on %s',kind=>{
    const s=sample(kind,['scent','brittle','cozy']);
    expect(applyV5Presentation(s.plan,s.legacy,v5SourceForPlan(s.plan,s.battle,s.before)).beats).toEqual([]);
  });
  it('recognises the exact Daze suppression record preceding the mapped hit',()=>{
    const s=sample('damage',['drowsy']);
    s.battle.log.splice(1,0,{kind:'suppressed',actorId:'foe',targetId:'foe',amount:1,text:'Daze spent the next action'});
    s.plan.events[0]!.seq=2;s.plan.events[0]!.actionId=3;
    const view=applyV5Presentation(s.plan,s.legacy,v5SourceForPlan(s.plan,s.battle,s.before));
    expect(view.beats.some(b=>b.kind==='trigger'&&b.statusId==='drowsy')).toBe(true);
  });
  it('keeps OFF and unknown-version input on the legacy path',()=>{
    const s=sample('heal',['bitter'],'heal',false);
    expect(v5SourceForPlan(s.plan,s.battle,s.before)).toBeUndefined();
    s.battle.initial.skillsV5=true;s.battle.v4.events[0]!.version=99;
    expect(v5SourceForPlan(s.plan,s.battle,s.before)).toBeUndefined();
  });
});
