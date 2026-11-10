import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import type { DepthModel } from '../depth/model';
import { RunMap } from '../depth/RunMap';
import { patrolDefaults } from './selectors';
import { Icon } from './Icon';

export function CampaignA6({m}:{m:DepthModel}) {
 const defaults=patrolDefaults(m.state),active=defaults.active,stars=R.starCountV4(m.state);
 return <div className="a6-campaign">
  <div className="a6-map-title"><div><small>BEYOND THE CAFE WINDOWS</small><h2>Lantern streets</h2></div><span aria-label={`${stars} route stars`}>★ {stars}</span></div>
  <details className="a6-chapter-picker" open={!active}><summary>{active?`Chapter ${m.state.run!.chapter} · ${R.CHAPTERS[m.state.run!.chapter-1]!.name}`:"Choose a chapter"}</summary><div className="a6-chapters" aria-label="Campaign chapters">{R.CHAPTERS.map(c=>{
   const unlocked=c.id===1||m.state.cleared.includes(c.id-1),cleared=m.state.cleared.includes(c.id),current=m.state.run?.chapter===c.id;
   const earned=Object.values(m.state.v4?.journey?.stars??{}).filter(r=>r.chapter===c.id).reduce((n,r)=>n+r.conditions.filter(Boolean).length,0);
   return <button key={c.id} className={current?'a6-current-chapter':''} aria-current={current?'step':undefined} disabled={active||!unlocked} onClick={()=>m.start(c.id,'campaign',defaults.band)}>
    <small>Chapter {c.id} · {cleared?'Cleared':unlocked?'Open':'Locked'}</small><b>{c.name}</b><span>★ {earned} · {unlocked?'Explore the rooftops':`Clear chapter ${c.id-1}`}</span>
   </button>;
  })}</div></details>
  <div className="a6-star-chests" aria-label="Star chests">{R.STAR_REWARDS_V4.map(chest=>{const p=R.starRewardPreviewV4(m.state,chest.id);return <button key={chest.id} disabled={!!p.reason} title={p.reason??chest.name} onClick={()=>m.apply(R.claimStarRewardV4(m.state,chest.id),'Star chest collected.')}><Icon name="chest"/><span><b>{p.claimed?'Collected':`${chest.target} stars`}</b><small>{Object.entries(p.reward).map(([id,n])=>`${n} ${id}`).join(' · ')}</small></span><progress aria-label={`${chest.target}-star chest progress`} max={chest.target} value={Math.min(stars,chest.target)}/></button>;})}</div>
  {m.state.run?<div className="a6-night-map"><RunMap m={m}/></div>:<p className="a6-map-empty">Choose the first chapter. Win, keep every cat standing, and finish quickly to earn three stars.</p>}
 </div>;
}
