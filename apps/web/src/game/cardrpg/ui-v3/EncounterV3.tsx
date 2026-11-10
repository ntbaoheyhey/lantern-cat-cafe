import {TowerA6} from './TowerA6';
import { PrepareA6 } from './FormationA6';
import { CampaignA6 } from './CampaignA6';
import { PowerA6 } from './PowerA6';
import { CountUpA6, currencyIconA6 } from './CountUpA6';
import { AdviceV4 } from '../depth/AdviceV4';
import {lazy,Suspense,useState} from 'react';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import type {DepthModel} from '../depth/model';
import {artPropsA6 as portraitProps} from './art-a6';
import {bestRoleTeam} from '../depth/meta-presentation';
import {summarizeBattle} from '../depth/battle-summary';
import {PreparationV4} from '../depth/PreparationV4';
import {ComboHintsV5} from '../depth/SkillsV5';
import {patrolDefaults,resultRewards} from './selectors';
const FullPrepare=lazy(()=>import('../depth/Encounter').then(m=>({default:m.Prepare})));
const FullResult=lazy(()=>import('../depth/Encounter').then(m=>({default:m.BattleResult})));
const RunMap=lazy(()=>import('../depth/RunMap').then(m=>({default:m.RunMap})));

export function PrepareV3({m}:{m:DepthModel}) {
 const battle=m.battle!,[seat,setSeat]=useState(0),[picking,setPicking]=useState(false);
 if(battle.initial.gameplayA6)return <PrepareA6 m={m}/>;
 if(!battle.v4)return <Suspense fallback={<p>Opening…</p>}><FullPrepare m={m}/></Suspense>;
 const cats=battle.initial.cats,ids=cats.map(c=>c.id),rows=Object.fromEntries(cats.map(c=>[c.id,c.row])),selected=ids[seat]??ids[0]!;
 const locked=battle.v4.committed||!!m.replay,rosterLocked=locked||!!m.state.run&&(m.state.run.visited.length>0||m.state.run.floor>1);
 const place=(id:string,row:R.Row)=>m.prepareCrew(ids,{...rows,[id]:row},battle.v4!.plan);
 const choose=(id:string)=>{m.prepareCrew(ids.map(old=>old===selected?id:old),{...m.state.rows,...rows,[id]:rows[selected]!},battle.v4!.plan);setPicking(false);};
 return <><div className="uv-prepare-main"><div className="uv-prepare-grid"><section aria-label="Your crew"><div className="uv-prepare-title"><h2>Your crew {battle.initial.gameplayA6&&<PowerA6 value={battle.initial.cats.reduce((n,c)=>n+R.powerScoreA6(c.stats),0)}/>}</h2><button disabled={rosterLocked} onClick={()=>{const team=bestRoleTeam(m.state);m.prepareCrew(team,{...m.state.rows,...Object.fromEntries(team.map(id=>[id,R.CAT_BY_ID[id]!.row]))},battle.v4!.plan)}}>Use recommended crew</button></div>
 <div className="uv-prepare-cats">{cats.map((cat,i)=><article key={i}><button className="uv-prepare-cat" aria-label={`Choose ${R.CAT_BY_ID[cat.id]!.name} seat`} aria-pressed={selected===cat.id&&picking} disabled={rosterLocked} onClick={()=>{setSeat(i);setPicking(!picking||i!==seat);}}><img {...portraitProps(cat.id)} alt=""/><b>{R.CAT_BY_ID[cat.id]!.name}</b>{battle.initial.gameplayA6&&<PowerA6 value={R.powerScoreA6(cat.stats)}/>}<small>{battle.actors.find(a=>a.id===cat.id)!.hp}/{cat.stats.hp} HP</small>{battle.initial.gameplayA6&&R.activePairCombosA6(ids).some(pair=>pair.cats.includes(cat.id))&&<small title={R.activePairCombosA6(ids).filter(pair=>pair.cats.includes(cat.id)).map(pair=>pair.name).join(' · ')}>∞ Combo ready</small>}</button><div className="uv-row-buttons">{(['front','rear'] as const).map(row=><button key={row} aria-label={`Place ${R.CAT_BY_ID[cat.id]!.name} ${row}`} disabled={locked||rows[cat.id]===row||(row==='rear'&&!ids.some(id=>id!==cat.id&&rows[id]==='front'))} onClick={()=>place(cat.id,row)}>{row==='front'?'Front':'Back'}</button>)}</div></article>)}</div>
 {picking&&<div className="uv-roster" aria-label="Choose replacement">{m.state.account.cards.filter(c=>!ids.includes(c.cardId)).map(c=><button key={c.id} onClick={()=>choose(c.cardId)}><img {...portraitProps(c.cardId)} alt=""/><b>{R.CAT_BY_ID[c.cardId]!.name}</b></button>)}{m.state.account.cards.length===ids.length&&<p>Your whole crew is here. Recruit more friends at the counter.</p>}</div>}
 <details className="uv-prepare-plans"><summary>Choose a plan</summary><PreparationV4 m={m}/></details>
 </section><aside aria-label="Enemy preview"><h2>{m.tutorialBattle?'Practice table':'Tonight’s foes'}</h2>{battle.initial.gameplayA6&&<PowerA6 label="Recommended Power" value={battle.actors.filter(a=>a.side==='enemy').reduce((n,a)=>n+R.powerScoreA6(a),0)}/>}<div className="uv-enemy-preview">{battle.actors.filter(a=>a.side==='enemy').map(a=><article key={a.id}><img {...portraitProps(a.catalogId)} alt=""/><b>{a.name}</b>{battle.initial.gameplayA6&&<PowerA6 value={R.powerScoreA6(a)}/>}<small>{a.hp} HP · {a.row}</small>{R.ENEMY_BY_ID[a.catalogId]?.tier==='boss'&&<span title="Changes tactics at half health">♛ Phase change</span>}</article>)}</div><details><summary>Read their tricks</summary>{battle.actors.filter(a=>a.side==='enemy').map(a=><p key={a.id}><b>{a.name}:</b> {R.enemyGuideV4(a.catalogId).counter}</p>)}</details><ComboHintsV5 cats={ids}/></aside></div></div>
 <footer className="uv-fight-bar"><span>{m.tutorialBattle?'Keep a sturdy cat in front.':'Your cats follow the plan automatically.'}</span><button className="uv-fight" onClick={()=>m.fight()}>Fight <span aria-hidden="true">→</span></button></footer></>;
}

