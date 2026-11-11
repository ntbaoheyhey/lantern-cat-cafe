import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties, type RefObject } from 'react';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import type { DepthModel } from '../depth/model';
import {artPropsA6 as portraitProps} from './art-a6';
import {CARD_BY_ID} from '@taskbar-hero/game-rules/cardrpg';
import { enemyGuideA6 } from './guide-a6';
import { ForecastV4 } from '../depth/ForecastV4';
import { PowerA6, QuickUpgradeA6 } from './PowerA6';
import { FormationToolA6, FormationTrioA6 } from './FormationToolA6';
import { MODE_TEAMS_A6, suggestedTeamsA6 } from './formation-a6';

function BondLinesA6({ host, ids, rows }: { host: RefObject<HTMLDivElement | null>; ids: string[]; rows: Record<string,R.Row> }) {
  const [lines,setLines]=useState<Array<{name:string;d:string}>>([]);
  const key=JSON.stringify([ids,rows]);
  useEffect(()=>{
    const root=host.current;if(!root)return;
    const draw=()=>{
      const bounds=root.getBoundingClientRect();
      setLines(R.activePairCombosA6(ids).flatMap(pair=>{
        const [left,right]=pair.cats.map(id=>root.querySelector<HTMLElement>(`[data-seat="${id}"]`)?.getBoundingClientRect());
        if(!left||!right)return [];
        const x1=left.left+left.width/2-bounds.left,y1=left.top+left.height/2-bounds.top;
        const x2=right.left+right.width/2-bounds.left,y2=right.top+right.height/2-bounds.top;
        return [{name:pair.name,d:`M ${x1} ${y1} Q ${(x1+x2)/2+30} ${(y1+y2)/2+20} ${x2} ${y2}`}];
      }));
    };draw();const observer=new ResizeObserver(draw);observer.observe(root);return()=>observer.disconnect();
  },[key,host]);
  return <svg className="a6-bond-lines" aria-label="Active bond links" role="img">{lines.map(line=><path key={line.name} d={line.d}><title>{line.name}</title></path>)}</svg>;
}

