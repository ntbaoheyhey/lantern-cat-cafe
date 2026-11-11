import {useEffect,useRef} from 'react';
import type {Battle,BattleEvent} from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import {artPropsA6} from './art-a6';
import {battleLogCopy} from './battle-log-copy';
import './battle-log.css';

/** Reads the existing event log; the parent owns the playback pause and return. */
export default function BattleLogV3({battle,wasPaused,onClose}:{battle:Battle;wasPaused:boolean;onClose:()=>void}) {
 const dialog=useRef<HTMLDialogElement>(null);
 const entries=battle.log.slice(-100).map((event,index)=>({event,index:Math.max(0,battle.log.length-100)+index})).reverse();
 const rounds:Array<{round:number;entries:Array<{event:BattleEvent;index:number}>}>=[];
 for(const entry of entries){
  let group=rounds.at(-1);
  if(!group||group.round!==entry.event.round){group={round:entry.event.round,entries:[]};rounds.push(group);}
  group.entries.push(entry);
 }
 useEffect(()=>{const el=dialog.current!;el.showModal();return()=>el.close();},[]);
 const close=()=>{dialog.current?.close();onClose();};
 return <dialog ref={dialog} className="uv-battle-log" aria-labelledby="battle-log-title" aria-describedby="battle-log-return"
  onCancel={e=>{e.preventDefault();close();}} onKeyDown={e=>{
   // Space scrolls the focused events page. It must not reach the battle's
   // global pause shortcut and resume combat behind this modal.
   e.stopPropagation();
   if(e.key==='Tab'){
    const controls=[...e.currentTarget.querySelectorAll<HTMLElement>('button,[tabindex="0"]')];
    const first=controls[0],last=controls.at(-1);
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}
   }
  }}>
  <header className="a6-log-header"><div><small>The Lantern · field notes</small><h2 id="battle-log-title">Battle log</h2></div><button autoFocus onClick={close}>Close log</button></header>
  <div className="a6-log-book">
   <aside className="a6-log-cover"><span className="a6-log-seal" aria-hidden="true">✦</span><img {...artPropsA6('soot')} alt=""/><div><b>Round {battle.round}</b><p>Battle paused</p><p id="battle-log-return">{wasPaused?'The table will stay paused when you close this book.':'Close this book to resume the auto battle.'}</p></div></aside>
   <section className="a6-log-page" aria-label="Recorded events">
    <div className="a6-log-count">{entries.length?`${entries.length===battle.log.length?entries.length:`Latest ${entries.length} of ${battle.log.length}`} events · Newest first`:'A fresh page'}</div>
    {entries.length?<div className="a6-log-events" role="region" aria-label="Battle events, newest first" tabIndex={0}>
     {rounds.map((group,i)=><section className="a6-log-round" key={i}><h3>Round {group.round}</h3><ol>{group.entries.map(({event,index})=>{
      const copy=battleLogCopy(battle,event);
      return <li key={index} data-event-index={index}><span aria-hidden="true">✧</span><div><b className="a6-log-context">{copy.context}</b><p>{copy.summary}</p></div></li>;
     })}</ol></section>)}
    </div>:<div className="a6-log-empty"><span aria-hidden="true">✧</span><h3>The first page is waiting</h3><p>Attacks, heals and other battle moments will appear here once the crew begins.</p><p>Close the log to return to the table.</p></div>}
   </section>
  </div>
 </dialog>;
}
