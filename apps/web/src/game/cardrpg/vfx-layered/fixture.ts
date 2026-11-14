/** Real rules events in an isolated four-slot scene; never mutates a player's save. */
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import {snapshotBattle,splitPresentation} from '../depth/battle-presentation';
import {createCardActionPlan} from '../depth/card-action-plan';
import {passivePresentation} from '../depth/passive-presentation';
import type {TurnEvent} from '@taskbar-hero/game-rules/src/squad/turn/types';

export function pilotFixture(id:string,preparation=false,archive=false){
 const enemy=id.startsWith('enemy:'),owner=enemy?id.split(':')[1]!:id.replace(/-(?:[1-4]|passive)$/,'');
 if(enemy?!R.ENEMY_BY_ID[owner]:!R.CAT_BY_ID[owner])throw Error('Unknown painted effect: '+id);
 const account=R.setFormationC2(R.setGameplayA6(R.createDepthAccount(71),true));
 if(!enemy&&!account.team.includes(owner)){
  account.account.cards.push({...account.account.cards[0]!,id:owner,cardId:owner});
  const index=Math.max(0,account.team.findIndex(cat=>account.rows[cat]===R.CAT_BY_ID[owner]!.row));
  account.rows[owner]=account.rows[account.team[index]!]!;
  account.team[index]=owner;
 }
 if(!enemy)account.skills[owner]=R.CAT_BY_ID[owner]!.skills.slice(0,3).map(skill=>skill.id);
 // Retired art may be inspected only through an explicit archive fixture.
 const legacy=archive&&(/-[23]$/.test(id)||id.endsWith('-passive')) || id.endsWith('-passive');
 if(legacy){account.gameplayA6=false;for(const cat of R.CATS)account.skills[cat.id]=cat.skills.map(s=>s.id);}
 const battle=R.createBattle({seed:71,chapter:enemy?R.ENEMY_BY_ID[owner]!.chapter:1,gameplayV4:true,skillsV5:true,gameplayA6:!legacy,formationC2:!legacy,
  cats:R.battleCats(account),enemies:[enemy?owner:'yarn-giant','binding-thread','binding-thread']});
 if(legacy)battle.initial.formationC2=true; // Archived pre-F6 formation, isolated from production.
 const caster=battle.actors.find(a=>a.catalogId===owner)!;
 for(const a of battle.actors)a.hp=Math.round(a.maxHp*(a.side==='party'?.55:.8));
 const patient=battle.actors.find(a=>a.side==='party'&&a.id!==caster.id)!;
 if(id==='cinnamon-4')patient.hp=0;
 caster.charge=id.endsWith(':basic')?0:100;caster.turns=3;caster.shield=45;
 if(enemy){
  const intent=battle.intents.find(i=>i.actorId===caster.id)!;
  intent.signature=!id.endsWith(':basic');intent.power=intent.signature?175:100;
  if(owner==='spool-ram')caster.bonuses.v5Charge=preparation?0:1;
 }
 battle.queue=[caster.id,...battle.queue.filter(a=>a!==caster.id)];battle.v4!.committed=true;
 if(id.endsWith('-passive')){
  const casts:Record<string,string>={mochi:'mochi-2',soot:'soot-3',clover:'clover-2',panko:'defend'};
  const cast=casts[owner];
  if(cast){
   patient.hp=Math.floor(patient.maxHp*.2);
   if(owner==='clover')patient.statuses.push({id:'bitter',stacks:1,remaining:2,source:caster.id,appliedRound:battle.round});
   if(owner==='soot')battle.actors.find(a=>a.side==='enemy')!.statuses.push({id:'crumb',stacks:2,remaining:3,source:caster.id,appliedRound:battle.round});
   const before=snapshotBattle(battle),choice=R.legalChoices(battle).find(c=>c.skillId===cast);
   if(!choice||!R.act(battle,choice))throw Error('No passive trigger: '+id);
   const resolved=splitPresentation(before,battle,cast),cues=passivePresentation(before,resolved.impact);
   if(!cues.presentationCues?.includes(id))throw Error('Passive did not activate: '+id);
   const start:TurnEvent={version:3,seq:0,turn:1,round:1,actionId:1,beat:0,type:'action_start',actorId:caster.id,skillId:cast,targetIds:[cues.presentationCueTargets![id]!],amount:0};
   const plan=createCardActionPlan([start,...resolved.events],cast);
   // The isolated workbench suppresses the companion main-skill painting;
   // the passive still uses the exact rule event, recipient and contact time.
   plan.presentationId='passive-preview:'+id;Object.assign(plan,cues);
   return {battle:resolved.impact,plan,previewOnly:false};
  }
  // Passive stat modifiers have no cast in the combat log. This isolated art
  // fixture shows the motif without inventing a heal or changing combat rules.
  const start:TurnEvent={version:3,seq:0,turn:1,round:1,actionId:1,beat:0,type:'action_start',actorId:caster.id,skillId:id,targetIds:[caster.id],amount:0};
  return {battle,plan:createCardActionPlan([start,{...start,seq:1,beat:2,type:'status_apply',note:'Passive art preview'}],id),previewOnly:true};
 }
 const before=snapshotBattle(battle);
 if(enemy)R.enemyAct(battle);
 else {const choice=R.legalChoices(battle).find(c=>c.skillId===id);if(!choice||!R.act(battle,choice))throw Error('Pilot fixture has no legal cast: '+id);}
 const resolved=splitPresentation(before,battle,id),targets=[...new Set(resolved.events.flatMap(e=>e.targetIds))];
 const start:TurnEvent={version:3,seq:0,turn:1,round:1,actionId:1,beat:0,type:'action_start',actorId:caster.id,skillId:id,targetIds:targets,amount:0};
 return {battle:resolved.impact,plan:createCardActionPlan([start,...resolved.events],id),previewOnly:false};
}
