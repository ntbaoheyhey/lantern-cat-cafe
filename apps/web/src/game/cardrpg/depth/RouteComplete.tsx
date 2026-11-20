import {useMemo,useSyncExternalStore} from 'react';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import {GearArtA6} from '../ui-v3/KeepsakeArtA6';
import {GuardianRelicOffer,guardianRelicEligible} from '../chain/GuardianRelicOffer';
import type {DepthModel} from './model';
import {dailySuppliesFullV4} from './star-plans-v4';
import './route-stops.css';

export function RouteComplete({m}:{m:DepthModel}){
 useSyncExternalStore(m.subscribe,m.snapshot);
 const state=m.state,run=state.run;
 const nextFloor=useMemo(()=>run?.complete&&run.won&&run.mode==='tower'?R.nextTowerFloor(state):null,[state,run]);
 if(!run?.complete)return null;
 // Existing saves record templates, not instance IDs. Group duplicate finds and
 // open the newest owned example, without claiming it is the original drop.
 const finds=new Map<string,number>(),notes:string[]=[];
 for(const id of run.earnedItems){if(R.GEAR_BY_ID[id])finds.set(id,(finds.get(id)??0)+1);else notes.push(id);}
 const owned=(id:string)=>state.gear.filter(piece=>piece.templateId===id);
 const open=(id?:string)=>{
  const item=id?m.state.gear.filter(piece=>piece.templateId===id).at(-1):undefined;
  if(item)m.itemId=item.id;
  m.go('inventory',item?R.GEAR_BY_ID[item.templateId]!.slot:'all');
 };
 const firstAvailable=[...finds.keys()].find(id=>owned(id).length>0);
 return <div className="dp-route-complete"><h2>{run.won?'The lantern stays lit.':'Every journey leaves a lesson.'}</h2>
  <p>{R.gameplayV4(state)?(dailySuppliesFullV4(state)?'Today’s supplies are gathered. Your stars and collected equipment are saved.':'Your earned supplies, stars and collected equipment are saved.'):run.won?'Chapter rewards and equipment are already in your account.':run.gameplayV4?'Your rewards are safe. Bring a fresh plan next time.':'Your capped partial rewards and earned gear are already in your account.'}</p>
  {finds.size+notes.length>2&&<p className="dp-route-finds-hint">{run.earnedItems.length} finds · Scroll to review all.</p>}
  {run.earnedItems.length?<section className="dp-route-finds" aria-label="Route finds">
   {[...finds].map(([id,count])=>{const spec=R.GEAR_BY_ID[id]!,pieces=owned(id);return <article key={id} className="dp-route-find">
    <GearArtA6 slot={spec.slot} setId={spec.setId}/><div><h3>{spec.name}</h3><p>{spec.rarity} · {spec.slot} · Found {count}</p>
     {pieces.length?<><small>{pieces.length} in Bag · Opens newest owned piece</small><button aria-label={`View ${spec.name} in Bag`} onClick={()=>open(id)}>View in Bag</button></>:<small>No matching piece remains in your Bag.</small>}
    </div>
   </article>;})}
   {notes.map((note,index)=><p className="dp-route-find-note" key={index}>{note}</p>)}
  </section>:<p>No new equipment this route.</p>}
  {guardianRelicEligible(run)&&<GuardianRelicOffer/>}
  {nextFloor&&!nextFloor.ok&&<p className="dp-route-complete-status" role="status">{nextFloor.error}</p>}
  <div className="cr-actions"><button className="cr-primary" onClick={()=>open(firstAvailable)}>Review equipment</button><button onClick={()=>m.go('hub')}>Return to cafe</button>
   {nextFloor?.ok&&<button onClick={()=>m.apply(R.nextTowerFloor(m.state),'Next Tower floor opened.')}>Climb to floor {run.floor+1}</button>}
  </div>
 </div>;
}