export function ResultV3({m}:{m:DepthModel}) {
 const battle=m.battle!,summary=summarizeBattle(battle),[details,setDetails]=useState(false),mvp=summary.mvp;
 const outcome=battle.v4?R.outcomeV4(battle):null,run=m.state.run,node=run?.nodes.find(n=>n.id===run.current);
 const stars=run&&node&&!run.towerA6&&!m.tutorialBattle&&!m.replay?R.combatStarsV4(run,node,battle):null;
 const rewards=!m.tutorialBattle&&!m.replay?resultRewards(m.state):[];
 const firstFallen=battle.initial.gameplayA6&&battle.result==='enemy'?outcome?.firstFallen:null;
 const why=firstFallen?`${firstFallen.name} fell first in round ${firstFallen.round}.`:outcome?.causes[0]?.text??`${battle.round} rounds played.`;
 const foe=battle.actors.find(a=>a.side==='enemy');
 const suggestion=foe?R.enemyGuideV4(foe.catalogId).counter:'Prepare your crew for the next stop.';
 const a6Loss=!!battle.initial.gameplayA6&&battle.result==='enemy'&&!m.tutorialBattle&&!m.replay;
 return <><div className="uv-result" data-a6-loss={a6Loss||undefined}><div className="uv-result-title"><small>{m.tutorialBattle?'PRACTICE COMPLETE':run?.towerA6?`YARN TOWER · FLOOR ${run.floor} · ${battle.round} ROUNDS`:`CHAPTER ${battle.chapter} · ${battle.round} ROUNDS`}</small><h2>{battle.result==='party'?'Victory':battle.result==='enemy'?'Defeat':'Replay complete'}</h2>{stars&&<div className="uv-result-stars" aria-label={`${stars.conditions.filter(Boolean).length} of 3 stars`}>{stars.conditions.map((on,i)=><span key={i} data-earned={on} style={{animationDelay:`${i*140}ms`}}>★</span>)}</div>}</div>
 {mvp&&<div className="uv-result-mvp"><img {...portraitProps(mvp.catalogId)} alt={mvp.name}/><div><small>TONIGHT’S STAR</small><h3>{mvp.name}</h3><p>{mvp.damage} damage · {mvp.healing} healing</p></div></div>}
 <div className="uv-result-rewards" aria-label="Encounter rewards">{rewards.map(r=><span key={r.id}><i aria-hidden="true">{currencyIconA6(r.id)}</i> +<CountUpA6 value={r.amount} from={0} reducedMotion={m.state.settings.reducedMotion}/> {r.label}</span>)}{!rewards.length&&<span>{m.tutorialBattle?'A welcome invitation awaits':'Your encounter is recorded'}</span>}</div><p><b>{battle.initial.gameplayA6?firstFallen?'First setback:':'Battle highlight:':'Why:'}</b> {why}</p>{a6Loss?<AdviceV4 m={m}/>:<p><b>Try this:</b> {suggestion}</p>}
 <div className="cr-actions"><button onClick={()=>setDetails(!details)} aria-expanded={details}>Read details</button><button className={a6Loss?undefined:"uv-fight"} onClick={()=>{m.finish();if(!m.error)m.go(run?.towerA6?'tower':'hub');}}>{a6Loss?(run?.towerA6?'Back to Tower':'Back to cafe'):'Next'} <span aria-hidden="true">→</span></button></div></div>{details&&<div className="uv-advanced"><Suspense fallback={<p>Opening…</p>}><FullResult m={m}/></Suspense></div>}</>;
}

