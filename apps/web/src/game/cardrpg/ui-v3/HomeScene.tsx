import {useEffect,useState} from 'react';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import type {DepthModel} from '../depth/model';
import {portraitProps} from '../depth/assets';
import cafePoster from './assets/cafe.webp';
import {Icon} from './Icon';
export function HomeScene({m,onRecruit,onTasks}:{m:DepthModel;onRecruit:()=>void;onTasks:()=>void}) {
 const [,tick]=useState(0);
 useEffect(()=>{const timer=setInterval(()=>tick(n=>n+1),30000);return()=>clearInterval(timer);},[]);
 const shift=R.cafeShiftV4(m.state,m.cafeNow),active=!!m.state.run&&!m.state.run.complete;
 const ready=!active&&!shift.rollback&&shift.claims>0&&Object.values(shift.reward).some(n=>n>0);
 const hours=Math.min(8,Math.max(0,(m.cafeNow-m.state.idle.lastAt)/3600000));
 return <div className="uv-scene" aria-label="Living cafe">
  <img className="uv-cafe-poster" src={cafePoster} alt="Lantern-lit cafe, ready for the evening shift"/>
  <div className="uv-home-crew" aria-label="Your current crew">{m.state.team.map((id,index)=><figure key={id} style={{animationDelay:`${index*-.8}s`}}><img {...portraitProps(id)} alt={R.CAT_BY_ID[id]!.name}/><figcaption>{R.CAT_BY_ID[id]!.name}</figcaption></figure>)}</div>
  <div className="uv-scene-vignette"/>
  <div className="uv-home-title"><small>THE EVENING SHIFT</small><h1>Your evening crew</h1></div>
  <button className="uv-hotspot uv-recruit-hotspot" onClick={onRecruit}>Recruit counter <span aria-hidden="true">↗</span></button>
  <button className="uv-hotspot uv-board-hotspot" onClick={onTasks}>Notice board <span aria-hidden="true">↗</span></button>
  <button className={`uv-tips ${ready?'uv-tips-ready':''}`} disabled={!ready} onClick={()=>m.apply(R.claimCafeShiftV4(m.state,m.cafeNow),'Night tips collected.')} aria-label={`Collect Night tips ${hours.toFixed(1)}/8 h`}><Icon name="chest"/><b>Night tips {hours.toFixed(1)}/8 h</b><small>{ready?'Collect':active?'After your patrol':shift.remaining===0?'Fresh tips tomorrow':`Ready in ${Math.max(1,Math.ceil((shift.readyAt-shift.now)/60000))} min`}</small></button>
 </div>;
}
