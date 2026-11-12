import {useEffect,useState} from 'react';
import type {DepthModel} from '../depth/model';

/** Owned by the visible result so reports, navigation and lazy loading hold the timer. */
export function AutoNextA6({m,reportOpen,onStop}:{m:DepthModel;reportOpen:boolean;onStop:()=>void}) {
 const [seconds,setSeconds]=useState(5),[visible,setVisible]=useState(()=>document.visibilityState==='visible');
 const eligible=m.canAutoContinue,discovery=!!m.state.v4?.journey?.pending.length;
 const waiting=reportOpen||!visible||discovery;
 // Discovery acknowledgements may clone the battle; only a new encounter resets it.
 const encounter=`${m.state.run?.id}:${m.state.run?.current}:${m.battle?.seed}`;
 useEffect(()=>{const changed=()=>setVisible(document.visibilityState==='visible');document.addEventListener('visibilitychange',changed);return()=>document.removeEventListener('visibilitychange',changed);},[]);
 useEffect(()=>{
  setSeconds(5);
  if(!eligible||waiting)return;
  let remaining=5;
  const timer=window.setInterval(()=>{
   // Recheck visibility even if a throttled visibility render has not committed yet.
   if(document.visibilityState!=='visible')return;
   remaining--;setSeconds(remaining);
   if(remaining===0){window.clearInterval(timer);m.continueBattle();}
  },1000);
  return()=>window.clearInterval(timer);
 },[m,eligible,waiting,encounter]);
 if(!eligible)return null;
 return <div className="a6-auto-next"><div role="status" aria-label="Auto-next status" aria-live="off"><b>{m.state.formationC2?`↻ ${waiting?'Ⅱ':seconds+'s'}`:<>Auto-next · {waiting?'Paused':`Continue in ${seconds}s`}</>}</b>{!m.state.formationC2&&<small>Stops for rewards, route choices and rest stops.</small>}</div><button aria-label="Stop Auto-next" onClick={()=>{m.autoContinue=false;m.notify(false);onStop();}}>{m.state.formationC2?'■':'Stop Auto-next'}</button></div>;
}
