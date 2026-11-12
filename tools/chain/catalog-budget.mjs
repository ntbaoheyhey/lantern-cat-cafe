// Complete-output affordability, not a demand model or a live fee setting.
import assert from 'node:assert/strict';
import {FORGE_COST,FORGE_DESIGNS,forgePreparationCost} from '../../packages/chain/src/forge.ts';
import {YARN_STYLES} from '../../packages/chain/src/cosmetics.ts';
const U=10n**18n;
export function catalogBaskets({budget=20n*U,reserve=2n*U,sealBps=1000,epicReference=100n*U,
  threadReference=20n*U,unsealedEpics=0,hasThread=true}={}) {
  for(const n of [budget,reserve,epicReference,threadReference])assert(typeof n==='bigint'&&n>=0n,'Nonnegative wei required');
  assert(Number.isInteger(sealBps)&&sealBps>=0&&sealBps<=1000,'Seal trial must be within0–10%');
  assert(Number.isSafeInteger(unsealedEpics)&&unsealedEpics>=0,'Nonnegative inventory required');
  assert(typeof hasThread==='boolean','Explicit thread availability required');
  const epicFee=epicReference*BigInt(sealBps)/10000n,threadFee=threadReference*BigInt(sealBps)/10000n;
  const forgeQuote=forgePreparationCost(0n,epicFee),rows=[];
  for(let forge=0;forge<=Math.min(FORGE_DESIGNS.length,Math.floor(unsealedEpics/2));forge++)
    for(let styleMask=0;styleMask<2**YARN_STYLES.length;styleMask++)for(let thread=0;thread<=Number(hasThread);thread++){
      const styles=YARN_STYLES.filter((_,i)=>(styleMask&(1<<i))!==0);
      const styleBurn=styles.reduce((n,s)=>n+BigInt(s.cost),0n);
      const sealBurn=BigInt(forge*2)*epicFee+BigInt(thread)*threadFee,forgeBurn=BigInt(forge)*FORGE_COST;
      const spent=styleBurn+sealBurn+forgeBurn;
      if(spent+reserve>budget)continue;
      rows.push({forge,styles:styles.map(s=>s.id),thread,epicsConsumed:forge*2,spent,remaining:budget-spent,
        styleBurn,sealBurn,forgeBurn});
    }
  return {budget,reserve,sealBps,epicFee,threadFee,firstForge:forgeQuote.total,baskets:rows,
    maxForge:Math.max(0,...rows.map(r=>r.forge)),maximumCompleteSpend:rows.reduce((n,r)=>r.spent>n?r.spent:n,0n)};
}
export function optimisticCohortBound({accounts,activeHumans,grant=20n*U,maximumCompleteSpend}) {
  for(const n of [accounts,activeHumans])assert(Number.isSafeInteger(n)&&n>=0,'Integer cohort counts required');
  assert(activeHumans<=accounts&&typeof grant==='bigint'&&grant>0n,'Invalid funded cohort');
  assert(typeof maximumCompleteSpend==='bigint'&&maximumCompleteSpend>=0n&&maximumCompleteSpend<=grant,'Invalid closed-grant spend');
  const claims=BigInt(accounts)*grant,burn=BigInt(activeHumans)*maximumCompleteSpend;
  const minimumActive=maximumCompleteSpend===0n?null:(claims+2n*maximumCompleteSpend-1n)/(2n*maximumCompleteSpend);
  return {claims,burn,retained:claims-burn,minimumActive,
    canReachTwoX:claims>0n&&burn>0n&&claims<=2n*burn,
    interpretation:'Optimistic necessary bound: every active human buys the maximum affordable completed basket. No inference of preference, bot identity, authority, resale income or future rewards.'};
}
