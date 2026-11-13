import {useState} from 'react';
import {GameIcon} from '../../../ui/GameIcon';
import {GUIDE_PAGES} from './lessons';
import {GuideMascot} from './PaintedKit';
import {PublishedOdds} from './ShellPages';
import {FieldGuideA6} from '../ui-v3/FieldGuideA6';

export function FieldGuideV3({v4=true,skillsV5=true}:{v4?:boolean;skillsV5?:boolean}) {
 const [index,setIndex]=useState(0),[odds,setOdds]=useState(false),[notes,setNotes]=useState(false);
 const page=GUIDE_PAGES[index]!;
 if(notes)return <><button onClick={()=>setNotes(false)}><GameIcon name="guide" size={24}/>Basics</button><FieldGuideA6 v4={v4} skillsV5={skillsV5}/></>;
 return <section className="b-field-guide" aria-label="Cafe field guide">
  <nav aria-label="Guide chapters"><label>Chapter<select aria-label="Guide chapter" value={index} onChange={e=>{setIndex(Number(e.target.value));setOdds(false);}}>{GUIDE_PAGES.map((p,i)=><option key={p.id} value={i}>{p.title}</option>)}</select></label>
   <button aria-pressed={odds} onClick={()=>setOdds(!odds)}><GameIcon name="bell" size={24}/>Odds</button>
   <button onClick={()=>setNotes(true)}><GameIcon name="fight" size={24}/>Battle notes</button>
  </nav>
  {odds?<div><PublishedOdds/></div>:<article><GuideMascot pose="point"/><GameIcon name={page.icon} size={128}/><h2 className="t-title">{page.title}</h2><p>{page.text}</p><button onClick={()=>setIndex((index+1)%GUIDE_PAGES.length)}><GameIcon name="arrow" size={24}/>Next</button></article>}
 </section>;
}
