import { playBattle, type Policy } from './policies';
import { availableNodes, chooseReward, enterNode, EVENTS, finishEncounter, resolveNode, shopStock } from './run';
import type { DepthAccount, RuleResult } from './contract';
function accept(result: RuleResult<DepthAccount>) {if(!result.ok)throw Error(result.error);return result.state;}
/** Headless client uses the same public node commands as the UI. */
export function playRun(state: DepthAccount, policy: Policy): DepthAccount {
  let next=state;
  for(let step=0;step<100&&!next.run?.complete;step++) {
    const run=next.run;
    if(!run)throw Error('Start a run before calling its bot');
    if(run.battle){playBattle(run.battle,policy);next=accept(finishEncounter(next));continue;}
    if(run.rewardChoices.length){next=accept(chooseReward(next,run.rewardChoices[0]!));continue;}
    if(run.current){
      const node=run.nodes.find(n=>n.id===run.current)!;
      if(node.kind==='campfire')next=accept(resolveNode(next,'heal'));
      else if(node.kind==='treasure')next=accept(resolveNode(next,'charm'));
      else if(node.kind==='shop')next=accept(resolveNode(next,run.points>=45?shopStock(run)[0]!:'leave'));
      else if(node.kind==='event') {
        const event=EVENTS.find(e=>e.id===node.eventId)!;
        const option=[...event.choices].filter(o=>o.cost<=run.points).sort((a,b)=>b.heal-a.heal)[0]!;
        next=accept(resolveNode(next,option.id));
      } else throw Error('Unresolved node');
      continue;
    }
    const node=availableNodes(run)[0];if(!node)throw Error('Map stalled');
    next=accept(enterNode(next,node.id));
  }
  if(!next.run?.complete)throw Error('Run exceeded its action bound');
  return next;
}
