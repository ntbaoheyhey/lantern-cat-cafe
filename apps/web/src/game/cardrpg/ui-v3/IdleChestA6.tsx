import { useEffect, useId, useRef, useState, useSyncExternalStore } from 'react';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import type { DepthModel } from '../depth/model';
import { currencyIconA6 } from './CountUpA6';
import { giftReducedA6 } from './GiftAmountsA6';
import {HelpC2,useTextDiet} from './TextDietC2';
import './idle-a6.css';

/** Original wooden cafe tip box, with a brass lantern clasp. */
function TipBox(){
 return <svg className="a6-tip-illustration" viewBox="0 0 180 126" aria-hidden="true">
  <ellipse cx="90" cy="116" rx="74" ry="9" fill="#261e2c" opacity=".4"/>
  <path d="M26 57 154 57 148 109Q90 123 32 109Z" fill="#70432d" stroke="#382b2c" strokeWidth="3"/>
  <path d="M32 64H148L144 102Q90 113 36 102Z" fill="#a4683d"/>
  <path d="M37 80Q88 87 145 80M36 95Q86 103 144 95M59 65V106M120 64V107" fill="none" stroke="#75482f" strokeWidth="2"/>
  <path d="M24 57Q24 24 50 22H130Q156 24 156 57L150 67H30Z" fill="#c18b51" stroke="#50352b" strokeWidth="3"/>
  <path d="M28 48Q31 28 51 27H129Q149 29 152 48Z" fill="#e0ac68"/>
  <path d="M31 48H150M29 57H153M48 31H133" fill="none" stroke="#996039" strokeWidth="2"/>
  <path d="M48 24H59L56 110 43 107ZM122 24H133L138 107 125 110Z" fill="#d9b06b" stroke="#805832" strokeWidth="2"/>
  <path d="M51 31 48 101M128 31 132 101" stroke="#fbe0a0" strokeWidth="2"/>
  <path d="M77 59H103V85L90 94 77 85Z" fill="#e6bb6a" stroke="#704b2d" strokeWidth="2"/>
  <path d="M84 68H96V82H84Z" fill="#795038"/><path d="M86 68V65Q90 59 94 65V68M90 70V79" fill="none" stroke="#fff0b4" strokeWidth="2"/>
  <path d="M19 22 23 11 27 22 38 26 27 30 23 41 19 30 8 26ZM157 34 160 25 163 34 172 37 163 40 160 49 157 40 148 37Z" className="a6-tip-sparkle" fill="#ffe9a0"/>
 </svg>;
}

export function IdleChestA6({m}:{m:DepthModel}) {
 useSyncExternalStore(m.subscribe,m.snapshot);
 const p=R.idleChestA6(m.state,m.cafeNow),fast=R.idleChestA6(m.state,m.cafeNow,true),[collected,setCollected]=useState(false);
 const [review,setReview]=useState<'tips'|'fast'|null>(null),[receipt,setReceipt]=useState('');
 useEffect(()=>{if(!collected)return;const timer=setTimeout(()=>setCollected(false),1800);return()=>clearTimeout(timer);},[collected]);
 const collect=(quick=false)=>{const preview=R.idleChestA6(m.state,m.cafeNow,quick);if(m.apply(R.claimIdleA6(m.state,m.cafeNow,quick),'Night tips collected.')){setCollected(true);setReceipt('Collected '+Object.entries(preview.reward).filter(([,n])=>n>0).map(([id,n])=>`${n} ${id}`).join(' · ')+(quick?'. Saved tips kept.':'. Tip timer restarted.'));}};
 const open=(kind:'tips'|'fast')=>{setReceipt('');setReview(kind);};
 const status=p.claims?'Review & collect →':p.rollback?'Waiting for the cafe clock':p.reason==='Finish your patrol first.'?'Available after your patrol':p.effectiveMinutes<10?`Ready in ${Math.ceil((p.readyAt-p.now)/60000)} min`:'Daily supplies full';
 return <><div className={`a6-idle a6-tip-corner ${collected?'a6-idle-collected':''}`} data-reduced={m.state.settings.reducedMotion} data-ready={!!p.claims}>
  <button className="uv-tips" onClick={()=>open('tips')} aria-label="Review Night tips" title="Review saved tips and today’s limits">
   <TipBox/>
   <span className="a6-tip-sign"><b>Night tips</b><small>{(p.elapsed/3600).toFixed(1)} / 12 h{!m.state.formationC2&&' saved'}</small><progress aria-label="Night tips fill" max={43200} value={p.elapsed}/>
    <span className="a6-tip-amounts"><span>{currencyIconA6('fish')} {p.reward.fish??0}{!m.state.formationC2&&' fish'}</span><span>{currencyIconA6('threads')} {p.reward.threads??0}{!m.state.formationC2&&' threads'}</span><span>{currencyIconA6('stamps')} {p.reward.stamps??0}{!m.state.formationC2&&' stamps'}</span></span>
    <span className="a6-tip-status" aria-label={status}>{m.state.formationC2?(p.claims?'✓':'◷'):status}</span>
   </span>
  </button>
  <button className="a6-fast-reward" data-ready={!fast.reason} onClick={()=>open('fast')} aria-label="Review Fast reward" title="Review one hour of rewards; saved tips stay in the chest"><b>{m.state.formationC2?'⚡ 1 h':'Fast reward · 1 h'}</b><small>{fast.remaining}/2{!m.state.formationC2&&' free today'}</small></button>
  {collected&&!review&&<span className="a6-idle-feedback" role="status">Tips collected!</span>}
 </div>{review&&<IdleRewardSheet p={p} fast={fast} selected={review} receipt={receipt} onCollect={collect} onClose={()=>setReview(null)}/>}</>;
}

