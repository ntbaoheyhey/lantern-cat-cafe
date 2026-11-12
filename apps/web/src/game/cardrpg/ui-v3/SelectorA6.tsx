import { useId, useMemo, useState, useSyncExternalStore } from 'react';
import { CARDS, CARD_RPG_CONFIG } from '@taskbar-hero/game-rules/cardrpg';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import type { DepthModel } from '../depth/model';
import { artPropsA6 } from './art-a6';
import { GearArtA6 } from './KeepsakeArtA6';
import {OddsC2} from './OddsC2';
import './selector-a6.css';

type Kind = 'cat' | 'gear';
type Receipt = { kind: Kind; id: string; text: string };

/** The quote runs the same atomic command on its own draft; viewing never spends marks. */
export function SelectorA6({m}:{m:DepthModel}) {
 useSyncExternalStore(m.subscribe,m.snapshot);
 const [kind,setKind]=useState<Kind>('cat'),[chosen,setChosen]=useState(''),[receipt,setReceipt]=useState<Receipt|null>(null),description=useId();
 const state=m.state,options=kind==='cat'?CARDS:R.GEAR,selected=options.find(o=>o.id===chosen);
 const quote=useMemo(()=>selected?R.chooseSelectorV4(state,kind,chosen):null,[state,kind,chosen,selected]);
 const marks=R.selectorMarksV4(state),cost=R.selectorCostV4(state,kind,chosen),owned=kind==='cat'?state.account.cards.find(c=>c.cardId===chosen):undefined;
 const template=kind==='gear'?R.GEAR_BY_ID[chosen]:undefined,gearCount=state.gear.filter(g=>g.templateId===chosen).length;
 const shardGain=selected&&owned?CARD_RPG_CONFIG.rarity[selected.rarity].shards:0,shardsFit=!owned||Number.isSafeInteger(owned.shards+shardGain);
 const collected=CARDS.filter(c=>state.account.cards.some(o=>o.cardId===c.id)).length;
 const needs:string[]=[];
 if(selected){
  if(state.run&&!state.run.complete)needs.push('Finish the current route.');
  if(marks<cost)needs.push(`Earn ${cost-marks} more selector marks.`);
  if(owned&&collected<CARDS.length)needs.push('Choose an uncollected companion first.');
  if(owned&&!shardsFit)needs.push('This saved balance is full.');
  if(template){
   if(state.gear.length>=R.GEAR_CAP_V4)needs.push(`The equipment shelf is full (${R.GEAR_CAP_V4}).`);
   if(state.account.chapter<template.chapter)needs.push(`Reach chapter ${template.chapter}.`);
   if(template.rarity==='legendary'&&!state.masteries.includes(template.chapter))needs.push(`Complete chapter ${template.chapter} mastery for this legendary template.`);
  }
  if(quote&&!quote.ok&&quote.error&&!needs.includes(quote.error))needs.push(quote.error);
 }
 const choose=()=>{
  const before=m.state,result=R.chooseSelectorV4(before,kind,chosen);
  if(!m.apply(result,'Your chosen reward is ready.')){setReceipt(null);return;}
  const previous=before.account.cards.find(c=>c.cardId===chosen),card=result.state.account.cards.find(c=>c.cardId===chosen),item=result.state.gear.at(-1);
  const name=kind==='cat'?R.CAT_BY_ID[chosen]!.name:R.GEAR_BY_ID[chosen]!.name;
  const received=kind==='gear'?`${name} added to your bag.`:previous?`${name}: +${card!.shards-previous.shards} matching shards.`:`${name} joined at level 1.`;
  setReceipt({kind,id:kind==='cat'?chosen:item!.id,text:`${received} ${cost} marks spent; ${R.selectorMarksV4(result.state)} left. Banner pity unchanged.`});
 };
 const openReward=()=>{if(!receipt)return;if(receipt.kind==='cat'){m.cardId=receipt.id;m.go('collection');}else{m.itemId=receipt.id;m.go('inventory');}};
 return <section className="a6-selector" aria-label="Guaranteed choice">
  <header><div><small>CHOOSE WITH MARKS</small><h2>A place saved for your choice</h2></div><p><strong>{marks} marks saved</strong><span>{cost} marks for one reward</span></p></header>
  <div className="a6-selector-layout"><div className="a6-selector-controls">
   <label>Reward type<select aria-label="Reward type" value={kind} onChange={e=>{setKind(e.target.value as Kind);setChosen('');setReceipt(null);}}><option value="cat">Companion</option><option value="gear">Equipment</option></select></label>
   <label>Chosen reward<select aria-label="Chosen reward" value={chosen} onChange={e=>{setChosen(e.target.value);setReceipt(null);}}><option value="">Choose a reward</option>{options.map(o=><option key={o.id} value={o.id}>{o.name} · {o.rarity}</option>)}</select></label>
   <p>One mark per stamp invitation. The free welcome adds none. Marks never expire.</p>
   <button disabled={!quote?.ok} aria-describedby={description} onClick={choose}>Choose reward · {cost} marks</button>
   {state.formationC2&&selected&&<OddsC2 source="Selector"><b aria-label="Chosen reward probability">100%</b><dl><div><dt aria-label="Selector marks cost">✦</dt><dd>{cost}</dd></div><div><dt aria-label="Reward quantity">◇</dt><dd>{owned?shardGain:1}</dd></div></dl></OddsC2>}
  </div><section id={description} className="a6-selector-preview" aria-label="Chosen reward preview">
   {selected?<><div className="a6-selector-reward">{template?<GearArtA6 slot={template.slot} setId={template.setId}/>:<img {...artPropsA6(chosen,'face')} alt=""/>}<div><small>{selected.rarity} {template?'keepsake':'companion'}</small><h3>{selected.name}</h3>
    <p>{template?`${gearCount} → ${gearCount+1} owned · one new piece in your bag`:owned?shardsFit?`${owned.shards} → ${owned.shards+shardGain} matching shards (+${shardGain})`:'Matching shard balance is full.':'Level 1 · 1 star · new companion'}</p>
   </div></div>
   <p className="a6-selector-cost">{marks>=cost?`Marks after choosing: ${marks} → ${marks-cost}.`:`Cost: ${cost} marks · ${marks} saved.`} Stamps and banner pity stay unchanged.</p>
   {owned&&<p>{collected}/{CARDS.length} companions collected. Duplicate choices require the full collection; they add shards and keep your cat’s level and stars.</p>}
   {template&&<p>Bag space: {state.gear.length}/{R.GEAR_CAP_V4}. Requires chapter {template.chapter}{template.rarity==='legendary'?' mastery':''}. Gear is added unequipped.</p>}
   {needs.length>0&&<ul className="a6-selector-needs">{needs.map(need=><li key={need}>{need}</li>)}</ul>}
   </>:<p>Choose a companion or keepsake to review what you will receive.</p>}
  </section></div>
  <footer><p role="status">{receipt?.text??''}</p>{receipt&&<button onClick={openReward}>{receipt.kind==='cat'?'View this cat':'View this gear'}</button>}</footer>
 </section>;
}
