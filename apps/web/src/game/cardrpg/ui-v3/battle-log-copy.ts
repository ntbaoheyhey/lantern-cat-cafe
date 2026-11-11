import {CAT_BY_ID,ENEMY_BY_ID,skillById,type Battle,type BattleEvent} from '@taskbar-hero/game-rules/src/cardrpg/depth/index';

const shapes:Record<string,string>={single:'Single foe',pierce:'Piercing target',row:'Enemy row',splash:'Splash target',bounce:'Bouncing target',all:'All foes','multi-hit':'Repeated target',one:'One ally',weakest:'Lowest-health ally','ally-row':'Allied row','ally-splash':'Recovery splash',team:'Whole team',self:'Self',fallen:'Fallen ally'};

/** Describe only recorded facts. Never infer an effect's skill or recipient from a later action. */
export function battleLogCopy(battle:Battle,event:BattleEvent):{context:string;summary:string} {
 const name=(id:string)=>{
  if(!id)return '';
  const actor=battle.actors.find(a=>a.id===id);
  if(!actor)return CAT_BY_ID[id]?.name??ENEMY_BY_ID[id]?.name??'Unknown unit';
  const peers=battle.actors.filter(a=>a.name===actor.name&&a.side===actor.side);
  return peers.length>1?`${actor.name} ${peers.findIndex(a=>a.id===id)+1}`:actor.name;
 };
 const source=name(event.actorId),target=name(event.targetId),amount=event.amount,text=event.text.trim();
 const action=event.kind==='action'||event.kind==='enemy-action';
 // An action's selected target can differ from its actual patients, splash victims or caster buffs.
 const context=action?source||'Battle':source&&target?`${source}${event.actorId===event.targetId?' · self':` → ${target}`}`:source||target||'Battle';
 const note=(summary:string)=>text?`${summary} · ${text}`:summary;
 let summary:string;
 switch(event.kind){
  case 'damage':summary=note(`${amount} HP damage`);break;
  case 'dot':summary=note(`${amount} HP damage over time`);break;
  case 'reflect':summary=note(`${amount} HP reflected damage`);break;
  case 'shared':summary=note(`${amount} HP damage shared through a link`);break;
  case 'reaction-damage':summary=note(`${amount} HP reaction damage`);break;
  case 'detonate':summary=note(`${amount} HP detonation damage`);break;
  case 'heal':summary=note(`Restored ${amount} HP`);break;
  case 'shield':summary=note(`Gained ${amount} shield`);break;
  case 'absorbed':summary=`Shield blocked ${amount} damage${text.includes('Bleed')?' from Bleed':''}`;break;
  case 'strip-shield':summary=note(`Removed ${amount} shield`);break;
  case 'status':summary=`${text||'Status'} · ${amount} stack${amount===1?'':'s'} now`;break;
  case 'expire':summary=`${text||'Status'} expired`;break;
  case 'status-tick':summary=`Tick detail · ${text||'Status'} · ${amount} HP ${event.skillId==='steep'?'restored':['scald','snag'].includes(event.skillId)?'lost':'change'}`;break;
  case 'multi-hit':{
   const skill=skillById(event.skillId,!!battle.initial.skillsV5);
   summary=`Target: ${shapes[text]??(text||'Recorded target')}${skill?` · ${skill.name}`:''}`;break;
  }
  case 'dispel':summary=/^Removed (buffs|debuffs)$/.test(text)?`Removed ${amount} ${text.slice(8,-1)}${amount===1?'':'s'}`:note(`Removed ${amount} effect${amount===1?'':'s'}`);break;
  case 'cleanse':summary=note(`Cleared ${amount} effect${amount===1?'':'s'}`);break;
  case 'revive':summary=note(`Revived with ${amount} HP`);break;
  case 'survive':summary=note(`Stayed in battle with ${amount} HP`);break;
  case 'defeat':summary=text||'Defeated';break;
  case 'phase':summary=note(`Phase ${amount}`);break;
  case 'energy':summary=note(`Gained ${amount} shared energy`);break;
  case 'reaction':summary=`Reaction · ${text||event.skillId}`;break;
  case 'bond.combo':summary=`Bond combo · ${text||event.skillId}`;break;
  default:summary=text||`${event.kind.replaceAll('-',' ')} ${amount}`;
 }
 return {context,summary};
}
