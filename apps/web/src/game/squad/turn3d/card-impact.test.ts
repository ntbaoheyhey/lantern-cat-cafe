import { expect, it } from 'vitest';
import { createCardActionPlan } from '../../cardrpg/depth/card-action-plan';
import { sampleActionPlan, createActionPlan } from './effects';
import { cardImpactHold } from './card-impact';
import { CARD_EFFECT_RECIPES } from './card-effect-data';
import type { TurnEvent } from '@taskbar-hero/game-rules/src/squad/turn/types';
const start:TurnEvent={version:3,seq:0,turn:1,round:1,actionId:1,beat:0,type:'action_start',actorId:'cat',skillId:'guardAttack',targetIds:['enemy'],amount:0};
it('holds each authored card impact without changing the action duration or reduced motion clock',()=>{
 const ids=Object.keys(CARD_EFFECT_RECIPES).filter(id=>/^[a-z]+-[1-4]$/.test(id)||id.startsWith('enemy:'));
 expect(ids).toHaveLength(74);
 for(const id of ids){
  const hold=cardImpactHold(id);expect(hold,id).toBeDefined();expect(hold,id).toBeGreaterThanOrEqual(0);expect(hold,id).toBeLessThanOrEqual(110);
  const plan=createCardActionPlan([start,{...start,seq:1,type:'damage',amount:40}],id);
  const impact=plan.beats.find(b=>b.kind==='impact')!,duration=plan.duration;
  const effective=Math.min(impact.duration*.8,hold!);
  if(effective>0){
   const elapsed=impact.start+effective*.75;
   expect(sampleActionPlan(plan,elapsed).progress,id).toBe(0);
   expect(sampleActionPlan(plan,elapsed,true).progress,id).toBeGreaterThan(0);
   expect(sampleActionPlan(plan,impact.start+effective+1).progress,id).toBeGreaterThan(0);
  }
  expect(plan.duration).toBe(duration);
 }
});
it('retains the legacy hit-stop path outside card presentation and ignores unrelated IDs',()=>{
 expect(cardImpactHold()).toBeUndefined();expect(cardImpactHold('unknown')).toBeUndefined();
 const plan=createActionPlan([start]),impact=plan.beats[2]!;
 expect(sampleActionPlan(plan,impact.start+20).progress).toBe(0);
 expect(sampleActionPlan(plan,impact.start+70).progress).toBeGreaterThan(0);
});
