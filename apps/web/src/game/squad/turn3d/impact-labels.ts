import type { TurnEvent } from '@taskbar-hero/game-rules/src/squad/turn/types';

/** Collapse simultaneous hits, keeping their resolved total and hit count truthful. */
export function impactLabels(events:readonly TurnEvent[],targetId:string){
  const labels:(TurnEvent & {hits:number})[]=[];
  for(const e of events){
    if(!e.targetIds.includes(targetId))continue;
    const numeric=['damage','heal','shield'].includes(e.type);
    const existing=numeric?labels.find(x=>x.type===e.type&&Math.sign(x.amount)===Math.sign(e.amount)):undefined;
    if(existing){existing.amount+=e.amount;existing.hits++;existing.critical ||= e.critical;}
    else labels.push({...e,hits:1});
  }
  return labels;
}
