import { STATUSES } from '@taskbar-hero/game-rules/src/cardrpg/depth/catalog';
import type { BattleEvent, StatusId } from '@taskbar-hero/game-rules/src/cardrpg/depth/contract';
import type { TurnEvent } from '@taskbar-hero/game-rules/src/squad/turn/types';
import type { EffectPlan } from './effects';

export interface StatusBeat { kind:'apply'|'tick'|'expire'|'burst'; statusId:StatusId; sourceId:string; targetId:string; stacks:number; at:number; duration:number }
export interface StatusPresentation { offsets:Map<string,number>; beats:StatusBeat[]; kinds:Map<number,string>; bursts:string[] }
const types:Record<string,string> = { damage:'damage',dot:'damage',detonate:'damage',shared:'damage',reflect:'damage',heal:'heal',revive:'heal',survive:'heal',shield:'shield',defeat:'death',status:'status_apply',expire:'status_expire',phase:'boss_phase',summon:'spawn' };
const byName = new Map(STATUSES.map(status => [status.name,status.id]));
function matches(event:TurnEvent, log:BattleEvent|undefined) {
  return log && types[log.kind] === event.type && log.actorId === event.actorId && event.targetIds.includes(log.targetId)
    && log.amount === event.amount && (log.text === event.note || event.note === 'Clutch heal');
}
/** Match the adapter's existing seq numbers to source logs, once per plan. Unknown logs stay legacy. */
export function statusPresentation(plan:EffectPlan, log:readonly BattleEvent[]):StatusPresentation {
  const events=plan.events.filter(e=>e.type!=='action_start'), result:StatusPresentation={offsets:new Map(),beats:[],kinds:new Map(),bursts:[]};
  if(!events.length)return result;
  const first=events[0]!, end=Math.min(log.length,first.actionId);
  let offset=-1;
  for(let i=end-1;i>=first.seq-1;i--) {
    const candidate=i-first.seq+1;
    if(matches(first,log[i])&&events.every(e=>matches(e,log[candidate+e.seq-1]))) { offset=candidate;break; }
  }
  if(offset<0)return result;
  const impact=plan.beats[2]!.start;
  for(const event of events) {
    const raw=log[offset+event.seq-1]!;
    result.kinds.set(event.seq,raw.kind);
    if(['damage','detonate','heal','shield','status'].includes(raw.kind)&&raw.amount>0&&!result.offsets.has(raw.targetId)) {
      // Existing action time is unchanged; round recovery remains its original 300ms group.
      result.offsets.set(raw.targetId,plan.skillId==='round-status'?0:result.offsets.size*70);
    }
  }
  for(const event of events) {
    const raw=log[offset+event.seq-1]!;
    const statusId=raw.kind==='dot'?'scald':raw.kind==='heal'&&plan.skillId==='round-status'?'steep':raw.kind==='detonate'?'crumb':byName.get(raw.text);
    const kind=raw.kind==='status'?'apply':raw.kind==='expire'?'expire':raw.kind==='detonate'?'burst':['dot','heal'].includes(raw.kind)?'tick':undefined;
    if(!kind||!statusId||kind==='burst'&&raw.amount<=0)continue;
    const at=impact+(result.offsets.get(raw.targetId)??0);
    if(kind==='burst'&&!result.bursts.includes(raw.targetId))result.bursts.push(raw.targetId);
    result.beats.push({kind,statusId,sourceId:raw.actorId,targetId:raw.targetId,stacks:raw.amount,at:kind==='apply'?Math.max(0,at-220):at,
      duration:kind==='apply'?320:kind==='burst'?500:200});
  }
  return result;
}

/** Damage-over-time never folds into a direct-hit label. Source event amounts remain exact. */
export function statusImpactLabels(plan:EffectPlan, targetId:string, presentation:StatusPresentation) {
  const labels:(TurnEvent&{hits:number;dot:boolean})[]=[];
  for(const e of plan.events) {
    if(!e.targetIds.includes(targetId))continue;
    const dot=presentation.kinds.get(e.seq)==='dot',numeric=['damage','heal','shield'].includes(e.type);
    const existing=numeric?labels.find(x=>x.type===e.type&&x.dot===dot&&Math.sign(x.amount)===Math.sign(e.amount)):undefined;
    if(existing){existing.amount+=e.amount;existing.hits++;}
    else labels.push({...e,hits:1,dot});
  }
  return labels;
}
