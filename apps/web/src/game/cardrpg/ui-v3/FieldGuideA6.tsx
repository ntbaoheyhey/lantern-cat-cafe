import {useId,useRef,useState} from 'react';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import {artPropsA6} from './art-a6';
import {enemyGuideA6,guideTermsA6} from './guide-a6';

type Chapter='keywords'|'companions'|'enemies'|'charms'|'sets';
type Note={id:string;name:string;detail:string;paragraphs:string[];art?:string;kind?:string};
const chapters:Chapter[]=['keywords','companions','enemies','charms','sets'];
function notesFor(chapter:Chapter,v4:boolean,skillsV5:boolean):Note[] {
 const wording=guideTermsA6;
 if(chapter==='keywords')return [
  ...(skillsV5?R.CORE_STATUS_RULES_V5:R.STATUSES).map(status=>({id:status.id,name:status.name,kind:status.kind,detail:`${status.kind} · cap ${status.cap} · ${status.duration} rounds · ${status.dispellable?'Dispellable':'Protected from dispel'}`,paragraphs:[skillsV5?status.description:v4?R.statusDescriptionV4(status.id):status.description]})),
  ...(skillsV5?Object.entries(R.REACTION_NAMES_V5).map(([id,name])=>({id,name,kind:'reaction',detail:'Crew reaction',paragraphs:[R.CREWS_V5.filter(c=>c.reaction===id).flatMap(c=>R.crewHintsV5([...c.cats])).join(' ')||'Defeat a Marked foe to carry half of each debuff stack to its nearest neighbour.']})):[]),
 ];
 if(chapter==='companions')return R.CATS.map(cat=>({id:cat.id,name:cat.name,detail:`${cat.role} · ${cat.flavour}`,art:cat.id,paragraphs:[`${cat.passive.name} · ${wording(v4?R.passiveDescriptionV4(cat.id):cat.passive.description)}`]}));
 if(chapter==='enemies')return R.ENEMIES.map(enemy=>{const guide=enemyGuideA6(enemy.id);return {id:enemy.id,name:enemy.name,detail:`${enemy.tier} · ${enemy.flavour} · ${enemy.row}`,art:enemy.id,paragraphs:[guide.intent,guide.counter,...(guide.phases?[guide.phases]:[])]};});
 if(chapter==='charms')return R.BOONS.map(boon=>({id:boon.id,name:boon.name,detail:`${boon.archetype} · stack cap ${boon.cap}`,paragraphs:[wording(R.boonForMode(boon.id,v4).description)]}));
 return R.SETS.map(original=>{const set=R.setTextV4(original,v4);return {id:set.id,name:set.name,detail:'Equipment set',paragraphs:[`2 pieces · ${wording(set.two)}`,`4 pieces · ${wording(set.four)}`]};});
}
function NoteSeal({chapter,kind}:{chapter:Chapter;kind?:string}) {
 return <svg className="a6-note-seal" viewBox="0 0 180 180" fill="none" aria-hidden="true" data-kind={kind}>
  <path d="m90 8 23 12 26 1 13 22 20 17-3 26 3 26-20 17-13 22-26 1-23 12-23-12-26-1-13-22-20-17 3-26-3-26 20-17 13-22 26-1Z" fill="currentColor" opacity=".13"/>
  <circle cx="90" cy="86" r="62" stroke="currentColor" strokeWidth="2"/>
  <circle cx="90" cy="86" r="54" stroke="currentColor" strokeDasharray="2 7" strokeWidth="2"/>
  {chapter==='sets'?<><path d="M58 58h64v59H58Z" stroke="currentColor" strokeWidth="4"/><path d="M90 58v59M58 87h64m-54-44 22 13 22-13" stroke="currentColor" strokeWidth="3"/></>:chapter==='charms'?<><path d="M90 44v17m-25 6 25-10 25 10v44l-25 14-25-14Z" stroke="currentColor" strokeWidth="4"/><path d="m90 75 5 10 12 2-9 8 2 12-10-6-10 6 2-12-9-8 12-2Z" fill="currentColor"/></>:<><path d="m90 49 11 24 26 13-26 11-11 27-11-27-26-11 26-13Z" stroke="currentColor" strokeWidth="4"/><path d="M90 68v36M72 86h36" stroke="currentColor" strokeWidth="3"/></>}
 </svg>;
}
export function FieldGuideA6({v4,skillsV5}:{v4:boolean;skillsV5:boolean}) {
 const [chapter,setChapter]=useState<Chapter>('keywords'),[selected,setSelected]=useState<Partial<Record<Chapter,string>>>({}),[query,setQuery]=useState('');
 const search=useRef<HTMLInputElement>(null),list=useRef<HTMLElement>(null),pageId=useId();
 const notes=notesFor(chapter,v4,skillsV5),needle=query.trim().toLocaleLowerCase();
 const visible=notes.filter(note=>[note.name,note.detail,...note.paragraphs].join(' ').toLocaleLowerCase().includes(needle));
 const current=visible.find(note=>note.id===selected[chapter])??visible[0];
 return <section className="a6-field-guide" aria-label="Cafe field guide">
  <header className="a6-guide-intro"><img {...artPropsA6('biscuit')} alt=""/><div><small>NOTES BEFORE NIGHT PATROL</small><h2>A little field wisdom.</h2><p>Choose your crew and formation before the fight. Unlocked ultimates cast automatically at 100 rage when the cat can act.</p></div></header>
  <nav className="a6-guide-chapters" aria-label="Field guide chapters">{chapters.map(id=><button key={id} aria-pressed={chapter===id} onClick={()=>{setChapter(id);setQuery('');if(list.current)list.current.scrollTop=0;}}>{id}</button>)}</nav>
  <div className="a6-guide-book">
   <aside className="a6-guide-finder"><label>Find a field note<input ref={search} type="search" value={query} placeholder={`Search ${chapter}`} onChange={e=>{setQuery(e.target.value);if(list.current)list.current.scrollTop=0;}}/></label><p role="status">{visible.length} of {notes.length} notes</p>
    <nav ref={list} className="a6-guide-index" aria-label={`${chapter} index`}>{visible.map(note=><button key={note.id} aria-pressed={current?.id===note.id} aria-controls={pageId} onClick={()=>setSelected(previous=>({...previous,[chapter]:note.id}))}>{note.art&&<img {...artPropsA6(note.art)} alt=""/>}<span>{note.name}</span></button>)}</nav>
   </aside>
   <article id={pageId} className="a6-guide-page" data-kind={current?.kind} aria-label={current?.name??'No matching notes'}>
    {current?<><div className="a6-guide-illustration">{current.art?<img {...artPropsA6(current.art)} alt={current.name}/>:<NoteSeal chapter={chapter} kind={current.kind}/>}<small>{chapter==='enemies'?'MEET THEM ON THE ROUTE':chapter==='companions'?'A FRIEND AT YOUR TABLE':'A NOTE TO TAKE WITH YOU'}</small></div>
     <div className="a6-guide-writing" tabIndex={0} role="region" aria-label={`${current.name} field note`} key={current.id}><header><small>{chapter}</small><h3>{current.name}</h3><p>{current.detail}</p></header>{current.paragraphs.map((text,i)=><p key={i}>{text}</p>)}</div></>:<div className="a6-guide-no-match"><NoteSeal chapter={chapter}/><h3>No notes found.</h3><p>Try a name, effect or crew role.</p><button onClick={()=>{setQuery('');search.current?.focus();}}>Clear search</button></div>}
   </article>
  </div>
  <p className="a6-guide-footnote">Debuff success is 90% + Effect Hit − Effect Resist, bounded to 10–98%. Boss control lasts one round and grants a short control-resistance window.</p>
 </section>;
}
