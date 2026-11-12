import { useEffect, useState, useSyncExternalStore, type CSSProperties } from 'react';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import type { DepthModel } from '../depth/model';
import { artPropsA6 } from '../ui-v3/art-a6';
import { FormationToolA6 } from '../ui-v3/FormationToolA6';
import { suggestedTeamsA6, MODE_TEAMS_A6 } from '../ui-v3/formation-a6';
import { stageLayoutC2, SLOTS_C2 } from './layout-c2';
import cafeUrl from '../../../../../../assets/cardrpg-look/stage/painted-cafe-c11-v1.webp?url';
import { cafePainting, formationPaintingC2 } from '../spine/stage-painting';
import './formation-c2.css';

export function FormationC2({ m, preparing = false }: { m: DepthModel; preparing?: boolean }) {
  useSyncExternalStore(m.subscribe, m.snapshot);
  const battle = preparing ? m.battle : null, state = m.state;
  const ids = battle ? battle.initial.cats.map(c => c.id) : state.team;
  const rows = battle ? Object.fromEntries(battle.initial.cats.map(c => [c.id,c.row])) : state.rows;
  const plan = battle?.v4?.plan ?? state.v4!.plan;
  const locked = !!m.replay || m.watching || (preparing ? !!battle?.v4?.committed : !!state.run && !state.run.complete);
  const rosterLocked = locked || preparing && !!state.run && (state.run.visited.length > 0 || state.run.floor > 1 && !state.run.towerA6);
  const [selected, select] = useState<string | null>(null), [tool, setTool] = useState<'crew' | 'saved' | 'help' | null>(null);
  const [backdrop,setBackdrop]=useState(cafeUrl);
  useEffect(()=>{let disposed=false;void cafePainting().then(image=>{if(!disposed)setBackdrop(formationPaintingC2(image).toDataURL('image/webp',.9));}).catch(()=>{});return()=>{disposed=true;};},[]);
  const picked = selected && ids.includes(selected) ? selected : ids[0]!;
  const seats = R.formationSeatsC2(ids, rows), supply = battle?.initial.packedSupply;
  const hp = battle && Object.fromEntries(battle.actors.filter(a => a.side === 'party').map(a => [a.id,a.hp]));
  const update = (team: string[], nextRows: Record<string,R.Row>, nextPlan = plan) => {
    if (preparing) m.prepareCrew(team,nextRows,nextPlan);
    else { let result = R.configureTeam(state,team,nextRows,state.skills); if (result.ok) result = R.changeBuildV4(result.state,{kind:'plan',plan:nextPlan}); m.apply(result,'Ready.'); }
  };
  const place = (cat: string, slot: number) => {
    if (locked) return;
    const next = R.placeInSlotC2(ids,rows,cat,slot);
    if (next && R.validRowsC2(next.team,next.rows,hp ?? undefined)) { update(next.team,next.rows); select(null); }
  };
  const enemies = battle?.actors.filter(a => a.side === 'enemy') ?? [];
  const boxes = stageLayoutC2([
    ...ids.map(id => ({id,side:'party' as const,row:rows[id]!,aspect:1})),
    ...enemies.map(a => ({id:a.id,side:'enemy' as const,row:a.row,boss:R.ENEMY_BY_ID[a.catalogId]?.tier==='boss',aspect:1.1})),
  ], 1000, 562.5);
  const position = (id: string): CSSProperties => { const b = boxes.get(id)!; return {left:`${b.footX/10}%`,top:`${b.y/5.625}%`,height:`${b.height/5.625}%`,width:`${b.width/10}%`,zIndex:b.order}; };
  return <section className="c2-formation" aria-label="Formation" data-preparing={preparing}>
    <nav aria-label="Formation tools"><button onClick={()=>setTool('crew')}>♟ Crew</button><button onClick={()=>setTool('saved')}>▣ Saved</button><button aria-label="Formation help" onClick={()=>setTool('help')}>?</button><output aria-live="polite">{locked?'🔒':selected?R.CAT_BY_ID[selected]!.name:'↔'}</output></nav>
    <div className="c2-formation-picture" style={{backgroundImage:`url(${backdrop})`}} role="group" aria-label="Opening formation">
      {seats.map((id,slot)=>id&&<button key={id} className="c2-seat" style={position(id)} disabled={locked} data-seat={id} data-slot={SLOTS_C2.slots[slot]!.id}
        draggable={!locked} onDragStart={e=>{e.dataTransfer.setData('text/plain',id);select(id);}} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();place(e.dataTransfer.getData('text/plain'),slot);}}
        aria-label={`${R.CAT_BY_ID[id]!.name}, ${SLOTS_C2.slots[slot]!.id}. ${selected?'Place selected companion':'Select for placement'}`} aria-pressed={selected===id}
        onClick={()=>selected&&selected!==id?place(selected,slot):select(selected===id?null:id)}>
        <img {...artPropsA6(id)} alt="" draggable={false}/><span aria-hidden="true">{slot<2?'🛡':'🏹'} {R.CAT_BY_ID[id]!.name}</span>
        {hp&&<progress aria-label={`${R.CAT_BY_ID[id]!.name} HP`} value={hp[id]} max={battle!.actors.find(a=>a.id===id)!.maxHp}/>}</button>)}
      {enemies.map(a=><div className="c2-foe" key={a.id} style={position(a.id)}><img {...artPropsA6(a.catalogId)} alt={a.name}/><span>{a.name}</span></div>)}
    </div>
    {tool&&<FormationToolA6 title={tool==='crew'?'Crew':tool==='saved'?'Saved teams':'Formation'} catId={picked} onClose={()=>setTool(null)}>
      {tool==='help'&&<><p>Tap or drag one companion onto another to swap seats. Shield: front. Bow: back. Two per row; keep one living companion in front.</p><p>Ordinary hits reach the front first. Backline and area skills can reach behind it. Row skills keep their bonuses.</p></>}
      {tool==='crew'&&<><div className="c2-bench">{state.account.cards.filter(c=>!ids.includes(c.cardId)).map(c=><button key={c.cardId} disabled={rosterLocked||supply?.catId===picked||preparing&&c.level<(state.run?.challengeLevel??1)} onClick={()=>{update(ids.map(id=>id===picked?c.cardId:id),{...rows,[c.cardId]:rows[picked]!});if(!m.error){select(null);setTool(null);}}}><img {...artPropsA6(c.cardId)} alt=""/>{R.CAT_BY_ID[c.cardId]!.name}</button>)}</div>
        <div className="cr-actions">{suggestedTeamsA6(state,preparing?state.run?.challengeLevel??1:1).map(s=><button key={s.name} disabled={rosterLocked||!!supply&&!s.team.includes(supply.catId)} onClick={()=>update(s.team,s.rows,s.plan)}>{s.name}</button>)}</div>
        <label>Target<select aria-label="Formation focus" value={plan.focus} disabled={locked} onChange={e=>update(ids,rows,{...plan,focus:e.target.value as R.StandingPlan['focus']})}><option value="finish">Weak foes</option><option value="support">Support</option><option value="leader">Boss</option></select></label>
        <label>Care<select aria-label="Formation care" value={plan.care} disabled={locked} onChange={e=>update(ids,rows,{...plan,care:e.target.value as R.StandingPlan['care']})}><option value="steady">Steady</option><option value="protect">Protect</option></select></label></>}
      {tool==='saved'&&MODE_TEAMS_A6.map(mode=>{const saved=state.v4?.loadouts?.[mode.slot];return <section key={mode.id}><h3>{mode.name}</h3><p>{saved?.team.map(id=>R.CAT_BY_ID[id]!.name).join(' · ')??'—'}</p><button disabled={preparing||locked} onClick={()=>m.apply(R.saveLoadoutV4(state,mode.slot,mode.name),'Saved.')}>Save</button><button disabled={!saved||rosterLocked||!!supply&&!saved.team.includes(supply.catId)} onClick={()=>{if(preparing&&saved)update(saved.team,saved.rows,saved.plan);else m.apply(R.applyLoadoutV4(state,mode.slot),'Ready.');}}>Use</button></section>;})}
      {m.error&&<p role="alert">{m.notice}</p>}
    </FormationToolA6>}
  </section>;
}

export function PrepareC2({m}:{m:DepthModel}) {
  useSyncExternalStore(m.subscribe,m.snapshot);
  return <><div className="uv-prepare-main c2-prepare"><FormationC2 m={m} preparing/></div><footer className="uv-fight-bar"><button className="uv-fight" onClick={()=>m.fight()}>Fight →</button></footer></>;
}
