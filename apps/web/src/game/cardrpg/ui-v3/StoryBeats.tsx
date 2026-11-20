import {useEffect,useMemo,useState,type CSSProperties} from 'react';
import type {DepthModel} from '../depth/model';
import './story-beats.css';

/** Short, skippable story beats that frame the campaign: an opening, an
 * intro and guardian line per chapter, a chapter-clear line and an ending.
 * Beats are driven only by public run state, so they never change a battle. */
export type Speaker='narrator'|'mochi'|'clover'|'soot'|'yarn-giant'|'rain-spool'|'pantry-crown';
export interface StoryLine{speaker:Speaker;text:string}
export interface StoryBeat{id:string;scene:'cafe'|'orchard'|'pantry';kicker?:string;title?:string;lines:StoryLine[];final?:boolean}

const NAMES:Record<Speaker,string>={narrator:'',mochi:'Mochi',clover:'Clover',soot:'Soot','yarn-giant':'Yarn Giant','rain-spool':'Rain Spool','pantry-crown':'Pantry Crown'};
const SCENE_BY_CHAPTER=['cafe','orchard','pantry'] as const;

export const STORY:Record<string,StoryBeat>={
 opening:{id:'opening',scene:'cafe',kicker:'Lantern Cat Café',title:'The last lit window',lines:[
  {speaker:'narrator',text:'Every task left unfinished leaves a loose thread behind. Tonight, the threads woke up.'},
  {speaker:'mochi',text:'One by one the street lamps went dark. Ours is the last lantern still burning.'},
  {speaker:'clover',text:'Then we keep it burning. Tea stays warm, scrapes get mended.'},
  {speaker:'soot',text:'And knots get burned. Come on, the Tangle is already at the door.'},
 ]},
 'ch1-intro':{id:'ch1-intro',scene:'cafe',kicker:'Chapter 1',title:'Tangled Café',lines:[
  {speaker:'narrator',text:'Yarn has crept under the door, into the cups, around the chair legs.'},
  {speaker:'soot',text:'Something big is pulling these threads from the back room. Follow them.'},
 ]},
 'ch1-boss':{id:'ch1-boss',scene:'cafe',kicker:'Chapter 1 guardian',title:'The Yarn Giant',lines:[
  {speaker:'yarn-giant',text:'So many… unfinished… things. I will wrap them ALL.'},
  {speaker:'mochi',text:'When it winds its arms back, that is the slam. Save my shield for it.'},
 ]},
 'ch1-clear':{id:'ch1-clear',scene:'cafe',kicker:'Chapter 1 cleared',title:'A scarf, never finished',lines:[
  {speaker:'clover',text:'Look. It was only a scarf somebody stopped knitting halfway.'},
  {speaker:'mochi',text:'The café is safe. But the loose ends lead up, onto the roof.'},
 ]},
 'ch2-intro':{id:'ch2-intro',scene:'orchard',kicker:'Chapter 2',title:'Rooftop Orchard',lines:[
  {speaker:'narrator',text:'Up on the roof garden it has been raining for a week. The rain falls from a spool in the sky.'},
  {speaker:'clover',text:'The seedlings are drowning. Stay close to me and I will keep you on your paws.'},
 ]},
 'ch2-boss':{id:'ch2-boss',scene:'orchard',kicker:'Chapter 2 guardian',title:'The Rain Spool',lines:[
  {speaker:'rain-spool',text:'Spin, spin, the storm goes round. Nothing up here will ever dry.'},
  {speaker:'soot',text:'Then let me bring you something warm.'},
 ]},
 'ch2-clear':{id:'ch2-clear',scene:'orchard',kicker:'Chapter 2 cleared',title:'Clear skies',lines:[
  {speaker:'soot',text:'A forecast nobody closed, still spinning. The rain has stopped.'},
  {speaker:'mochi',text:'One thread left, and it goes down. Into the pantry.'},
 ]},
 'ch3-intro':{id:'ch3-intro',scene:'pantry',kicker:'Chapter 3',title:'Midnight Pantry',lines:[
  {speaker:'narrator',text:'Every jar down here holds a promise someone meant to keep later.'},
  {speaker:'clover',text:'It is so quiet. Whatever sits on that shelf has been waiting a long time.'},
 ]},
 'ch3-boss':{id:'ch3-boss',scene:'pantry',kicker:'Final guardian',title:'The Pantry Crown',lines:[
  {speaker:'pantry-crown',text:'I am every "later" you ever said. Bow to the crown of tomorrow.'},
  {speaker:'mochi',text:'Not tonight. Tonight we finish things.'},
 ]},
 ending:{id:'ending',scene:'cafe',kicker:'Epilogue',title:'The lantern stays lit',final:true,lines:[
  {speaker:'narrator',text:'The Pantry Crown comes apart into a hundred finished to-do lists, fluttering like snow.'},
  {speaker:'clover',text:'Listen. The lamps outside are clicking back on, one street at a time.'},
  {speaker:'soot',text:'The Tangle will knot up again someday. Loose ends always come back.'},
  {speaker:'mochi',text:'Then the café stays open. Keep tonight as a Relic, a memory the Tangle can never erase.'},
 ]},
};

