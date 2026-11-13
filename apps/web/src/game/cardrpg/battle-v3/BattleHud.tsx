import {useEffect,useRef,useState,type CSSProperties} from 'react';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import {CARD_BY_ID} from '@taskbar-hero/game-rules/cardrpg';
import type {DepthModel} from '../depth/model';
import type {SpineScene} from '../spine/scene';
import {ELEMENT_COLORS} from '../stage/core';
import BattleLogV3 from '../ui-v3/BattleLogV3';
import BattleLeaveV3 from '../ui-v3/BattleLeaveV3';
import {SoundControlA6} from '../ui-v3/SoundControlA6';
import {battleControls,skipPlate,type CinematicMode} from './controls';
import {STATUS_BODY,STATUS_COLOR,STATUS_PATH} from './status';
import '@fontsource/baloo-2/800.css';
import './battle.css';

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
function Badges({actor}:{actor:R.Actor}){
 return <div className="b3-statuses" aria-label={actor.name+' statuses'}>
  {actor.shield>0&&<span role="img" tabIndex={0} aria-label={`${actor.shield} shield`} title={`${actor.shield} shield`} style={{color:STATUS_COLOR.shield}}><svg viewBox="0 0 20 20" aria-hidden="true"><path d={STATUS_PATH.shield}/></svg></span>}
  {actor.statuses.slice(0,3).map(s=>{const body=STATUS_BODY[s.id]??'debuff',rule=R.statusRuleV5(s.id,R.STATUS_BY_ID[s.id]);return <span key={s.id} tabIndex={0} role="img" aria-label={`${rule.name}, ${s.stacks} stacks, ${s.remaining} rounds. ${rule.description}`} title={rule.name+': '+rule.description} style={{color:STATUS_COLOR[body]}}>
   <svg viewBox="0 0 20 20" aria-hidden="true"><path d={STATUS_PATH[body]}/></svg><b>{s.stacks}</b></span>;})}
  {actor.statuses.length>3&&<span tabIndex={0} title={actor.statuses.slice(3).map(s=>R.STATUS_BY_ID[s.id].name).join(',')} aria-label={`${actor.statuses.length-3} more statuses`}>+{actor.statuses.length-3}</span>}
 </div>;
}
export default function BattleHud({m}:{m:DepthModel}){
 const battle=m.visualBattle!,controls=battleControls(m),world=useRef(new Map<string,HTMLDivElement>()),total=useRef<HTMLOutputElement>(null);
 const [more,setMore]=useState(false),[help,setHelp]=useState(false),[log,setLog]=useState(false),[leaving,setLeaving]=useState(false);
 const menuButton=useRef<HTMLButtonElement>(null),helpButton=useRef<HTMLButtonElement>(null),dialog=useRef<HTMLDialogElement>(null),paused=useRef(false);
 const skipButton=useRef<HTMLButtonElement>(null);
 const totalState=useRef<{plan:unknown;until:number;amount:number}>({plan:null,until:0,amount:0});
 useEffect(()=>{
  document.body.classList.add('battle-v3-active');
  let raf=0;
  const paint=()=>{
   const scene=window.__depthScene as SpineScene|undefined,canvas=document.querySelector('.dp-canvas')?.getBoundingClientRect();
   if(canvas&&scene?.anchors)for(const anchor of scene.anchors){
    const node=world.current.get(anchor.id);if(!node)continue;node.hidden=!anchor.visible;
    node.style.left=`${canvas.left+anchor.labelX}px`;node.style.top=`${canvas.top+anchor.labelY}px`;
   }
   document.body.classList.toggle('b3-cinema-occludes',!!scene?.cinema&&(scene.cinema.audit.plate||scene.cinema.audit.cutin));
   if(skipButton.current)skipButton.current.hidden=!scene?.cinema?.audit.plate;
   const plan=m.plan,state=totalState.current,now=performance.now();
   if(plan?.ultimate&&m.impactVisible&&state.plan!==plan){state.plan=plan;state.amount=plan.events.filter(e=>e.type==='damage').reduce((n,e)=>n+e.amount,0);state.until=now+1000;}
   if(total.current){total.current.hidden=now>state.until||!state.amount;total.current.querySelector('b')!.textContent=String(state.amount);}
   raf=requestAnimationFrame(paint);
  };paint();return()=>{cancelAnimationFrame(raf);document.body.classList.remove('battle-v3-active','b3-cinema-occludes');};
 },[m]);
 useEffect(()=>{if(help)dialog.current?.showModal();},[help]);
 const closeHelp=()=>{dialog.current?.close();setHelp(false);m.paused=paused.current;m.notify(false);helpButton.current?.focus();};
 useEffect(()=>{const listener=(e:KeyboardEvent)=>{if(e.key==='Escape'&&more){setMore(false);menuButton.current?.focus();}};window.addEventListener('keydown',listener);return()=>window.removeEventListener('keydown',listener);},[more]);
 const party=battle.actors.filter(a=>a.side==='party');
 return <div className="b3-hud" data-reduced={m.state.settings.reducedMotion} aria-label="Battle controls">
  <header className="b3-top"><span className="b3-round" aria-label={`Wave 1 of 1, round ${battle.round}`}>ROUND <b>{battle.round}/15</b></span>
   <span className="b3-location">{R.CHAPTERS[battle.chapter-1]!.name}</span><span className="b3-wave" aria-label="Wave 1 of 1">◆</span>
   <button aria-label={m.paused?'Resume auto':'Pause auto'} onClick={()=>{m.paused=!m.paused;m.notify(false);}}>{m.paused?'▶':'Ⅱ'}</button>
   <button ref={helpButton} aria-label="Read battle guide" onClick={()=>{paused.current=m.paused;m.paused=true;m.notify(false);setHelp(true);}}>?</button>
   <button ref={menuButton} aria-label="More battle options" aria-expanded={more} onClick={()=>setMore(!more)}>⋯</button>
  </header>
  <div className="b3-world-layer">{battle.actors.filter(a=>a.hp>0).map(a=><div className="b3-world" data-side={a.side} data-actor={a.id} title={a.name} aria-label={a.name} key={a.id} ref={node=>{if(node)world.current.set(a.id,node);else world.current.delete(a.id);}}>
   <Badges actor={a}/><Meter hp={a.hp} max={a.maxHp} shield={a.shield} name={a.name} reduced={m.state.settings.reducedMotion}/><Rage value={a.charge} name={a.name}/>
  </div>)}</div>
  <footer className="b3-bottom">
   <button className="b3-speed" aria-label="Change playback speed" onClick={()=>m.cycleSpeed()}>×{m.state.settings.speed}</button>
   <div className="b3-party" aria-label="Crew health and ultimates">{party.map(cat=>{
    const ult=R.CAT_BY_ID[cat.catalogId]?.skills.find(s=>s.type==='ultimate'),ready=cat.hp>0&&cat.charge>=100&&cat.skills.includes(ult?.id??''),queued=controls.queued.has(cat.id);
    const stars=m.state.account.cards.find(c=>c.cardId===cat.catalogId)?.stars??1;
    return <button key={cat.id} className="b3-portrait" data-actor={cat.id} data-ready={ready} data-fallen={cat.hp<=0} data-rarity={CARD_BY_ID[cat.catalogId]?.rarity}
     style={{'--element':ELEMENT_COLORS[cat.catalogId]??'#e8c06e'} as CSSProperties}
     aria-label={`${cat.name} ultimate: ${ready?'Ready':cat.hp<=0?'Fallen':cat.charge+'/100 rage'}.${controls.auto?' Casts automatically.':queued?' Queued for next legal turn.':' Click to queue.'}`}
     onClick={()=>{if(!controls.auto&&ready){queued?controls.queued.delete(cat.id):controls.queued.add(cat.id);m.notify(false);}}}>
      <img src={`/units/${cat.catalogId}/portrait.webp`} alt=""/><span className="b3-name">{cat.name}</span><span className="b3-stars" aria-label={stars+' stars'}>{'★'.repeat(stars)}</span>
      {queued&&<span className="b3-queued">QUEUED</span>}<Meter hp={cat.hp} max={cat.maxHp} shield={cat.shield} name={cat.name} reduced={m.state.settings.reducedMotion}/><Rage value={cat.charge} name={cat.name}/>
     </button>;
   })}</div>
   <div className="b3-bottom-actions"><button aria-label="Toggle Auto ultimates" aria-pressed={controls.auto} onClick={()=>{controls.auto=!controls.auto;m.notify(false);}}>AUTO {controls.auto?'ON':'OFF'}</button>
    <button aria-label="Skip to result" disabled={!m.canSkip} title={m.canSkip?'Skip to result':'Earn three stars to skip this battle'} onClick={()=>m.skip()}>SKIP ›</button></div>
  </footer>
  <button ref={skipButton} hidden className="b3-skip-plate" onClick={()=>skipPlate(m)}>Skip cinematic ›</button>
  <output className="b3-total" ref={total} aria-label="Total ultimate damage" hidden><i>TOTAL</i><b>0</b></output>
  {more&&<div className="b3-menu">{m.a6Battle&&!m.replay&&<label className="b3-autonext"><input type="checkbox" aria-label="Auto-next" checked={m.autoContinue} onChange={e=>{m.autoContinue=e.target.checked;m.notify(false);}}/>Auto-next battle</label>}<label>Ultimate cinematics<select value={controls.cinematics} onChange={e=>{controls.cinematics=e.target.value as CinematicMode;m.notify(false);}}><option value="full">Full</option><option value="short">Short</option><option value="off">Off</option></select></label>
   <label>Effects quality<select value={m.state.settings.quality} onChange={e=>{m.state.settings.quality=e.target.value as typeof m.state.settings.quality;m.notify(false);}}><option value="high">High</option><option value="low">Low</option></select></label><SoundControlA6 m={m} battle/><button onClick={()=>{paused.current=m.paused;m.paused=true;m.notify(false);setLog(true);setMore(false);}}>Read battle log</button>
   <button onClick={()=>{setMore(false);if(m.replay||m.galleryBattle){m.leave();return;}paused.current=m.paused;m.paused=true;m.notify(false);setLeaving(true);}}>Leave table</button></div>}
  {help&&<dialog ref={dialog} className="b3-help" aria-label="Battle guide" onCancel={e=>{e.preventDefault();closeHelp();}}><button autoFocus onClick={closeHelp}>Close guide</button><h2>Keep the café glowing</h2><p>Green bars are ally HP; red bars are enemy HP. Gold bars are rage. A gold portrait means its ultimate is ready.</p><p>Auto casts ultimates on legal turns. Turn Auto off and tap a glowing portrait to queue it. Status symbols show stacks; hover or focus for their effects.</p><p>Burn: fire. Bitter: green bubbles. Bleed: red drips. Daze: orbiting stars. Shield: a pale bubble. Arrows show other buffs and debuffs.</p></dialog>}
  {log&&<BattleLogV3 battle={battle} wasPaused={paused.current} onClose={()=>{setLog(false);m.paused=paused.current;m.notify(false);menuButton.current?.focus();}}/>}
  {leaving&&<BattleLeaveV3 state={m.state} practice={!!m.tutorialBattle} wasPaused={paused.current} onCancel={()=>{setLeaving(false);m.paused=paused.current;m.notify(false);}} onConfirm={()=>{setLeaving(false);m.leave();}}/>}
 </div>;
}
