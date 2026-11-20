import {lazy,Suspense} from 'react';
import './fuji-collection.css';

const JudgeRewardV9=lazy(()=>import('./JudgeRewardV9').then(m=>({default:m.JudgeRewardV9})));

/** Campaign reward after the Chapter 1 guardian. Reuses the judge finale flow:
 * server voucher -> café test gas -> RelicNFT.mint, or the labelled fixture
 * preview when this build has no chain backend. */
export function GuardianRelicOffer(){
 return <section className="guardian-relic-offer" aria-labelledby="guardian-relic-title">
  <h3 id="guardian-relic-title">Keep this memory as a Relic on Avalanche</h3>
  <p><small>The café server signs this Relic after replaying its own fixed guardian trial. It does not replay your battle yet. Avalanche Fuji testnet · no real value.</small></p>
  <Suspense fallback={<p>Opening reward…</p>}><JudgeRewardV9/></Suspense>
 </section>;
}

/** The offer appears only for a won Chapter 1 campaign route (the Yarn Giant). */
export function guardianRelicEligible(run:{complete:boolean;won:boolean;mode:string;chapter:number}|null|undefined){
 return !!run&&run.complete&&run.won&&run.mode==='campaign'&&run.chapter===1;
}