const KEY='lantern-story-seen';
function readSeen():string[]{try{return JSON.parse(localStorage.getItem(KEY)??'[]') as string[];}catch{return [];}}
function markSeen(id:string){try{localStorage.setItem(KEY,JSON.stringify([...new Set([...readSeen(),id])]));}catch{/* the beat simply shows again */}}

/** Which beat (if any) the current public state calls for. */
export function pendingBeat(m:DepthModel,seen:string[]):StoryBeat|null{
 if(m.showBattle||m.sceneStarted&&m.battle&&!m.battle.result)return null;
 const want=(id:string)=>!seen.includes(id)&&STORY[id]?STORY[id]!:null;
 const run=m.state.run;
 if(!run||run.mode!=='campaign')return want('opening');
 const ch=run.chapter;
 if(run.complete){
  if(!run.won)return null;
  return want(`ch${ch}-clear`)??(ch===3?want('ending'):null);
 }
 const node=run.nodes.find(n=>n.id===run.current);
 if(node?.kind==='boss')return want(`ch${ch}-boss`);
 // Fight from the café starts the run and enters the first node in one step.
 if(!run.visited.length)return want(`ch${ch}-intro`);
 return want('opening');
}

export function StoryBeats({m}:{m:DepthModel}){
 const [seen,setSeen]=useState(readSeen);
 const beat=pendingBeat(m,seen);
 const [index,setIndex]=useState(0);
 useEffect(()=>setIndex(0),[beat?.id]);
 useEffect(()=>{
  if(!beat)return;
  const key=(e:KeyboardEvent)=>{if(e.key==='Escape')close();else if(e.key==='Enter'||e.key===' '||e.key==='ArrowRight'){e.preventDefault();next();}};
  window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);
 });
 const style=useMemo(()=>beat?{'--story-bg':`url(/art/story/${beat.scene}.webp)`} as CSSProperties:undefined,[beat]);
 if(!beat)return null;
 const line=beat.lines[Math.min(index,beat.lines.length-1)]!;
 function close(){markSeen(beat!.id);setSeen(readSeen());}
 function next(){if(index+1<beat!.lines.length)setIndex(index+1);else close();}
 const left=line.speaker==='mochi'||line.speaker==='clover'||line.speaker==='soot';
 const scene=SCENE_BY_CHAPTER.includes(beat.scene)?beat.scene:'cafe';
 return <div className="story-beat" data-scene={scene} style={style} role="dialog" aria-modal="true" aria-label={beat.title??'Story'} onClick={next}>
  <div className="story-shade" aria-hidden="true"/>
  {index===0&&beat.title&&<header className="story-title"><small>{beat.kicker}</small><h2>{beat.title}</h2></header>}
  {line.speaker!=='narrator'&&<img key={line.speaker} className="story-speaker" data-side={left?'left':'right'} data-boss={!left} src={`/units/${line.speaker}/runtime.webp`} alt=""/>}
  <section className="story-box" data-narrator={line.speaker==='narrator'} aria-live="polite">
   {line.speaker!=='narrator'&&<b className="story-name">{NAMES[line.speaker]}</b>}
   <p key={beat.id+index}>{line.text}</p>
   <footer><span className="story-dots" aria-hidden="true">{beat.lines.map((_,i)=><i key={i} data-on={i<=index}/>)}</span>
    <button className="story-next" onClick={e=>{e.stopPropagation();next();}}>{index+1<beat.lines.length?'Next':beat.final?'Back to the café':'Continue'}</button></footer>
  </section>
  <button className="story-skip" onClick={e=>{e.stopPropagation();close();}}>Skip story</button>
 </div>;
}
