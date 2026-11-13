import {createPortal,flushSync} from 'react-dom';
import {useEffect,useLayoutEffect,useRef,useState} from 'react';
import type {DepthModel} from '../depth/model';
import {GameIcon} from '../../../ui/GameIcon';
import {LESSONS} from './lessons';
import {coachLayout,type Box} from './coach-layout';
import './coach.css';
const KEY='lantern.coach.v3';
function read(){try{return JSON.parse(localStorage.getItem(KEY)??'{}') as Record<string,boolean>;}catch{return {};}}
function mark(topic:string){try{localStorage.setItem(KEY,JSON.stringify({...read(),[topic]:true}));}catch{/* lessons remain usable without storage */}}
export function TutorialSettings(){const [disabled,setDisabled]=useState(()=>!!read().disabled);return <div className="b-tutorial-settings"><label><input type="checkbox" checked={disabled} onChange={e=>{setDisabled(e.target.checked);try{localStorage.setItem(KEY,JSON.stringify({...read(),disabled:e.target.checked}));}catch{}window.dispatchEvent(new Event('coach:changed'));}}/>Skip tutorial</label><button aria-label="Replay lessons" onClick={()=>{try{localStorage.removeItem(KEY);}catch{}setDisabled(false);window.dispatchEvent(new Event('coach:changed'));}}><GameIcon name="guide" size={26}/>Lessons</button></div>;}
export function Coach({m}:{m:DepthModel}){
 const [topic,setTopic]=useState(''),[index,setIndex]=useState(0),[rect,setRect]=useState<Box>(),[fallback,setFallback]=useState(false),[revision,setRevision]=useState(0),[view,setView]=useState({width:innerWidth,height:innerHeight}),[height,setHeight]=useState(176);
 const previousPause=useRef(false),paused=useRef(false),panel=useRef<HTMLElement>(null),target=useRef<HTMLElement|null>(null);
 const finish=()=>{if(topic)mark(topic);setTopic('');setIndex(0);if(paused.current){m.paused=previousPause.current;paused.current=false;m.notify(false);}};
 useEffect(()=>{
  const changed=()=>{setRevision(x=>x+1);if(read().disabled)finish();};
  const open=(key:string)=>{if(LESSONS[key]&&!read()[key]&&!read().disabled){setTopic(key);setIndex(0);}};
  const page=(e:Event)=>{const key=String((e as CustomEvent).detail);if(key==='season')open(key);};
  const wallet=()=>open('wallet'),forge=()=>open('forge'),cafe=()=>open('cafe');
  window.addEventListener('coach:changed',changed);window.addEventListener('shell:page',page);window.addEventListener('chain:wallet',wallet);window.addEventListener('coach:forge',forge);window.addEventListener('coach:cafe',cafe);
  return()=>{window.removeEventListener('coach:changed',changed);window.removeEventListener('shell:page',page);window.removeEventListener('chain:wallet',wallet);window.removeEventListener('coach:forge',forge);window.removeEventListener('coach:cafe',cafe);};
 },[topic,m]);
 useEffect(()=>{if(read().disabled)return;const key=m.showBattle?'battle':m.screen;if(!topic&&LESSONS[key]&&!read()[key]){setTopic(key);setIndex(0);}},[m.showBattle,m.screen,topic,revision]);
 useEffect(()=>{if(topic==='battle'&&m.showBattle&&!paused.current){previousPause.current=m.paused;paused.current=true;m.paused=true;m.notify(false);}},[topic,m.showBattle,m]);
 useEffect(()=>()=>{if(paused.current){m.paused=previousPause.current;paused.current=false;m.notify(false);}},[m]);
 useLayoutEffect(()=>{
  if(!topic)return;setFallback(false);setRect(undefined);target.current=null;
  let missingSince=performance.now(),logged=false,scrolled:Element|null=null;
  const update=()=>{
   const selector=LESSONS[topic]?.[index]?.target,node=selector?Array.from(document.querySelectorAll<HTMLElement>(selector)).find(el=>{const r=el.getBoundingClientRect();return r.width>0&&r.height>0&&!el.hidden;})??null:null;
   let r=node?.getBoundingClientRect();
   if(node&&r&&r.width>0&&r.height>0&&!node.hidden){
    if(scrolled!==node){scrolled=node;if(r.top<8||r.bottom>innerHeight-8||r.left<8||r.right>innerWidth-8)node.scrollIntoView?.({block:'center',inline:'nearest',behavior:'instant'});r=node.getBoundingClientRect();}
   }
   if(node&&r&&r.width>0&&r.height>0&&!node.hidden&&r.bottom>0&&r.right>0&&r.top<innerHeight&&r.left<innerWidth&&getComputedStyle(node).visibility!=='hidden'){
    target.current=node;const next={x:r.x,y:r.y,width:r.width,height:r.height};setRect(previous=>previous&&Object.keys(next).every(k=>previous[k as keyof Box]===next[k as keyof Box])?previous:next);setFallback(false);missingSince=performance.now();
   }else{target.current=null;setRect(undefined);if(performance.now()-missingSince>=2000){setFallback(true);if(!logged){logged=true;window.dispatchEvent(new CustomEvent('coach:fallback',{detail:{topic,index,target:selector}}));}}}
   setView(previous=>previous.width===innerWidth&&previous.height===innerHeight?previous:{width:innerWidth,height:innerHeight});const measured=panel.current?.getBoundingClientRect().height;if(measured)setHeight(measured);
  };
  // A centered native dialog moves when asynchronous balances change its size.
  // Observe the containing layout as well as the target, and commit geometry
  // before paint so the spotlight never trails that movement by one frame.
  const refresh=()=>flushSync(update);
  update();panel.current?.focus();
  const observer=typeof ResizeObserver==='undefined'?undefined:new ResizeObserver(refresh);
  for(let node:Element|null=target.current as Element|null;node;node=node.parentElement)observer?.observe(node);
  let frame=0;const follow=()=>{refresh();frame=requestAnimationFrame(follow);};frame=requestAnimationFrame(follow);window.addEventListener('resize',refresh);window.addEventListener('scroll',refresh,true);
  const allowed=(node:EventTarget|null)=>node instanceof Node&&(panel.current?.contains(node)||target.current?.contains(node));
  const block=(event:Event)=>{if(!allowed(event.target)){event.preventDefault();event.stopImmediatePropagation();}};
  const focus=(event:FocusEvent)=>{if(!allowed(event.target))panel.current?.focus();};
  const keys=(event:KeyboardEvent)=>{
   if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();finish();return;}
   if(event.key==='Tab'){
    const select='button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),[tabindex="0"]';
    const nodes=[...(target.current?.matches(select)?[target.current]:[]),...Array.from(target.current?.querySelectorAll<HTMLElement>(select)??[]),...Array.from(panel.current?.querySelectorAll<HTMLElement>(select)??[])].filter(n=>n.getBoundingClientRect().width>0);
    const current=nodes.indexOf(document.activeElement as HTMLElement);event.preventDefault();event.stopImmediatePropagation();nodes[(current+(event.shiftKey?-1:1)+nodes.length)%nodes.length]?.focus();
   }else if(!allowed(event.target)){event.preventDefault();event.stopImmediatePropagation();}
  };
  document.addEventListener('click',block,true);document.addEventListener('pointerdown',block,true);document.addEventListener('focusin',focus,true);document.addEventListener('keydown',keys,true);
  return()=>{cancelAnimationFrame(frame);observer?.disconnect();window.removeEventListener('resize',refresh);window.removeEventListener('scroll',refresh,true);document.removeEventListener('click',block,true);document.removeEventListener('pointerdown',block,true);document.removeEventListener('focusin',focus,true);document.removeEventListener('keydown',keys,true);};
 },[topic,index]);
 const lesson=LESSONS[topic]?.[index];if(!lesson)return null;
 const {spotlight,bubble,arrow}=coachLayout(rect,view,height);
 const hole=spotlight?`M${spotlight.x+14},${spotlight.y}h${spotlight.width-28}q14,0 14,14v${spotlight.height-28}q0,14 -14,14h${28-spotlight.width}q-14,0 -14,-14v${28-spotlight.height}q0,-14 14,-14Z`:'';
 return createPortal(<div className="b-coach" data-topic={topic} data-step={index} data-fallback={fallback} data-ready={!!rect||fallback}>
  <svg className="b-coach-mask" width={view.width} height={view.height} aria-hidden="true"><path d={`M0,0H${view.width}V${view.height}H0Z ${hole}`} fillRule="evenodd" fill="#0b0818b8"/>{arrow&&<><defs><marker id="coach-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0,0L7,3.5L0,7" fill="#ffd681"/></marker></defs><path d={`M${arrow.from.x},${arrow.from.y}L${arrow.to.x},${arrow.to.y}`} stroke="#ffd681" strokeWidth="3" markerEnd="url(#coach-arrow)"/></>}</svg>
  {spotlight&&<div className="b-coach-focus" style={{left:spotlight.x,top:spotlight.y,width:spotlight.width,height:spotlight.height}}/>}
  <section className="b-coach-card" role="dialog" aria-label="Tutorial" ref={panel} tabIndex={-1} style={{left:bubble.x,top:bubble.y,width:bubble.width}}><GameIcon name={lesson.icon} size={32}/><small>{index+1} / {LESSONS[topic]!.length}</small><p>{lesson.text}</p><div><button onClick={finish}>Skip</button><button className="b-primary" onClick={()=>index+1<LESSONS[topic]!.length?setIndex(index+1):finish()}>{index+1<LESSONS[topic]!.length?'Next':'Got it'}</button></div></section>
 </div>,document.querySelector('dialog[open]')??document.body);
}
