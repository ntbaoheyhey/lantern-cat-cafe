import {expect,it} from 'vitest';
import {configureSequence,sequenceAt,SEQUENCES,type CinematicMode} from './sequence';
import {pilotFixture} from '../vfx-layered/fixture';
import {battleControls,prepareBattleSequence,skipPlate} from './controls';
import type {DepthModel} from '../depth/model';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';

it.each(['full','short','off'] as CinematicMode[])('keeps resolved events and exact contact in %s',mode=>{
 for(const id of SEQUENCES.keys()){
  const original=pilotFixture(id).plan,events=JSON.stringify(original.events),plan=configureSequence(original,mode),impact=plan.beats[2]!.start;
  expect(plan.sequence!.impact).toBe(impact);expect(JSON.stringify(plan.events)).toBe(events);expect(plan.events).toBe(original.events);
  expect(sequenceAt(plan,impact-1)!.flash).toBe(0);expect(sequenceAt(plan,impact)!.flash).toBe(.35);
  expect(sequenceAt(plan,impact,true)!.flash).toBe(0);expect(sequenceAt(plan,impact,true)!.shake).toBe(sequenceAt(plan,impact)!.shake/2);
  expect(sequenceAt(plan,impact)!.plate).toBe(false);
 }
});
it('shortens only after three full presentations and skips without a second resolution',()=>{
 const m={state:R.setFormationC2(R.setGameplayA6(R.createDepthAccount(71),true)),animationAt:1000,notify:()=>{}} as unknown as DepthModel;
 const original=pilotFixture('soot-4').plan;
 for(let i=0;i<3;i++)expect(prepareBattleSequence(m,original)).toHaveProperty('cinematicMode','full');
 expect(prepareBattleSequence(m,original)).toHaveProperty('cinematicMode','short');
 battleControls(m).seen.clear();m.plan=prepareBattleSequence(m,original);const events=m.plan.events;
 expect(skipPlate(m)).toBe(true);expect(m.animationAt).toBe(3200);expect(m.plan.events).toBe(events);expect(skipPlate(m)).toBe(false);
});
it('C2 seeded combat remains byte-identical across presentation modes',()=>{
 const state=R.setFormationC2(R.setGameplayA6(R.createDepthAccount(71),true));
 const baseline=R.createBattle({seed:71,chapter:1,gameplayV4:true,skillsV5:true,gameplayA6:true,formationC2:true,cats:R.battleCats(state),enemies:['yarn-giant','binding-thread','binding-thread']});
 const expected=structuredClone(baseline);R.playBattle(expected,'auto');
 for(const mode of ['full','short','off'] as CinematicMode[]){const battle=structuredClone(baseline);R.playBattle(battle,'auto');for(const id of SEQUENCES.keys())configureSequence(pilotFixture(id).plan,mode);expect(JSON.stringify(battle)).toBe(JSON.stringify(expected));}
});
