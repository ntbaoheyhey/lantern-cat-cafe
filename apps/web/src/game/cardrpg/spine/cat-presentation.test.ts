import {describe,it,expect} from 'vitest';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import {DepthModel} from '../depth/model';
import {galleryFixture,GALLERY_ACTIONS} from '../depth/feel-lab';
import {paintedRecipe,paintedTargets,type PaintedRecipients} from './vfx-registry';
import {statusPresentation} from '../../squad/turn3d/card-status-beats';
import {presentationEvents} from '../depth/battle-presentation';
import {createCardActionPlan} from '../depth/card-action-plan';

function resolveCat(id:string,variant='ally'){
 const initial=galleryFixture(id,false,true).battle.initial,battle=R.createBattle(initial);
 const actor=battle.actors.find(a=>a.catalogId===id.split('-')[0])!;
 actor.skills=R.CAT_BY_ID[actor.catalogId]!.skills.map(skill=>skill.id);actor.charge=100;actor.turns=3;
 const patient=battle.actors.find(a=>a.side===actor.side&&a.id!==actor.id)!;
 actor.hp=Math.floor(actor.maxHp*(variant==='self'?.1:.8));patient.hp=Math.floor(patient.maxHp*.2);
 // Keep both candidates in the same priority row under the incoming healer rules.
 if(id==='clover-1'||id==='cinnamon-1'){actor.row='front';patient.row='front';}
 if(variant==='revive')patient.hp=0;
 const enemy=battle.actors.find(a=>a.side==='enemy')!;
 if(variant==='cleanse')R.applyStatus(battle,enemy,patient,'scald');
 if(variant==='resist')enemy.effectResist=100000;
 battle.queue=[actor.id,...battle.queue.filter(id=>id!==actor.id)];battle.v4!.committed=true;
 const choice=R.legalChoices(battle).find(choice=>choice.skillId===id)!;
 expect(choice).toBeDefined();
 const model=new DepthModel(true);model.tutorialBattle=battle;model.sceneReady=true;model.sceneStarted=true;model.watching=true;model.screen='map';model.act(choice);
 const plan=model.plan!;
 const recipients=(kind:PaintedRecipients)=>{const ids:string[]=[];paintedTargets(plan,kind,battle.actors,ids);return ids;};
 return{battle,actor,patient,enemy,model,plan,recipients};
}

