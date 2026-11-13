import {GameIcon} from '../../../ui/GameIcon';
import {useId} from 'react';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import type {DepthModel} from '../depth/model';
import {CostView} from '../shared';

/** Preview the public transaction on its copy; purchase from the current account. */
export function AwakeningA6({m,catId}:{m:DepthModel;catId:string}) {
 const descriptionId=useId(),rank=m.state.awakened[catId]??0;
 const card=m.state.account.cards.find(c=>c.cardId===catId);
 const preview=R.awakenCat(m.state,catId);
 const locked=!!m.state.run&&!m.state.run.complete;
 const before=preview.ok?R.depthStats(m.state,catId):null;
 const after=preview.ok?R.depthStats(preview.state,catId):null;
 const quote=R.awakeningCost(rank),showQuote=!!card&&rank<3&&!locked;
 const needs=Object.entries(quote.currencies).flatMap(([id,amount])=>{
  const missing=amount-m.state.account.currencies[id as keyof typeof quote.currencies];
  return missing>0?[`${missing} more ${id==='threads'&&missing===1?'thread':id}`]:[];
 });
 const missingMaterials=quote.materials-m.state.materials;
 if(missingMaterials>0)needs.push(`${missingMaterials} more mastery material${missingMaterials===1?'':'s'}`);
 const reason=!preview.ok&&(!showQuote||!needs.length||card!.level<10||card!.stars<2)
  ?locked?'Finish this route before training your companions.':preview.error:null;
 if(m.state.formationC2)return <section className="b2-awakening" aria-label="Awakening">
  <div className="b2-constellation" aria-label={`Awakening ${rank} of 3`}>{[1,2,3].map(n=><span key={n} data-active={rank>=n}><img src="/art/v3-shell/b2/constellation-node.webp" alt="" width={88} height={88}/><b>{n}</b></span>)}</div>
  <p><GameIcon name="heart" size={24}/> +3% <GameIcon name="fight" size={24}/> +3%</p>
  <div id={descriptionId}>{showQuote&&<><CostView cost={quote.currencies}/><span><GameIcon name="materials" size={28}/> {quote.materials}</span></>}
   {!preview.ok&&<p>{locked?'Finish this route.':rank>=3?'Complete':card&&card.level>=10&&card.stars>=2?'More supplies needed.':'Requires level 10 and two stars.'}</p>}
  </div>
  <button className="cr-primary" disabled={!preview.ok} aria-describedby={descriptionId} onClick={()=>m.apply(R.awakenCat(m.state,catId),'Awakening raised HP and attack by 3%.')}><GameIcon name="season" size={28}/>Awaken</button>
 </section>;
 return <details className="a6-awakening">
  <summary><span className="a6-awakening-open">Awakening · {rank}/3</span><span className="a6-awakening-back">Level &amp; stars</span></summary>
  <div className="a6-awakening-receipt">
   <header className="a6-awakening-heading"><h3>Awakening · {rank}/3</h3>
    <button className={preview.ok?'cr-primary':undefined} disabled={!preview.ok} aria-describedby={descriptionId}
     onClick={()=>m.apply(R.awakenCat(m.state,catId),'Awakening raised HP and attack by 3%.')}>Awaken</button>
   </header>
   <p>Each rank adds 3% base Health and Attack.</p>
   <div id={descriptionId}>
    {reason&&<p className="a6-awakening-reason">{reason}</p>}
    {showQuote&&<>
     <b>{R.CAT_BY_ID[catId]!.name} to rank {rank+1}/3</b>
     <CostView cost={quote.currencies}/>
     <span>{quote.materials} mastery materials</span>
     {preview.ok?<strong>+{after!.hp-before!.hp} Health · +{after!.attack-before!.attack} Attack</strong>
      :needs.length>0&&<><span className="a6-awakening-missing">Need {needs.join(' · ')}.</span><span className="a6-awakening-source">Win patrols for supplies and mastery materials.</span></>}
    </>}
   </div>
  </div>
 </details>;
}
