import {GameIcon} from '../../../ui/GameIcon';
import {RecruitOddsC2} from './OddsC2';
import {HelpC2} from './TextDietC2';
import {useId,useMemo,useSyncExternalStore} from 'react';
import {CARD_RPG_CONFIG,emptyPity} from '@taskbar-hero/game-rules/cardrpg';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import {firstInvitation} from '@taskbar-hero/game-rules/src/cardrpg/depth/onboarding';
import type {DepthModel} from '../depth/model';

/** Eligibility uses the same command and seed as the click; no random reward is disclosed. */
export function RecruitActionsA6({m,bannerId,revealing,onInvite}:{m:DepthModel;bannerId:string;revealing:boolean;onInvite:(count:number,welcome?:boolean)=>void}){
 useSyncExternalStore(m.subscribe,m.snapshot);
 const state=m.state,id=useId(),quotes=useMemo(()=>{
  const banner=R.invitationBannerV4(bannerId,state),pity=state.account.pity[banner.pityGroup]??emptyPity();
  const seed=state.account.seed+pity.totalPulls*101+39,stamps=state.account.currencies.stamps,marks=R.selectorMarksV4(state);
  const remaining=Math.max(0,CARD_RPG_CONFIG.maxDrawsPerDay-state.account.daily.draws),room=Math.max(0,R.GEAR_CAP_V4-state.gear.length);
  return [...(bannerId==='standard'&&!state.freeInvite?[{count:1,welcome:true}]:[]),{count:1,welcome:false},{count:10,welcome:false}].map(({count,welcome})=>{
   const result=welcome?firstInvitation(state,4):R.metaCommand(state,{type:'pull',bannerId,count,seed}),cost=welcome?0:banner.cost.stamps!*count,needs:string[]=[];
   if(state.run&&!state.run.complete)needs.push('Finish your route to recruit.');
   if(stamps<cost)needs.push(`Need ${cost-stamps} more stamps.`);
   if(remaining<count)needs.push(`${remaining} invitation${remaining===1?'':'s'} left today; this needs ${count}.`);
   if(!welcome&&banner.kind==='equipment'&&room<count)needs.push(`${room} gear spaces free; this needs ${count}.`);
   if(!result.ok&&!needs.length)needs.push(result.error??'This invitation is unavailable.');
   const after=welcome?'Free · stamps unchanged · no marks added. Uses one daily invitation.':stamps>=cost?`${stamps} to ${stamps-cost} stamps · +${count} mark${count===1?'':'s'}.`:`${cost} stamps total · +${count} mark${count===1?'':'s'}.`;
   return {count,welcome,ok:result.ok,cost,needs,after,marks,remaining};
  });
 },[state,bannerId]);
 return <><div className="uv-recruit-buttons a6-recruit-purchases">{quotes.map(q=>{const key=q.welcome?'welcome':String(q.count),description=`${id}-${key}`;return <div key={key} role="group" aria-label={q.welcome?'Free welcome':`${q.count} invitation purchase`}>
  <button className={q.welcome?'uv-fight':q.count===10?'cr-primary':undefined} aria-describedby={description} disabled={revealing||!q.ok} onClick={()=>onInvite(q.count,q.welcome)}>{state.formationC2&&<GameIcon name="invitations" size={26}/>} {q.welcome?(state.formationC2?'Welcome':'Welcome a friend'):`Recruit ×${q.count} · ${q.cost}`}</button>
  <div id={description} className="a6-recruit-quote"><HelpC2 label="Invitation cost"><p>{state.economyV3?q.after.replaceAll('stamps','Bells'):q.after}</p>{q.needs.length>0&&<ul>{q.needs.map(need=><li key={need}>{state.economyV3?need.replaceAll('stamps','Bells'):need}</li>)}</ul>}</HelpC2>{state.economyV3&&<RecruitOddsC2 state={state} bannerId={bannerId}/>}</div>
 </div>;})}</div><p className="a6-recruit-limits">{state.formationC2?<span aria-label="Daily invitations left and saved marks"><GameIcon name="invitations" size={18}/> {quotes[0]!.remaining}/30 · <GameIcon name="season" size={18}/> {quotes[0]!.marks}</span>:<>{quotes[0]!.remaining} invitation{quotes[0]!.remaining===1?'':'s'} left today · resets daily.<br/>{quotes[0]!.marks} marks saved · {R.SELECTOR_COST_V4} choose one reward.<br/>Earned stamps only · from patrols and tasks.</>}</p></>;
}
