import { ENEMY_BY_ID } from './catalog';
import { emitGameplayEvent } from './events-v4';
import type { Actor, Battle, BattleSetup } from './contract';

/** Frozen content level: never depends on equipped items or selected editions. */
export function challengeStatsV4(level:number): NonNullable<BattleSetup['enemyStats']> {
 if(!Number.isSafeInteger(level)||level<1||level>50)throw Error('Choose a challenge band from 1 to 50.');
 const growth=(1+(level-1)*.012)*(level>=6?1.12:1);
 return Object.fromEntries(Object.values(ENEMY_BY_ID).map(e=>{
  const hp=e.tier==='boss'?(e.chapter===3?.25:.30):e.tier==='elite'?.30:.23;
  return [e.id,{hp:Math.max(1,Math.round(e.hp*hp*growth)),attack:Math.max(1,Math.round(e.attack*growth)),defense:e.defense}];
 }));
}
export function phaseBossV4(battle:Battle,boss:Actor):void {
 if(!battle.v4||boss.side!=='enemy'||ENEMY_BY_ID[boss.catalogId]?.tier!=='boss'||boss.phase!==1||boss.hp>boss.maxHp/2||boss.hp<=0)return;
 boss.phase=2;
 const text=`${boss.name}: closing phase. The next signature reaches both rows.`;
 battle.log.push({round:battle.round,actorId:boss.id,targetId:boss.id,skillId:'',kind:'phase',amount:2,text});
 emitGameplayEvent(battle,{kind:'boss-phase',actorId:boss.id,bossId:boss.catalogId,from:1,to:2,threshold:.5,text});
}
/** Called after all damage in a single action, before any next actor or round tick. */
export function finishBossV4(battle:Battle):boolean {
 if(!battle.v4)return false;
 const primary=battle.actors.find(a=>a.side==='enemy'&&ENEMY_BY_ID[a.catalogId]?.tier==='boss');
 if(!primary||primary.hp>0)return false;
 if(battle.v4.events.some(e=>e.kind==='boss-finish'))return !!battle.result;
 const retired=battle.actors.filter(a=>a.side==='enemy'&&a.linkedBossId===primary.id&&a.hp>0);
 for(const actor of retired){actor.hp=0;actor.shield=0;actor.statuses=[];
  battle.log.push({round:battle.round,actorId:primary.id,targetId:actor.id,skillId:'',kind:'retire',amount:0,text:`${actor.name} leaves with ${primary.name}.`});
 }
 const outcome=battle.actors.some(a=>a.side==='party'&&a.hp>0)?'party':'enemy';
 if(outcome==='enemy'||!battle.actors.some(a=>a.side==='enemy'&&a.hp>0)){battle.result=outcome;battle.queue=[];}
 else battle.queue=battle.queue.filter(id=>battle.actors.some(a=>a.id===id&&a.hp>0));
 emitGameplayEvent(battle,{kind:'boss-finish',actorId:primary.id,bossId:primary.catalogId,retiredIds:retired.map(a=>a.id),outcome,
  text:`${primary.name} is defeated; ${retired.length} linked helpers leave. ${outcome==='enemy'?'The crew also fell; the route is lost.':battle.result==='party'?'The crew wins.':'Unlinked foes remain.'}`});
 return !!battle.result;
}
