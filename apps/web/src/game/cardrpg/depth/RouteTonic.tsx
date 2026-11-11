import {useId,useMemo,useSyncExternalStore} from 'react';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import type {DepthModel} from './model';
import './route-tonic.css';

/** Both route and Bag use the same public transaction for eligibility and recovery. */
export function RouteTonic({m,compact=false}:{m:DepthModel;compact?:boolean}){
 useSyncExternalStore(m.subscribe,m.snapshot);
 const state=m.state,run=state.run,description=useId();
 const preview=useMemo(()=>R.useTonic(state),[state]);
 const body=<section id={description} className="dp-route-tonic-preview" aria-label="Route tonic recovery" aria-live="polite">
  <h3>{run?.supplies??0} route tonic{run?.supplies===1?'':'s'}</h3>
  <p>Restore up to 100 HP to every companion, including fallen cats. For this route only.</p>
  {preview.ok&&run?<>
   <ul>{state.team.map(id=>{const before=run.hp[id]??0,after=preview.state.run!.hp[id]!;return <li key={id}>
    <b>{R.CAT_BY_ID[id]!.name}</b><span>{before} → {after} HP (+{after-before})</span><small>{before===0?'Revives':after===before?'Already full':''}</small>
   </li>;})}</ul>
   <p>Uses 1 route tonic now · {run.supplies} → {preview.state.run!.supplies} remaining.</p>
  </>:<p className="dp-route-tonic-reason">{preview.error}</p>}
  <button aria-describedby={description} disabled={!preview.ok} onClick={()=>m.apply(R.useTonic(m.state),'Route tonic used. Crew HP updated.')}>Use route tonic</button>
 </section>;
 return compact?<details className="dp-route-tonic"><summary>Review tonic recovery</summary>{body}</details>:<article className="dp-route-tonic-card">{body}</article>;
}
