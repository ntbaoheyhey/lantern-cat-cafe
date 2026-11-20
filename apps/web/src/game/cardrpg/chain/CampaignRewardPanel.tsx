import {GameIcon} from '../../../ui/GameIcon';
import {useState,useRef} from 'react';
import {formatEther} from 'viem';
import type {CampaignRewardKind,CampaignRewardQuote} from '@taskbar-hero/chain';
import {friendlyError} from './errors';
export function CampaignRewardPanel({disabled,onQuote,onClaim}:{disabled:boolean;
 onQuote:(kind:CampaignRewardKind)=>Promise<CampaignRewardQuote>;onClaim:(quote:CampaignRewardQuote)=>Promise<void>}){
 const [quote,setQuote]=useState<CampaignRewardQuote>(),[busy,setBusy]=useState(false),[error,setError]=useState(''),lock=useRef(false);
 const run=async(action:()=>Promise<void>)=>{if(lock.current||disabled)return;lock.current=true;setBusy(true);setError('');
  try{await action();}catch(e){setQuote(undefined);setError(friendlyError(e));}finally{lock.current=false;setBusy(false);}};
 return <section className="chain-campaign-rewards" aria-label="Campaign rewards" aria-busy={busy}>
  {!quote?<div>{(['weekly-boss','season-rank'] as const).map(kind=><button key={kind} disabled={disabled||busy} onClick={()=>void run(async()=>setQuote(await onQuote(kind)))}>{kind==='weekly-boss'?'Weekly':'Rank'}</button>)}</div>:
   <div><output aria-label="Campaign reward amount"><GameIcon name="yarn" size={18}/> {formatEther(BigInt(quote.amount))}</output>
    {quote.used?<span><GameIcon name="check" size={18}/> Claimed</span>:<button disabled={disabled||busy} onClick={()=>void run(async()=>{await onClaim(quote);setQuote({...quote,used:true});})}><GameIcon name="download" size={18}/> Claim</button>}
    <button disabled={disabled||busy} onClick={()=>setQuote(undefined)}>Close</button></div>}
  {error&&<p role="alert">{error}</p>}
  <details><summary>?</summary><p>Weekly: one server-verified boss win this UTC week. Rank: the closed previous season. A funded program and available claim cap are required. Quotes reserve nothing; claims expire in at most ten minutes. No battle-by-battle YARN. Purchases never improve eligibility.</p></details>
 </section>;
}
