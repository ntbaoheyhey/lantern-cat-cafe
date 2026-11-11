import {lookSpineEnabled} from '../spine/config';
import {PAINT} from '../spine/style';
import {paintedRecipe} from '../spine/vfx-registry';
import {CARD_BY_ID} from '@taskbar-hero/game-rules/cardrpg';
import type {CSSProperties} from 'react';
import {HealthMeterA6,RageMeterA6} from './HudMetersA6';
import BattleLogV3 from './BattleLogV3';
import BattleLeaveV3 from './BattleLeaveV3';
import './battle-a6.css';
import {lazy,Suspense,useEffect,useMemo,useRef,useState} from 'react';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import type {DepthModel} from '../depth/model';
import {displayedBossPhase} from '../depth/battle-presentation';
import {artPropsA6 as portraitProps} from './art-a6';
import {skillReadinessV4} from '../../squad/turn3d/card-v4-presentation';
import {applyV5Presentation,REACTION_WORDS,v5SourceForPlan} from '../../squad/turn3d/card-v5-events';
import {statusImpactLabels,statusPresentation} from '../../squad/turn3d/card-status-beats';
import {isLookV2} from '../../squad/turn3d/look-v2';
import {StatusBadges} from '../../squad/turn3d/StatusBadges';
const Guide=lazy(()=>import('../depth/Pages').then(m=>({default:m.Codex})));
const currentStatusRule=(id:R.StatusId)=>R.statusRuleV5(id,R.STATUS_BY_ID[id]);

