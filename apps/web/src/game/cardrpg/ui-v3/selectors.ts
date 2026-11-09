import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import {QUESTS} from '@taskbar-hero/game-rules/cardrpg';
import {teamPower} from '../depth/meta-presentation';
export function homeView(state:R.DepthAccount, now:number) {
  const run=state.run&&!state.run.complete?state.run:null;
  const next=run?(run.battle?run.nodes.find(n=>n.id===run.current):R.availableNodes(run)[0]):undefined;
  const chapter=run?.chapter??Math.min(3,state.cleared.length+1);
  const tasks=QUESTS.filter(q=>{const p=state.account.quests[q.id];return p&&!p.claimed&&p.progress>=q.target;}).length;
  const free=!state.freeInvite;
  const shift=R.cafeShiftV4(state,now);
  return {power:teamPower(state),chapter,subline:state.tutorial<3?'Your first adventure':`Chapter ${chapter} · Stop ${(next?.depth??0)+1} · ${next?.kind??'Battle'}`,
    tasks,free,recruit:!run&&(free||state.account.currencies.stamps>=1),shift,
    cats:!run&&state.account.cards.some(card=>R.metaCommand(state,{type:'level',cardId:card.id}).ok),
    gear:!run&&state.team.some(id=>state.gear.some(item=>{const p=R.equipGear(state,id,item.id);if(!p.ok)return false;return teamPower(p.state)>teamPower(state);})),
  };
}

/** Same default route/band selection as HomeV4; derives state without changing it. */
export function patrolDefaults(state:R.DepthAccount) {
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
export function resultRewards(state:R.DepthAccount) {
 if(!state.run?.battle?.result)return [];
 const result=R.finishEncounter(state);if(!result.ok)return [];
 const rows=Object.entries(state.account.currencies).flatMap(([id,n])=>{
  const delta=result.state.account.currencies[id as keyof typeof state.account.currencies]-n;
  return delta>0?[{id,label:id,amount:delta}]:[];
 });
 const points=(result.state.run?.points??0)-state.run.points;
 if(points>0)rows.push({id:'points',label:'route points',amount:points});
 for(const item of result.state.gear.filter(g=>!state.gear.some(old=>old.id===g.id)))rows.push({id:item.id,label:R.GEAR_BY_ID[item.templateId]!.name,amount:1});
 return rows;
}
