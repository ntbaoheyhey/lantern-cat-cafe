import {useEffect,useMemo,useRef} from 'react';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import {artPropsA6} from './art-a6';
import './battle-leave.css';

/** A read-only quote of the existing settlement. The model still owns leaving. */
export default function BattleLeaveV3({state,practice,wasPaused,onCancel,onConfirm}:{
 state:R.DepthAccount;practice:boolean;wasPaused:boolean;onCancel:()=>void;onConfirm:()=>void;
}) {
 const dialog=useRef<HTMLDialogElement>(null);
 const preview=useMemo(()=>practice?null:R.abandonRun(state),[state,practice]);
 const run=state.run,tower=!practice&&!!run?.towerA6,next=preview?.ok?preview.state:null;
 const title=practice?'Leave practice?':tower?`Leave floor ${run!.floor}?`:'End this patrol?';
 const gains=next?Object.entries(state.account.currencies).flatMap(([id,value])=>{
  const amount=next.account.currencies[id as keyof typeof state.account.currencies]-value;
  return amount>0?[`+${amount} ${id}`]:[];
 }):[];
 if(next){
  const xp=next.account.accountXp-state.account.accountXp,materials=next.materials-state.materials;
  if(xp>0)gains.push(`+${xp} account XP`);
  if(materials>0)gains.push(`+${materials} mastery materials`);
 }
 const usesGift=!!next&&next.account.daily.battles>state.account.daily.battles;
 const usesChallenge=!!next&&next.challengeClaims.length>state.challengeClaims.length;
 const close=()=>{dialog.current?.close();onCancel();};
 useEffect(()=>{const element=dialog.current!;element.showModal();return()=>element.close();},[]);
 return <dialog ref={dialog} className="uv-leave-table" aria-labelledby="leave-table-title" aria-describedby="leave-table-consequence" onCancel={e=>{e.preventDefault();close();}} onKeyDown={e=>{
  if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close();}
  if(e.key==='Tab'){
   const buttons=[...e.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')],first=buttons[0],last=buttons.at(-1);
   if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}
   else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}
  }
 }}>
  <header><img {...artPropsA6('mochi')} alt=""/><div><small>Battle paused · Return to the cafe</small><h2 id="leave-table-title">{title}</h2></div></header>
  <div className="uv-leave-copy">
   <p id="leave-table-consequence">{practice?'Leave without the practice reward. Your free invitation is still available if you have not used it.':tower?'This attempt ends here. You can try the same floor again from the Tower.': 'This patrol ends here. Your next patrol starts at the first stop.'}</p>
   {!practice&&<><p>You keep items and gear already added to your Bag. Route charms, skill boosts, points and tonics end here.</p>
    <section className="uv-leave-gift" aria-label="Leaving reward"><b>{tower?'No floor-clear gift':'Partial route gift now'}</b><p>{gains.length?gains.join(' · '):'No new supplies or account XP.'}</p>
     {usesGift?<small>Uses 1 of today’s 6 route gifts ({next!.account.daily.battles}/6 used after leaving).</small>:<small>{tower?'Leaving does not claim a floor gift.':state.account.daily.battles>=6?'All 6 route gifts were already used today.':'This challenge’s gift was already claimed.'}</small>}
     {usesChallenge&&<p className="uv-leave-challenge">Uses this {run?.mode==='daily'?'daily challenge’s':'Tower challenge’s'} gift even though you have not cleared it.</p>}
    </section>
    {run?.battle?.initial.packedSupply&&<p>{run.battle.v4?.committed?'The packed supply used for this fight stays spent.':'The unused packed supply returns to your Bag.'}</p>}
   </>}
   {preview&&!preview.ok&&<p role="alert">{preview.error}</p>}
   <p className="uv-leave-return">{wasPaused?'Keep fighting returns to the paused table.':'Keep fighting resumes the auto battle.'}</p>
  </div>
  <footer><button autoFocus onClick={close}>Keep fighting</button><button className="uv-leave-confirm" disabled={!!preview&&!preview.ok} onClick={()=>{dialog.current?.close();onConfirm();}}>{practice?'Leave practice':tower?'Leave floor':'End patrol'}</button></footer>
 </dialog>;
}
