import {useEffect,useLayoutEffect,useRef,useState,type CSSProperties} from 'react';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import {CARD_BY_ID} from '@taskbar-hero/game-rules/cardrpg';
import type {DepthModel} from '../depth/model';
import type {SpineScene} from '../spine/scene';
import {ELEMENT_COLORS} from '../stage/core';
import BattleLogV3 from '../ui-v3/BattleLogV3';
import BattleLeaveV3 from '../ui-v3/BattleLeaveV3';
import {SoundControlA6} from '../ui-v3/SoundControlA6';
import {battleControls,setAutoUltimates,skipPlate,type CinematicMode} from './controls';
import {STATUS_BODY,STATUS_COLOR,STATUS_PATH} from './status';
import '@fontsource/baloo-2/800.css';
import './battle.css';
import './hud-details.css';
import {GameIcon} from '../../../ui/GameIcon';
import {displayedBossPhase} from '../depth/battle-presentation';
import {portrait} from '../depth/assets';
import {battleWave,IntentMark} from './hud-details';
import {createWorldLabelLayout} from './world-label-dom';
import {bindWorldStatusSource} from './world-label-status';

function Meter({hp,max,name,shield=0,reduced=false}:{hp:number;max:number;name:string;shield?:number;reduced?:boolean}){
 const value=Math.max(0,Math.min(100,hp/max*100)),[trail,setTrail]=useState(value);
 useEffect(()=>{if(value>=trail||reduced){setTrail(value);return;}const timer=setTimeout(()=>setTrail(value),400);return()=>clearTimeout(timer);},[value,reduced,trail]);
 return <div className="b3-hp" role="progressbar" aria-label={name+' HP'} aria-valuemin={0} aria-valuemax={max} aria-valuenow={hp}>
  <i className="b3-trail" style={{width:`${Math.max(value,trail)}%`}}/><i className="b3-fill" style={{width:`${value}%`}}/>
  {shield>0&&<i className="b3-shield" style={{width:`${Math.min(100,100*shield/max)}%`}}/>}
 </div>;
}
function Rage({value,name}:{value:number;name:string}){
 return <div className="b3-rage" role="progressbar" aria-label={name+' rage'} aria-valuemin={0} aria-valuemax={100} aria-valuenow={value}><i style={{width:`${Math.min(100,value)}%`}}/></div>;
}
function Badges({actor,tutorial=false}:{actor:R.Actor;tutorial?:boolean}){
 return <div data-tutorial-id={tutorial?"battle-statuses":undefined} className="b3-statuses" aria-label={actor.name+' statuses'}>
  {actor.shield>0&&<span role="img" tabIndex={0} aria-label={`${actor.shield} shield`} title={`${actor.shield} shield`} style={{color:STATUS_COLOR.shield}}><svg viewBox="0 0 20 20" aria-hidden="true"><path d={STATUS_PATH.shield}/></svg></span>}
  {actor.statuses.slice(0,3).map(s=>{const body=STATUS_BODY[s.id]??'debuff',rule=R.statusRuleV5(s.id,R.STATUS_BY_ID[s.id]);return <span key={s.id} tabIndex={0} role="img" aria-label={`${rule.name}, ${s.stacks} stacks, ${s.remaining} rounds. ${rule.description}`} title={rule.name+': '+rule.description} style={{color:STATUS_COLOR[body]}}>
   <svg viewBox="0 0 20 20" aria-hidden="true"><path d={STATUS_PATH[body]}/></svg><b>{s.stacks}</b></span>;})}
  {actor.statuses.length>3&&<span tabIndex={0} title={actor.statuses.slice(3).map(s=>R.STATUS_BY_ID[s.id].name).join(',')} aria-label={`${actor.statuses.length-3} more statuses`}>+{actor.statuses.length-3}</span>}
 </div>;
}
const ULT_HINT_KEY='lantern-ult-hint';
let ultHintSession=false;
function ultHintDone(){if(ultHintSession)return true;try{return localStorage.getItem(ULT_HINT_KEY)==='done';}catch{return false;}}
function markUltHintDone(){ultHintSession=true;try{localStorage.setItem(ULT_HINT_KEY,'done');}catch{/* Session flag still hides it. */}}
export default function BattleHud({m}:{m:DepthModel}){
 const battle=m.visualBattle!,controls=battleControls(m),world=useRef(new Map<string,HTMLDivElement>()),total=useRef<HTMLOutputElement>(null);
 const worldLayer=useRef<HTMLDivElement>(null);
 useLayoutEffect(()=>bindWorldStatusSource(worldLayer.current!,()=>
  (m.visualBattle?.actors??[]).map(actor=>({id:actor.id,shield:actor.shield>0,stacks:actor.statuses.map(status=>status.stacks)}))),[m]);
 const [intro,setIntro]=useState(true);
 const wave=battleWave(m),boss=battle.actors.find(a=>a.side==='enemy'&&R.ENEMY_BY_ID[a.catalogId]?.tier==='boss');
 useEffect(()=>{setIntro(true);const timer=setTimeout(()=>setIntro(false),900);return()=>clearTimeout(timer);},[battle.initial]);
 const [more,setMore]=useState(false),[help,setHelp]=useState(false),[log,setLog]=useState(false),[leaving,setLeaving]=useState(false);
 const menuButton=useRef<HTMLButtonElement>(null),helpButton=useRef<HTMLButtonElement>(null),dialog=useRef<HTMLDialogElement>(null),paused=useRef(false);
 const skipButton=useRef<HTMLButtonElement>(null);
 const totalState=useRef<{plan:unknown;until:number;amount:number}>({plan:null,until:0,amount:0});
 useEffect(()=>{
  document.body.classList.add('battle-v3-active');
  const labelLayout=createWorldLabelLayout(world.current);
  let raf=0;
  const paint=()=>{
   const scene=window.__depthScene as SpineScene|undefined,canvas=document.querySelector('.dp-canvas')?.getBoundingClientRect();
   if(canvas&&scene?.anchors)labelLayout.paint(scene.anchors,canvas,!!m.battle?.initial.formationC2);
   document.body.classList.toggle('b3-cinema-occludes',!!scene?.cinema&&(scene.cinema.audit.plate||scene.cinema.audit.cutin));
   if(skipButton.current)skipButton.current.hidden=!scene?.cinema?.audit.plate;
   const plan=m.plan,state=totalState.current,now=performance.now();
   if(plan&&(plan.ultimate||/-[23]$/.test(plan.presentationId??plan.skillId)||/^enemy:[^:]+$/.test(plan.presentationId??plan.skillId))&&m.impactVisible&&state.plan!==plan){state.plan=plan;state.amount=plan.events.filter(e=>e.type==='damage').reduce((n,e)=>n+e.amount,0);state.until=now+1000;}
   if(total.current){total.current.hidden=now>state.until||!state.amount;total.current.querySelector('b')!.textContent=String(state.amount);}
   raf=requestAnimationFrame(paint);
  };paint();return()=>{cancelAnimationFrame(raf);labelLayout.dispose();document.body.classList.remove('battle-v3-active','b3-cinema-occludes');};
 },[m]);
 useEffect(()=>{if(help)dialog.current?.showModal();},[help]);
 const closeHelp=()=>{dialog.current?.close();setHelp(false);m.paused=paused.current;m.notify(false);helpButton.current?.focus();};
 useEffect(()=>{const listener=(e:KeyboardEvent)=>{if(e.key==='Escape'&&more){setMore(false);menuButton.current?.focus();}};window.addEventListener('keydown',listener);return()=>window.removeEventListener('keydown',listener);},[more]);
 const party=battle.actors.filter(a=>a.side==='party');
 return <div className="b3-hud" data-reduced={m.state.settings.reducedMotion} aria-label="Battle controls">
  <header className="b3-top">
   <span className="b3-wave" title={`Wave ${wave.current} of ${wave.total}`} aria-label={`Wave ${wave.current} of ${wave.total}`}><GameIcon name="fight" size={22}/><b>{wave.current}/{wave.total}</b></span>
   <span className="b3-round" title={`Round ${battle.round} of 15`} aria-label={`Round ${battle.round} of 15`}><GameIcon name="clock" size={20}/><b>{battle.round}/15</b></span>
   {boss&&<div className="b3-boss" title={boss.name} aria-label={`${boss.name}, phase ${displayedBossPhase(battle,boss)}`}>
    <GameIcon name="boss-seal" size={32}/><Meter hp={boss.hp} max={boss.maxHp} name={boss.name} shield={boss.shield} reduced={m.state.settings.reducedMotion}/>
    <span className="b3-phase-ticks" aria-hidden="true">{(battle.initial.gameplayA6?[.66,.33]:[.5]).map(at=><i key={at} style={{left:`${at*100}%`}}/>)}</span><b>{Math.ceil(100*boss.hp/boss.maxHp)}%</b>
   </div>}
   <div className="b3-turns" data-tutorial-id="battle-order" aria-label="Upcoming turns">{battle.queue.filter(id=>!battle.acted.includes(id)).slice(0,4).map(id=>{const actor=battle.actors.find(a=>a.id===id)!;return <span key={id} title={actor.name} aria-label={actor.name}><img src={actor.side==='enemy'?portrait(actor.catalogId):`/units/${actor.catalogId}/portrait.webp`} alt=""/></span>;})}</div>
   <span className="b3-supplies" data-tutorial-id="battle-supplies" title={battle.initial.packedSupply?`Packed ${battle.initial.packedSupply.id}`:'No packed supply'} aria-label={battle.initial.packedSupply?`Packed ${battle.initial.packedSupply.id}`:'No packed supply'}><GameIcon name="potion" size={24}/><b>{battle.initial.packedSupply?1:0}</b></span>
   <span className="b3-top-spacer"/>
   <button aria-label={m.paused?'Resume auto':'Pause auto'} title={m.paused?'Resume':'Pause'} onClick={()=>{m.paused=!m.paused;m.notify(false);}}>{m.paused?'▶':'Ⅱ'}</button>
   <button ref={helpButton} aria-label="Read battle guide" onClick={()=>{paused.current=m.paused;m.paused=true;m.notify(false);setHelp(true);}}>?</button>
   <button ref={menuButton} aria-label="More battle options" aria-expanded={more} onClick={()=>setMore(!more)}><GameIcon name="menu" size={20}/></button>
  </header>
  {intro&&!m.plan&&battle.round===1&&<div className="b3-wave-intro" aria-live="polite"><GameIcon name="fight" size={36}/><strong>Wave {wave.current}/{wave.total}</strong></div>}
  <div className="b3-world-layer" ref={worldLayer}>{battle.actors.filter(a=>a.hp>0).map(a=><div className="b3-world" data-tutorial-id={a.id===party[0]?.id?"battle-rows":undefined} data-side={a.side} data-actor={a.id} title={a.name} aria-label={a.name} key={a.id} ref={node=>{if(node)world.current.set(a.id,node);else world.current.delete(a.id);}}>
   <div data-tutorial-id={a.id===battle.actors.find(a=>a.side==='enemy'&&a.hp>0)?.id?"battle-intent":undefined} className="b3-marker-row">{a.side==='enemy'&&<IntentMark intent={battle.intents.find(i=>i.actorId===a.id)} />}<Badges actor={a} tutorial={a.id===party[0]?.id}/></div><Meter hp={a.hp} max={a.maxHp} shield={a.shield} name={a.name} reduced={m.state.settings.reducedMotion}/><Rage value={a.charge} name={a.name}/>
  </div>)}</div>
  <footer className="b3-bottom">
   <button data-tutorial-id="battle-speed" className="b3-speed" aria-label="Change playback speed" onClick={()=>m.cycleSpeed()}>×{m.state.settings.speed}</button>
   {(()=>{const threat=battle.intents.find(i=>{const foe=battle.actors.find(a=>a.id===i.actorId);return i.signature&&!i.interrupted&&foe&&foe.hp>0&&['boss','elite'].includes(R.ENEMY_BY_ID[foe.catalogId]?.tier??'');});
    if(!threat)return null;const foe=battle.actors.find(a=>a.id===threat.actorId)!,target=battle.actors.find(a=>a.id===threat.targetId);
    const name=threat.label.includes(' · ')?threat.label.split(' · ')[1]:threat.label;
    return <aside className="b3-threat" role="status" key={threat.actorId+battle.round}><b>⚠ {foe.name} is winding up{name&&!/basic/i.test(name)?`: ${name}`:' a heavy strike'}</b><span>{target&&target.side==='party'?`Aimed at ${target.name}. `:''}{threat.counter}</span></aside>;})()}
   {(()=>{if(controls.auto||ultHintDone())return null;const readyCat=party.find(cat=>{const u=R.CAT_BY_ID[cat.catalogId]?.skills.find(s=>s.type==='ultimate');return cat.hp>0&&cat.charge>=100&&cat.skills.includes(u?.id??'')&&!controls.queued.has(cat.id);});
    return readyCat?<p className="b3-ult-hint" role="status"><b>{readyCat.name}'s ultimate is ready.</b> Tap the glowing portrait to cast it on {readyCat.name}'s next turn, or it fires by itself soon after. Time it: shields before a boss slam, heals after it.</p>:null;})()}
   <div data-tutorial-id="battle-roles" className="b3-party" aria-label="Crew health and ultimates">{party.map(cat=>{
    const ult=R.CAT_BY_ID[cat.catalogId]?.skills.find(s=>s.type==='ultimate'),ready=cat.hp>0&&cat.charge>=100&&cat.skills.includes(ult?.id??''),queued=controls.queued.has(cat.id);
    const stars=m.state.account.cards.find(c=>c.cardId===cat.catalogId)?.stars??1;
    return <button key={cat.id} className="b3-portrait" data-actor={cat.id} data-ready={ready} data-manual={!controls.auto} data-queued={queued} data-fallen={cat.hp<=0} data-rarity={CARD_BY_ID[cat.catalogId]?.rarity} title={cat.name}
     style={{'--element':ELEMENT_COLORS[cat.catalogId]??'#e8c06e'} as CSSProperties}
     aria-label={`${cat.name} ultimate: ${ready?'Ready':cat.hp<=0?'Fallen':cat.charge+'/100 rage'}.${controls.auto?' Casts automatically.':queued?' Queued for next legal turn.':' Click to queue.'}`}
     onClick={()=>{if(!controls.auto&&ready){if(queued)controls.queued.delete(cat.id);else{controls.queued.add(cat.id);markUltHintDone();}m.notify(false);}}}>
      <img src={`/units/${cat.catalogId}/portrait.webp`} alt=""/><span className="b3-name" aria-hidden="true">{cat.name}</span><span className="b3-portrait-shine" aria-hidden="true"/><span className="b3-stars" aria-label={stars+' stars'}>{'★'.repeat(stars)}</span>
      {queued?<span className="b3-queued" aria-label="Queued">Next turn</span>:ready&&!controls.auto&&<span className="b3-tap" aria-hidden="true">TAP</span>}<Meter hp={cat.hp} max={cat.maxHp} shield={cat.shield} name={cat.name} reduced={m.state.settings.reducedMotion}/><span data-tutorial-id={cat.id===party[0]?.id?"battle-rage":undefined} className="b3-rage-target"><Rage value={cat.charge} name={cat.name}/></span>
     </button>;
   })}</div>
   <div className="b3-bottom-actions"><button aria-label="Toggle Auto ultimates" aria-pressed={controls.auto} onClick={()=>setAutoUltimates(m,!controls.auto)} className="b3-auto"><GameIcon name="refresh" size={20}/>Auto<i data-on={controls.auto}/></button>
    <button aria-label="Skip to result" disabled={!m.canSkip} title={m.canSkip?'Skip to result':'Earn three stars to skip this battle'} onClick={()=>m.skip()} className="b3-skip"><svg viewBox="0 0 32 24" aria-hidden="true"><path d="M4 4 15 12 4 20ZM16 4 27 12 16 20Z"/><path d="M29 4V20"/></svg></button></div>
  </footer>
  <button ref={skipButton} hidden className="b3-skip-plate" onClick={()=>skipPlate(m)} aria-label="Skip cinematic" title="Skip cinematic"><svg viewBox="0 0 32 24" aria-hidden="true"><path d="M4 4 15 12 4 20ZM16 4 27 12 16 20Z"/></svg></button>
  <output className="b3-total" ref={total} aria-label="Total skill damage" hidden><i>Σ</i><b>0</b></output>
  {more&&<div className="b3-menu">{m.a6Battle&&!m.replay&&<label className="b3-autonext"><input type="checkbox" aria-label="Auto-next" checked={m.autoContinue} onChange={e=>{m.autoContinue=e.target.checked;m.notify(false);}}/>Auto-next battle</label>}
   <label>Effects quality<select value={m.state.settings.quality} onChange={e=>{m.state.settings.quality=e.target.value as typeof m.state.settings.quality;m.notify(false);}}><option value="high">High</option><option value="low">Low</option></select></label><SoundControlA6 m={m} battle/><button onClick={()=>{paused.current=m.paused;m.paused=true;m.notify(false);setLog(true);setMore(false);}}>Read battle log</button>
   <button onClick={()=>{setMore(false);if(m.replay||m.galleryBattle){m.leave();return;}paused.current=m.paused;m.paused=true;m.notify(false);setLeaving(true);}}>Leave table</button></div>}
  {help&&<dialog ref={dialog} className="b3-help" aria-label="Battle guide" onCancel={e=>{e.preventDefault();closeHelp();}}><button autoFocus onClick={closeHelp}>Close guide</button><h2>Keep the café glowing</h2><p>Green bars are ally HP; red bars are enemy HP. Gold bars are rage. A gold portrait means its ultimate is ready.</p><p>Each cat has a Basic and an Ultimate. Auto casts ultimates on legal turns. Turn Auto off and tap a glowing portrait to queue it. Status symbols show stacks; hover or focus for their effects.</p><p>Burn: fire. Bitter: green bubbles. Bleed: red drips. Daze: orbiting stars. Shield: a pale bubble. Arrows show other buffs and debuffs.</p></dialog>}
  {log&&<BattleLogV3 battle={battle} wasPaused={paused.current} onClose={()=>{setLog(false);m.paused=paused.current;m.notify(false);menuButton.current?.focus();}}/>}
  {leaving&&<BattleLeaveV3 state={m.state} practice={!!m.tutorialBattle} wasPaused={paused.current} onCancel={()=>{setLeaving(false);m.paused=paused.current;m.notify(false);}} onConfirm={()=>{setLeaving(false);m.leave();}}/>}
 </div>;
}
