import {GameIcon} from '../../../ui/GameIcon';
import {useEffect,useState} from 'react';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import type {DepthModel} from '../depth/model';
import {artPropsA6 as portraitProps} from './art-a6';
import cafePoster from './assets/cafe.webp';
import {Icon} from './Icon';
import {IdleChestA6} from './IdleChestA6';
export function HomeScene({m,onRecruit,onTasks,onTower}:{m:DepthModel;onRecruit:()=>void;onTasks:()=>void;onTower:()=>void}) {
 const [,tick]=useState(0);
 useEffect(()=>{const timer=setInterval(()=>tick(n=>n+1),30000);return()=>clearInterval(timer);},[]);
 const intro=R.introductionA6(m.state),a6=R.gameplayA6(m.state);
 const shift=R.cafeShiftV4(m.state,m.cafeNow),active=!!m.state.run&&!m.state.run.complete;
 const ready=!active&&!shift.rollback&&shift.claims>0&&Object.values(shift.reward).some(n=>n>0);
 const hours=Math.min(8,Math.max(0,(m.cafeNow-m.state.idle.lastAt)/3600000));
 return <div className="uv-scene" aria-label="Living cafe">
  <img className="uv-cafe-poster" src={cafePoster} alt="Lantern-lit cafe, ready for the evening shift"/>
  <div className="uv-ambient" aria-hidden="true"><i className="uv-lantern"/><i className="uv-lantern"/>{[0,1,2,3,4,5].map(i=><i className="uv-mote" key={i}/>)}</div>
  <div className="uv-home-crew" aria-label="Your current crew">{m.state.team.map((id,index)=><figure key={id} style={{animationDelay:`${index*-.8}s`}}><img {...portraitProps(id,'art','compact')} alt={R.CAT_BY_ID[id]!.name}/><figcaption>{R.CAT_BY_ID[id]!.name}</figcaption></figure>)}</div>
  <div className="uv-scene-vignette"/>
  {!m.state.formationC2&&<div className="uv-home-title"><small>THE EVENING SHIFT</small><h1>Your evening crew</h1></div>}
  <button disabled={a6&&m.state.tutorial<3} className="uv-hotspot uv-recruit-hotspot" onClick={onRecruit} aria-label="Recruit counter">{m.state.formationC2?'invitations':'Recruit counter'} <span aria-hidden="true"><GameIcon name="external" size={18}/></span></button>
  <button disabled={a6&&!intro.features.find(f=>f.id==='daily')!.open} className="uv-hotspot uv-board-hotspot" onClick={onTasks} aria-label="Notice board">{m.state.formationC2?'season':'Notice board'} <span aria-hidden="true"><GameIcon name="external" size={18}/></span></button>
  {a6&&intro.features.find(f=>f.id==='tower')!.open&&<button className="uv-hotspot a6-tower-hotspot" onClick={onTower}>Yarn Tower <small>{m.state.cleared.includes(1)?`Floor ${Math.min(30,m.state.towerBest+1)}`:'Clear chapter 1'}</small><span aria-hidden="true"><GameIcon name="external" size={18}/></span></button>}
  {R.gameplayA6(m.state)?<IdleChestA6 m={m}/>:<button className={`uv-tips ${ready?'uv-tips-ready':''}`} disabled={!ready} onClick={()=>m.apply(R.claimCafeShiftV4(m.state,m.cafeNow),'Night tips collected.')} aria-label={`Collect Night tips ${hours.toFixed(1)}/8 h`}><Icon name="chest"/><b>Night tips {hours.toFixed(1)}/8 h</b><small>{ready?'Collect':active?'After your patrol':shift.remaining===0?'Fresh tips tomorrow':`Ready in ${Math.max(1,Math.ceil((shift.readyAt-shift.now)/60000))} min`}</small></button>}
 </div>;
}