describe('cat outcome presentation from current combat rules',()=>{
 it.each(['ally','self'])('routes Clover recovery to the actual weakest %s',variant=>{
  const {plan,actor,patient,recipients}=resolveCat('clover-1',variant);
  expect(recipients('heal')).toEqual([variant==='self'?actor.id:patient.id]);
  expect(paintedRecipe('clover-1',plan)!.layers.find(layer=>layer.glyph==='sprout'&&layer.phase==='contact')).toMatchObject({anchor:'target',recipients:'heal',phase:'contact'});
 });
 it('keeps Mochi shielding and Cinnamon recovery on their actual allied recipients',()=>{
  const mochi=resolveCat('mochi-1'),cinnamon=resolveCat('cinnamon-1','self');
  expect(mochi.recipients('shield')).toEqual([mochi.actor.id]);expect(mochi.recipients('hostile')).toEqual([mochi.enemy.id]);
  expect(cinnamon.recipients('heal')).toEqual([cinnamon.actor.id]);
  expect(paintedRecipe('cinnamon-1',cinnamon.plan)!.layers.find(layer=>layer.glyph==='drop')).toMatchObject({recipients:'heal',anchor:'target'});
 });
 it.each(['ally','cleanse'])('keeps Marigold support on allies without hostile paint (%s)',variant=>{
  const {plan,actor,patient,battle,recipients}=resolveCat('marigold-4',variant);
  expect(recipients('hostile')).toEqual([]);expect(recipients('damage')).toEqual([]);
  expect(recipients('heal').sort()).toEqual(battle.actors.filter(a=>a.side===actor.side).map(a=>a.id).sort());
  if(variant==='cleanse')expect(plan.events.some(event=>event.type==='status_expire'&&event.targetIds.includes(patient.id))).toBe(true);
 });
 it.each([false,true])('routes attacker status-only contact without inventing damage (resisted=%s)',resisted=>{
  const battle=R.createBattle(galleryFixture('soot-1').battle.initial);
  const actor=battle.actors.find(a=>a.catalogId==='soot')!,enemy=battle.actors.find(a=>a.side==='enemy')!;
  R.applyStatus(battle,enemy,enemy,'cozy');battle.log.length=0;
  R.dispel(battle,actor,enemy,'buff');
  if(resisted)enemy.effectResist=100000;
  R.applyStatus(battle,actor,enemy,'scald');
  const plan=createCardActionPlan(presentationEvents(battle.log,battle,'soot-1'),'soot-1'),targets:string[]=[];
  paintedTargets(plan,'hostile',battle.actors,targets);expect(targets).toEqual([enemy.id]);
  paintedTargets(plan,'damage',battle.actors,targets);expect(targets).toEqual([]);
  paintedTargets(plan,'heal',battle.actors,targets);expect(targets).toEqual([]);
  expect(plan.events.some(event=>event.type==='status_expire')).toBe(true);
  expect(plan.events.some(event=>event.type===(resisted?'fizzle':'status_apply'))).toBe(true);
  expect(statusPresentation(plan,battle.log).kinds.size).toBe(plan.events.length);
 });
 it.each(['revive','ally'])('keeps Cinnamon second serving on its resolved recipients (%s)',variant=>{
  const {plan,actor,patient,model,battle,recipients}=resolveCat('cinnamon-4',variant);
  expect(recipients('damage')).toEqual([]);
  expect(recipients('heal').sort()).toEqual((variant==='revive'?[patient.id]:battle.actors.filter(a=>a.side===actor.side).map(a=>a.id)).sort());
  const resolved=JSON.stringify(battle);model.finishMoment();expect(JSON.stringify(battle)).toBe(resolved);
  expect(paintedRecipe('cinnamon-4',plan)!.friendly).toBe(true);
 });
 it('ignores reflected damage, other casters and a same-side buff when routing hostile paint',()=>{
  const {plan,battle,actor,enemy,recipients}=resolveCat('soot-1');
  const damage=plan.events.find(event=>event.type==='damage')!;
  plan.events.push({...damage,actorId:enemy.id,targetIds:[actor.id]},{...damage,type:'status_apply',targetIds:[actor.id]}, {...damage,actorId:'other',targetIds:[actor.id]});
  expect(recipients('hostile')).toEqual([enemy.id]);expect(recipients('damage')).toEqual([enemy.id]);
  const targets=['stale'];paintedTargets(plan,'hostile',[],targets);expect(targets).toEqual([]);
  expect(battle.actors.some(a=>a.id===enemy.id)).toBe(true);
 });
 it('previews the two-skill A6 kit and preserves retired V5 art outside the live gallery',()=>{
  for(const cat of R.CATS)for(const skill of cat.skills){
   const retired=!R.battleKitA6(cat.id).some(current=>current.id===skill.id),{battle,plan}=galleryFixture(skill.id,false,true);
   expect(GALLERY_ACTIONS.some(action=>action.id===skill.id)).toBe(!retired);
   if(retired)expect(()=>galleryFixture(skill.id)).toThrow('Unknown gallery action');
   expect(battle.initial).toMatchObject({gameplayV4:true,skillsV5:true});
   expect(!!battle.initial.gameplayA6).toBe(!retired);
   expect(battle.choices).toHaveLength(1);expect(battle.choices[0]!.skillId).toBe(skill.id);
   expect(plan.events.slice(1).every(event=>battle.log.some(raw=>raw.actorId===event.actorId&&event.targetIds.includes(raw.targetId)&&raw.amount===event.amount))).toBe(true);
  }
 });
});
