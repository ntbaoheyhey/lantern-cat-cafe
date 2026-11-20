import {TURN_SKILLS} from '@taskbar-hero/game-rules/src/squad/turn/config';
import type {TurnActor,TurnEvent} from '@taskbar-hero/game-rules/src/squad/turn/types';
import type {EffectFrame} from './effects';
const beats=['anticipation','travel','impact','reaction','residue'];
const names=['Prepare','Release','Impact','Resolve','Settle'];
export function ActionReadout({frame,actors}:{frame:EffectFrame;actors:TurnActor[]}){
 const actor=actors.find(a=>a.id===frame.plan.actorId),targets=frame.plan.targetIds.map(id=>actors.find(a=>a.id===id)?.name).filter(Boolean);
 return <div className={`t3-action-readout ${frame.beat.kind}`} style={{'--signature':frame.color} as React.CSSProperties}>
  <small>{actor?.name??'The cafe'} {targets.length?`→ ${targets.length>2?`${targets.length} targets`:targets.join(' + ')}`:''}</small>
  <strong>{frame.plan.name}</strong><div aria-label={`Action: ${names[beats.indexOf(frame.beat.kind)]}`}>{names.map((name,i)=><span key={name} className={i===beats.indexOf(frame.beat.kind)?'current':''}>{name}</span>)}</div>
 </div>;
}
export function actionSentences(events:readonly TurnEvent[],actors:readonly TurnActor[]){
 const label=(id:string)=>actors.find(a=>a.id===id)?.name??id;
 const lines:{id:number;text:string}[]=[];
 for(const e of events){
  if(e.type==='action_start')lines.push({id:e.seq,text:`${label(e.actorId)} used ${TURN_SKILLS[e.skillId]?.name??e.skillId}${e.targetIds.length?` on ${e.targetIds.map(label).join(', ')}`:''}.`});
  else if(e.type==='damage'&&e.amount)lines.push({id:e.seq,text:`${e.targetIds.map(label).join(', ')} lost ${e.amount} HP${e.critical?' (critical hit)':''}.`});
  else if(e.type==='heal'&&e.amount)lines.push({id:e.seq,text:`${e.targetIds.map(label).join(', ')} recovered ${e.amount} HP.`});
  else if(e.type==='interrupt')lines.push({id:e.seq,text:`${e.targetIds.map(label).join(', ')} had the pending intent canceled.`});
  else if(e.type==='death')lines.push({id:e.seq,text:`${e.targetIds.map(label).join(', ')} fell. The remaining team carries on.`});
  else if(e.type==='wave_clear')lines.push({id:e.seq,text:'Wave cleared. Take a breath at the cafe.'});
 }
 return lines.slice(-16);
}
export function BattleLog({events,actors}:{events:readonly TurnEvent[];actors:readonly TurnActor[]}){
 const lines=actionSentences(events,actors);
 return <details className="t3-log"><summary>Battle log <span>{lines.length} recent events</span></summary><ol aria-label="Recent battle actions">{lines.map(line=><li key={line.id}>{line.text}</li>)}{!lines.length&&<li>Your first decision is ahead.</li>}</ol></details>;
}
