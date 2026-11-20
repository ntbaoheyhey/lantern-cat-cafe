// Exact closed-cohort liability bound. No RPC, keys, demand forecast or issuance.
import assert from 'node:assert/strict';

/** Every gross reward payment counts, including recycled treasury tokens.
 * Pending promises and planned tester grants must be disjoint from paid claims.
 * A budget can preserve this bound; it cannot erase an inherited deficit. */
export function grantHeadroom({grossClaims,eligibleBurn,unpaidClaims=0n,plannedGrants=0n}) {
  for(const n of [grossClaims,eligibleBurn,unpaidClaims,plannedGrants])
    assert(typeof n==='bigint'&&n>=0n,'Nonnegative integer wei required');
  const committedClaims=grossClaims+unpaidClaims+plannedGrants;
  const delta=2n*eligibleBurn-committedClaims;
  return {committedClaims,headroom:delta>0n?delta:0n,
    additionalBurnRequired:delta<0n?(-delta+1n)/2n:0n,
    alreadyWithinTwoX:grossClaims>0n&&eligibleBurn>0n&&grossClaims<=2n*eligibleBurn,
    includingPromisesWithinTwoX:committedClaims>0n&&eligibleBurn>0n&&delta>=0n};
}
