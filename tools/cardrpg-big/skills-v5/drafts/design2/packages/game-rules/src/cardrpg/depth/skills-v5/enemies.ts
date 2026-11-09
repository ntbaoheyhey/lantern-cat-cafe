import {emitGameplayEvent} from '../events-v4';
import {ENEMY_BY_ID} from '../catalog';
import type {Actor,Battle,Intent,StatusId} from '../contract';
import {landingsV5,weakestV5,type ShapeV5} from './shapes';

/** Existing helpers make isolated boss/elite encounters readable combo opportunities. */
export function encounterEnemiesV5(ids:string[]):string[] {
  const tier=ids.length===1?ENEMY_BY_ID[ids[0]!]!.tier:'';
  return tier==='boss'?[...ids,'binding-thread','binding-thread']:tier==='elite'?[...ids,'binding-thread']:ids;
}
export function phaseHelpersV5(b:Battle,boss:Actor,spawn:(b:Battle,source:Actor,limit?:number)=>void):void {
  if(boss.hp<=0||boss.phase!==2||ENEMY_BY_ID[boss.catalogId]?.tier!=='boss'||boss.bonuses.v5Helpers)return;
  boss.bonuses.v5Helpers=1;
  spawn(b,boss,4);spawn(b,boss,4);
}
/** A defeated thread releases only its own knot; another source's Shred stays. */
export function releaseThreadV5(b:Battle,thread:Actor):void {
  if(thread.catalogId!=='binding-thread')return;
  for(const ally of b.actors.filter(a=>a.side==='party')){
    const removed=ally.statuses.filter(s=>s.source===thread.id&&['brittle','drowsy'].includes(s.id));
    if(!removed.length)continue;
    ally.statuses=ally.statuses.filter(s=>!removed.includes(s));
    b.log.push({round:b.round,actorId:thread.id,targetId:ally.id,skillId:'',kind:'dispel',amount:removed.length,text:'Binding Thread defeated; knot released.'});
  }
}

