import {useState} from 'react';
import {GameIcon} from '../../../ui/GameIcon';
import {GUIDE_PAGES} from './lessons';
import {PublishedOdds} from './ShellPages';
export function FieldGuideV3(){const [index,setIndex]=useState(0),[odds,setOdds]=useState(false);const page=GUIDE_PAGES[index]!;return <div className="b-field-guide"><nav aria-label="Guide chapters"><label>Chapter<select aria-label="Guide chapter" value={index} onChange={e=>{setIndex(Number(e.target.value));setOdds(false);}}>{GUIDE_PAGES.map((p,i)=><option key={p.id} value={i}>{p.title}</option>)}</select></label><button aria-pressed={odds} onClick={()=>setOdds(!odds)}><GameIcon name="bell" size={24}/>Odds</button></nav>{odds?<div><PublishedOdds/></div>:<article><GameIcon name={page.icon} size={128}/><h2 className="t-title">{page.title}</h2><p>{page.text}</p><button onClick={()=>setIndex((index+1)%GUIDE_PAGES.length)}>Next</button></article>}</div>;}
