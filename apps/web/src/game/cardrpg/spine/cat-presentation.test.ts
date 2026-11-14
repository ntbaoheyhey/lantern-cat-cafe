import {describe,it,expect} from 'vitest';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import {DepthModel} from '../depth/model';
import {galleryFixture,GALLERY_ACTIONS} from '../depth/feel-lab';
import {paintedRecipe,paintedTargets,type PaintedRecipients} from './vfx-registry';
import {statusPresentation} from '../../squad/turn3d/card-status-beats';

function resolveCat(id:string,variant='ally'){
 const initial=galleryFixture(id,false,true).battle.initial,battle=R.createBattle(initial);
 const actor=battle.actors.find(a=>a.catalogId===id.split('-')[0])!;
 actor.skills=R.CAT_BY_ID[actor.catalogId]!.skills.map(skill=>skill.id);actor.charge=100;actor.turns=3;
 const patient=battle.actors.find(a=>a.side===actor.side&&a.id!==actor.id)!;
 actor.hp=Math.floor(actor.maxHp*(variant==='self'?.1:.8));patient.hp=Math.floor(patient.maxHp*.2);
 if(variant==='revive')patient.hp=0;
 const enemy=battle.actors.find(a=>a.side==='enemy')!;
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
  const {plan,actor,patient,enemy,recipients}=resolveCat('clover-1',variant);
  expect(recipients('damage')).toEqual([enemy.id]);expect(recipients('hostile')).toEqual([enemy.id]);
  expect(recipients('heal')).toEqual([variant==='self'?actor.id:patient.id]);
  expect(paintedRecipe('clover-1',plan)!.layers.find(layer=>layer.glyph==='sprout'&&layer.phase==='contact')).toMatchObject({anchor:'target',recipients:'heal',phase:'contact'});
 });
 it('keeps a shield separate from Mochi damage and Cinnamon drain separate from its Burn',()=>{
  const mochi=resolveCat('mochi-1'),cinnamon=resolveCat('cinnamon-1','self');
  expect(mochi.recipients('shield')).toEqual([mochi.actor.id]);expect(mochi.recipients('hostile')).toEqual([mochi.enemy.id]);
  expect(cinnamon.recipients('heal')).toEqual([cinnamon.actor.id]);expect(cinnamon.recipients('hostile')).toEqual([cinnamon.enemy.id]);
  expect(paintedRecipe('cinnamon-1',cinnamon.plan)!.layers.find(layer=>layer.glyph==='drop')).toMatchObject({recipients:'heal',anchor:'target'});
 });
 it.each(['ally','resist'])('keeps Marigold debuff contact visible without inventing damage (%s)',variant=>{
  const {plan,enemy,battle,recipients}=resolveCat('marigold-3',variant);
  expect(recipients('hostile')).toEqual([enemy.id]);expect(recipients('damage')).toEqual([]);expect(recipients('heal')).toEqual([]);
  expect(plan.events.some(event=>event.type==='status_expire')).toBe(true);
  expect(plan.events.some(event=>event.type===(variant==='resist'?'fizzle':'status_apply'))).toBe(true);
  const presentation=statusPresentation(plan,battle.log);
  expect(presentation.kinds.size).toBe(plan.events.length-1);
 });
 it.each(['revive','ally'])('keeps Cinnamon second serving on its resolved recipients (%s)',variant=>{
  const {plan,actor,patient,model,battle,recipients}=resolveCat('cinnamon-4',variant);
  expect(recipients('damage')).toEqual([]);
  expect(recipients('heal').sort()).toEqual((variant==='revive'?[patient.id]:battle.actors.filter(a=>a.side===actor.side).map(a=>a.id)).sort());
  const resolved=JSON.stringify(battle);model.finishMoment();expect(JSON.stringify(battle)).toBe(resolved);
  expect(paintedRecipe('cinnamon-4',plan)!.friendly).toBe(true);
 });
 it('ignores reflected damage, other casters and a same-side buff when routing hostile paint',()=>{
  const {plan,battle,actor,enemy,recipients}=resolveCat('clover-1');
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
