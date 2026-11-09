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
