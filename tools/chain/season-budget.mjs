// Pure, offline policy experiment. No network, signing, persistence or activation.
import assert from 'node:assert/strict';
const min=(...xs)=>xs.reduce((a,b)=>a<b?a:b);
/** Budget a future 13-week season from a CLOSED period. Burn is counted once;
 * unused budget expires. Rank is a conditional request before this allocation,
 * not an existing signed debt. Existing signed debts must be reserved separately.
 * Equal boss amounts never depend on a player's spending or token ownership. */
export function seasonBudget({organicBurn,burnBudgetBps=5000,accounts,bossCeiling,rankRequests,weeklyCap,
  available=1_000_000_000n*10n**18n,rankShareBps=1000,earnedCredit=null}){
  for(const value of [organicBurn,bossCeiling,weeklyCap,available,...rankRequests])
    assert(typeof value==='bigint'&&value>=0n,'Nonnegative integer wei required');
  assert(Number.isSafeInteger(accounts)&&accounts>0&&accounts<=50_000_000,'Invalid account count');
  assert(rankRequests.length===accounts,'Rank request count must match cohort');
  for(const bps of [burnBudgetBps,rankShareBps])assert(Number.isInteger(bps)&&bps>=0&&bps<=10000,'Invalid bps');
  if(earnedCredit!==null)assert(typeof earnedCredit==='bigint'&&earnedCredit>=0n,'Invalid earned credit');
  // A carry variant supplies reviewed cumulative credit minus already paid
  // claims and surviving liabilities. Expired unused allocations may be reused;
  // a signed/unexpired promise may not. Caller owns this reconciliation.
  const ceiling=min(earnedCredit??organicBurn*BigInt(burnBudgetBps)/10000n,available);
  const rankCaps=rankRequests.map(r=>min(r,weeklyCap));
  const rankRequested=rankCaps.reduce((a,b)=>a+b,0n);
  const rankEnvelope=min(rankRequested,ceiling*BigInt(rankShareBps)/10000n);
  const rankAwards=rankCaps.map(r=>rankRequested?r*rankEnvelope/rankRequested:0n);
  const rankTotal=rankAwards.reduce((a,b)=>a+b,0n);
  // Reserve one full week's capacity for rank; equal boss quote is feasible for
  // all accounts including the largest rank recipient. Conservative by design.
  const largestRank=rankAwards.reduce((a,b)=>a>b?a:b,0n);
  const bossPerWeek=min(bossCeiling,weeklyCap-largestRank,(ceiling-rankTotal)/(13n*BigInt(accounts)));
  const bossTotal=bossPerWeek*13n*BigInt(accounts);
  return {ceiling,bossPerWeek,bossTotal,rankAwards,rankTotal,committed:bossTotal+rankTotal,
    uncommitted:ceiling-bossTotal-rankTotal};
}
