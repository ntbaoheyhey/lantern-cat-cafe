import {useId} from 'react';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import type {DepthModel} from '../depth/model';
import {CostView} from '../shared';

/** Preview the public transaction on its copy; purchase from the current account. */
export function AwakeningA6({m,catId}:{m:DepthModel;catId:string}) {
 const descriptionId=useId(),rank=m.state.awakened[catId]??0;
 const preview=R.awakenCat(m.state,catId);
 const locked=!!m.state.run&&!m.state.run.complete;
 const before=preview.ok?R.depthStats(m.state,catId):null;
 const after=preview.ok?R.depthStats(preview.state,catId):null;
 const cost=preview.ok?Object.fromEntries(Object.entries(m.state.account.currencies)
  .map(([id,n])=>[id,n-preview.state.account.currencies[id as keyof typeof m.state.account.currencies]])
  .filter(([,n])=>Number(n)>0)):{};
 return <details className="a6-awakening">
  <summary><span className="a6-awakening-open">Awakening · {rank}/3</span><span className="a6-awakening-back">Level &amp; stars</span></summary>
  <div className="a6-awakening-receipt">
   <h3>Awakening · {rank}/3</h3>
   <p>Each rank adds 3% base Health and Attack.</p>
   <div id={descriptionId}>
    {preview.ok?<>
     <b>{R.CAT_BY_ID[catId]!.name} → rank {preview.state.awakened[catId]}/3</b>
     <CostView cost={cost}/>
     <span>{m.state.materials-preview.state.materials} mastery materials</span>
     <strong>+{after!.hp-before!.hp} Health · +{after!.attack-before!.attack} Attack</strong>
    </>:<p className="a6-awakening-reason">{locked?'Finish this route before training your companions.':preview.error}</p>}
   </div>
   <button className="cr-primary" disabled={!preview.ok} aria-describedby={descriptionId}
    onClick={()=>m.apply(R.awakenCat(m.state,catId),'Awakening raised HP and attack by 3%.')}>Awaken</button>
  </div>
 </details>;
}
