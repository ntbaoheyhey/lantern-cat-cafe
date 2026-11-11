import {describe,it,expect} from 'vitest';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import {DepthModel} from '../depth/model';
import {chargeEvent} from '../depth/card-action-plan';
import {paintedRecipe,paintedTargets} from './vfx-registry';
import {puppetNumberRows} from '../../squad/turn3d/look-puppet-numbers';
import {galleryFixture} from '../depth/feel-lab';

function resolveRam(charged=false,rage=false,dazed=false){
 const account=R.setGameplayA6(R.setSkillsV5(R.setGameplayV4(R.createDepthAccount(71),true),true),true);
 const battle=R.createBattle({seed:71,chapter:1,gameplayV4:true,skillsV5:true,gameplayA6:true,cats:R.battleCats(account),enemies:['spool-ram','binding-thread']});
 const actor=battle.actors.find(a=>a.catalogId==='spool-ram')!,intent=battle.intents.find(i=>i.actorId===actor.id)!;
 battle.actors.find(a=>a.catalogId==='soot')!.row='front';
 actor.turns=2;actor.bonuses.v5Charge=Number(charged);actor.charge=rage?100:0;intent.signature=charged;
 if(dazed)actor.statuses.push({id:'drowsy',stacks:1,remaining:2,source:'mochi',appliedRound:1});
 battle.queue=[actor.id,...battle.queue.filter(id=>id!==actor.id)];battle.v4!.committed=true;
 const model=new DepthModel(true);model.tutorialBattle=battle;model.sceneReady=true;model.sceneStarted=true;model.watching=true;model.screen='map';model.act();
 return{battle,actor,plan:model.plan!,model};
}

describe('actual Spool Ram preparation and damage presentation',()=>{
 it('lets the gallery preview real preparation separately from a strike',()=>{
  for(const id of ['enemy:spool-ram:basic','enemy:spool-ram']){
   const preview=galleryFixture(id,true),strike=galleryFixture(id);
   expect(chargeEvent(preview.plan)).toBeDefined();expect(preview.plan.targetIds).toEqual([preview.plan.actorId]);
   expect(preview.plan.events.some(e=>e.type==='damage')).toBe(false);
   expect(strike.plan.events.some(e=>e.type==='damage')).toBe(true);
   expect(chargeEvent(strike.plan)).toBeUndefined();
  }
 });
 it.each([false,true])('keeps charge visible and on the caster with full rage=%s',rage=>{
  const {plan,actor,battle,model}=resolveRam(false,rage);
  expect(plan.presentationId).toBe(`enemy:spool-ram${rage?'':':basic'}`);
  expect(chargeEvent(plan)?.targetIds).toEqual([actor.id]);
  expect(plan.name).toBe('Charging a row strike');
  expect(plan.targetIds).toEqual([actor.id]);
  expect(plan.events.some(e=>e.type==='damage')).toBe(false);
  expect(puppetNumberRows(plan)).toEqual([]);
  const recipe=paintedRecipe(plan.presentationId!,plan)!;
  expect(recipe.friendly).toBe(true);expect(recipe.overrideKey).toBe('');
  expect(recipe.layers.every(layer=>layer.anchor==='caster')).toBe(true);
  expect(recipe.layers.some(layer=>layer.phase==='contact')).toBe(true);
  expect(paintedRecipe(plan.presentationId!,plan)).toBe(recipe);
  const resolved=JSON.stringify(battle);model.finishMoment();expect(JSON.stringify(battle)).toBe(resolved);
  expect(actor.bonuses.v5Charge).toBe(1);
 });
 it('shows the next charged action as damage to the actual front row',()=>{
  const {plan,actor,battle}=resolveRam(true);
  expect(chargeEvent(plan)).toBeUndefined();expect(actor.bonuses.v5Charge).toBe(0);
  const recipe=paintedRecipe(plan.presentationId!,plan)!,targets:string[]=[];paintedTargets(plan,'hostile',battle.actors,targets);
  expect(recipe.friendly).toBe(false);expect(recipe.overrideKey).toBe('enemy-spool-ram');
  expect(targets.sort()).toEqual(['mochi','soot']);
  expect(puppetNumberRows(plan).every(row=>row.labels.some(label=>label.type==='damage'))).toBe(true);
 });
 it('keeps Daze cancellation a softened hit, without presenting another charge',()=>{
  const {plan,actor}=resolveRam(true,false,true);
  expect(chargeEvent(plan)).toBeUndefined();expect(actor.bonuses.v5Charge).toBe(0);
  expect(plan.presentationId).toBe('enemy:spool-ram:basic');
  expect(paintedRecipe(plan.presentationId!,plan)!.friendly).toBe(false);
  expect(plan.events.filter(e=>e.type==='damage')).toHaveLength(1);
 });
 it('does not infer preparation from the skill ID or another actor charge',()=>{
  const {plan}=resolveRam(true);const hit=plan.events.find(e=>e.type==='damage')!;
  plan.events.push({...hit,type:'charge'});expect(chargeEvent(plan)).toBeUndefined();
  plan.events=plan.events.filter(e=>e.type!=='damage');expect(chargeEvent(plan)).toBeDefined();
  plan.events=plan.events.map(e=>e.type==='charge'?{...e,actorId:'other'}:e);expect(chargeEvent(plan)).toBeUndefined();
 });
});
