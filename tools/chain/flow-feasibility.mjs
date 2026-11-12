// Exact necessary bounds, not demand forecasts or changes to token parameters.
import assert from 'node:assert/strict';
import {parseYarn,formatYarn} from './reward-budget.mjs';
export function marketOnlyBound({claims,burnShareBps=4000}) {
  const c=parseYarn(claims);
  assert(Number.isInteger(burnShareBps)&&burnShareBps>=0&&burnShareBps<=10000,'Invalid fee split');
  // No external funds, no treasury recycling/extra burns, no direct sink, and
  // each claimed token can be consumed once as a fee. Rounding only lowers burn.
  const maximum=c*BigInt(burnShareBps)/10000n;
  const shortfall=c>2n*maximum?(c-2n*maximum+1n)/2n:0n;
  // If all balances are exhausted, d+(1-d)*share>=1/2. This is a theoretical
  // minimum direct-burn share of claims, not a spending quota for any player.
  const numerator=5000-burnShareBps,denominator=10000-burnShareBps;
  const minimumDirectShareBps=numerator<=0?0:Math.ceil(numerator*10000/denominator);
  return {maximumBurn:formatYarn(maximum),remainingTwoXShortfall:formatYarn(shortfall),
    canReachTwoX:c>0n&&2n*maximum>=c,minimumDirectShareBps,
    assumptions:'Closed funded cohort; treasury retained; no external token inflow or other sink. Exhausting wallet balances is a mathematical ceiling, not healthy play.'};
}
export function inactiveGrantBound({accounts,grant='20',adoptionBps}) {
  assert(Number.isSafeInteger(accounts)&&accounts>=0&&accounts<=50000000,'Invalid cohort');
  assert(Number.isInteger(adoptionBps)&&adoptionBps>=0&&adoptionBps<=10000,'Invalid adoption');
  // Count whole inactive accounts conservatively; all their grants stay idle.
  const inactive=BigInt(Math.floor(accounts*(10000-adoptionBps)/10000));
  const locked=inactive*parseYarn(grant);
  return {inactiveAccounts:Number(inactive),retainedGrant:formatYarn(locked),
    minimumBurnForTwoX:formatYarn(locked),
    note:'Necessary only: burn must cover retained grants plus treasury and other retained balances. More rewards to nonspenders make this bound worse; no probability or human identity is inferred.'};
}
export function reconcileFlow({claims,directBurn,marketBurn,treasury,balances}) {
  const c=parseYarn(claims),d=parseYarn(directBurn),m=parseYarn(marketBurn),t=parseYarn(treasury),b=parseYarn(balances);
  assert.equal(c,d+m+t+b,'Claimed-token cohort must conserve exactly');
  const burn=d+m,target=(c+1n)/2n;
  return {claims,burn:formatYarn(burn),retained:formatYarn(t+b),flowPass:c>0n&&burn>0n&&c<=2n*burn,
    additionalDirectBurnWithoutNewClaims:formatYarn(target>burn?target-burn:0n),
    cumulativeHealthOnePossibleWithoutTreasuryBurn:t===0n,
    note:'Seasonal burn may consume past saved tokens. A one-season health ratio is different from cumulative closed-cohort conservation.'};
}
