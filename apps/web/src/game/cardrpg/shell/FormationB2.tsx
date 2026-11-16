import { CombatClassBadge } from '../ui-v3/CombatClassBadge';
import {useState,useSyncExternalStore} from 'react';
import {EQUIPMENT_SLOTS} from '@taskbar-hero/game-rules/cardrpg';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import type {DepthModel} from '../depth/model';
import {GameIcon} from '../../../ui/GameIcon';
import {artPropsA6} from '../ui-v3/art-a6';
import {MODE_TEAMS_A6,savedTeamPreviewA6,suggestedTeamsA6} from '../ui-v3/formation-a6';
import {MenuDialogB2} from './MenuDialogB2';
import {GuideMascot} from './PaintedKit';

export function FormationB2({m}:{m:DepthModel}) {
 useSyncExternalStore(m.subscribe,m.snapshot);
 const s=m.state,ids=s.team,rows=s.rows,plan=s.v4!.plan,locked=!!s.run&&!s.run.complete;
 const [selected,select]=useState<string|null>(null),[tool,setTool]=useState<'crew'|'saved'|'help'|null>(null),[mode,setMode]=useState(0);
 const picked=selected&&ids.includes(selected)?selected:ids[0]!,seats=R.formationSeatsC2(ids,rows),preset=s.v4?.loadouts?.[mode],preview=preset?savedTeamPreviewA6(s,mode):null;
 const update=(team:string[],nextRows:Record<string,R.Row>,nextPlan=plan)=>{let result=R.configureTeam(m.state,team,nextRows,m.state.skills);if(result.ok)result=R.changeBuildV4(result.state,{kind:'plan',plan:nextPlan});return m.apply(result,'Ready.');};
 const place=(id:string,slot:number)=>{if(locked||!ids.includes(id))return;const next=R.placeInSlotC2(ids,rows,id,slot);if(next&&R.validRowsC2(next.team,next.rows)&&update(next.team,next.rows))select(null);};
 const shown=preset?.team??ids,shownRows=preset?.rows??rows;
 return <section className="b2-formation" aria-label="Formation">
  <nav data-tutorial-id="team-tools" className="b2-tools" aria-label="Formation tools"><button onClick={()=>setTool('crew')}><GameIcon name="team"/>Crew</button><button onClick={()=>setTool('saved')}><GameIcon name="history"/>Saved</button><button aria-label="Formation help" onClick={()=>setTool('help')}><GameIcon name="guide"/></button><output aria-live="polite">{locked?<GameIcon name="lock"/>:selected?R.CAT_BY_ID[selected]!.name:null}</output></nav>
  <div className="b2-formation-stage" role="group" aria-label="Opening formation">{seats.map((id,slot)=><div data-tutorial-id={slot===0?"team-rows":undefined} className="b2-formation-seat" data-row={slot<2?'front':'rear'} key={slot}>
   {id&&<><div data-tutorial-id={slot===0?"team-gear":undefined} className="b2-gear-orbit">{EQUIPMENT_SLOTS.map(gearSlot=><button key={gearSlot} aria-label={`${R.CAT_BY_ID[id]!.name} ${gearSlot}`} data-equipped={!!s.equipment[id]?.[gearSlot]} onClick={()=>{m.cardId=id;m.inventorySlot=gearSlot;m.go('inventory');}}><GameIcon name={gearSlot} size={34}/></button>)}</div>
   <button className="b2-formation-cat" disabled={locked} data-seat={id} aria-label={`${R.CAT_BY_ID[id]!.name}, ${slot<2?'front':'back'} ${slot%2+1}. ${selected?'Place selected companion':'Select for placement'}`} aria-pressed={selected===id} draggable={!locked} onDragStart={e=>{e.dataTransfer.setData('text/plain',id);select(id);}} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();place(e.dataTransfer.getData('text/plain'),slot);}} onClick={()=>selected&&selected!==id?place(selected,slot):select(selected===id?null:id)}>
    <img {...artPropsA6(id)} alt="" draggable={false}/><span title={slot<2?'Front row':'Back row'}><b>{R.CAT_BY_ID[id]!.name}</b></span><CombatClassBadge combatClass={R.CAT_BY_ID[id]!.combatClass}/><small className="b2-number">{s.account.cards.find(c=>c.cardId===id)?.level??1}</small>
   </button></>}
  </div>)}</div>
  {tool&&<MenuDialogB2 title={tool==='saved'?'Saved teams':tool==='crew'?'Crew':'Formation'} onClose={()=>setTool(null)} className="b2-formation-dialog">
   {tool==='saved'&&<><nav className="b2-mode-tabs">{MODE_TEAMS_A6.map(t=><button aria-pressed={mode===t.slot} key={t.id} onClick={()=>setMode(t.slot)}><GameIcon name={t.id==='campaign'?'chapter':t.id==='daily'?'quest':'season'}/>{t.name}</button>)}</nav>
    <div className="b2-preset-cats">{shown.map(id=><figure key={id}><img {...artPropsA6(id)} alt=""/><figcaption title={shownRows[id]==='front'?'Front row':'Back row'}>{R.CAT_BY_ID[id]!.name}<CombatClassBadge combatClass={R.CAT_BY_ID[id]!.combatClass}/></figcaption></figure>)}</div>
    <p className="b2-preset-power">{preset?<><GameIcon name="power"/>{preview?.before.toLocaleString('en-US')}<GameIcon name="arrow" size={24}/><b>{preview?.after.toLocaleString('en-US')}</b></>:<><GameIcon name="team"/>Current crew</>}</p>
    <footer className="b2-dialog-actions"><button disabled={locked} onClick={()=>m.apply(R.saveLoadoutV4(m.state,mode,MODE_TEAMS_A6[mode]!.name),'Saved.')}><GameIcon name="download"/>Save</button><button className="cr-primary" disabled={locked||!preview?.ok} onClick={()=>{if(m.apply(R.applyLoadoutV4(m.state,mode),'Ready.'))setTool(null);}}><GameIcon name="check"/>Use</button></footer>
   </>}
   {tool==='crew'&&<><div className="b2-bench">{s.account.cards.filter(c=>!ids.includes(c.cardId)).map(c=><button key={c.id} disabled={locked} aria-label={`Replace ${R.CAT_BY_ID[picked]!.name} with ${R.CAT_BY_ID[c.cardId]!.name}`} onClick={()=>{if(update(ids.map(id=>id===picked?c.cardId:id),{...rows,[c.cardId]:rows[picked]!})){select(null);setTool(null);}}}><img {...artPropsA6(c.cardId)} alt=""/>{R.CAT_BY_ID[c.cardId]!.name}<CombatClassBadge combatClass={R.CAT_BY_ID[c.cardId]!.combatClass}/></button>)}</div>
    <div className="b2-suggestions">{suggestedTeamsA6(s).map((t,i)=><button disabled={locked} key={t.name} onClick={()=>update(t.team,t.rows,t.plan)}><GameIcon name={['shield','bonds','fight'][i]!}/>{t.name}</button>)}</div>
    <div className="b2-plan"><label>Target<select aria-label="Formation focus" disabled={locked} value={plan.focus} onChange={e=>update(ids,rows,{...plan,focus:e.target.value as R.StandingPlan['focus']})}><option value="finish">Weak foes</option><option value="support">Support</option><option value="leader">Boss</option></select></label><label>Care<select aria-label="Formation care" disabled={locked} value={plan.care} onChange={e=>update(ids,rows,{...plan,care:e.target.value as R.StandingPlan['care']})}><option value="steady">Steady</option><option value="protect">Protect</option></select></label></div>
   </>}
   {tool==='help'&&<div className="b2-help-illustration"><GuideMascot pose="point"/><p>Tap two cats to swap. Shields guard the front. Bows support behind.</p></div>}
   {m.error&&<p role="alert">{m.notice}</p>}
  </MenuDialogB2>}
 </section>;
}
