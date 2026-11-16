import type {EffectPlan} from '../../squad/turn3d/effects';

export type PresentationTier='basic'|'active'|'ultimate';
type PresentedPlan=EffectPlan&{sequence?:{tier:PresentationTier}};

/** Rules presentation IDs distinguish an enemy's signature from its basic. */
export function presentationTier(plan:PresentedPlan):PresentationTier {
 if(plan.sequence)return plan.sequence.tier;
 if(plan.ultimate)return 'ultimate';
 const id=plan.presentationId??plan.skillId;
 if(id.startsWith('enemy:'))return id.endsWith(':basic')?'basic':'active';
 return /-[23]$/.test(id)?'active':'basic';
}

/** One contact impulse for authored and fallback actions, on the same clock. */
export function impactFeedback(plan:PresentedPlan,elapsed:number,reduced:boolean,healing=false){
 if(!plan.events.some(e=>e.type==='action_start'||e.type==='charge'))return {shake:0,flash:0};
 const since=elapsed-plan.beats[2]!.start;
 return {shake:!healing&&!reduced&&presentationTier(plan)==='ultimate'&&since>=0&&since<120?4*(1-since/120):0,flash:0};
}
