import {useId,useMemo,useState,useSyncExternalStore} from 'react';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import type {DepthModel} from './model';
import './route-stops.css';

export function RouteShop({m}:{m:DepthModel}){
 useSyncExternalStore(m.subscribe,m.snapshot);
 const state=m.state,run=state.run,description=useId();
 const quotes=useMemo(()=>({
  charms:state.run?R.shopStock(state.run).map(id=>({id,result:R.resolveNode(state,id)})):[],
  tonic:R.resolveNode(state,'tonic'),leave:R.resolveNode(state,'leave'),
 }),[state]);
 if(!run)return null;
 const short=Math.max(0,45-run.points),tonicFull=!!run.gameplayV4&&run.supplies>=5;
 return <div className="dp-route-shop">
  <h2>The travelling tea cart</h2><p>Choose one purchase, or keep your run points.</p>
  <p id={description} className="dp-route-shop-points">{run.points} run points{short?` · Need ${short} more for a purchase.`:` · ${run.points-45} left after a purchase.`}</p>
  <div className="dp-three">{quotes.charms.map(({id,result})=><button key={id} aria-describedby={description} disabled={!result.ok} onClick={()=>m.apply(R.resolveNode(m.state,id),'Charm added for this route.')}>
   <h3>{R.BOON_BY_ID[id]!.name}</h3><p>{R.boonForMode(id,!!run.gameplayV4).description}</p>
   <small>45 run points · Stack {run.boons[id]??0} → {(run.boons[id]??0)+1}/{R.BOON_BY_ID[id]!.cap}</small>
  </button>)}</div>
  <div className="dp-route-shop-footer">
   <div><p id={`${description}-tonic`} aria-live="polite">Route tonics: {run.supplies}{quotes.tonic.ok?` → ${quotes.tonic.state.run!.supplies}`:''}{run.gameplayV4?'/5':''}. {tonicFull?'At the carrying limit.':quotes.tonic.ok?'Restore crew HP between encounters.':quotes.tonic.error}</p>
    <button aria-describedby={`${description} ${description}-tonic`} disabled={!quotes.tonic.ok} onClick={()=>m.apply(R.resolveNode(m.state,'tonic'),'Route tonic packed for later.')}>Buy route tonic · 45 points</button></div>
   <button disabled={!quotes.leave.ok} onClick={()=>m.apply(R.resolveNode(m.state,'leave'),'Run points kept for later.')}>Keep points and leave</button>
  </div>
 </div>;
}

export function RouteCampfire({m}:{m:DepthModel}){
 useSyncExternalStore(m.subscribe,m.snapshot);
 const state=m.state,run=state.run,healDescription=useId(),skillDescription=useId();
 const skills=useMemo(()=>state.team.flatMap(id=>R.defaultSkills(state,id).map(skill=>({cat:id,skill}))),[state]);
 const [chosen,setChosen]=useState('');
 const skill=skills.find(s=>s.skill===chosen)?.skill??skills.find(s=>(run?.upgrades[s.skill]??0)<3)?.skill??skills[0]?.skill??'';
 const heal=useMemo(()=>R.resolveNode(state,'heal'),[state]);
 const upgrade=useMemo(()=>R.resolveNode(state,'upgrade',skill),[state,skill]);
 const crew=useMemo(()=>R.battleCats(state),[state]);
 if(!run)return null;
 const rows=crew.map(cat=>({id:cat.id,before:run.hp[cat.id]??cat.stats.hp,after:heal.state.run?.hp[cat.id]??cat.stats.hp}));
 const healing=heal.ok&&rows.some(row=>row.after>row.before),rank=run.upgrades[skill]??0;
 const canStrengthen=skills.some(s=>(run.upgrades[s.skill]??0)<3);
 return <div className="dp-route-campfire">
  <h2>A pause beside the kettle</h2><p>Choose crew recovery or one skill upgrade. This stop ends after your choice.</p>
  <div className="dp-route-camp-choices">
   <section id={healDescription} aria-label="Campfire recovery" aria-live="polite">
    <h3>Restore 35% max HP</h3>
    {heal.ok?<><ul>{rows.map(row=><li key={row.id}><b>{R.CAT_BY_ID[row.id]!.name}</b><span>{row.before} → {row.after} HP (+{row.after-row.before}){row.before===0&&row.after>0?' · Revives':''}</span></li>)}</ul>
     {!healing&&<p>Everyone is already full. {canStrengthen?'You can still strengthen a skill.':'All skills have 3 route upgrades. Continue when ready.'}</p>}</>:<p>{heal.error}</p>}
    <button aria-describedby={healDescription} disabled={!heal.ok} onClick={()=>m.apply(R.resolveNode(m.state,'heal'),'Campfire rest complete.')}>{healing?'Heal the crew':'Continue at full HP'}</button>
   </section>
   <section id={skillDescription} aria-label="Campfire skill upgrade" aria-live="polite">
    <h3>Strengthen one skill</h3><label>Route skill<select aria-label="Campfire skill" value={skill} onChange={e=>setChosen(e.target.value)}>{skills.map(s=><option key={s.skill} value={s.skill}>{R.CAT_BY_ID[s.cat]!.name} · {R.SKILLS[s.skill]!.name} · Rank {run.upgrades[s.skill]??0}/3</option>)}</select></label>
    {upgrade.ok?<p>Rank {rank} → {rank+1}/3 · effect power +{rank*12}% → +{(rank+1)*12}% for this route.</p>:<p>{rank>=3?'This skill already has all 3 route upgrades.':upgrade.error}</p>}
    <button aria-describedby={skillDescription} disabled={!upgrade.ok} onClick={()=>m.apply(R.resolveNode(m.state,'upgrade',skill),'Skill strengthened for this route.')}>Strengthen skill</button>
   </section>
  </div>
 </div>;
}
