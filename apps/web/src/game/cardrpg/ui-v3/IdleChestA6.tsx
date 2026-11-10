import { useState } from 'react';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import type { DepthModel } from '../depth/model';
import { Icon } from './Icon';

export function IdleChestA6({m}:{m:DepthModel}) {
 const p=R.idleChestA6(m.state,m.cafeNow),fast=R.idleChestA6(m.state,m.cafeNow,true),[collected,setCollected]=useState(false);
 const collect=(quick=false)=>{if(m.apply(R.claimIdleA6(m.state,m.cafeNow,quick),'Night tips collected.'))setCollected(true);};
 return <div className={`a6-idle ${collected?'a6-idle-collected':''}`} onAnimationEnd={()=>setCollected(false)}>
  <button className="uv-tips" disabled={!!p.reason} onClick={()=>collect()} aria-label={`Collect Night tips ${(p.elapsed/3600).toFixed(1)}/12 h`} title={p.reason??'Collect your cafe tips'}>
   <Icon name="chest"/><b>Night tips · {(p.elapsed/3600).toFixed(1)}/12 h</b><progress aria-label="Night tips fill" max={43200} value={p.elapsed}/>
   <small>{p.claims?`Collect · ${p.reward.fish??0} fish`:p.reason==='Finish your patrol first.'?'After your patrol':p.effectiveMinutes<10?`Ready in ${Math.ceil((p.readyAt-p.now)/60000)} min`:'Today’s supplies are full'}</small>
  </button>
  <button className="a6-fast-reward" disabled={!!fast.reason} onClick={()=>collect(true)} title={fast.reason??'Collect one hour of tips without emptying the chest'}>Fast reward · 1 h <small>{fast.remaining}/2 today</small></button>
  {collected&&<span className="a6-idle-feedback" role="status">Tips collected!</span>}
 </div>;
}

