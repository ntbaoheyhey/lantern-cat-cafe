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

/** A compact companion sheet; all upgrades still use the shared commands. */
export function CatDetailsA6({m,catId,onPreview}:{m:DepthModel;catId:string;onPreview:()=>void}) {
 const [tab,setTab]=useState('growth'),cat=R.CAT_BY_ID[catId]!;
 const card=m.state.account.cards.find(c=>c.cardId===catId),locked=!!m.state.run&&!m.state.run.complete;
 const gear=R.equippedItems(m.state,catId);
 const tabs=[['growth','Growth'],['skills','Skills'],['bonds','Bonds'],['gear','Gear']] as const;
 return <aside className="uv-detail a6-cat-detail" aria-label="Cat details">
  <header className="a6-cat-hero"><img {...portraitProps(catId)} alt={cat.name}/><div><small>{CARD_BY_ID[catId]!.rarity} · {cat.role}</small><h2>{cat.name}</h2>{card&&<PowerA6 value={R.powerV4(m.state,catId).total} reducedMotion={m.state.settings.reducedMotion}/>}<p>{card?`Level ${card.level} · ${card.stars} stars`:'A new friend to meet'}</p></div></header>
  <nav className="a6-cat-tabs" aria-label="Companion details">{tabs.map(([id,label])=><button key={id} aria-pressed={tab===id} onClick={()=>setTab(id)}>{label}</button>)}</nav>
  <section className="a6-cat-panel" aria-label={tabs.find(t=>t[0]===tab)![1]}>
   {tab==='growth'&&(card?<><div className="a6-cat-growth"><CompanionGrowthV4 m={m} catId={catId} kind="level"/><CompanionGrowthV4 m={m} catId={catId} kind="ascend"/></div><details><summary>Awakening · {m.state.awakened[catId]??0}/3</summary><p>From level ten and two stars. Each rank adds 3% HP and attack.</p><button disabled={locked||(m.state.awakened[catId]??0)>=3} onClick={()=>m.apply(R.awakenCat(m.state,catId),'Awakening raised HP and attack by 3%.')}>Awaken</button></details></>:<><p>Invite this friend to your cafe to train and equip them.</p><button className="cr-primary" onClick={()=>m.go('gacha')}>Recruit</button></>)}
   {tab==='skills'&&<><p className="a6-cat-passive"><b>{cat.passive.name}</b><small>{R.passiveDescriptionV4(catId)}</small></p>{cat.skills.map(skill=><div className="dp-skill-summary" key={skill.id}><img src={skillIcon(skill.id)} alt=""/><span><b>{skill.name}</b><small>{R.kitSkillV5(skill).description}</small>{(!card || card.level < skill.unlockLevel && card.stars < skill.unlockStars) && <small>Opens at level {skill.unlockLevel} or {skill.unlockStars} stars</small>}</span></div>)}<button onClick={onPreview}>Watch skill previews</button></>}
   {tab==='bonds'&&<BondSummaryA6 m={m} catId={catId}/>}
   {tab==='gear'&&<><div className="a6-cat-gear">{EQUIPMENT_SLOTS.map(slot=>{
    const item=gear.find(g=>R.GEAR_BY_ID[g.templateId]!.slot===slot);
    return <button key={slot} disabled={!card} onClick={()=>{m.cardId=catId;if(item)m.itemId=item.id;m.go('inventory');}}><ItemIcon slot={slot}/><span><small>{slot}</small><b>{item?R.GEAR_BY_ID[item.templateId]!.name:'Empty slot'}</b>{item&&<small>+{item.enhancement}</small>}</span></button>;
   })}</div><p>Gear earned on patrol stays with this cat.</p><button onClick={onPreview}>Inspect stats & previews</button></>}
  </section>
 </aside>;
}