export const ENEMY_MECHANICS_V5:Record<string,{mechanic:string;counter:string}>={
  'button-guard':{mechanic:'Shields and Warms its whole row.',counter:'Shred strips shields; Burn passes through.'},
  'sock-skipper':{mechanic:'Targets rear cats and applies Bleed.',counter:'Shield the rear before their next actions.'},
  'spool-ram':{mechanic:'Charges for one turn, then hits a row.',counter:'Daze interrupts the charged action.'},
  'needle-moth':{mechanic:'Three seeded hits on random cats.',counter:'Warm and team shields soften repeated hits.'},
  'teacup-healer':{mechanic:'Heals its weakest ally every two rounds.',counter:'Bitter halves healing; Mark opens rear access.'},
  'kettle-knight':{mechanic:'Below half HP, basics Burn the front row.',counter:'Cleanse or Regen removes Burn.'},
  'binding-thread':{mechanic:'Knots apply Shred; every third turn Dazes the weakest cat.',counter:'Defeat the thread to release its knot or Cleanse.'},
  'yarn-giant':{mechanic:'Row + Shred signatures; closing phase All + Bitter.',counter:'Cleanse the crew; Daze stops its signature.'},
};
export function enemyIntentV5(b:Battle,actor:Actor,intent:Intent):Intent {
  const spec=ENEMY_MECHANICS_V5[actor.catalogId];if(!spec)return intent;
  const signature=actor.catalogId==='spool-ram'?!!actor.bonuses.v5Charge:actor.catalogId==='teacup-healer'?b.round%2===0:intent.signature;
  const label=actor.catalogId==='spool-ram'?(signature?'Charged row strike':'Charging for next turn'):actor.catalogId==='teacup-healer'&&signature?'Refill the weakest cup':signature?spec.mechanic:intent.label;
  return {...intent,signature,label,counter:spec.counter};
}
export interface EnemyRuntimeV5 {
  damage:(b:Battle,source:Actor,target:Actor,power:number,pressure:number,cover?:boolean,shape?:ShapeV5)=>void;
  apply:(b:Battle,source:Actor,target:Actor,id:StatusId,stacks?:number)=>boolean;
  shield:(b:Battle,source:Actor,target:Actor,amount:number)=>void;
  heal:(b:Battle,source:Actor,target:Actor,amount:number)=>void;
  roll:(b:Battle,max:number)=>number;
  record:(b:Battle,source:Actor,target:Actor,kind:string,amount?:number,text?:string,skillId?:string)=>void;
}
/** Only chapter-one opponents change; other chapters keep their existing mechanics. */
export function enemyActionV5(b:Battle,actor:Actor,intent:Intent,target:Actor,io:EnemyRuntimeV5):boolean {
  if(!ENEMY_MECHANICS_V5[actor.catalogId])return false;
  const party=()=>b.actors.filter(a=>a.side==='party'&&a.hp>0),foes=()=>b.actors.filter(a=>a.side==='enemy'&&a.hp>0);
  const targets:string[]=[];let resolvedShape:ShapeV5='single';
  const hit=(t:Actor,power=100,shape:ShapeV5='single')=>{targets.push(t.id);resolvedShape=shape;io.record(b,actor,t,'multi-hit',0,shape,actor.catalogId);io.damage(b,actor,t,power,0,shape==='single',shape);};
  switch(actor.catalogId){
    case 'button-guard':
      if(intent.signature)for(const ally of foes().filter(a=>a.row===actor.row)){io.shield(b,actor,ally,45);io.apply(b,actor,ally,'cozy');}else hit(target);
      break;
    case 'sock-skipper':{
      const rear=party().filter(a=>a.row==='rear'),victim=party().find(a=>a.statuses.some(s=>s.id==='shelter'))??weakestV5(rear.length?rear:party());
      if(victim){hit(victim);io.apply(b,actor,victim,'snag');}break;
    }
    case 'spool-ram':
      if(!actor.bonuses.v5Charge){actor.bonuses.v5Charge=1;io.record(b,actor,actor,'charge',1,'Charging a row strike');}
      else{actor.bonuses.v5Charge=0;for(const landing of landingsV5(b,actor,target,'row',n=>io.roll(b,n)))hit(landing.target,175*landing.multiplier,'row');}
      break;
    case 'needle-moth':
      for(let i=0;i<3&&actor.hp>0;i++){const living=party();if(!living.length)break;const victim=living[io.roll(b,living.length)]!;targets.push(victim.id);resolvedShape='multi-hit';io.record(b,actor,victim,'multi-hit',i,'multi-hit',actor.catalogId);io.damage(b,actor,victim,40,0,false,'multi-hit');}
      break;
    case 'teacup-healer':
      if(intent.signature){const patient=weakestV5(foes());if(patient){io.heal(b,actor,patient,65);io.apply(b,actor,patient,'steep');}}else{hit(target);io.apply(b,actor,target,'scent');}
      break;
    case 'kettle-knight':
      hit(target,intent.signature?intent.power:100);
      if(!intent.signature&&actor.hp<actor.maxHp/2)for(const front of party().filter(a=>a.row==='front'))io.apply(b,actor,front,'scald');
      if(actor.turns===0){io.shield(b,actor,actor,70);io.apply(b,actor,actor,'cozy');}
      break;
    case 'binding-thread':
      hit(target,50);io.apply(b,actor,target,'brittle');if(intent.signature)io.apply(b,actor,target,'drowsy');
      break;
    case 'yarn-giant':
      if(!intent.signature)hit(target);
      else{
        const shape=actor.phase===2?'all':'row',status=actor.phase===2?'bitter':'brittle';
        // Commit phase/shape before any reflection can advance the boss phase.
        for(const landing of landingsV5(b,actor,target,shape,n=>io.roll(b,n))){if(actor.hp<=0)break;hit(landing.target,intent.power*landing.multiplier,shape);io.apply(b,actor,landing.target,status);}
      }
      break;
  }
  if(targets.length&&resolvedShape!=='single')emitGameplayEvent(b,{kind:'multi-hit',skillId:actor.catalogId,shape:resolvedShape,targets,actorId:actor.id,text:`${actor.name}: ${targets.length} landings.`});
  return true;
}
