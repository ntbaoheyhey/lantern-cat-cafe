// Counterfactual recipe definitions, not game configuration or a live entitlement.
// Exact prices/content cadence are design hypotheses, never measured demand.
import assert from 'node:assert/strict';
export const FEATURE_PRICES = Object.freeze({rename:2,decor:4,pass:12,forge:3,epicSeal:10});
export function validateFeaturePlan(plan) {
  assert(plan && ['sealed','unsealed'].includes(plan.input),'Invalid forge input');
  for (const [key,max] of [['catalogSeasons',40],['recipesPerSeason',8],['forgePriceYarn',30]])
    assert(Number.isSafeInteger(plan[key])&&plan[key]>=1&&plan[key]<=max,`Invalid ${key}`);
  assert(Number.isSafeInteger(plan.renewalBps)&&plan.renewalBps>=0&&plan.renewalBps<=10000,'Invalid renewal willingness');
  return plan;
}
export function featureQuote(plan) {
  validateFeaturePlan(plan);
  // Source-side crafting consumes authenticated unsealed Epic inventory directly.
  // It never seals then destroys an item merely to manufacture extra token burn.
  const preparation=plan.input==='sealed'?2*FEATURE_PRICES.epicSeal:0;
  return {recipeYarn:plan.forgePriceYarn,preparationYarn:preparation,
    totalSelfSourcedYarn:plan.forgePriceYarn+preparation,inputEpic:2,
    cosmeticUnits:1,combatPower:0,maximumLifetimeCrafts:plan.catalogSeasons*plan.recipesPerSeason,
    authorityRequired:true,implemented:false};
}
