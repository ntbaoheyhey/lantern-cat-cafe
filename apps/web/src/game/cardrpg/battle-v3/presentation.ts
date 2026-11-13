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
export function impactFeedback(plan:PresentedPlan,elapsed:number,reduced:boolean){
 if(!plan.events.some(e=>e.type==='action_start'||e.type==='charge'))return {shake:0,flash:0};
 const since=elapsed-plan.beats[2]!.start,tier=presentationTier(plan),critical=plan.events.some(e=>e.critical);
 const damage=plan.events.some(e=>e.type==='damage');
 const strength=tier==='ultimate'?12:tier==='active'?5:critical?3:damage?1.5:0;
 return {shake:since>=0&&since<300?strength*(1-since/300)*(reduced?.5:1):0,
  flash:!reduced&&since>=0&&since<1000/30?(tier==='ultimate'?.35:tier==='active'?.16:critical?.12:0):0};
}