export function RouteV3({m,onReturn}:{m:DepthModel;onReturn?:()=>void}) {
 const defaults=patrolDefaults(m.state),[chosen,setChosen]=useState<number|null>(null),band=Math.min(chosen??defaults.band,defaults.ceiling);
 if(R.gameplayA6(m.state))return m.state.run?.towerA6&&!m.state.run.complete?<TowerA6 m={m} onReturn={onReturn}/>:<CampaignA6 m={m}/>;
 return <section aria-label="Route preview"><details className="uv-route-options" open={!m.state.run}><summary>Choose a route</summary><label>Challenge band <select value={band} aria-label="Challenge band" disabled={defaults.active} onChange={e=>setChosen(Number(e.target.value))}>{Array.from({length:defaults.ceiling},(_,i)=><option key={i} value={i+1}>Band {i+1}</option>)}</select></label><div className="uv-task-grid">{R.CHAPTERS.map(c=><button key={c.id} disabled={defaults.active||c.id>1&&!m.state.cleared.includes(c.id-1)} onClick={()=>{m.start(c.id,'campaign',band);}}><b>Explore {c.name}</b><small>{c.reward}</small></button>)}</div><div className="cr-actions"><button disabled={defaults.active} onClick={()=>m.start(Math.min(3,m.state.cleared.length+1),'daily')}>Start daily challenge</button><button disabled={defaults.active||!m.state.cleared.includes(3)} onClick={()=>m.start(1,'tower')}>Climb Tower · {m.state.towerBest}</button></div></details><Suspense fallback={<p>Opening the route…</p>}><RunMap m={m}/></Suspense></section>;
}
