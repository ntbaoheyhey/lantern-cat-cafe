import { useEffect, useState } from 'react';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import { PageTitle } from '../shared';
import type { DepthModel } from './model';
import { CompanionPreview } from './CompanionPreview';
import { CafeBoardV4 } from './CafeV4';

export function HomeV4({m}:{m:DepthModel}) {
 const [,tick]=useState(0);
 useEffect(()=>{const timer=window.setInterval(()=>tick(n=>n+1),1000);return()=>clearInterval(timer);},[]);
 const active=!!m.state.run&&!m.state.run.complete,ceiling=Math.min(...m.state.team.map(id=>m.state.account.cards.find(c=>c.cardId===id)!.level));
 const [selected,setSelected]=useState<number|null>(null),band=Math.min(selected??ceiling,ceiling);
 const week=R.firstWeekV4(m.state)!,shift=R.cafeShiftV4(m.state,m.cafeNow),stars=R.starCountV4(m.state);
 const nextStar=Object.values(m.state.v4?.journey?.stars??{}).find(r=>r.conditions.some(c=>!c));
 const starGoal=nextStar?`${R.CHAPTERS[nextStar.chapter-1]!.name}, stop ${Number(nextStar.nodeId.split('-')[0])+1}: ${R.nodeStarGoalsV4({kind:nextStar.kind} as R.RunNode)[nextStar.conditions.findIndex(c=>!c)]!.text}`
  :stars?'Explore another stop for a new star.':'Win your first route encounter.';
 const route=R.CHAPTERS.find(chapter=>!m.state.cleared.includes(chapter.id)&&(chapter.id===1||m.state.cleared.includes(chapter.id-1)))??R.CHAPTERS[2]!;
 const next=active?'Continue your route':m.state.tutorial<3?'Try the practice table':!m.state.freeInvite?'Open your welcome invitation':m.state.tutorial===3?'Equip your first piece':`${m.state.cleared.includes(route.id)?'Revisit':'Explore'} ${route.name}`;
 const goal=active?'Your crew is waiting at the next stop.':m.state.tutorial<3?'Place a sturdy companion in front. Try the practice table.'
  :!m.state.freeInvite?'A new companion is waiting. Open your welcome invitation.':m.state.tutorial===3?'Choose a piece, compare it, then equip your companion.'
  :m.state.account.day===1?`Your crew is ready. Explore ${route.name} and learn the boss’s tricks.`:week.goal;
 const act=()=>active?m.go('map'):m.state.tutorial<3?m.tutorial():!m.state.freeInvite?m.go('gacha'):m.state.tutorial===3?m.go('inventory'):m.start(route.id,'campaign',band);
 return <><PageTitle eyebrow={`Cafe day ${m.state.account.day}`} title="A small light. A brave little team."/>
  <section className="dp-v4-home cr-panel" aria-label="Tonight at home"><div><small>TONIGHT'S LITTLE ADVENTURE</small><h2>Keep the lantern warm.</h2>
   <p>{goal}</p><button className="cr-primary" onClick={act}>{next} →</button>
   {m.state.tutorial<3&&<button className="dp-v4-skip-lesson" onClick={()=>{m.state.tutorial=3;m.notify();}}>Skip lesson</button>}
   <div className="dp-v4-home-pull"><p><b>Next star · {stars} found</b><span>{starGoal}</span></p>
    <p><b>The kettle</b><span>{shift.claims?`${shift.claims} cafe service ready.`:shift.remaining===0?'Fresh service tomorrow.':`Ready in ${Math.max(1,Math.ceil((shift.readyAt-shift.now)/60000))} minutes.`}</span></p></div>
   <p className="dp-v4-home-tomorrow"><b>Tomorrow</b> {week.tomorrow}</p>
  </div><CompanionPreview m={m} home/></section>
  <section className="cr-panel dp-v4-home-routes"><h2>Choose tonight's route</h2>
   <label>Challenge band <select aria-label="Challenge band" disabled={active} value={band} onChange={e=>setSelected(Number(e.target.value))}>
    {Array.from({length:ceiling},(_,i)=><option key={i} value={i+1}>Band {i+1}{i+1===ceiling?' · current crew':''}</option>)}</select></label>
   <div className="cr-route-list">{R.CHAPTERS.map(chapter=><button key={chapter.id} disabled={active||chapter.id>1&&!m.state.cleared.includes(chapter.id-1)} onClick={()=>m.start(chapter.id,'campaign',band)}>
    <span>{chapter.name}<small>{chapter.reward}</small></span><em>{m.state.cleared.includes(chapter.id)?'Cleared ↗':'→'}</em></button>)}</div>
   <details><summary>Daily challenge and tower</summary><div className="cr-actions"><button disabled={active} onClick={()=>m.start(Math.min(3,m.state.cleared.length+1),'daily')}>Daily challenge</button>
    <button disabled={active||!m.state.cleared.includes(3)} onClick={()=>m.start(1,'tower')}>Tower · best {m.state.towerBest}</button></div></details>
  </section><details className="cr-panel dp-v4-home-board"><summary>Cafe service, daily board and star rewards</summary><CafeBoardV4 m={m}/></details>
 </>;
}