export function FormationA6({m,preparing=false}:{m:DepthModel;preparing?:boolean}) {
  useSyncExternalStore(m.subscribe,m.snapshot);
  const state=m.state,battle=preparing?m.battle:null;
  const ids=battle?battle.initial.cats.map(c=>c.id):state.team;
  const rows=battle?Object.fromEntries(battle.initial.cats.map(c=>[c.id,c.row])):state.rows;
  const plan=battle?.v4?.plan??state.v4!.plan;
  const [picked,setPicked]=useState(ids[0]!),[mode,setMode]=useState<R.Run['mode']>(state.run?.mode??'campaign');
  const selected=ids.includes(picked)?picked:ids[0]!;
  const [tool,setTool]=useState<'saved'|'suggested'|'replace'|null>(null);
  const locked=preparing?!!battle?.v4?.committed||!!m.replay||m.watching:!!state.run&&!state.run.complete;
  const rosterLocked=locked||preparing&&!!state.run&&(state.run.visited.length>0||state.run.floor>1&&!state.run.towerA6);
  const root=useRef<HTMLDivElement>(null);
  const suggestions=useMemo(()=>suggestedTeamsA6(state,preparing?state.run?.challengeLevel??1:1),[state,preparing]);
  const modeInfo=MODE_TEAMS_A6.find(item=>item.id===mode)!;
  const saved=state.v4?.loadouts?.[modeInfo.slot];
  const update=(team:string[],nextRows:Record<string,R.Row>,nextPlan=plan)=>{
    if(preparing){m.prepareCrew(team,nextRows,nextPlan);return;}
    let result=R.configureTeam(m.state,team,nextRows,m.state.skills);
    if(result.ok)result=R.changeBuildV4(result.state,{kind:'plan',plan:nextPlan});
    m.apply(result,'Formation ready.');
  };
  return <section className="a6-formation" aria-label="Formation" data-preparing={preparing}>
    <div className="a6-formation-tools" role="group" aria-label="Formation tools">
      <button aria-haspopup="dialog" onClick={()=>setTool('saved')}>Saved teams</button>
      <button aria-haspopup="dialog" onClick={()=>setTool('suggested')}>Suggested teams · 3 plans</button>
      <button aria-haspopup="dialog" onClick={()=>setTool('replace')}>Replace {R.CAT_BY_ID[selected]!.name} or change the plan</button>
    </div>
    {tool&&<FormationToolA6 title={tool==='saved'?'Saved teams':tool==='suggested'?'Suggested teams':`Replace ${R.CAT_BY_ID[selected]!.name} or change the plan`} catId={selected} onClose={()=>setTool(null)}>
      {(locked||rosterLocked)&&<p className="a6-formation-lock">{locked?'This crew is committed to the current patrol. You can still inspect its plans.':'The patrol has begun. Keep this crew; rows and plans remain editable.'}</p>}
      {tool==='saved'&&<section className="a6-saved-team-desk" aria-label="Saved team">
        <div className="a6-saved-team-top"><label>Saved for <select aria-label="Team mode" value={mode} onChange={e=>setMode(e.target.value as R.Run['mode'])}>{MODE_TEAMS_A6.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label><p>{saved?`${modeInfo.name} crew · saved rows and plan`:`No ${modeInfo.name.toLowerCase()} team saved yet. Your current crew is shown.`}</p></div>
        <FormationTrioA6 ids={saved?.team??ids} rows={saved?.rows??rows}/>
        {saved&&<p>Target: {saved.plan.focus==='leader'?'Their leader':saved.plan.focus==='support'?'Their support':'Weak foes'} · Care: {saved.plan.care==='protect'?'Protect':'Steady'}</p>}
        <footer><p>{preparing?'Save a crew from the Team screen between patrols.':'Save your current crew, positions and plan for this mode.'}</p><button disabled={preparing||locked} onClick={()=>m.apply(R.saveLoadoutV4(m.state,modeInfo.slot,`${modeInfo.name} team`),`${modeInfo.name} team saved.`)}>Save team</button>
          <button disabled={!saved||rosterLocked} onClick={()=>{if(saved&&preparing)update(saved.team,{...rows,...saved.rows},saved.plan);else m.apply(R.applyLoadoutV4(m.state,modeInfo.slot),'Saved team restored.');setTool(null);}}>Use saved {modeInfo.name.toLowerCase()} team</button></footer>
      </section>}
      {tool==='suggested'&&<section className="a6-suggestion-desk" aria-label="Suggested teams">
        <p>Choose a crew and its standing plan. Your cats carry it out automatically.</p>
        <div className="a6-team-suggestions">{suggestions.map((suggestion,index)=><button key={suggestion.name} disabled={rosterLocked} aria-label={`Use suggested team ${index+1}: ${suggestion.name}`} onClick={()=>{update(suggestion.team,{...rows,...suggestion.rows},suggestion.plan);setTool(null);}}>
          <small>PLAN {index+1}</small><h3>{suggestion.name}</h3><FormationTrioA6 ids={suggestion.team} rows={suggestion.rows}/><PowerA6 value={suggestion.power}/><p>{suggestion.why}</p><strong>Use this team →</strong>
        </button>)}</div>
        {!suggestions.length&&<p className="a6-formation-empty">No full crew meets this route’s level requirement. Train three companions before trying a suggested team.</p>}
      </section>}
      {tool==='replace'&&<section className="a6-replacement-desk" aria-label="Companions and plan">
        <p>Choose a friend for {R.CAT_BY_ID[selected]!.name}’s {rows[selected]==='front'?'front':'back'} seat.</p>
        <div className="a6-replacement-cats">{state.account.cards.filter(c=>!ids.includes(c.cardId)).map(card=><button key={card.id} aria-label={`Replace ${R.CAT_BY_ID[selected]!.name} with ${R.CAT_BY_ID[card.cardId]!.name}`} disabled={rosterLocked||preparing&&card.level<(state.run?.challengeLevel??1)} onClick={()=>{update(ids.map(id=>id===selected?card.cardId:id),{...rows,[card.cardId]:rows[selected]!});setPicked(card.cardId);setTool(null);}}><img {...portraitProps(card.cardId)} alt=""/><b>{R.CAT_BY_ID[card.cardId]!.name}</b><small>Level {card.level}{preparing&&card.level<(state.run?.challengeLevel??1)?` · Needs ${state.run!.challengeLevel}`:''}</small></button>)}</div>
        {state.account.cards.length===ids.length&&<p className="a6-formation-empty">Recruit more friends to build new teams. You can still choose your current crew’s plan below.</p>}
        <footer><div><b>Standing plan</b><p>Applied automatically during the battle.</p></div><label>Target <select aria-label="Formation focus" disabled={locked} value={plan.focus} onChange={e=>update(ids,rows,{...plan,focus:e.target.value as R.StandingPlan['focus']})}><option value="finish">Weak foes</option><option value="support">Their support</option><option value="leader">Their leader</option></select></label><label>Care <select aria-label="Formation care" disabled={locked} value={plan.care} onChange={e=>update(ids,rows,{...plan,care:e.target.value as R.StandingPlan['care']})}><option value="steady">Steady</option><option value="protect">Protect</option></select></label></footer>
      </section>}
    </FormationToolA6>}
    <div className="a6-formation-stage" ref={root} style={{'--a6-front-seats':`${Math.max(1,ids.filter(id=>rows[id]==='front').length)}fr`,'--a6-back-seats':`${Math.max(1,ids.filter(id=>rows[id]==='rear').length)}fr`} as CSSProperties}><BondLinesA6 host={root} ids={ids} rows={rows}/>{(['front','rear'] as const).map(row=><section className="a6-formation-row" key={row} aria-label={`${row==='front'?'Front':'Back'} row`}>
      <header><div><b>{row==='front'?'Front · protect':'Back · support'}</b><small>{row==='front'?'Takes ordinary hits':'Cover while the front holds'}</small></div><button disabled={locked||rows[selected]===row||(row==='rear'&&!ids.some(id=>id!==selected&&rows[id]==='front'))} onClick={()=>update(ids,{...rows,[selected]:row})} aria-label={`Place ${R.CAT_BY_ID[selected]!.name} ${row}`}>Place here</button></header>
      <div className="a6-row-cats">{ids.filter(id=>rows[id]===row).map(id=><button key={id} data-seat={id} className="a6-formation-cat" data-rarity={CARD_BY_ID[id]!.rarity} disabled={locked} aria-pressed={selected===id} aria-label={`Select ${R.CAT_BY_ID[id]!.name} for placement`} onClick={()=>setPicked(id)}>
        <span className="a6-seat-level">Lv. {state.account.cards.find(c=>c.cardId===id)?.level??1}</span><span className="a6-seat-stars" aria-label={`${state.account.cards.find(c=>c.cardId===id)?.stars??1} stars`}>{"★".repeat(state.account.cards.find(c=>c.cardId===id)?.stars??1)}</span><img {...portraitProps(id)} alt=""/><div><b>{R.CAT_BY_ID[id]!.name}</b><PowerA6 value={battle?R.powerScoreA6(battle.initial.cats.find(c=>c.id===id)!.stats):R.powerV4(state,id).total}/><small>{R.CAT_BY_ID[id]!.role}</small></div></button>)}{!ids.some(id=>rows[id]===row)&&<p className="a6-empty-row">Choose a cat, then place it here.</p>}</div>
    </section>)}</div>
    <p className="a6-placement-hint" aria-live="polite">{locked?'This crew is committed. Positions and plan are locked.':<>{R.CAT_BY_ID[selected]!.name} selected · choose a row to place.{rosterLocked?' Keep this crew; positions and plan can still change.':''}</>}</p>
    {R.activePairCombosA6(ids).length>0&&<div className="a6-ready-pairs">{R.activePairCombosA6(ids).map(pair=><span key={pair.id}>∞ {pair.name} <small>{pair.cats.map(id=>R.CAT_BY_ID[id]!.name).join(' + ')}</small></span>)}</div>}

  </section>;
}

export function TeamA6({m}:{m:DepthModel}) {
  useSyncExternalStore(m.subscribe,m.snapshot);
  return <><QuickUpgradeA6 m={m}/><FormationA6 m={m}/></>;
}

export function PrepareA6({m}:{m:DepthModel}) {
  useSyncExternalStore(m.subscribe,m.snapshot);
  const battle=m.battle!,enemies=battle.actors.filter(a=>a.side==='enemy');
  const [chosen,setChosen]=useState<string|null>(null);
  const selected=enemies.find(actor=>actor.id===chosen)??enemies.find(actor=>R.ENEMY_BY_ID[actor.catalogId]?.tier==='boss')??enemies[0]!;
  const note=enemyGuideA6(selected.catalogId);
  return <><div className="uv-prepare-main"><div className="uv-prepare-grid a6-prepare-grid"><section aria-label="Your crew"><div className="uv-prepare-title"><h2>Your crew <PowerA6 value={battle.initial.cats.reduce((sum,cat)=>sum+R.powerScoreA6(cat.stats),0)}/></h2></div><FormationA6 m={m} preparing/></section>
    <aside aria-label="Enemy preview"><header className="a6-enemy-heading"><h2>{m.tutorialBattle?'Practice table':'Tonight’s foes'}</h2><PowerA6 label="Recommended Power" value={enemies.reduce((sum,actor)=>sum+R.powerScoreA6(actor),0)}/></header>
      <div className="uv-enemy-preview a6-foes a6-foe-index" role="group" aria-label="Read an enemy note">{enemies.map(actor=><button key={actor.id} className="a6-foe-choice" aria-label={`Read ${actor.name} tactics`} aria-pressed={actor.id===selected.id} onClick={()=>setChosen(actor.id)}><img {...portraitProps(actor.catalogId)} alt=""/><b>{actor.name}</b><PowerA6 value={R.powerScoreA6(actor)}/><small>{actor.row==='front'?'Front':'Back'} · {actor.maxHp} HP</small></button>)}</div>
      <section className="a6-foe-note" aria-label={`${selected.name} tactics`} aria-live="polite"><h3>{selected.name}</h3><p>{note.intent}</p><p className="a6-foe-counter"><strong>Try</strong> {note.counter}</p>{note.phases&&<small>{note.phases}</small>}</section>
      <ForecastV4 setup={battle.initial} label="Matchup" unavailableMessage="Forecast unavailable. Read their plan above." compact/>
    </aside></div></div><footer className="uv-fight-bar"><span>{m.tutorialBattle?'Practice together. Win to welcome a free friend.':'Your cats fight automatically. Formation and upgrades shape the result.'}</span><button className="uv-fight" onClick={()=>m.fight()}>Fight <span aria-hidden="true">→</span></button></footer></>;
}
