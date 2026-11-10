import {CARD_BY_ID} from '@taskbar-hero/game-rules/cardrpg';
import type {CSSProperties} from 'react';
import {HealthMeterA6,RageMeterA6} from './HudMetersA6';
import './battle-a6.css';
import {lazy,Suspense,useEffect,useMemo,useRef,useState} from 'react';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import type {DepthModel} from '../depth/model';
import {artPropsA6 as portraitProps} from './art-a6';
import {skillReadinessV4} from '../../squad/turn3d/card-v4-presentation';
import {applyV5Presentation,REACTION_WORDS,v5SourceForPlan} from '../../squad/turn3d/card-v5-events';
import {statusImpactLabels,statusPresentation} from '../../squad/turn3d/card-status-beats';
import {isLookV2} from '../../squad/turn3d/look-v2';
import {StatusBadges} from '../../squad/turn3d/StatusBadges';
const Guide=lazy(()=>import('../depth/Pages').then(m=>({default:m.Codex})));

/** Presentation only: the existing model remains the sole combat clock. */
export default function BattleHudV3({m}:{m:DepthModel}) {
 const battle=m.visualBattle!,plan=m.plan,banner=useRef<HTMLElement>(null),comboBanner=useRef<HTMLElement>(null),effects=useRef<HTMLDivElement>(null);
 const [help,setHelp]=useState(false),[more,setMore]=useState(false),[log,setLog]=useState(false);
 const [banners,setBanners]=useState(()=>{try{return localStorage.getItem('lantern-ui-v3-banners')!=='off'}catch{return true}});
 const pausedBeforeHelp=useRef(false);
 const boss=battle.actors.find(a=>a.side==='enemy'&&['boss','elite'].includes(R.ENEMY_BY_ID[a.catalogId]?.tier??''));
 const bossPhase=boss?(boss.bonuses.a6FirstPhase?(boss.phase===2?3:2):1):1;
 const caster=battle.actors.find(a=>a.id===plan?.actorId);
 const legacy=!isLookV2();
 const presentation=useMemo(()=>plan?applyV5Presentation(plan,statusPresentation(plan,m.battle?.log??[]),v5SourceForPlan(plan,m.battle,battle)):undefined,[plan,m.battle,battle]);
 const reactions=legacy?presentation?.reactions??[]:[];
 const numbers=legacy&&plan&&presentation?plan.targetIds.map(id=>({id,at:plan.beats[2]!.start+(presentation.offsets.get(id)??0),labels:statusImpactLabels(plan,id,presentation).filter(e=>['damage','heal','shield'].includes(e.type)&&e.amount>0)})).filter(n=>n.labels.length):[];
 useEffect(()=>{
  let frame=0;
  const paint=()=>{
   if(comboBanner.current)comboBanner.current.hidden=m.playbackAt>=m.comboBannerUntil;
   if(banner.current)banner.current.hidden=!m.plan?.ultimate||(m.a6Battle?m.playbackAt>=m.ultimateBannerUntil:m.animationAt>=800);
   for(const el of effects.current?.querySelectorAll<HTMLElement>('[data-reaction]')??[]){
    const at=Number(el.dataset.at),duration=Number(el.dataset.duration);
    const plate=Array.from(document.querySelectorAll<HTMLElement>('.dp-world-plate')).find(p=>p.dataset.actor===el.dataset.target);
    el.hidden=!plate||plate.hidden||m.animationAt<at||m.animationAt>=at+duration;
    if(plate&&!el.hidden){const r=plate.getBoundingClientRect();el.style.left=`${Math.max(8,Math.min(innerWidth-170,r.x))}px`;el.style.top=`${Math.max(84,r.y-38)}px`;}
   }
   for(const el of effects.current?.querySelectorAll<HTMLElement>('[data-number]')??[]){
    const target=Array.from(document.querySelectorAll<HTMLElement>('.dp-world-plate,.uv-battle-cat')).find(p=>p.dataset.actor===el.dataset.target);
    el.hidden=!target||target.hidden||m.animationAt<Number(el.dataset.at);
    if(target&&!el.hidden){const r=target.getBoundingClientRect();el.style.left=`${Math.max(8,Math.min(innerWidth-170,r.x))}px`;el.style.top=`${Math.max(86,r.y-44)}px`;}
   }
   frame=requestAnimationFrame(paint);
  };paint();return()=>cancelAnimationFrame(frame);
 },[m,plan]);
 const closeHelp=()=>{setHelp(false);m.paused=pausedBeforeHelp.current;m.notify(false);};
 useEffect(()=>{const key=(e:KeyboardEvent)=>{if(e.key==='Escape'){if(help)closeHelp();else{setMore(false);setLog(false)}}};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);});
 return <div className="uv-battle-hud" data-a6={m.a6Battle} aria-label="Battle controls">
  <header className="uv-battle-top"><div className="uv-battle-round"><small>{m.tutorialBattle?'Practice table':R.CHAPTERS[battle.chapter-1]!.name}</small><b>Wave 1/1 · Round {battle.round}</b></div>
   {boss&&<div className="uv-boss" aria-label={`${boss.name} boss health`}><b>{m.a6Battle&&<span aria-hidden="true">♛ </span>}{boss.name}</b>{m.a6Battle?<HealthMeterA6 hp={boss.hp} maxHp={boss.maxHp} name={boss.name} reduced={m.state.settings.reducedMotion}/>:<progress value={boss.hp} max={boss.maxHp}/>}<small>{boss.hp}/{boss.maxHp} · Phase {m.a6Battle?bossPhase:boss.phase}</small>{m.a6Battle&&<span className="a6-boss-phases" aria-label={`Phase ${bossPhase} of 3`}>{[1,2,3].map(p=><i key={p} data-active={p<=bossPhase}>◆</i>)}</span>}</div>}
   <div className="uv-battle-actions">{m.a6Battle&&<label className="uv-auto-continue" title="Auto-continue battles; pause at rest stops"><input type="checkbox" checked={m.autoContinue} onChange={e=>{m.autoContinue=e.target.checked;m.notify(false)}}/> Auto-next</label>}<button aria-label="Change playback speed" onClick={()=>m.cycleSpeed()}>×{m.state.settings.speed}</button><button onClick={()=>{m.paused=!m.paused;m.notify(false)}}>{m.paused?'Resume auto':'Pause auto'}</button><button disabled={!m.canSkip} title={m.canSkip?'Skip to result':'Earn three stars on this stage to skip it.'} onClick={()=>m.skip()}>{m.a6Battle&&!m.canSkip?'Skip · 3★ needed':'Skip to result'}</button><button aria-label="Read battle guide" onClick={()=>{pausedBeforeHelp.current=m.paused;m.paused=true;m.notify(false);setHelp(true)}}>?</button><button aria-label="More battle options" aria-expanded={more} onClick={()=>setMore(!more)}>⋯</button></div>
  </header>
  {m.a6Battle&&<section className="uv-enemy-rage" aria-label="Enemy rage">{battle.actors.filter(a=>a.side==='enemy'&&a.hp>0).map(a=><div key={a.id}><small>{a.name}</small><RageMeterA6 value={a.charge} ready={a.charge>=100} label={`${a.name} rage: ${a.charge}/100`}/></div>)}</section>}
  
  {more&&<div className="uv-battle-menu"><button onClick={()=>{const next=!banners;setBanners(next);try{localStorage.setItem('lantern-ui-v3-banners',next?'on':'off')}catch{/* Session preference still works. */}}}>Turn banners {banners?'off':'on'}</button><button onClick={()=>{void m.audio.toggle().then(()=>{m.state.settings.sound=m.audio.enabled;m.notify()})}}>Turn sound {m.audio.enabled?'off':'on'}</button><button onClick={()=>{setLog(!log);setMore(false)}}>Read battle log</button><button onClick={()=>m.leave()}>Leave table</button></div>}
  <div className="uv-battle-party dp-v5look" aria-label="Crew health and ultimates">{battle.actors.filter(a=>a.side==='party').map(cat=>{
   const ult=R.CAT_BY_ID[cat.catalogId]?.skills.find(s=>s.type==='ultimate');
   const readiness=ult?(m.a6Battle?(!cat.skills.includes(ult.id)?'Unlocks at level 6':cat.charge>=100?'Ready':`${cat.charge}/100 rage`):battle.v4?skillReadinessV4(cat,ult):cat.charge>=100?'Ready':`${cat.charge}/100 charge`):'Unavailable';
   const owned=m.state.account.cards.find(c=>c.cardId===cat.catalogId);
   const ready=cat.hp>0&&readiness==='Ready';
   const progress=m.a6Battle?cat.charge/100:battle.v4?(readiness==='Ready'?1:readiness==='Used this battle'?0:1-Math.min(1,(Number.parseInt(readiness)||0)/Math.max(2,ult?.cooldown??2))):cat.charge/100;
   if(!m.a6Battle)return <article key={cat.id} className="uv-battle-cat" data-actor={cat.id} data-ready={ready} data-fallen={cat.hp<=0}><img {...portraitProps(cat.catalogId)} alt=""/><div><b>{cat.name}</b><small>{cat.hp}/{cat.maxHp} HP</small><progress value={cat.hp} max={cat.maxHp} aria-label={`${cat.name} health`}/><progress className="uv-ult-charge" value={progress} max={1} aria-label={`${cat.name} ultimate: ${readiness}`}/><small className="uv-ult-label">{ready?'Ultimate ready':`Ultimate · ${readiness}`}</small></div><StatusBadges statuses={cat.statuses} name={cat.name}/></article>;
   return <article key={cat.id} className="uv-battle-cat" data-actor={cat.id} data-ready={ready} data-fallen={cat.hp<=0} data-rarity={CARD_BY_ID[cat.catalogId]?.rarity}><div className="a6-hud-portrait"><img {...portraitProps(cat.catalogId,'face')} alt=""/>{m.a6Battle&&<><span className="a6-hud-level">Lv. {owned?.level??1}</span><span className="a6-hud-stars" aria-label={`${owned?.stars??1} stars`}>{'★'.repeat(owned?.stars??1)}</span></>}</div><div className="a6-hud-vitals"><b>{cat.name}</b><small>{cat.hp}/{cat.maxHp} HP</small><HealthMeterA6 hp={cat.hp} maxHp={cat.maxHp} name={cat.name} reduced={m.state.settings.reducedMotion}/><RageMeterA6 value={progress*100} ready={ready} label={`${cat.name} ultimate: ${readiness}`}/><small className="uv-ult-label">{ready?'Ultimate ready':`Ultimate · ${readiness}`}</small></div><StatusBadges statuses={cat.statuses} name={cat.name}/></article>;
  })}</div>
  {banners&&plan?.ultimate&&caster?.side==='party'&&<aside key={plan.id} ref={banner} hidden={m.a6Battle?m.playbackAt>=m.ultimateBannerUntil:m.animationAt>=800} className={`uv-ultimate-banner ${m.a6Battle?'a6-ultimate-cutin':''}`} style={{'--cutin-enter':`${180/m.state.settings.speed}ms`} as CSSProperties} aria-label="Ultimate cast">{m.a6Battle&&<><span className="a6-cutin-rays" aria-hidden="true"/><img {...portraitProps(caster.catalogId)} alt=""/></>}<div><small>{m.a6Battle?'ULTIMATE · ':''}{caster.name}</small><b>{plan.name}</b>{m.a6Battle&&<span className="a6-cutin-flourish" aria-hidden="true">✦ ━━━━━ ✦</span>}</div></aside>}
  {banners&&m.a6Battle&&m.comboBanner&&<aside ref={comboBanner} className="a6-combo-banner" aria-label="Bond combo"><small>Bond combo · together as one</small><b>{m.comboBanner}</b></aside>}
  <div ref={effects}>{reactions.map((r,i)=><div key={`${plan?.id}-${i}`} className="uv-reaction" data-reaction={r.id} data-target={r.targetId} data-at={r.at} data-duration={r.duration} hidden>{REACTION_WORDS[r.id]}</div>)}{numbers.map(n=><div className="uv-float-number" data-number data-target={n.id} data-at={n.at} key={n.id} hidden>{n.labels.map((e,i)=><span key={i} className={`uv-damage-${e.type} ${e.dot?'uv-dot-damage':''} ${e.statusId==='snag'?'uv-bleed-damage':''} ${e.critical?'uv-critical':''}`}>{e.type==='heal'?'+':e.type==='shield'?'◇':'−'}{e.amount}</span>)}</div>)}</div>
  {help&&<section className="uv-battle-guide" role="dialog" aria-label="Battle guide" onKeyDown={e=>{if(e.key==='Escape'){e.stopPropagation();closeHelp()}}}><button autoFocus onClick={closeHelp}>Close guide</button><Suspense fallback={<p>Opening…</p>}><Guide v4={!!battle.v4} skillsV5={!!battle.initial.skillsV5}/></Suspense></section>}
  {log&&<section className="uv-battle-guide" role="dialog" aria-label="Battle log"><button onClick={()=>setLog(false)}>Close log</button>{battle.log.slice(-100).reverse().map((e,i)=><p key={i}>Round {e.round} · {e.text||`${e.kind} ${e.amount}`}</p>)}</section>}
 </div>;
}
