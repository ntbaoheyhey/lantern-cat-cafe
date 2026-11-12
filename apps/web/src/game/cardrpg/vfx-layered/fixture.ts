/** Real rules events in an isolated four-slot scene; never mutates a player's save. */
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import {snapshotBattle,splitPresentation} from '../depth/battle-presentation';
import {createCardActionPlan} from '../depth/card-action-plan';
import type {TurnEvent} from '@taskbar-hero/game-rules/src/squad/turn/types';

export function pilotFixture(id:string){
 const account=R.setFormationC2(R.setGameplayA6(R.createDepthAccount(71),true));
 const battle=R.createBattle({seed:71,chapter:1,gameplayV4:true,skillsV5:true,gameplayA6:true,formationC2:true,
  cats:R.battleCats(account),enemies:['yarn-giant','binding-thread','binding-thread']});
 const enemy=id.startsWith('enemy:'),caster=battle.actors.find(a=>a.catalogId===(enemy?'yarn-giant':'mochi'))!;
 for(const a of battle.actors){if(a.side==='party')a.hp=Math.round(a.maxHp*.55);}
 caster.charge=100;caster.turns=3;battle.queue=[caster.id,...battle.queue.filter(a=>a!==caster.id)];battle.v4!.committed=true;
 const before=snapshotBattle(battle);
 if(enemy)R.enemyAct(battle);
 else {const choice=R.legalChoices(battle).find(c=>c.skillId===id);if(!choice||!R.act(battle,choice))throw Error('Pilot fixture has no legal cast: '+id);}
 const resolved=splitPresentation(before,battle,id),targets=[...new Set(resolved.events.flatMap(e=>e.targetIds))];
 const start:TurnEvent={version:3,seq:0,turn:1,round:1,actionId:1,beat:0,type:'action_start',actorId:caster.id,skillId:id,targetIds:targets,amount:0};
 return {battle:resolved.impact,plan:createCardActionPlan([start,...resolved.events],id)};
}
