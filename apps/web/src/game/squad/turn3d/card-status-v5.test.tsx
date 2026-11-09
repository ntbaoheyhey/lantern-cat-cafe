import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import { STATUSES } from '@taskbar-hero/game-rules/src/cardrpg/depth/catalog';
import { snapshotBattle, splitPresentation, presentationEvents } from '../../cardrpg/depth/battle-presentation';
import { createCardActionPlan } from '../../cardrpg/depth/card-action-plan';
import { STATUS_IDENTITIES } from './card-status-data';
import { CARD_STATUS_LOOKS } from './card-status-looks';
import { StatusBadges } from './StatusBadges';
import { statusPresentation, statusImpactLabels } from './card-status-beats';

afterEach(cleanup);
describe('lookV2 status vocabulary',()=>{
  it('requires an original icon, display name and body/apply/tick/expiry cue for every rules status',()=>{
    expect(Object.keys(STATUS_IDENTITIES).sort()).toEqual([...new Set([...STATUSES.map(s=>s.id),'snag','bitter'])].sort());
    expect(Object.keys(CARD_STATUS_LOOKS).sort()).toEqual([...new Set([...STATUSES.map(s=>s.id),'snag','bitter'])].sort());
    expect(new Set(Object.values(STATUS_IDENTITIES).map(s=>s.path)).size).toBe(new Set([...STATUSES.map(s=>s.id),'snag','bitter']).size);
    for(const rule of STATUSES){
      expect(STATUS_IDENTITIES[rule.id].name.length).toBeGreaterThan(0);
      const look=CARD_STATUS_LOOKS[rule.id];
      for(const layer of [look.layer,look.apply,look.tick,look.expire]){
        expect(layer.opacity).toBeGreaterThanOrEqual(.6);expect(layer.opacity).toBeLessThanOrEqual(.8);
      }
    }
  });
  it('orders debuffs then buffs then signatures; caps visible icons at four and exposes current rule text on focus',()=>{
    const statuses=STATUSES.map(rule=>({id:rule.id,stacks:rule.cap,remaining:rule.duration,source:'s',appliedRound:1}));
    const {container}=render(<StatusBadges statuses={statuses} name="Mochi" />);
    expect(container.querySelectorAll('[data-status]')).toHaveLength(4);
    expect(container.querySelector('[data-status]')?.getAttribute('data-status')).toBe('scald');
    expect(screen.getByText('+12')).toBeTruthy();
    fireEvent.focus(container.querySelector('[data-status]')!);
    expect(screen.getByRole('tooltip').textContent).toContain(R.STATUS_BY_ID.scald.description);
    expect(screen.getByRole('tooltip').textContent).toContain('Stacks 5/5. 3 rounds remaining.');
    fireEvent.keyDown(container.querySelector('[data-status]')!,{key:'Escape'});
    expect(screen.queryByRole('tooltip')).toBeNull();
    fireEvent.focus(screen.getByText('+12'));
    expect(screen.getByRole('tooltip').textContent).toContain('Second sprout');
  });
});

describe('presentation-only resolved log beats',()=>{
  it('reads stored cafe subtitles while displaying the current keyword without changing the log',()=>{
    const state=R.createDepthAccount(17),battle=R.createBattle({seed:17,chapter:1,cats:R.battleCats(state),enemies:['button-guard']});
    const target=battle.actors.find(a=>a.side==='enemy')!;
    battle.log=[{round:1,actorId:'cat-biscuit',targetId:target.id,skillId:'biscuit-4',kind:'status',amount:1,text:'Brittle sugar'}];
    const plan=createCardActionPlan(presentationEvents(battle.log,battle,'biscuit-4'),'biscuit-4');
    const original=JSON.stringify({log:battle.log,plan});
    const view=statusPresentation(plan,battle.log);
    expect(view.beats.some(beat=>beat.statusId==='brittle'&&beat.kind==='apply')).toBe(true);
    expect(statusImpactLabels(plan,target.id,view).find(event=>event.type==='status_apply')?.note).toBe('Shred');
    expect(JSON.stringify({log:battle.log,plan})).toBe(original);
  });

  it.each([7,17,71,1808,20261108])('maps source logs, stacks and ordered targets without mutating seed %i',seed=>{
    const state=R.createDepthAccount(seed);
    const battle=R.createBattle({seed,chapter:1,cats:R.battleCats(state),enemies:['button-guard','sock-skipper']});
    let mapped=0,ticks=0,bursts=0,expectedBursts=0;
    while(!battle.result){
      const before=snapshotBattle(battle),actor=R.currentActor(battle)!;
      const choice=actor.side==='party'?R.chooseAction(battle,'auto'):undefined;
      if(choice)R.act(battle,choice);else R.enemyAct(battle);
      expectedBursts+=new Set(battle.log.slice(before.log.length).filter(e=>e.kind==='detonate'&&e.amount>0).map(e=>e.targetId)).size;
      const split=splitPresentation(before,battle,choice?.skillId??'enemy:button-guard');
      const plan=createCardActionPlan(split.events,choice?.skillId??'enemy:button-guard');
      const bytes=JSON.stringify(battle),planBytes=JSON.stringify(plan);
      for(const p of [plan,split.roundPlan].filter(x=>x!==null)){
        const visual=statusPresentation(p,battle.log);
        expect(visual.kinds.size).toBe(p.events.filter(e=>e.type!=='action_start').length);
        mapped+=visual.kinds.size;ticks+=visual.beats.filter(b=>b.kind==='tick').length;bursts+=visual.bursts.length;
        const offsets=[...visual.offsets.values()];
        for(let i=1;i<offsets.length;i++)expect(offsets[i]!-offsets[i-1]!).toBe(p.skillId==='round-status'?0:70);
        for(const id of visual.offsets.keys())statusImpactLabels(p,id,visual);
        for(const beat of visual.beats){expect(beat.at).toBeGreaterThanOrEqual(0);expect(beat.at).toBeLessThan(p.duration);}
      }
      expect(JSON.stringify(battle)).toBe(bytes);expect(JSON.stringify(plan)).toBe(planBytes);
    }
    expect(mapped).toBeGreaterThan(10);expect(ticks).toBeGreaterThan(0);expect(bursts).toBe(expectedBursts);
  });
  it('announces resolved multi-target detonation in log order for 500ms inside the existing action',()=>{
    const state=R.createDepthAccount(17),battle=R.createBattle({seed:17,chapter:1,cats:R.battleCats(state),enemies:['button-guard','sock-skipper','teacup-healer']});
    battle.log=battle.actors.filter(a=>a.side==='enemy').map(a=>({round:1,actorId:'cat-soot',targetId:a.id,skillId:'soot-4',kind:'detonate',amount:48,text:''}));
    const plan=createCardActionPlan(presentationEvents(battle.log,battle,'soot-4'),'soot-4'),before=JSON.stringify(plan);
    const visual=statusPresentation(plan,battle.log);
    expect(visual.bursts).toEqual(battle.log.map(e=>e.targetId));
    expect([...visual.offsets.values()]).toEqual([0,70,140]);
    for(const beat of visual.beats){expect(beat.duration).toBe(500);expect(beat.at+beat.duration).toBeLessThanOrEqual(plan.duration);}
    expect(JSON.stringify(plan)).toBe(before);
  });
  it('falls back without guessing a reaction for unmatched or future source data',()=>{
    const plan=createCardActionPlan([],'soot-3');
    expect(statusPresentation(plan,[]).beats).toEqual([]);
    expect(plan.duration).toBeGreaterThan(0);
  });
});
