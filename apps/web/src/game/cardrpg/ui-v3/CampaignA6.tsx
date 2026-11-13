import {GameIcon} from '../../../ui/GameIcon';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import type { DepthModel } from '../depth/model';
import { RunMap } from '../depth/RunMap';
import { patrolDefaults } from './selectors';
import {CampaignSceneryA6} from './CampaignSceneryA6';
import {artPropsA6} from './art-a6';

export function CampaignA6({m}:{m:DepthModel}) {
 const defaults=patrolDefaults(m.state),active=defaults.active,stars=R.starCountV4(m.state);
 return <div className="a6-campaign">
  <nav className="a6-chapter-picker" aria-label="Choose a chapter"><div className="a6-chapters" aria-label="Campaign chapters">{R.CHAPTERS.filter(c=>!m.state.formationC2||!active||c.id===m.state.run?.chapter).map(c=>{
   const unlocked=c.id===1||m.state.cleared.includes(c.id-1),cleared=m.state.cleared.includes(c.id),current=m.state.run?.chapter===c.id;
   const earned=Object.values(m.state.v4?.journey?.stars??{}).filter(r=>r.chapter===c.id).reduce((n,r)=>n+r.conditions.filter(Boolean).length,0);
   return <button key={c.id} className={current?'a6-current-chapter':''} aria-label={`Chapter ${c.id} · ${c.name} · ${cleared?'Cleared':unlocked?'Open':'Locked'}`} aria-current={current?'step':undefined} disabled={active||!unlocked} onClick={()=>m.start(c.id,'campaign',defaults.band)}>
    <img {...artPropsA6(c.boss)} alt=""/><small>{m.state.formationC2?`${c.id} · ${cleared?'Done':unlocked?'to':'Locked'}`:<>Chapter {c.id} · {cleared?'Cleared':unlocked?'Open':'Locked'}</>}</small><b>{c.name}</b><span><GameIcon name="season" size={18}/> {earned}{!m.state.formationC2&&<> · {unlocked?'Explore the rooftops':`Clear chapter ${c.id-1}`}</>}</span>
   </button>;
  })}</div><div className="a6-route-total" aria-label={`${stars} route stars`}><b><GameIcon name="season" size={18}/> {stars}</b>{!m.state.formationC2&&<small>Route stars</small>}</div></nav>
  {m.state.run?<div className="a6-night-map"><RunMap m={m} scenicMap={<CampaignSceneryA6 m={m}/>}/></div>:<CampaignSceneryA6 m={m}/>}

 </div>;
}