/** Presentation only: the existing model remains the sole combat clock. */
export default function BattleHudV3({m}:{m:DepthModel}) {
 const battle=m.visualBattle!,plan=m.plan,banner=useRef<HTMLElement>(null),comboBanner=useRef<HTMLElement>(null),phaseBanner=useRef<HTMLElement>(null),effects=useRef<HTMLDivElement>(null);
 const resolveStatusRule=battle.initial.skillsV5?currentStatusRule:undefined;
 const [help,setHelp]=useState(false),[more,setMore]=useState(false),[log,setLog]=useState(false),[leaving,setLeaving]=useState(false);
 const [banners,setBanners]=useState(()=>{try{return localStorage.getItem('lantern-ui-v3-banners')!=='off'}catch{return true}});
 const pausedBeforeHelp=useRef(false),helpButton=useRef<HTMLButtonElement>(null),helpDialog=useRef<HTMLDialogElement>(null);
 const pausedBeforeLog=useRef(false),moreButton=useRef<HTMLButtonElement>(null);
 const pausedBeforeLeave=useRef(false);
 const boss=battle.actors.find(a=>a.side==='enemy'&&['boss','elite'].includes(R.ENEMY_BY_ID[a.catalogId]?.tier??''));
 const bossPhase=boss?displayedBossPhase(battle,boss):1;
 const caster=battle.actors.find(a=>a.id===plan?.actorId);
 const legacy=!isLookV2(),spine=lookSpineEnabled(location.search,isLookV2());
 const accent=plan?paintedRecipe(plan.presentationId??plan.skillId)?.color??PAINT.honey:PAINT.honey;
 const presentation=useMemo(()=>plan?applyV5Presentation(plan,statusPresentation(plan,m.battle?.log??[]),v5SourceForPlan(plan,m.battle,battle)):undefined,[plan,m.battle,battle]);
 const reactions=legacy?presentation?.reactions??[]:[];
 const numbers=legacy&&plan&&presentation?plan.targetIds.map(id=>({id,at:plan.beats[2]!.start+(presentation.offsets.get(id)??0),labels:statusImpactLabels(plan,id,presentation).filter(e=>['damage','heal','shield'].includes(e.type)&&e.amount>0)})).filter(n=>n.labels.length):[];
 useEffect(()=>{
  let frame=0;
  const paint=()=>{
   if(comboBanner.current)comboBanner.current.hidden=m.playbackAt>=m.comboBannerUntil;
   const scene=window.__depthScene,cinematic=scene&&'cinematic' in scene?scene.cinematic:undefined;
   const canvas=spine?document.querySelector('.dp-canvas')?.getBoundingClientRect():undefined;
   if(banner.current){
    banner.current.hidden=spine?(!cinematic?.ultimateVisible||cinematic.actorId!==m.plan?.actorId||m.a6Battle&&m.ultimateBannerUntil===0):!m.plan?.ultimate||(m.a6Battle?m.playbackAt>=m.ultimateBannerUntil:m.animationAt>=800);
    if(spine&&cinematic?.box&&canvas){const box=cinematic.box;banner.current.dataset.compact=String(box.height<110);Object.assign(banner.current.style,{left:`${canvas.left+box.x}px`,top:`${canvas.top+box.y}px`,width:`${box.width}px`,height:`${box.height}px`});}
   }
   if(phaseBanner.current){
    phaseBanner.current.hidden=!cinematic?.phaseVisible;
    if(cinematic?.phaseBox&&canvas){const box=cinematic.phaseBox;Object.assign(phaseBanner.current.style,{left:`${canvas.left+box.x}px`,top:`${canvas.top+box.y}px`,width:`${box.width}px`,height:`${box.height}px`});phaseBanner.current.textContent=cinematic.phaseText;}
   }
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
 },[m,plan,spine]);
 useEffect(()=>{if(!help)return;const dialog=helpDialog.current!;dialog.showModal();return()=>dialog.close();},[help]);
 const closeHelp=()=>{helpDialog.current?.close();setHelp(false);m.paused=pausedBeforeHelp.current;m.notify(false);helpButton.current?.focus();};
 const closeLog=()=>{setLog(false);m.paused=pausedBeforeLog.current;m.notify(false);moreButton.current?.focus();};
 const closeLeave=()=>{setLeaving(false);m.paused=pausedBeforeLeave.current;m.notify(false);moreButton.current?.focus();};
 useEffect(()=>{const key=(e:KeyboardEvent)=>{if(e.key==='Escape'){if(help)closeHelp();else if(more){setMore(false);moreButton.current?.focus();}}};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);});
 return <div className="uv-battle-hud" data-a6={m.a6Battle} data-spine={spine} data-reduced={m.state.settings.reducedMotion} style={{'--spine-cream':PAINT.cream,'--spine-ink':PAINT.ink,'--spine-accent':accent,'--spine-rim':PAINT.rim} as CSSProperties} aria-label="Battle controls">
  <header className="uv-battle-top"><div className="uv-battle-round"><small>{m.tutorialBattle?'Practice table':R.CHAPTERS[battle.chapter-1]!.name}</small><b>Wave 1/1 · Round {battle.round}</b></div>
   {boss&&<div className="uv-boss" aria-label={`${boss.name} boss health`}><b>{m.a6Battle&&<span aria-hidden="true">♛ </span>}{boss.name}</b>{m.a6Battle?<HealthMeterA6 hp={boss.hp} maxHp={boss.maxHp} name={boss.name} reduced={m.state.settings.reducedMotion}/>:<progress value={boss.hp} max={boss.maxHp}/>}<small>{boss.hp}/{boss.maxHp} · Phase {m.a6Battle?bossPhase:boss.phase}</small>{m.a6Battle&&<span className="a6-boss-phases" aria-label={`Phase ${bossPhase} of 3`}>{[1,2,3].map(p=><i key={p} data-active={p<=bossPhase}>◆</i>)}</span>}</div>}
   <div className="uv-battle-actions">{m.a6Battle&&<label className="uv-auto-continue" title="Continue after wins; stop for rewards, route choices and rest stops"><input type="checkbox" checked={m.autoContinue} onChange={e=>{m.autoContinue=e.target.checked;m.notify(false)}}/> Auto-next</label>}<button aria-label="Change playback speed" onClick={()=>m.cycleSpeed()}>×{m.state.settings.speed}</button><button onClick={()=>{m.paused=!m.paused;m.notify(false)}}>{m.paused?'Resume auto':'Pause auto'}</button><button disabled={!m.canSkip} title={m.canSkip?'Skip to result':'Earn three stars on this stage to skip it.'} onClick={()=>m.skip()}>{m.a6Battle&&!m.canSkip?'Skip · 3★ needed':'Skip to result'}</button><button ref={helpButton} aria-label="Read battle guide" onClick={()=>{pausedBeforeHelp.current=m.paused;m.paused=true;m.notify(false);setHelp(true)}}>?</button><button ref={moreButton} aria-label="More battle options" aria-expanded={more} onClick={()=>setMore(!more)}>⋯</button></div>
  </header>
  {m.a6Battle&&<section className="uv-enemy-rage" aria-label="Enemy rage">{battle.actors.filter(a=>a.side==='enemy'&&a.hp>0).map(a=><div key={a.id}><small>{a.name}</small><RageMeterA6 value={a.charge} ready={a.charge>=100} label={`${a.name} rage: ${a.charge}/100`}/></div>)}</section>}

  {more&&<div className="uv-battle-menu"><button onClick={()=>{const next=!banners;setBanners(next);try{localStorage.setItem('lantern-ui-v3-banners',next?'on':'off')}catch{/* Session preference still works. */}}}>Turn banners {banners?'off':'on'}</button><button onClick={()=>{void m.audio.toggle().then(()=>{m.state.settings.sound=m.audio.enabled;m.notify()})}}>Turn sound {m.audio.enabled?'off':'on'}</button><button onClick={()=>{pausedBeforeLog.current=m.paused;m.paused=true;m.notify(false);setLog(true);setMore(false)}}>Read battle log</button><button onClick={()=>{setMore(false);if(m.replay||m.galleryBattle){m.leave();return;}pausedBeforeLeave.current=m.paused;m.paused=true;m.notify(false);setLeaving(true);}}>{m.galleryBattle?'Close preview':m.replay?'Return from replay':'Leave table'}</button></div>}
  <div className="uv-battle-party dp-v5look" aria-label="Crew health and ultimates">{battle.actors.filter(a=>a.side==='party').map(cat=>{
   const ult=R.CAT_BY_ID[cat.catalogId]?.skills.find(s=>s.type==='ultimate');
   const readiness=ult?(m.a6Battle?(cat.hp<=0?'Fallen':!cat.skills.includes(ult.id)?'Unlocks at level 6 or three stars':cat.charge>=100?'Ready':`${cat.charge}/100 rage`):battle.v4?skillReadinessV4(cat,ult):cat.charge>=100?'Ready':`${cat.charge}/100 charge`):'Unavailable';
   const owned=m.state.account.cards.find(c=>c.cardId===cat.catalogId);
   const ready=cat.hp>0&&readiness==='Ready';
   const readinessLabel=readiness==='Ready'?'Ultimate ready':readiness.startsWith('Unlocks')?'Ult · Lv. 6 or 3★':readiness.endsWith(' rage')?`Rage ${cat.charge}/100`:readiness;
   const progress=m.a6Battle?cat.charge/100:battle.v4?(readiness==='Ready'?1:readiness==='Used this battle'?0:1-Math.min(1,(Number.parseInt(readiness)||0)/Math.max(2,ult?.cooldown??2))):cat.charge/100;
   if(!m.a6Battle)return <article key={cat.id} className="uv-battle-cat" data-actor={cat.id} data-ready={ready} data-fallen={cat.hp<=0}><img {...portraitProps(cat.catalogId)} alt=""/><div><b>{cat.name}</b><small>{cat.hp}/{cat.maxHp} HP</small><progress value={cat.hp} max={cat.maxHp} aria-label={`${cat.name} health`}/><progress className="uv-ult-charge" value={progress} max={1} aria-label={`${cat.name} ultimate: ${readiness}`}/><small className="uv-ult-label">{ready?'Ultimate ready':`Ultimate · ${readiness}`}</small></div><StatusBadges statuses={cat.statuses} name={cat.name} resolveRule={resolveStatusRule}/></article>;
   return <article key={cat.id} className="uv-battle-cat" data-actor={cat.id} data-ready={ready} data-fallen={cat.hp<=0} data-rarity={CARD_BY_ID[cat.catalogId]?.rarity}><div className="a6-hud-portrait"><img {...portraitProps(cat.catalogId,'face')} alt=""/>{m.a6Battle&&<><span className="a6-hud-level">Lv. {owned?.level??1}</span><span className="a6-hud-stars" aria-label={`${owned?.stars??1} stars`}>{'★'.repeat(owned?.stars??1)}</span></>}</div><div className="a6-hud-vitals"><b>{cat.name}</b><small>{cat.hp}/{cat.maxHp} HP</small><HealthMeterA6 hp={cat.hp} maxHp={cat.maxHp} name={cat.name} reduced={m.state.settings.reducedMotion}/><RageMeterA6 value={progress*100} ready={ready} label={`${cat.name} ultimate: ${readiness}`}/><small className="uv-ult-label">{readinessLabel}</small></div><StatusBadges statuses={cat.statuses} name={cat.name} resolveRule={resolveStatusRule}/></article>;
  })}</div>
  {banners&&plan?.ultimate&&caster?.side==='party'&&<aside key={plan.id} ref={banner} hidden={spine|| (m.a6Battle?m.playbackAt>=m.ultimateBannerUntil:m.animationAt>=800)} className={`uv-ultimate-banner ${m.a6Battle?'a6-ultimate-cutin':''} ${spine?'spine-ultimate-cutin':''}`} data-unit={caster.catalogId} style={{'--cutin-enter':`${180/m.state.settings.speed}ms`} as CSSProperties} aria-label="Ultimate cast">{(m.a6Battle||spine)&&<><span className="a6-cutin-rays" aria-hidden="true"/><img {...portraitProps(caster.catalogId)} alt=""/></>}<div><small>{m.a6Battle?'ULTIMATE · ':''}{caster.name}</small><b>{plan.name}</b>{m.a6Battle&&<span className="a6-cutin-flourish" aria-hidden="true">✦ ━━━━━ ✦</span>}</div></aside>}
  {banners&&spine&&<aside ref={phaseBanner} className="spine-phase-cue" role="status" aria-label="Boss phase change" hidden/>}
  {banners&&m.a6Battle&&m.comboBanner&&<aside ref={comboBanner} className="a6-combo-banner" aria-label="Bond combo"><small>Bond combo · together as one</small><b>{m.comboBanner}</b></aside>}
  <div ref={effects}>{reactions.map((r,i)=><div key={`${plan?.id}-${i}`} className="uv-reaction" data-reaction={r.id} data-target={r.targetId} data-at={r.at} data-duration={r.duration} hidden>{REACTION_WORDS[r.id]}</div>)}{numbers.map(n=><div className="uv-float-number" data-number data-target={n.id} data-at={n.at} key={n.id} hidden>{n.labels.map((e,i)=><span key={i} className={`uv-damage-${e.type} ${e.dot?'uv-dot-damage':''} ${e.statusId==='snag'?'uv-bleed-damage':''} ${e.critical?'uv-critical':''}`}>{e.type==='heal'?'+':e.type==='shield'?'◇':'−'}{e.amount}</span>)}</div>)}</div>
  {help&&<dialog ref={helpDialog} className="uv-battle-guide" aria-label="Battle guide" onCancel={e=>{e.preventDefault();closeHelp();}} onKeyDown={e=>{
   e.stopPropagation();
   if(e.key==='Escape'){e.preventDefault();closeHelp();}
   if(e.key==='Tab'){
    const controls=[...e.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled),[tabindex="0"]')].filter(el=>el.getClientRects().length);
    const first=controls[0],last=controls.at(-1);
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}
   }
  }}><button autoFocus onClick={closeHelp}>Close guide</button><Suspense fallback={<p>Opening…</p>}><Guide v4={!!battle.v4} skillsV5={!!battle.initial.skillsV5} a6={m.a6Battle}/></Suspense></dialog>}
  {log&&<BattleLogV3 battle={battle} wasPaused={pausedBeforeLog.current} onClose={closeLog}/>}
  {leaving&&<BattleLeaveV3 state={m.state} practice={!!m.tutorialBattle} wasPaused={pausedBeforeLeave.current} onCancel={closeLeave} onConfirm={()=>{setLeaving(false);m.leave();}}/>}
 </div>;
}
