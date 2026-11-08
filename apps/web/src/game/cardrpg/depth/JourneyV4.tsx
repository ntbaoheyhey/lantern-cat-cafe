import { useEffect } from 'react';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import type { DepthModel } from './model';
import { CostView } from '../shared';

export function NodeStarsV4({ m, node, goals = false }: { m: DepthModel; node: R.RunNode; goals?: boolean }) {
  const run = m.state.run;
  if (!run?.gameplayV4) return null;
  const conditions = m.state.v4?.journey?.stars[R.nodeStarKeyV4(run,node)]?.conditions ?? [false,false,false];
  const count = conditions.filter(Boolean).length;
  return <span className="dp-v4-stars" aria-label={`${count} of 3 stars`}>
    <span aria-hidden="true">{conditions.map((c,i) => <span key={i} data-earned={c}>{c ? '★' : '☆'}</span>)}</span>
    {goals && <span className="dp-v4-star-goals">{R.nodeStarGoalsV4(node).map((g,i)=><span key={g.id}>{conditions[i] ? '✓ ' : '○ '}{g.text}</span>)}</span>}
  </span>;
}
export function StarBoardV4({ m }: { m: DepthModel }) {
  const stars = R.starCountV4(m.state);
  return <section className="dp-v4-star-board" aria-label="Route star board"><h3>{stars} route stars</h3>
    <p>Each stop has three goals. Earn missing stars on a later visit.</p>
    <div className="dp-v4-meta-grid">{R.STAR_REWARDS_V4.map(goal=>{
      const p=R.starRewardPreviewV4(m.state,goal.id);
      return <article key={goal.id}><b>{goal.name}</b><p>{Math.min(stars,goal.target)}/{goal.target} stars · <CostView cost={p.reward}/></p>
        <button disabled={!!p.reason} onClick={()=>m.apply(R.claimStarRewardV4(m.state,goal.id),'A little thank-you for your route stars.')}>
          {p.claimed?'Collected':`Collect ${goal.target}-star reward`}</button>{p.reason&&!p.claimed&&<small>{p.reason}</small>}</article>;
    })}</div>
  </section>;
}
export function DiscoveriesV4({ m }: { m: DepthModel }) {
  const found=m.state.v4?.journey?.found??[];
  return <section className="dp-v4-discoveries" aria-label="Discoveries"><h2>Discoveries · {found.length}/{R.discoveryIdsV4().length}</h2>
    <p>Crew bonuses, matching sets, new ranks, your first Legendary and star milestones.</p>
    {found.length?<ol>{[...found].reverse().map(d=><li key={d.id}><span>{d.text}</span><small>Day {d.day}</small></li>)}</ol>:<p>Your first discoveries are just ahead.</p>}
    <StarBoardV4 m={m}/>
    {Object.values(m.state.v4?.journey?.stars??{}).length>0&&<details><summary>Your route stars</summary>
      <p>Stars keep your best achievements across visits. They need not come from one encounter.</p>
      <ul>{Object.values(m.state.v4!.journey!.stars).map(r=><li key={r.key}>
        {R.CHAPTERS[r.chapter-1]!.name} · Band {r.band} · {r.kind} {r.nodeId}: {r.conditions.filter(Boolean).length}/3
      </li>)}</ul>
    </details>}
  </section>;
}
export function DiscoveryCelebrationV4({ m }: { m: DepthModel }) {
  const hidden=m.showBattle||m.screen==='gacha'||!R.gameplayV4(m.state);
  const receipt=hidden?undefined:m.state.v4?.journey?.pending[0];
  useEffect(()=>{
    if(!receipt)return;
    const timer=window.setTimeout(()=>m.apply(R.acknowledgeDiscoveryV4(m.state,receipt.sequence),'Discovery saved in your journal.'),1200);
    return ()=>clearTimeout(timer);
  },[m,receipt?.sequence,receipt?.discovery.id,hidden]);
  if(!receipt)return null;
  return <aside className="dp-v4-celebration" data-discovery-sequence={receipt.sequence} data-reduced={m.state.settings.reducedMotion}
    role="status" aria-label="New discovery"><small>A LITTLE MOMENT TO KEEP</small><p>{receipt.text}</p>
    <button onClick={()=>m.apply(R.acknowledgeDiscoveryV4(m.state,receipt.sequence),'Discovery saved in your journal.')}>Skip celebration</button>
  </aside>;
}
