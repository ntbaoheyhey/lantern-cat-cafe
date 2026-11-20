import type {EffectPlan} from '../../squad/turn3d/effects';

// These five fallback ultimates obscured bodies in the native-cat battle review.
// Keep the contact peak, then clear the field before the cast returns to idle.
const skills=new Set(['mallow-4','sorrel-4','biscuit-4','cinnamon-4','brioche-4']);
const clearance={radiusScale:.62,releaseMs:660} as const;
export function nativeUltimateField(plan:EffectPlan){
 return plan.ultimate&&skills.has(plan.presentationId??plan.skillId)?clearance:undefined;
}
