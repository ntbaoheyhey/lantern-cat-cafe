import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type RefObject } from 'react';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import type { DepthModel } from '../depth/model';
import { portraitProps } from '../depth/assets';
import { ForecastV4 } from '../depth/ForecastV4';
import { PowerA6, QuickUpgradeA6 } from './PowerA6';
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
    <details className="a6-team-picker"><summary>Saved teams</summary><div className="a6-mode-team"><label>Saved for <select aria-label="Team mode" value={mode} onChange={e=>setMode(e.target.value as R.Run['mode'])}>{MODE_TEAMS_A6.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <button disabled={preparing||locked} onClick={()=>m.apply(R.saveLoadoutV4(m.state,modeInfo.slot,`${modeInfo.name} team`),`${modeInfo.name} team saved.`)}>Save team</button>
      <button disabled={!saved||rosterLocked} onClick={()=>{if(saved&&preparing)update(saved.team,{...rows,...saved.rows},saved.plan);else m.apply(R.applyLoadoutV4(m.state,modeInfo.slot),'Saved team restored.');}}>Use saved {modeInfo.name.toLowerCase()} team</button></div></details>
    <details className="a6-team-picker"><summary>Suggested teams · 3 plans</summary><div className="a6-suggested" aria-label="Suggested teams">{suggestions.map((suggestion,index)=><button key={suggestion.name} disabled={rosterLocked} aria-label={`Use suggested team ${index+1}: ${suggestion.name}`} onClick={event=>{update(suggestion.team,{...rows,...suggestion.rows},suggestion.plan);event.currentTarget.closest('details')!.open=false;}}>
      <small>Suggested {index+1}</small><b>{suggestion.name}</b><span>{suggestion.team.map(id=>R.CAT_BY_ID[id]!.name).join(' · ')}</span><PowerA6 value={suggestion.power}/><span>{suggestion.why}</span></button>)}</div></details>
    <div className="a6-formation-stage" ref={root}><BondLinesA6 host={root} ids={ids} rows={rows}/>{(['front','rear'] as const).map(row=><section className="a6-formation-row" key={row} aria-label={`${row==='front'?'Front':'Back'} row`}>
      <header><div><b>{row==='front'?'Front · protect':'Back · support'}</b><small>{row==='front'?'Takes ordinary hits':'Cover while the front holds'}</small></div><button disabled={locked||rows[selected]===row||(row==='rear'&&!ids.some(id=>id!==selected&&rows[id]==='front'))} onClick={()=>update(ids,{...rows,[selected]:row})} aria-label={`Place ${R.CAT_BY_ID[selected]!.name} ${row}`}>Place here</button></header>
      <div className="a6-row-cats">{ids.filter(id=>rows[id]===row).map(id=><button key={id} data-seat={id} className="a6-formation-cat" disabled={locked} aria-pressed={selected===id} aria-label={`Select ${R.CAT_BY_ID[id]!.name} for placement`} onClick={()=>setPicked(id)}>
        <img {...portraitProps(id)} alt=""/><div><b>{R.CAT_BY_ID[id]!.name}</b><PowerA6 value={battle?R.powerScoreA6(battle.initial.cats.find(c=>c.id===id)!.stats):R.powerV4(state,id).total}/><small>{R.CAT_BY_ID[id]!.role}</small></div></button>)}{!ids.some(id=>rows[id]===row)&&<p className="a6-empty-row">Choose a cat, then place it here.</p>}</div>
    </section>)}</div>
    <p className="a6-placement-hint" aria-live="polite">{R.CAT_BY_ID[selected]!.name} selected · click a row to place.{rosterLocked?' Crew locked; rows and plans stay available.':''}</p>
    {R.activePairCombosA6(ids).length>0&&<div className="a6-ready-pairs">{R.activePairCombosA6(ids).map(pair=><span key={pair.id}>∞ {pair.name} <small>{pair.cats.map(id=>R.CAT_BY_ID[id]!.name).join(' + ')}</small></span>)}</div>}
    <details><summary>Replace {R.CAT_BY_ID[selected]!.name} or change the plan</summary><div className="uv-roster">{state.account.cards.filter(c=>!ids.includes(c.cardId)).map(card=><button key={card.id} disabled={rosterLocked||preparing&&card.level<(state.run?.challengeLevel??1)} onClick={()=>{update(ids.map(id=>id===selected?card.cardId:id),{...rows,[card.cardId]:rows[selected]!});setPicked(card.cardId);}}><img {...portraitProps(card.cardId)} alt=""/><b>{R.CAT_BY_ID[card.cardId]!.name}</b><small>Level {card.level}</small></button>)}{state.account.cards.length===ids.length&&<p>Recruit more friends to build new teams.</p>}</div>
      <div className="a6-mode-team"><label>Target <select aria-label="Formation focus" disabled={locked} value={plan.focus} onChange={e=>update(ids,rows,{...plan,focus:e.target.value as R.StandingPlan['focus']})}><option value="finish">Weak foes</option><option value="support">Their support</option><option value="leader">Their leader</option></select></label><label>Care <select aria-label="Formation care" disabled={locked} value={plan.care} onChange={e=>update(ids,rows,{...plan,care:e.target.value as R.StandingPlan['care']})}><option value="steady">Steady</option><option value="protect">Protect</option></select></label></div></details>
  </section>;
}

export function TeamA6({m}:{m:DepthModel}) {
  useSyncExternalStore(m.subscribe,m.snapshot);
  return <><QuickUpgradeA6 m={m}/><FormationA6 m={m}/></>;
}

export function PrepareA6({m}:{m:DepthModel}) {
  useSyncExternalStore(m.subscribe,m.snapshot);
  const battle=m.battle!,enemies=battle.actors.filter(a=>a.side==='enemy');
  return <><div className="uv-prepare-main"><div className="uv-prepare-grid a6-prepare-grid"><section aria-label="Your crew"><div className="uv-prepare-title"><h2>Your crew <PowerA6 value={battle.initial.cats.reduce((sum,cat)=>sum+R.powerScoreA6(cat.stats),0)}/></h2></div><FormationA6 m={m} preparing/></section>
    <aside aria-label="Enemy preview"><h2>{m.tutorialBattle?'Practice table':'Tonight’s foes'}</h2><PowerA6 label="Recommended Power" value={enemies.reduce((sum,actor)=>sum+R.powerScoreA6(actor),0)}/>
      <div className="uv-enemy-preview a6-foes">{enemies.map(actor=><article key={actor.id}><img {...portraitProps(actor.catalogId)} alt=""/><b>{actor.name}</b><PowerA6 value={R.powerScoreA6(actor)}/><small>{actor.row==='front'?'Front':'Back'} · {actor.maxHp} HP</small><p>{R.enemyGuideV4(actor.catalogId).counter}</p></article>)}</div>
      <ForecastV4 setup={battle.initial} label="Win chance" showChance/>
    </aside></div></div><footer className="uv-fight-bar"><span>{R.patrolPressureA6(m.state)<1?'Entry patrol · gentler foes. Fully automatic.':'Your cats fight automatically.'}</span><button className="uv-fight" onClick={()=>m.fight()}>Fight <span aria-hidden="true">→</span></button></footer></>;
}
