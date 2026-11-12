// Exact self-source recipe arithmetic, not a price floor or a spending rule.
import assert from 'node:assert/strict';
import {forgePreparationCost} from '../../packages/chain/src/forge.ts';

export function forgePreparation({sealedEpics,unsealedEpics,balance,sealFee}) {
  for(const n of [sealedEpics,unsealedEpics])
    assert(Number.isSafeInteger(n)&&n>=0,'Nonnegative item count required');
  for(const n of [balance,sealFee])
    assert(typeof n==='bigint'&&n>=0n,'Nonnegative integer wei required');
  const quote=forgePreparationCost(BigInt(sealedEpics),sealFee);
  const missing=Number(quote.missing),{total}=quote;
  return {...quote,missing,
    shortfall:balance<total?total-balance:0n,
    sourceReady:unsealedEpics>=missing,
    canComplete:unsealedEpics>=missing&&balance>=total};
}
