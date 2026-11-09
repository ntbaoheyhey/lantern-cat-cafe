// REFERENCE: reports/cardrpg-look/skills-v5/SPEC.md; B2 presentation stack; no rule changes.
import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createPortal } from 'react-dom';
import DepthApp from '../../../apps/web/src/game/cardrpg/depth/App';
import { STATUSES, STATUS_BY_ID } from '../../../packages/game-rules/src/cardrpg/depth/catalog';
import type { StatusId } from '../../../packages/game-rules/src/cardrpg/depth/contract';
import { STATUS_IDENTITIES } from '../../../apps/web/src/game/squad/turn3d/card-status-data';
import { setLookV2 } from '../../../apps/web/src/game/squad/turn3d/look-v2';
import '../../../apps/web/src/game/cardrpg/look-tokens.css';
import './review.css';
setLookV2(true);
function Demo(){
 const [host,setHost]=useState<HTMLElement|null>(null),[open,setOpen]=useState(false),[preview,setPreview]=useState(false),[status,setStatus]=useState<StatusId>('scald');
 const dialog=useRef<HTMLDialogElement>(null);
 useEffect(()=>setHost(document.querySelector('.cr-topbar')),[]);
 useEffect(()=>{if(open)dialog.current?.showModal();else dialog.current?.close();},[open]);
 const inspect=(id:StatusId)=>{
  const m=window.__depthReview;if(!m)return;
  m.inspect('mochi-1',-1);m.paused=true;
  for(const actor of m.galleryBattle!.actors)actor.statuses=['mochi','button-guard'].includes(actor.catalogId)?[{id,stacks:STATUS_BY_ID[id].cap,remaining:STATUS_BY_ID[id].duration,source:actor.id,appliedRound:1}]:[];
  m.notify(false);setStatus(id);setPreview(true);setOpen(false);
 };
 return <><DepthApp offline />{host&&createPortal(<button className="v5-guide-button" onClick={()=>setOpen(true)}>Status guide</button>,host)}
 <dialog ref={dialog} className="v5-guide" onCancel={()=>setOpen(false)} onClose={()=>setOpen(false)}>
  <header><div><small>THE LANTERN · SKILLS V5 LOOK</small><h2>What is on this unit?</h2></div><button onClick={()=>setOpen(false)} autoFocus>Close guide</button></header>
  <p>Hover or focus a battle badge for its current rule, stacks and rounds left. The ring tracks remaining rounds. Four badges stay visible; +N reveals the rest.</p>
  <div className="v5-guide-grid">{STATUSES.map(rule=>{const look=STATUS_IDENTITIES[rule.id];return <button key={rule.id} onClick={()=>inspect(rule.id)}><svg viewBox="0 0 24 24" width="32" height="32" aria-hidden="true"><path d={look.path} fill="none" stroke={look.color} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" /></svg><b>{look.name} <small>{look.subtitle}</small></b><span>{rule.description}</span><em>Preview on Mochi + Button Guard</em></button>})}</div>
  <p>Previews demonstrate each status on both sides. Ordinary battles use the current rules. Bleed, Bitter and more combos are planned for a later update.</p>
 </dialog>
 {preview&&<div className="v5-preview" aria-label="Status preview controls"><b>Status preview fixture</b><label>Status<select value={status} onChange={e=>inspect(e.target.value as StatusId)}>{STATUSES.map(s=><option value={s.id} key={s.id}>{STATUS_IDENTITIES[s.id].name} · {s.name}</option>)}</select></label><button onClick={()=>{window.__depthReview?.closeGallery();setPreview(false);setOpen(true);}}>Back to guide</button></div>}
 </>;
}
createRoot(document.getElementById('root')!).render(<Demo />);
