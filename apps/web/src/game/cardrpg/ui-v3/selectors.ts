import {badgesA6} from './badges-a6';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import {CARD_RPG_CONFIG,QUESTS} from '@taskbar-hero/game-rules/cardrpg';
import {teamPower} from '../depth/meta-presentation';
export function homeView(state:R.DepthAccount, now:number) {
  const run=state.run&&!state.run.complete?state.run:null;
  const next=run?(run.battle?run.nodes.find(n=>n.id===run.current):R.availableNodes(run)[0]):undefined;
  const chapter=run?.chapter??Math.min(3,state.cleared.length+1);
  if(R.gameplayA6(state)){
    const badges=badgesA6(state,now);
    return {power:teamPower(state),chapter,subline:state.tutorial<3?'Your first adventure':run?.towerA6?`Yarn Tower · Floor ${run.floor}`:`Chapter ${chapter} · Stop ${(next?.depth??0)+1} · ${next?.kind??'Battle'}`,
      tasks:badges.events,milestones:0,free:badges.free,recruit:badges.recruit,shift:R.idleChestA6(state,now),cats:badges.cats,gear:badges.gear};
  }
  const tasks=run?0:QUESTS.filter(q=>!R.boardPreviewV4(state,q.id).reason).length;
  const milestones=run?0:R.MILESTONES_V4.filter(x=>!R.milestonePreviewV4(state,x.id).reason).length;
  const available=state.account.daily.draws<CARD_RPG_CONFIG.maxDrawsPerDay;
  const free=!run&&!state.freeInvite&&available;
  const shift=R.cafeShiftV4(state,now);
  return {power:teamPower(state),chapter,subline:state.tutorial<3?'Your first adventure':`Chapter ${chapter} · Stop ${(next?.depth??0)+1} · ${next?.kind??'Battle'}`,
    tasks,milestones,free,recruit:!run&&available&&(free||state.account.currencies.stamps>=R.invitationBannerV4('standard').cost.stamps!),shift,
    cats:!run&&state.account.cards.some(card=>R.metaCommand(state,{type:'level',cardId:card.id}).ok),
    gear:!run&&state.team.some(id=>state.gear.some(item=>{const p=R.equipGear(state,id,item.id);if(!p.ok)return false;return teamPower(p.state)>teamPower(state);})),
  };
}

/** Same default route/band selection as HomeV4; derives state without changing it. */
export function patrolDefaults(state:R.DepthAccount) {
 if(R.gameplayA6(state))return R.patrolDefaultsA6(state);
 const active=!!state.run&&!state.run.complete;
 const ceiling=Math.min(...state.team.map(id=>state.account.cards.find(c=>c.cardId===id)!.level));
 const unlocked=R.CHAPTERS.filter(c=>c.id===1||state.cleared.includes(c.id-1));
 const next=unlocked.find(c=>!state.cleared.includes(c.id));
 const pending=Object.values(state.v4?.journey?.stars??{}).filter(r=>r.conditions.some(c=>!c)&&r.band>=1&&r.band<=ceiling&&unlocked.some(c=>c.id===r.chapter));
 const first=next?(state.run?.chapter===next.id?state.run.challengeLevel:undefined)??1:undefined;
 const band=active?state.run!.challengeLevel??ceiling:Math.min(first??pending[0]?.band??ceiling,ceiling);
 const replay=!next?pending.find(r=>r.band===band):undefined;
 const chapter=active?state.run!.chapter:next?.id??replay?.chapter??3;
 return {active,ceiling,band,chapter};
}

/** Preview the existing transaction on its copy; never apply it to the model. */
export interface GearDropView {templateId:string;name:string;rarity:R.GearTemplate['rarity'];slot:string;setId:string;powerGain:number;wearer:string|null}
export interface ResultRewardRow {id:string;label:string;amount:number;gear?:GearDropView}
export function resultRewards(state:R.DepthAccount):ResultRewardRow[] {
 if(!state.run?.battle?.result)return [];
 const result=R.finishEncounter(state);if(!result.ok)return [];
 const rows:ResultRewardRow[]=Object.entries(state.account.currencies).flatMap(([id,n])=>{
  const delta=result.state.account.currencies[id as keyof typeof state.account.currencies]-n;
  return delta>0?[{id,label:id,amount:delta}]:[];
 });
 const points=(result.state.run?.points??0)-state.run.points;
 if(points>0)rows.push({id:'points',label:'route points',amount:points});
 for(const item of result.state.gear.filter(g=>!state.gear.some(old=>old.id===g.id))){
  const t=R.GEAR_BY_ID[item.templateId]!,best=gearUpgradePreview(result.state,item.id);
  rows.push({id:item.id,label:t.name,amount:1,gear:{templateId:t.id,name:t.name,rarity:t.rarity,slot:t.slot,setId:t.setId,powerGain:best.gain,wearer:best.cardId}});
 }
 return rows;
}
/** Team Power gained if this piece replaced the matching slot on the teammate who benefits most. Read-only preview. */
export function gearUpgradePreview(state:R.DepthAccount,instanceId:string):{gain:number;cardId:string|null} {
 const item=state.gear.find(g=>g.id===instanceId);if(!item)return {gain:0,cardId:null};
 const slot=R.GEAR_BY_ID[item.templateId]!.slot,before=R.teamPowerV4(state);let gain=0,cardId:string|null=null;
 for(const id of state.team){
  const preview={...state,equipment:{...state.equipment,[id]:{...state.equipment[id],[slot]:instanceId}}};
  const delta=Math.round(R.teamPowerV4(preview)-before);
  if(delta>gain){gain=delta;cardId=id;}
 }
 return {gain,cardId};
}
/** The kind of gear roll the current encounter makes, matching run.ts finishEncounter. */
export function encounterDropKind(state:R.DepthAccount):'battle'|'elite'|'boss'|null {
 const run=state.run,node=run?.nodes.find(n=>n.id===run.current);
 if(!run||!node||run.towerA6)return null;
 return node.kind==='elite'||node.kind==='boss'?node.kind:node.kind==='battle'?'battle':null;
}

/** Team Power that "equip best" would add once this route ends (gear can only change at home). Read-only. */
export function homeEquipGain(state:R.DepthAccount):number {
 const home={...state,run:null},equipped=R.autoEquipA6(home);
 return equipped.ok?Math.max(0,Math.round(R.teamPowerV4(equipped.state)-R.teamPowerV4(home))):0;
}
