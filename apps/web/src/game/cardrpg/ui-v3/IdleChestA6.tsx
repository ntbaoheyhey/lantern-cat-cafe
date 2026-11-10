import { useEffect, useState } from 'react';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import type { DepthModel } from '../depth/model';
import { currencyIconA6 } from './CountUpA6';
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
 const p=R.idleChestA6(m.state,m.cafeNow),fast=R.idleChestA6(m.state,m.cafeNow,true),[collected,setCollected]=useState(false);
 useEffect(()=>{if(!collected)return;const timer=setTimeout(()=>setCollected(false),1800);return()=>clearTimeout(timer);},[collected]);
 const collect=(quick=false)=>{if(m.apply(R.claimIdleA6(m.state,m.cafeNow,quick),'Night tips collected.'))setCollected(true);};
 const status=p.claims?'Collect your tips':p.rollback?'Waiting for the cafe clock':p.reason==='Finish your patrol first.'?'Available after your patrol':p.effectiveMinutes<10?`Ready in ${Math.ceil((p.readyAt-p.now)/60000)} min`:'Daily supplies full';
 return <div className={`a6-idle a6-tip-corner ${collected?'a6-idle-collected':''}`} data-reduced={m.state.settings.reducedMotion} data-ready={!!p.claims}>
  <button className="uv-tips" disabled={!!p.reason} onClick={()=>collect()} aria-label={`Collect Night tips ${(p.elapsed/3600).toFixed(1)}/12 h`} title={p.reason??'Collect your cafe tips'}>
   <TipBox/>
   <span className="a6-tip-sign"><b>Night tips</b><small>{(p.elapsed/3600).toFixed(1)} / 12 h saved</small><progress aria-label="Night tips fill" max={43200} value={p.elapsed}/>
    <span className="a6-tip-amounts"><span>{currencyIconA6('fish')} {p.reward.fish??0} fish</span><span>{currencyIconA6('threads')} {p.reward.threads??0} threads</span><span>{currencyIconA6('stamps')} {p.reward.stamps??0} stamps</span></span>
    <span className="a6-tip-status">{status}{p.claims?' →':''}</span>
   </span>
  </button>
  <button className="a6-fast-reward" disabled={!!fast.reason} onClick={()=>collect(true)} title={fast.reason??'Collect one hour of tips without emptying the chest'}><b>Fast reward · 1 h</b><small>{fast.remaining}/2 free today</small></button>
  {collected&&<span className="a6-idle-feedback" role="status">Tips collected!</span>}
 </div>;
}
