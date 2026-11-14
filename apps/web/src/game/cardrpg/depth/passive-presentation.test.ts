// Legacy passive triggers remain archived; F6 live kits reject their retired actions.
import { expect, it } from 'vitest';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import { snapshotBattle, splitPresentation } from './battle-presentation';
import { passivePresentation } from './passive-presentation';

function cast(owner:string, skillId:string, prepare?:(battle:R.Battle)=>void) {
  const account=R.setFormationC2(R.setGameplayA6(R.createDepthAccount(71),false));
  account.skills[owner]=R.CAT_BY_ID[owner]!.skills.slice(0,3).map(s=>s.id);
  const battle=R.createBattle({seed:71,chapter:1,formationC2:false,gameplayA6:false,gameplayV4:true,skillsV5:true,cats:R.battleCats(account),enemies:['yarn-giant']});
  battle.initial.formationC2=true;
  const actor=battle.actors.find(a=>a.catalogId===owner)!;
  battle.actors.filter(a=>a.side==='party').forEach(a=>{a.hp=Math.floor(a.maxHp*.6);a.shield=0;});
  battle.actors.find(a=>a.catalogId==='panko')!.hp=50;
  actor.turns=3;actor.charge=100;battle.queue=[actor.id,...battle.queue.filter(id=>id!==actor.id)];battle.v4!.committed=true;
  prepare?.(battle);
  const before=snapshotBattle(battle),choice=R.legalChoices(battle).find(c=>c.skillId===skillId)!;
  expect(choice).toBeTruthy();expect(R.act(battle,choice)).toBe(true);
  const after=splitPresentation(before,battle,skillId).impact;
  const untouched=JSON.stringify([before,after]);
  const cues=passivePresentation(before,after);
  expect(JSON.stringify([before,after])).toBe(untouched);
  return {before,after,cues};
}

it('places the first-heal cleanse on the actual patient, and does not retrigger later',()=>{
  // Row healing resolves in formation order, so the first patient is Mochi
  // even though Panko has lower HP. Follow the actual event, not a heuristic.
  const {after,cues}=cast('clover','clover-2',b=>{b.actors.find(a=>a.catalogId==='mochi')!.statuses.push({id:'bitter',stacks:1,remaining:2,source:'enemy',appliedRound:b.round});});
  expect(cues.presentationCueTargets).toEqual({'clover-passive':'mochi'});
  expect(after.actors.find(a=>a.id==='mochi')!.statuses.some(s=>s.id==='bitter')).toBe(false);
  expect(passivePresentation(after,after)).toEqual({});
});
it('shows Mochi shelter only when the ally-shield passive adds self shield',()=>{
  expect(cast('mochi','mochi-2').cues.presentationCueTargets).toEqual({'mochi-passive':'mochi'});
  expect(cast('mochi','mochi-1').cues.presentationCues).toBeUndefined();
  expect(cast('mochi','mochi-2',b=>{const a=b.actors.find(a=>a.id==='mochi')!;a.shield=Math.floor(a.maxHp*.6);}).cues.presentationCues).toBeUndefined();
});
it('requires a real Soot detonation and presents Panko riposte on Defend',()=>{
  expect(cast('soot','soot-3').cues.presentationCues).toBeUndefined();
  expect(cast('soot','soot-3',b=>b.actors.find(a=>a.side==='enemy')!.statuses.push({id:'crumb',stacks:2,remaining:3,source:'soot',appliedRound:b.round})).cues.presentationCueTargets).toEqual({'soot-passive':'soot'});
  expect(cast('panko','defend').cues.presentationCueTargets).toEqual({'panko-passive':'panko'});
});
