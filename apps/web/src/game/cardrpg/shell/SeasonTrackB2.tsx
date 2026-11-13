import {useEffect,useState} from 'react';
import {PaintedIcon} from './PaintedKit';
import {GameIcon} from '../../../ui/GameIcon';
export interface SeasonProgressB2 {
 points:number;days:number;
 rewards:{points:number;claimed:boolean;reason:string|null;reward:{stamps?:number;threads?:number}}[];
}
/** The shell publishes actual daily-board previews; no separate season economy. */
export function SeasonTrackB2(){
 const [view,setView]=useState<SeasonProgressB2>();
 useEffect(()=>{
  const receive=(e:Event)=>setView((e as CustomEvent<SeasonProgressB2>).detail);
  window.addEventListener('shell:season-progress',receive);
  window.dispatchEvent(new Event('shell:season-request'));
  return()=>window.removeEventListener('shell:season-progress',receive);
 },[]);
 if(!view)return <p role="status">Open your café.</p>;
 return <section className="b2-weekly-track" aria-label="Weekly reward track">
  <header><span>Weekly</span><output aria-label="Weekly activity points">{view.points}/30</output><span><GameIcon name="clock" size={20}/>{view.days}d</span></header>
  <progress aria-label="Weekly reward progress" value={Math.min(view.points,30)} max={30}/>
  <div>{view.rewards.map(r=><article key={r.points} data-ready={!r.reason} data-claimed={r.claimed}>
   <PaintedIcon name={r.claimed?'deed':'supply'} size={68}/><b>{r.points}</b>
   <div aria-label="Bound reward">{r.reward.stamps!==undefined&&<span><PaintedIcon name="bell" size={24}/>{r.reward.stamps}</span>}{r.reward.threads!==undefined&&<span><PaintedIcon name="thread" size={24}/>{r.reward.threads}</span>}</div>
   <button disabled={!!r.reason} title={r.reason??'Collect reward'} aria-label={`Collect ${r.points}-task weekly gift`} onClick={()=>window.dispatchEvent(new CustomEvent('shell:season-claim',{detail:r.points}))}><GameIcon name={r.claimed?'check':'bag'} size={22}/>{r.claimed?'Collected':'Collect'}</button>
  </article>)}</div>
 </section>;
}