function IdleRewardSheet({p,fast,selected,receipt,onCollect,onClose}:{p:ReturnType<typeof R.idleChestA6>;fast:ReturnType<typeof R.idleChestA6>;selected:'tips'|'fast';receipt:string;onCollect:(fast:boolean)=>void;onClose:()=>void}) {
 const compact=useTextDiet();
 const dialog=useRef<HTMLDialogElement>(null),id=useId();
 useEffect(()=>{const element=dialog.current!,previous=document.activeElement as HTMLElement|null;element.showModal();element.querySelector('button')?.focus();return()=>{element.close();if(previous?.isConnected)previous.focus({preventScroll:true});};},[]);
 return <dialog ref={dialog} className={`a6-tip-review ${compact?'c2-tip-review':''}`} aria-labelledby={id+'-title'} onCancel={event=>{event.preventDefault();onClose();}} onKeyDown={event=>{
  if(event.key==='Escape'){event.preventDefault();event.stopPropagation();onClose();}
  if(event.key==='Tab'){event.stopPropagation();const controls=Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')).filter(b=>b.getClientRects().length),first=controls[0],last=controls.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}}
 }}>
  {compact?<><header><TipBox/><h2 id={id+'-title'}>Night tips</h2><button aria-label="Back to cafe" onClick={onClose}>×</button></header><div className="a6-tip-review-cards">{[{kind:'tips',preview:p},{kind:'fast',preview:fast}].map(({kind,preview})=>{const quick=kind==='fast',reduced=giftReducedA6(preview.requested,preview.reward);return <article key={kind} data-reward={kind} data-selected={selected===kind}><h3>{quick?'Fast reward':'Saved tips'}</h3><b>{quick?`⚡ 1 h · ${fast.remaining}/2`:`◷ ${(p.elapsed/3600).toFixed(1)}/${p.capHours} h`}</b><div className="c2-gift-amounts">{(['fish','threads','stamps']as const).map(currency=><span key={currency} aria-label={`${currency}: ${preview.reward[currency]??0} of ${preview.requested[currency]}`}>{currencyIconA6(currency)} {reduced&&<s>{preview.requested[currency]}</s>} {preview.reward[currency]??0}</span>)}</div><HelpC2 label={quick?'Fast reward details':'Saved tip details'}><p>{quick?'Uses one free reward; saved tips stay in the chest.':'Collecting empties saved tips and restarts the timer.'}</p>{reduced&&<p>Today’s limits reduce this reward. The missing supplies are lost if you collect now.</p>}<p>{preview.reason}</p></HelpC2><button disabled={!!preview.reason} aria-label={quick?'Collect fast reward':'Collect saved tips'} onClick={()=>onCollect(quick)}>{reduced?'Collect less':'Collect'}</button></article>;})}</div><p role="status" aria-label={receipt}>{receipt?'✓':''}</p></>:<>
  <header><TipBox/><div><small>THE CAFE TIP BOX</small><h2 id={id+'-title'}>Night tips and fast rewards</h2><p>Review your supplies before collecting.</p></div><button onClick={onClose}>Back to cafe</button></header>
  <div className="a6-tip-review-cards">{[{kind:'tips',preview:p},{kind:'fast',preview:fast}].map(({kind,preview})=>{const quick=kind==='fast',reduced=giftReducedA6(preview.requested,preview.reward),detailId=id+'-'+kind;return <article key={kind} data-reward={kind} data-selected={selected===kind}>
   <h3>{quick?'Fast reward':'Saved Night tips'}</h3><p>{quick?`1 hour of tips · ${fast.remaining}/2 free today`:`${(p.elapsed/3600).toFixed(1)} / ${p.capHours} h saved`}</p>
   <div id={detailId}><table><caption className="sr-only">{quick?'Fast reward supplies':'Saved tip supplies'}</caption><thead><tr><th scope="col">Supplies</th><th scope="col">Full amount</th><th scope="col">Collect now</th></tr></thead><tbody>{(['fish','threads','stamps']as const).map(currency=><tr key={currency}><th scope="row">{currency}</th><td>{preview.requested[currency]}</td><td>{preview.reward[currency]??0}</td></tr>)}</tbody></table>
    <p className="a6-tip-consequence">{quick?'Uses 1 free reward. Saved tips stay in the chest.':'Collecting empties all saved tips.'}</p>
    <p>{quick?'Free uses reset each day. Fast rewards do not complete the Evening tips task.':'Saved tips complete the Evening tips task. The chest holds up to 12 hours.'}</p>
    {reduced&&<p className="a6-tip-limit">{quick?'Today’s limits reduce this reward. The missing supplies are lost when you collect.':'Today’s limits reduce these tips. The missing supplies are lost when you collect; you can keep the chest for another day.'}</p>}
    {preview.reason&&<p className="a6-tip-reason">{preview.reason}</p>}
   </div>
   <button disabled={!!preview.reason} aria-describedby={detailId} onClick={()=>onCollect(quick)}>{quick?reduced?'Collect reduced fast reward':'Collect fast reward':reduced?'Collect reduced tips':'Collect saved tips'}</button>
  </article>;})}</div>
  <p className="a6-tip-receipt" role="status">{receipt||'Choose which reward to collect.'}</p>
  </>}
 </dialog>;
}
