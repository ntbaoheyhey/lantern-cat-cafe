import {expect,it} from 'vitest';
import {configureSequence,sequenceAt,SEQUENCES,type CinematicMode} from './sequence';
import {pilotFixture} from '../vfx-layered/fixture';
import {battleControls,prepareBattleSequence,skipPlate} from './controls';
import type {DepthModel} from '../depth/model';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
const liveIds=R.CATS.flatMap(c=>R.battleKitA6(c.id).map(s=>s.id));
it.each(['full','short','off'] as CinematicMode[])('keeps fixed timing and resolved events regardless of archived mode %s',mode=>{
 for(const id of [...liveIds,...R.ENEMIES.flatMap(e=>[`enemy:${e.id}`,`enemy:${e.id}:basic`])]){
  const original=pilotFixture(id).plan,events=JSON.stringify(original.events),plan=configureSequence(original,mode),impact=plan.beats[2]!.start;
  expect(plan.sequence!.impact).toBe(plan.ultimate?1100:350);expect(impact).toBe(plan.sequence!.impact);
  expect(plan.duration).toBe(plan.ultimate?2200:800);expect(plan.events).toBe(original.events);expect(JSON.stringify(plan.events)).toBe(events);
  for(let t=0;t<=plan.duration;t+=1000/30){const frame=sequenceAt(plan,t)!;
   expect(frame.camera).toMatchObject({zoom:1,x:0,y:0,tilt:0});expect(frame.plate).toBe(false);expect(frame.cutin).toBe(false);expect(frame.flash).toBe(0);
   expect(frame.shake).toBeLessThanOrEqual(4);if(!plan.ultimate||t<impact||t>=impact+120)expect(frame.shake).toBe(0);
   expect(sequenceAt(plan,t,true)!.shake).toBe(0);
  }
 }
});
it('exposes exactly one Basic and Ultimate per cat while preserving archived effect assets',()=>{
 const basics=new Set<string>();
 for(const cat of R.CATS){
  const skills=R.battleKitA6(cat.id);expect(skills.map(s=>s.id)).toEqual([`${cat.id}-1`,`${cat.id}-4`]);
  const plans=skills.map(s=>configureSequence(pilotFixture(s.id).plan));expect(plans.map(p=>p.sequence!.tier)).toEqual(['basic','ultimate']);
  basics.add(SEQUENCES.get(`${cat.id}-1`)!.sequence!.vfx.find(v=>v.type==='shader')!.source);
  for(const p of plans){expect(p.sequence!.damage.every(d=>d.t===p.sequence!.impact)).toBe(true);expect(p.sequence!.audio.some(a=>a.t===p.sequence!.impact)).toBe(true);}
  expect(SEQUENCES.has(`${cat.id}-2`)).toBe(true);expect(SEQUENCES.has(`${cat.id}-3`)).toBe(true);
 }
 expect(basics.size).toBe(4);
});
it('repeated ultimates keep the same beat and cannot skip a nonexistent plate',()=>{
 const m={state:R.setFormationC2(R.setGameplayA6(R.createDepthAccount(71),true)),animationAt:1000,notify:()=>{}} as unknown as DepthModel;
 const original=pilotFixture('soot-4').plan;
 for(let i=0;i<5;i++){m.plan=prepareBattleSequence(m,original);expect(m.plan).toMatchObject({duration:2200,cinematicMode:'off'});}
 expect(battleControls(m).seen.size).toBe(0);const events=m.plan!.events;
 expect(skipPlate(m)).toBe(false);expect(m.animationAt).toBe(1000);expect(m.plan!.events).toBe(events);
});
it('C2 seeded combat remains byte-identical across archived presentation preferences',()=>{
 const state=R.setFormationC2(R.setGameplayA6(R.createDepthAccount(71),true));
 const baseline=R.createBattle({seed:71,chapter:1,gameplayV4:true,skillsV5:true,gameplayA6:true,formationC2:true,cats:R.battleCats(state),enemies:['yarn-giant','binding-thread','binding-thread']});
 const expected=structuredClone(baseline);R.playBattle(expected,'auto');
 for(const mode of ['full','short','off'] as CinematicMode[]){const battle=structuredClone(baseline);R.playBattle(battle,'auto');for(const id of liveIds)configureSequence(pilotFixture(id).plan,mode);expect(battle).toEqual(expected);}
});
