import {useSyncExternalStore} from 'react';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import type {DepthModel} from '../depth/model';
import {DiscoveriesV4} from '../depth/JourneyV4';
import {currencyIconA6} from './CountUpA6';
import {artPropsA6} from './art-a6';

type MilestoneKind = typeof R.MILESTONES_V4[number]['kind'];
function JournalStamp({kind}:{kind:MilestoneKind}) {
 return <svg className="a6-journal-stamp" viewBox="0 0 80 80" fill="none" aria-hidden="true">
  <circle cx="40" cy="40" r="34" fill="currentColor" opacity=".1"/>
  <circle cx="40" cy="40" r="29" stroke="currentColor" strokeWidth="2" strokeDasharray="2 5"/>
  <g stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
   {kind==='cats'?<><path d="M27 48c-3-14 12-11 13-7 5-7 17-8 15 5s-12 13-17 10-10-1-11-8Z" fill="currentColor" opacity=".8"/><ellipse cx="25" cy="34" rx="4" ry="6"/><ellipse cx="35" cy="27" rx="4" ry="6"/><ellipse cx="47" cy="28" rx="4" ry="6"/><ellipse cx="57" cy="36" rx="4" ry="6"/></>:
    kind==='gear'?<><path d="M30 24v-4q10-10 20 0v4M28 24q12 5 24 0l3 15 7 20q-22 7-44 0l7-20Z"/><path d="M30 42q10 4 20 0l-2 10q-8 4-16 0Z"/><path d="m24 34-7-3m39 3 7-3"/></>:
    kind==='sets'?<><path d="M26 48 23 65l12-7 6 9 6-20m2 1 9 13 2-13 8-3-15-10"/><path d="m40 15 7 5 8 1 1 9 5 7-5 7-1 9-8 1-7 5-7-5-8-1-1-9-5-7 5-7 1-9 8-1Z"/><path d="m31 36 7 8 13-16"/></>:
    kind==='chapters'?<><path d="M33 23v-6q7-8 14 0v6M25 29l7-6h16l7 6-4 32H29ZM23 64h34M25 29h30"/><path d="m40 35 7 10-7 12-7-12Z"/><path d="m16 25-5-4m53 4 5-4m-29-14v-5"/></>:
    <><path d="m16 25 16-7 16 7 16-7v39l-16 7-16-7-16 7ZM32 18v39m16-32v39"/><path d="M24 45c8-17 22 15 32-12" strokeDasharray="3 4"/><path d="m52 29 8 8m0-8-8 8"/></>}
  </g>
 </svg>;
}

export function JournalA6({m}:{m:DepthModel}) {
 useSyncExternalStore(m.subscribe,m.snapshot);
 const journal=R.journalV4(m.state),milestones=R.MILESTONES_V4.map(x=>R.milestonePreviewV4(m.state,x.id));
 const ready=milestones.filter(p=>!p.reason),collected=milestones.filter(p=>p.claimed).length;
 const starGifts=R.STAR_REWARDS_V4.filter(g=>!R.starRewardPreviewV4(m.state,g.id).reason).length;
 const crew=m.state.team.slice(0,3);
 return <section className="a6-journal" aria-label="Your collection journal">
  <header className="a6-journal-intro">
   <div className="a6-journal-photos" aria-hidden="true">{crew.map(id=><div key={id}><img {...artPropsA6(id)} alt=""/><span>{R.CAT_BY_ID[id]?.name}</span></div>)}</div>
   <div className="a6-journal-title"><small>THE CAFE KEEPSAKE BOOK</small><h2>Little moments, kept forever.</h2><p>{ready.length?`${ready.length} ${ready.length===1?'gift is':'gifts are'} ready for your crew.`:collected===milestones.length?'Every milestone collected. Another evening awaits.':'Every new friend and every walk adds a page.'}</p>
    <dl className="a6-journal-counts"><div><dt>Companions</dt><dd>{journal.cats.length}<small> / {R.CATS.length}</small></dd></div><div><dt>Gear designs</dt><dd>{journal.gear.length}<small> / {R.GEAR.length}</small></dd></div><div><dt>Full sets</dt><dd>{journal.sets.length}<small> / {R.SETS.length}</small></dd></div><div><dt>Routes home</dt><dd>{journal.rewardedRoutes}</dd></div></dl>
   </div>
  </header>
  <div className="a6-journal-milestones" aria-label="Collection milestones">{milestones.map(p=><article className="a6-journal-ticket" key={p.id} data-status={p.claimed?'collected':p.reason?'waiting':'ready'}>
   <div className="a6-journal-ticket-top"><JournalStamp kind={p.kind}/><span>{p.claimed?'Collected':p.reason?(p.progress>=p.target?'Gift waiting':'A little further'):'Gift ready'}</span></div>
   <h3>{p.name}</h3><label className="a6-journal-progress"><span>{Math.min(p.progress,p.target)} / {p.target}</span><progress aria-label={`${p.name} progress`} value={p.progress} max={p.target}/></label>
   <div className="a6-journal-reward">{p.claimed?<><span aria-hidden="true">✓</span> Moment saved</>:p.ribbon?<><span aria-hidden="true">✦</span> Cafe ribbon</>:<span className="a6-journal-currency">{Object.entries(p.reward).map(([id,count])=><span key={id}><i aria-hidden="true">{currencyIconA6(id)}</i><b>{count} {id==='fish'?'fish':id}</b></span>)}</span>}</div>
   <p className="a6-journal-reason">{p.claimed?'Keep exploring with your crew.':p.reason??'A thank-you for the journey.'}</p>
   <button className={!p.reason?'cr-primary':undefined} aria-label={`Claim ${p.name}`} disabled={!!p.reason} onClick={()=>m.apply(R.claimMilestoneV4(m.state,p.id),`${p.name} collected.`)}>{p.claimed?'Collected':'Collect gift'}</button>
  </article>)}</div>
  <details className="a6-journal-pages"><summary>Open your discovery pages <span>{starGifts?`${starGifts} star ${starGifts===1?'gift':'gifts'} ready`:`${m.state.v4?.journey?.found.length??0} discoveries`}</span></summary><DiscoveriesV4 m={m}/></details>
  <details className="a6-journal-pages"><summary>Browse your collection <span>{journal.cats.length} companions · {journal.gear.length} designs</span></summary><h3>Companions</h3><p>{journal.cats.map(id=>R.CAT_BY_ID[id]?.name).filter(Boolean).join(' · ')||'A new friend is waiting at the recruit counter.'}</p><h3>Gear designs</h3><p>{journal.gear.map(id=>R.GEAR_BY_ID[id]?.name).filter(Boolean).join(' · ')||'Find your first keepsake on Night Patrol.'}</p></details>
  <details className="a6-journal-pages"><summary>Revisit your evenings <span>Chapter mastery and battle notes</span></summary><div className="a6-journal-chapters">{R.CHAPTERS.map(c=><p key={c.id}><b>{c.name}</b><span>{m.state.masteries.includes(c.id)?'Mastered':m.state.cleared.includes(c.id)?'Cleared':'Still to explore'}</span></p>)}</div><div className="cr-actions"><button onClick={()=>m.go('codex')}>Open field guide</button><button onClick={()=>m.go('save')}>Review last battle</button></div></details>
 </section>;
}
