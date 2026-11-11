import type { TurnEvent } from '@taskbar-hero/game-rules/src/squad/turn/types';

/** Short presentation copy; source notes and combat outcomes remain unchanged. */
export function fizzleLabel(event:Pick<TurnEvent,'note'>,kind?:string){
  if(kind==='immune'||event.note==='Immune'||event.note==='Control resisted during recovery.'||event.note?.endsWith('recovered control resistance'))return 'Immune';
  if(kind==='resist'||event.note==='Resisted'||event.note==='Effect resisted.'||event.note?.includes(' resisted '))return 'Resisted';
  return 'No effect';
}
export function visibleImpactLabel(event:Pick<TurnEvent,'type'|'amount'>){
  return event.type==='death'||event.type==='fizzle'||event.amount>0&&['damage','heal','shield','status_apply'].includes(event.type);
}

/** Collapse simultaneous hits, keeping their resolved total and hit count truthful. */
export function impactLabels(events:readonly TurnEvent[],targetId:string){
  const labels:(TurnEvent & {hits:number})[]=[];
  for(const e of events){
    if(!e.targetIds.includes(targetId))continue;
    const numeric=['damage','heal','shield'].includes(e.type),note=e.type==='fizzle'?fizzleLabel(e):e.note;
    const existing=numeric?labels.find(x=>x.type===e.type&&Math.sign(x.amount)===Math.sign(e.amount))
      :e.type==='fizzle'?labels.find(x=>x.type==='fizzle'&&x.note===note):undefined;
    if(existing){existing.amount+=e.amount;existing.hits++;existing.critical ||= e.critical;}
    else labels.push({...e,note,hits:1});
  }
  return labels;
}
