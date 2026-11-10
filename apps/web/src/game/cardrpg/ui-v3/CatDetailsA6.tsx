import {useState} from 'react';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import {CARD_BY_ID,EQUIPMENT_SLOTS} from '@taskbar-hero/game-rules/cardrpg';
import type {DepthModel} from '../depth/model';
import {skillIcon} from '../depth/assets';
import {artPropsA6 as portraitProps} from './art-a6';
import {CompanionGrowthV4} from '../depth/CompanionGrowthV4';
import {ItemIcon} from '../shared';
import {PowerA6} from './PowerA6';
import {BondSummaryA6} from './BondsA6';
import {guideTermsA6} from './guide-a6';

/** A compact companion sheet; all upgrades still use the shared commands. */
export function CatDetailsA6({m,catId,onPreview}:{m:DepthModel;catId:string;onPreview:(skillId?:string)=>void}) {
 const [tab,setTab]=useState('growth'),cat=R.CAT_BY_ID[catId]!;
 const [skillId,setSkillId]=useState(cat.skills[0]!.id);
 const card=m.state.account.cards.find(c=>c.cardId===catId),locked=!!m.state.run&&!m.state.run.complete;
 const selectedSkill=cat.skills.find(skill=>skill.id===skillId)??cat.skills[0]!;
 const availableSkills=new Set(R.availableSkills(m.state,catId).map(skill=>skill.id));
 const gear=R.equippedItems(m.state,catId);
 const tabs=[['growth','Growth'],['skills','Skills'],['bonds','Bonds'],['gear','Gear']] as const;
 return <aside className="uv-detail a6-cat-detail" aria-label="Cat details">
  <header className="a6-cat-hero"><img {...portraitProps(catId)} alt={cat.name}/><div><small>{CARD_BY_ID[catId]!.rarity} · {cat.role}</small><h2>{cat.name}</h2>{card&&<PowerA6 value={R.powerV4(m.state,catId).total} reducedMotion={m.state.settings.reducedMotion}/>}<p>{card?`Level ${card.level} · ${card.stars} stars`:'A new friend to meet'}</p></div></header>
  <nav className="a6-cat-tabs" aria-label="Companion details">{tabs.map(([id,label])=><button key={id} aria-pressed={tab===id} onClick={()=>setTab(id)}>{label}</button>)}</nav>
  <section className="a6-cat-panel" aria-label={tabs.find(t=>t[0]===tab)![1]}>
   {tab==='growth'&&(card?<><div className="a6-cat-growth"><CompanionGrowthV4 m={m} catId={catId} kind="level"/><CompanionGrowthV4 m={m} catId={catId} kind="ascend"/></div><details><summary>Awakening · {m.state.awakened[catId]??0}/3</summary><p>From level ten and two stars. Each rank adds 3% HP and attack.</p><button disabled={locked||(m.state.awakened[catId]??0)>=3} onClick={()=>m.apply(R.awakenCat(m.state,catId),'Awakening raised HP and attack by 3%.')}>Awaken</button></details></>:<><p>Invite this friend to your cafe to train and equip them.</p><button className="cr-primary" onClick={()=>m.go('gacha')}>Recruit</button></>)}
   {tab==='skills'&&<div className="a6-cat-skillbook">
    <p className="a6-cat-passive"><small>PASSIVE</small><b>{cat.passive.name}</b><span>{guideTermsA6(R.passiveDescriptionV4(catId))}</span></p>
    <nav className="a6-cat-skill-index" aria-label={`${cat.name} skills`}>{cat.skills.map(skill=><button key={skill.id} aria-pressed={selectedSkill.id===skill.id} aria-controls="a6-cat-skill-detail" data-ultimate={skill.type==='ultimate'} onClick={()=>setSkillId(skill.id)}>
     <img src={skillIcon(skill.id)} alt=""/><span><small>{skill.type==='ultimate'?'ULTIMATE':skill.type.toUpperCase()}{!availableSkills.has(skill.id)&&' · LOCKED'}</small><b>{skill.name}</b></span>
    </button>)}</nav>
    <section className="a6-cat-skill-detail" id="a6-cat-skill-detail" aria-label={selectedSkill.name} data-ultimate={selectedSkill.type==='ultimate'}>
     <header><b>{selectedSkill.name}</b><small>{availableSkills.has(selectedSkill.id)?selectedSkill.type==='ultimate'?`Automatic at ${R.RAGE_COST_A6} rage`:'Used automatically':'Not yet unlocked'}</small></header>
     <p>{R.kitSkillV5(selectedSkill).description}</p>
     {!availableSkills.has(selectedSkill.id)&&<small className="a6-cat-skill-unlock">{card?`Opens at level ${selectedSkill.unlockLevel} or ${selectedSkill.unlockStars} stars`:'Recruit this cat to unlock their skills.'}</small>}
    </section>
    <button className="a6-cat-preview" onClick={()=>onPreview(selectedSkill.id)}>Watch skill previews</button>
   </div>}
   {tab==='bonds'&&<BondSummaryA6 m={m} catId={catId}/>}
   {tab==='gear'&&<><div className="a6-cat-gear">{EQUIPMENT_SLOTS.map(slot=>{
    const item=gear.find(g=>R.GEAR_BY_ID[g.templateId]!.slot===slot);
    return <button key={slot} disabled={!card} onClick={()=>{m.cardId=catId;if(item)m.itemId=item.id;m.go('inventory');}}><ItemIcon slot={slot}/><span><small>{slot}</small><b>{item?R.GEAR_BY_ID[item.templateId]!.name:'Empty slot'}</b>{item&&<small>+{item.enhancement}</small>}</span></button>;
   })}</div><p>Gear earned on patrol stays with this cat.</p><button onClick={()=>onPreview()}>Inspect stats & previews</button></>}
  </section>
 </aside>;
}
