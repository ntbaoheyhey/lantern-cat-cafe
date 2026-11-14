import {useEffect,useRef,useState} from 'react';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import {EQUIPMENT_SLOTS} from '@taskbar-hero/game-rules/cardrpg';
import type {DepthModel} from '../depth/model';
import {CompanionPreview} from '../depth/CompanionPreview';
import {skillIcon} from '../depth/assets';
import {Stats} from '../shared';
import {artPropsA6} from './art-a6';
import {SkillContextA6} from './SkillContextA6';

/** A focused view of the existing companion-preview runtime; account state stays untouched. */
export function CatPreviewA6({m,catId,initialSkillId,onClose}:{m:DepthModel;catId:string;initialSkillId?:string;onClose:()=>void}) {
 const dialog=useRef<HTMLDialogElement>(null),[skillId,setSkillId]=useState(initialSkillId??'');
 const cat=R.CAT_BY_ID[catId]!,skill=R.battleKitA6(catId).find(s=>s.id===skillId),card=m.state.account.cards.find(c=>c.cardId===catId);
 const available=new Set(R.availableSkills(m.state,catId).map(s=>s.id)),gear=R.equippedItems(m.state,catId);
 useEffect(()=>{
  const element=dialog.current!,previous=document.activeElement as HTMLElement|null;
  element.showModal();element.querySelector('button')?.focus();
  return()=>{element.close();if(previous?.isConnected)previous.focus({preventScroll:true});};
 },[]);
 return <dialog ref={dialog} className="a6-cat-preview-dialog" aria-labelledby="a6-preview-title" onCancel={event=>{event.preventDefault();onClose();}} onKeyDown={event=>{
  if(event.key==='Tab'||event.key==='Escape')event.stopPropagation();
  if(event.key==='Tab'){
   const controls=Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),summary,[href],[tabindex="0"]')).filter(node=>node.getClientRects().length);
   const first=controls[0],last=controls.at(-1);
   if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
   else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
  }
  if(event.key==='Escape'){event.preventDefault();onClose();}
 }}>
  <header className="a6-preview-header"><img {...artPropsA6(catId)} alt=""/><div><small>THE PRACTICE TABLE</small><h2 id="a6-preview-title">{cat.name} · skill previews</h2></div><button onClick={onClose}>{initialSkillId?'Back to Skills':'Back to cat'} <span aria-hidden="true">×</span></button></header>
  <div className="a6-preview-body">
   <div className="a6-preview-stage"><CompanionPreview m={m} id={catId} skillId={skill?.id}/>
    <section key={skill?.id??cat.id} className="a6-preview-copy" aria-label={skill?.name??`${cat.name} miniature`} tabIndex={0}>
     <header><h3>{skill?.name??`Meet ${cat.name}`}</h3><small>{skill?available.has(skill.id)?skill.type==='ultimate'?`Automatic at ${R.RAGE_COST_A6} rage`:'Used automatically':card?`Opens at level ${skill.unlockLevel} or ${skill.unlockStars} stars`:'Recruit to unlock':'Drag the angle slider to look around.'}</small></header>
     <p>{skill?R.kitSkillV5(skill).description:'Choose an ability to watch its repeating preview.'}</p>
     {skill&&<SkillContextA6 state={m.state} skill={skill}/>}
    </section>
   </div>
   <aside className="a6-preview-notes"><p>Preview freely. Your crew stays unchanged.</p>
    <nav aria-label={`${cat.name} skill previews`}>{R.battleKitA6(catId).map(s=><button key={s.id} aria-pressed={s.id===skill?.id} data-ultimate={s.type==='ultimate'} onClick={()=>setSkillId(s.id)}><img src={skillIcon(s.id)} alt=""/><span><small>{s.type==='ultimate'?'ULTIMATE':'BASIC'}</small><b>{s.name}</b></span></button>)}</nav>
    <button className="a6-preview-rotate" aria-pressed={!skill} onClick={()=>setSkillId('')}>View miniature</button>
    {card&&<details><summary><span className="a6-preview-stats-closed">Stats & equipped gear</span><span className="a6-preview-stats-open">Back to skill choices</span></summary><Stats stats={R.depthStats(m.state,catId)}/><ul>{EQUIPMENT_SLOTS.map(slot=>{const item=gear.find(g=>R.GEAR_BY_ID[g.templateId]!.slot===slot);return <li key={slot}><small>{slot}</small><b>{item?R.GEAR_BY_ID[item.templateId]!.name:'Empty slot'}</b></li>;})}</ul></details>}
   </aside>
  </div>
 </dialog>;
}
