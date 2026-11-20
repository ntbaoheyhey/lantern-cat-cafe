import {GameIcon} from '../../../ui/GameIcon';
import {HelpC2} from './TextDietC2';
import {useId,useState,useSyncExternalStore} from 'react';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import type {DepthModel} from '../depth/model';
import {GearArtA6} from './KeepsakeArtA6';
import {StarBoardV4} from '../depth/JourneyV4';
import {GiftAmountsA6,giftReducedA6,REDUCED_GIFT_NOTE_A6} from './GiftAmountsA6';
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
 const starPreviews=R.STAR_REWARDS_V4.map(g=>R.starRewardPreviewV4(m.state,g.id)),starGifts=starPreviews.filter(p=>!p.reason).length;
 const [section,setSection]=useState<'keepsakes'|'discoveries'|'collection'|'evenings'>('keepsakes'),panelId=useId();
 const reduced=(section==='keepsakes'?milestones:section==='discoveries'?starPreviews:[]).some(p=>!p.reason&&giftReducedA6(p.requested,p.reward));
 const found=m.state.v4?.journey?.found??[],stars=Object.values(m.state.v4?.journey?.stars??{});
 const crew=m.state.team.slice(0,3);
 if(m.state.formationC2)return <section className="a6-journal c2-journal" aria-label="Your collection journal"><nav className="a6-journal-sections" aria-label="Journal pages">{(['keepsakes','discoveries','collection','evenings'] as const).map((id,i)=><button key={id} aria-pressed={section===id} onClick={()=>setSection(id)}>{['Keepsakes','Discoveries','Collection','Evenings'][i]}</button>)}</nav><div className="c2-journal-counts" aria-label="Collection counts"><GameIcon name="team" size={18}/> {journal.cats.length}/{R.CATS.length} · <GameIcon name="bag" size={18}/> {journal.gear.length}/{R.GEAR.length} · <GameIcon name="bonds" size={18}/> {journal.sets.length}/{R.SETS.length} · <GameIcon name="moon" size={18}/> {journal.rewardedRoutes}</div>
  {section==='keepsakes'&&<div className="a6-journal-milestones" aria-label="Collection milestones">{milestones.map(p=><article className="a6-journal-ticket" key={p.id} data-status={p.claimed?'collected':p.reason?'waiting':'ready'}><JournalStamp kind={p.kind}/><b aria-label={p.name}>{Math.min(p.progress,p.target)}/{p.target}</b><progress aria-label={p.name+' progress'} value={p.progress} max={p.target}/>{!p.claimed&&(p.ribbon?<span><GameIcon name="season" size={18}/></span>:<GiftAmountsA6 requested={p.requested} reward={p.reward}/>)}<HelpC2 label={p.name}><p>{p.reason??'Ready to collect.'}</p>{giftReducedA6(p.requested,p.reward)&&<p>{REDUCED_GIFT_NOTE_A6}</p>}</HelpC2><button aria-label={'Claim '+p.name} disabled={!!p.reason} onClick={()=>m.apply(R.claimMilestoneV4(m.state,p.id),p.name+' collected.')}>{p.claimed?'Done':p.reason?'Locked':'Collect'}</button></article>)}</div>}
  {section==='discoveries'&&<><div className="c2-reward-grid">{starPreviews.map(p=><article key={p.id}><JournalStamp kind="chapters"/><b><GameIcon name="season" size={18}/> {p.progress}/{p.target}</b><GiftAmountsA6 requested={p.requested} reward={p.reward}/><HelpC2 label={p.id}><p>{p.reason??'Ready to collect.'}</p><p>{REDUCED_GIFT_NOTE_A6}</p></HelpC2><button aria-label={'Collect '+p.target+'-star chest'} disabled={!!p.reason} onClick={()=>m.apply(R.claimStarRewardV4(m.state,p.id),'Star chest collected.')}>{p.claimed?'Done':p.reason?'Locked':'Collect'}</button></article>)}</div><HelpC2 label="Discovery history"><ol>{[...found].reverse().map(d=><li key={d.id}>{d.text} · {d.day}</li>)}</ol></HelpC2></>}
  {section==='collection'&&<div className="a6-journal-collection"><div className="a6-journal-companions">{journal.cats.map(id=><figure key={id}><img {...artPropsA6(id)} alt=""/><figcaption>{R.CAT_BY_ID[id]?.name}</figcaption></figure>)}</div><div className="c2-reward-grid">{journal.gear.map(id=>{const g=R.GEAR_BY_ID[id]!;return <div key={id}><GearArtA6 slot={g.slot} setId={g.setId}/><HelpC2 label={g.name}><p>{g.story}</p></HelpC2></div>;})}</div></div>}
  {section==='evenings'&&<><div className="a6-journal-chapters">{R.CHAPTERS.map(c=><article key={c.id} data-cleared={m.state.cleared.includes(c.id)}><JournalStamp kind="chapters"/><h4>{c.name}</h4><b>{m.state.masteries.includes(c.id)?<GameIcon name="season" size={18}/>:m.state.cleared.includes(c.id)?'Done':'Locked'}</b></article>)}</div><button onClick={()=>m.go('codex')}>? Guide</button><button onClick={()=>m.go('save')}><GameIcon name="fight" size={18}/> Replay</button></>}
 </section>;
 return <section className="a6-journal" aria-label="Your collection journal">
  <header className="a6-journal-intro">
   <div className="a6-journal-photos" aria-hidden="true">{crew.map(id=><div key={id}><img {...artPropsA6(id)} alt=""/><span>{R.CAT_BY_ID[id]?.name}</span></div>)}</div>
   <div className="a6-journal-title"><small>THE CAFE KEEPSAKE BOOK</small><h2>Little moments, kept forever.</h2><p id={panelId+'-cap'}>{reduced?REDUCED_GIFT_NOTE_A6:ready.length?`${ready.length} ${ready.length===1?'gift is':'gifts are'} ready for your crew.`:collected===milestones.length?'Every milestone collected. Another evening awaits.':'Every new friend and every walk adds a page.'}</p>
    <dl className="a6-journal-counts"><div><dt>Companions</dt><dd>{journal.cats.length}<small> / {R.CATS.length}</small></dd></div><div><dt>Gear designs</dt><dd>{journal.gear.length}<small> / {R.GEAR.length}</small></dd></div><div><dt>Full sets</dt><dd>{journal.sets.length}<small> / {R.SETS.length}</small></dd></div><div><dt>Routes home</dt><dd>{journal.rewardedRoutes}</dd></div></dl>
   </div>
  </header>
  <nav className="a6-journal-sections" aria-label="Journal pages">
   <button aria-pressed={section==='keepsakes'} aria-controls={panelId} onClick={()=>setSection('keepsakes')}>Keepsakes <span data-ready={ready.length>0}>{ready.length}</span></button>
   <button aria-pressed={section==='discoveries'} aria-controls={panelId} onClick={()=>setSection('discoveries')}>Discoveries <span data-ready={starGifts>0}>{starGifts}</span></button>
   <button aria-pressed={section==='collection'} aria-controls={panelId} onClick={()=>setSection('collection')}>Collection</button>
   <button aria-pressed={section==='evenings'} aria-controls={panelId} onClick={()=>setSection('evenings')}>Evenings</button>
  </nav>
  <div className="a6-journal-view" id={panelId}>
  {section==='keepsakes'&&<div className="a6-journal-milestones" aria-label="Collection milestones">{milestones.map(p=>{const partial=!p.reason&&giftReducedA6(p.requested,p.reward),detailId=panelId+'-'+p.id;return <article className="a6-journal-ticket" key={p.id} data-status={p.claimed?'collected':p.reason?'waiting':'ready'}>
   <div className="a6-journal-ticket-top"><JournalStamp kind={p.kind}/><span>{p.claimed?'Collected':p.reason?(p.progress>=p.target?'Gift waiting':'A little further'):'Gift ready'}</span></div>
   <h3>{p.name}</h3><label className="a6-journal-progress"><span>{Math.min(p.progress,p.target)} / {p.target}</span><progress aria-label={`${p.name} progress`} value={p.progress} max={p.target}/></label>
   <div id={detailId+'-amounts'} className="a6-journal-reward">{p.claimed?<><span aria-hidden="true"><GameIcon name="check" size={18}/></span> Moment saved</>:p.ribbon?<><span aria-hidden="true"><GameIcon name="season" size={18}/></span> Cafe ribbon</>:<GiftAmountsA6 requested={p.requested} reward={p.reward}/>}</div>
   <p id={detailId} className="a6-journal-reason">{p.claimed?'Keep exploring with your crew.':p.reason??(partial?'Uses the whole gift.':'A thank-you for the journey.')}</p>
   <button className={!p.reason?'cr-primary':undefined} aria-label={`Claim ${p.name}`} aria-describedby={detailId+'-amounts '+detailId+(partial?' '+panelId+'-cap':'')} disabled={!!p.reason} onClick={()=>m.apply(R.claimMilestoneV4(m.state,p.id),`${p.name} collected.`)}>{p.claimed?'Collected':partial?'Collect reduced gift':'Collect gift'}</button>
  </article>;})}</div>}
  {section==='discoveries'&&<div className="a6-journal-discoveries">
   <StarBoardV4 m={m} reducedNoteId={panelId+'-cap'}/>
   <section className="a6-journal-notes" aria-label="Discovery history"><header><small>PAGES ADDED ALONG THE WAY</small><h3>{found.length} discoveries</h3></header>
    <div className="a6-journal-scroll" tabIndex={0} role="region" aria-label="Discovery notes">
     {found.length?<ol>{[...found].reverse().map(d=><li key={d.id}><span>{d.text}</span><small>Day {d.day}</small></li>)}</ol>:<div className="a6-journal-empty"><JournalStamp kind="routes"/><p>Your first discoveries are just ahead.</p><small>Crew bonds, matching sets, new ranks and route stars each leave a memory.</small></div>}
     {stars.length>0&&<details><summary>Your route stars</summary><p>Stars keep your best achievements across visits. They need not come from one encounter.</p><ul>{stars.map(r=><li key={r.key}>{R.CHAPTERS[r.chapter-1]!.name} · Band {r.band} · {r.kind} {r.nodeId}: {r.conditions.filter(Boolean).length}/3</li>)}</ul></details>}
    </div>
   </section>
  </div>}
  {section==='collection'&&<div className="a6-journal-collection">
   <section aria-label="Companions in your journal"><header><small>FRIENDS AT THE CAFE</small><h3>{journal.cats.length} companions</h3></header><div className="a6-journal-scroll" tabIndex={0} role="region" aria-label="Companion collection">
    {journal.cats.length?<div className="a6-journal-companions">{journal.cats.map(id=><figure key={id}><img {...artPropsA6(id)} alt=""/><figcaption>{R.CAT_BY_ID[id]?.name}</figcaption></figure>)}</div>:<div className="a6-journal-empty"><JournalStamp kind="cats"/><p>A new friend is waiting at the recruit counter.</p></div>}
   </div></section>
   <section aria-label="Gear designs in your journal"><header><small>KEEPSAKES FOUND TOGETHER</small><h3>{journal.gear.length} gear designs</h3></header><div className="a6-journal-scroll" tabIndex={0} role="region" aria-label="Gear collection">
    {journal.gear.length?<ul className="a6-journal-gear">{journal.gear.map(id=><li key={id}>{R.GEAR_BY_ID[id]?.name}</li>)}</ul>:<div className="a6-journal-empty"><JournalStamp kind="gear"/><p>Find your first keepsake on Night Patrol.</p></div>}
   </div></section>
  </div>}
  {section==='evenings'&&<section className="a6-journal-evenings" aria-label="Your evenings"><header><small>THE WAY BACK HOME</small><h3>Every route leaves a memory.</h3><p>{journal.rewardedRoutes} routes home · {m.state.masteries.length} chapters mastered</p></header>
   <div className="a6-journal-chapters">{R.CHAPTERS.map(c=><article key={c.id} data-cleared={m.state.cleared.includes(c.id)}><JournalStamp kind="chapters"/><small>CHAPTER {c.id}</small><h4>{c.name}</h4><p>{m.state.masteries.includes(c.id)?'Mastered':m.state.cleared.includes(c.id)?'Cleared':'Still to explore'}</p></article>)}</div>
   <footer><p>Take a field note into your next evening, or look back at the last battle.</p><div><button onClick={()=>m.go('codex')}>Open field guide</button><button onClick={()=>m.go('save')}>Review last battle</button></div></footer>
  </section>}
  </div>
 </section>;
}
