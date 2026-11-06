// REFERENCE: depth/feel-lab.ts; turn3d/card-*-motion.ts; reports/cardrpg-big2.
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { DepthModel, type Screen } from '../../apps/web/src/game/cardrpg/depth/model';
import { BattleView } from '../../apps/web/src/game/cardrpg/depth/Battle';
import './studio.css';

type Evidence = { owner:string; name:string; before?:string; after?:string; beforeLabel?:string; afterLabel?:string; source:string; note:string };
type Check = {label:string;kind:string;actions:number;pairs:number;offenders:number;faceOffenders:number;errors:number;source:string};
declare global { interface Window { __b2Evidence?:Evidence[]; __b2Checks?:Check[]; __b2Gallery?:DepthModel } }
const checklist: Array<{name:string;detail:string;screen?:Screen;panel?:'gallery'|'comparison'|'mechanics'}> = [
 {name:'Collect companions',detail:'Cards, portraits and skill descriptions.',screen:'collection'},
 {name:'Prepare a team',detail:'Choose three companions and their rows before fighting.',screen:'team'},
 {name:'Dress the team',detail:'Equipment, comparisons and set progress.',screen:'inventory'},
 {name:'Watch an automatic battle',detail:'Prepare → Fight. Speed, pause, skip, camera and sound.',screen:'map'},
 {name:'Invite a companion',detail:'Earned invitations, published odds and pity.',screen:'gacha'},
 {name:'Inspect every skill',detail:'Gallery below: twelve cats, ten enemies and three bosses.',panel:'gallery'},
 {name:'Compare the artwork',detail:'Before / after pairs use measured, pinned captures.',panel:'comparison'},
 {name:'Try automatic extras',detail:'Try the Mechanics lab. All experiments start off.',panel:'mechanics'},
];
function Gallery(){
 const [m]=useState(()=>{const model=new DepthModel(true);model.state.settings.reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;model.inspect(model.galleryId);return model;});
 useSyncExternalStore(m.subscribe,m.snapshot);
 const scrub=useRef<HTMLInputElement>(null);
 const [owner,setOwner]=useState('mochi');
 useEffect(()=>{
  window.__b2Gallery=m;let frame=0;
  const tick=()=>{if(scrub.current&&document.activeElement!==scrub.current)scrub.current.value=String(m.plan?m.animationAt/m.plan.duration:1);frame=requestAnimationFrame(tick);};frame=requestAnimationFrame(tick);
  return()=>{cancelAnimationFrame(frame);m.audio.dispose();delete window.__b2Gallery;};
 },[m]);
 const owners=[...new Set(m.galleryActions.map(a=>a.owner))],actions=m.galleryActions.filter(a=>a.owner===owner);
 return <div className="b2-gallery">
  <div className="b2-gallery-tools">
   <label>Companion or opponent<select aria-label="Gallery unit" value={owner} onChange={e=>{setOwner(e.target.value);m.inspect(m.galleryActions.find(a=>a.owner===e.target.value)!.id);}}>{owners.map(id=><option key={id} value={id}>{m.galleryActions.find(a=>a.owner===id)!.name.split(' · ')[0]}</option>)}</select></label>
   <label>Action<select aria-label="Gallery action" value={m.galleryId} onChange={e=>m.inspect(e.target.value)}>{actions.map(a=><option key={a.id} value={a.id}>{a.name.split(' · ').slice(1).join(' · ')}</option>)}</select></label>
   <button onClick={()=>m.inspect(m.galleryId,0,true)}>Play preview</button>
   <label>Preview speed<select value={m.gallerySpeed} onChange={e=>{m.gallerySpeed=Number(e.target.value);m.notify(false);}}><option value={.25}>0.25×</option><option value={1}>1×</option></select></label>
   <label><input type="checkbox" checked={m.galleryEffectOnly} onChange={e=>{m.galleryEffectOnly=e.target.checked;m.notify(false);}}/>Effect only</label>
   <label>Camera<select aria-label="Gallery camera" value={m.camera} onChange={e=>{m.camera=e.target.value as typeof m.camera;m.notify(false);}}><option value="close">A · portrait</option><option value="wide">B · balanced</option><option value="far">C · stage</option></select></label>
   <label><input type="checkbox" checked={m.state.settings.reducedMotion} onChange={e=>{m.state.settings.reducedMotion=e.target.checked;m.notify(false);}}/>Reduced motion</label>
   <label className="b2-scrub">Action progress<input aria-label="Gallery progress" ref={scrub} type="range" min="0" max=".999" step=".001" defaultValue="0" onChange={e=>m.inspect(m.galleryId,Number(e.target.value))}/></label>
  </div>
  <div className="b2-gallery-stage"><BattleView m={m}/></div>
  <p className="b2-reference">REFERENCE: apps/web/src/game/cardrpg/depth/feel-lab.ts · {m.galleryActions.length} previews · isolated fixtures; your collection is unchanged.</p>
  {!!window.__b2Checks?.length&&<details><summary>Measured motion and effect comparisons</summary><p>Motion compares rig trajectories. Effects compare grayscale silhouettes, edges and their change over six frames. These checks do not replace judging the artwork.</p><table><thead><tr><th>Batch</th><th>Check</th><th>Actions</th><th>Pairs</th><th>Below threshold</th><th>Face / runtime issues</th></tr></thead><tbody>{window.__b2Checks.map(c=><tr key={`${c.label}-${c.kind}`}><td>{c.label}</td><td>{c.kind}</td><td>{c.actions}</td><td>{c.pairs}</td><td>{c.offenders}</td><td>{c.faceOffenders} / {c.errors}</td></tr>)}</tbody></table><p className="b2-reference">REFERENCE: {window.__b2Checks.map(c=>c.source).join(' · ')}</p></details>}
 </div>;
}
function Comparison(){
 const rows=window.__b2Evidence??[],[index,setIndex]=useState(0),row=rows[index];
 const image=(id?:string)=>id?document.getElementById(id)?.textContent??undefined:undefined;
 return <div className="b2-studio-body"><h2>Look closer</h2><p>Compare performance filmstrips, native sharpness crops and camera views. The earlier motion capture keeps the actual fallback animation. Colour alone is not counted as a distinct effect.</p>
  {!row?<p>Capture evidence is not included in this build yet.</p>:<><label>Capture<select value={index} onChange={e=>setIndex(Number(e.target.value))}>{rows.map((r,i)=><option value={i} key={`${r.owner}-${i}`}>{r.name}</option>)}</select></label><div className="b2-comparison">{[[row.beforeLabel??'Earlier',row.before],[row.afterLabel??'Current',row.after]].map(([label,id])=><figure key={label}><figcaption>{label}</figcaption>{id?<img src={image(id)} alt={`${row.name} ${label} comparison`} style={row.owner==='sharpness'?{width:'auto',maxWidth:'100%'}:undefined} loading="lazy"/>:<p>Not captured for this view.</p>}</figure>)}</div><p>{row.note}</p><p className="b2-reference">REFERENCE: {row.source}</p></>}
 </div>;
}
export function ReviewStudio({close,go,openMechanics}:{close:()=>void;go:(screen:Screen)=>void;openMechanics:()=>void}){
 const [tab,setTab]=useState<'gallery'|'comparison'|'checklist'>('gallery');
 return <section className="b2-studio" aria-label="Review studio"><header><div><small>THE LANTERN · REVIEW STUDIO</small><h1>Meet the whole cast</h1></div><button onClick={close}>Return to cafe</button></header>
 <nav aria-label="Review panels"><button aria-pressed={tab==='gallery'} onClick={()=>setTab('gallery')}>Skill gallery</button><button aria-pressed={tab==='comparison'} onClick={()=>setTab('comparison')}>Before / after</button><button aria-pressed={tab==='checklist'} onClick={()=>setTab('checklist')}>Brief checklist</button></nav>
 {tab==='gallery'?<Gallery/>:tab==='comparison'?<Comparison/>:<div className="b2-studio-body"><h2>A cafe outside. A show inside.</h2><div className="b2-checklist">{checklist.map(item=><article key={item.name}><h3>{item.name}</h3><p>{item.detail}</p>{item.screen&&<button onClick={()=>go(item.screen!)}>Open screen</button>}{item.panel&&<button onClick={()=>item.panel==='mechanics'?openMechanics():setTab(item.panel! as 'gallery'|'comparison')}>Open {item.panel==='gallery'?'gallery':item.panel==='comparison'?'comparison':'Mechanics lab'}</button>}</article>)}</div><p className="b2-reference">REFERENCE: reports/cardrpg-big2/CARDRPG-BIG2-REPORT.md · items, invitations and final integration belong to Lane A.</p></div>}
 </section>;
}
export function FrameMeter(){
 const canvas=useRef<HTMLCanvasElement>(null),label=useRef<HTMLOutputElement>(null);
 useEffect(()=>{let frame=0,last=0,lastLabel=0,max=0,hitches=0;const values:number[]=[];
  const tick=(at:number)=>{const ms=last?at-last:0;last=at;if(ms){values.push(ms);if(values.length>180)values.shift();max=Math.max(max,ms);if(ms>50)hitches++;}if(at-lastLabel>250){lastLabel=at;const c=canvas.current,ctx=c?.getContext('2d'),stats=window.__depthScene?.stats;if(ctx&&c){ctx.clearRect(0,0,c.width,c.height);ctx.fillStyle='#b6dfc6';values.forEach((v,i)=>ctx.fillRect(i,40-Math.min(40,v/2),1,Math.min(40,v/2)));ctx.fillStyle='#d6ad75';ctx.fillRect(0,15,180,1);}if(label.current)label.current.textContent=`${ms.toFixed(1)} ms · max ${max.toFixed(1)} · >50 ms ${hitches} · ${stats?.calls??0} draws · ${stats?.triangles??0} triangles · ${stats?.quality??'idle'}`;}frame=requestAnimationFrame(tick);};frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame);
 },[]);
 return <aside className="b2-frame-meter" aria-label="Live performance"><canvas width="180" height="40" ref={canvas}/><output ref={label}>Measuring from opening the meter…</output><small>Local samples since opening · not a gate verdict</small></aside>;
}
