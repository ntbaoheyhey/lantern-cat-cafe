import {lazy, Suspense, useEffect, useId, useRef, useState, useSyncExternalStore} from 'react';
import {EQUIPMENT_SLOTS} from '@taskbar-hero/game-rules/cardrpg';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import type {DepthModel} from '../depth/model';
import {gearComparison} from '../depth/meta-presentation';
import {UtilityComparison} from '../depth/EquipmentV4';
import {CostView, rarityStyle, statName, statValue} from '../shared';
import {artPropsA6} from './art-a6';
import {GearArtA6} from './KeepsakeArtA6';
import {QuickUpgradeA6} from './PowerA6';

const Workshop=lazy(()=>import('../depth/Equipment').then(m=>({default:m.Inventory})));
const slotNames={all:'All',weapon:'Weapons',outfit:'Outfits',charm:'Charms',relic:'Relic gear'};
const shortName=(name:string)=>name.replace(/^(Common|Rare|Epic|Legendary) /,'');

export function BagA6({m}:{m:DepthModel}) {
 useSyncExternalStore(m.subscribe,m.snapshot);
 const [slot,setSlot]=useState<string>(m.inventorySlot),[page,setPage]=useState<'compare'|'effects'>('compare'),[workshop,setWorkshop]=useState(false);
 const enhanceDescription=useId();
 const workshopButton=useRef<HTMLButtonElement>(null),backButton=useRef<HTMLButtonElement>(null),wasWorkshop=useRef(false);
 useEffect(()=>{if(workshop)backButton.current?.focus();else if(wasWorkshop.current)workshopButton.current?.focus();wasWorkshop.current=workshop;},[workshop]);
 const state=m.state,locked=!!state.run&&!state.run.complete;
 const cardId=state.account.cards.some(c=>c.cardId===m.cardId)?m.cardId:state.team[0]!,cat=R.CAT_BY_ID[cardId]!;
 const gear=state.gear.filter(g=>slot==='all'||R.GEAR_BY_ID[g.templateId]!.slot===slot);
 const item=gear.find(g=>g.id===m.itemId)??gear[0],spec=item?R.GEAR_BY_ID[item.templateId]:undefined;
 const gearSet=R.SETS.find(s=>s.id===spec?.setId),setInfo=gearSet?R.setTextV4(gearSet,true):undefined;
 const ownerOf=(id:string)=>Object.entries(state.equipment).find(([,slots])=>Object.values(slots).includes(id))?.[0];
 const owner=item?ownerOf(item.id):undefined,equipped=owner===cardId;
 const preview=item?R.enhancementPreview(item,state,cardId):undefined;
 // Equipping compares the chosen cat; enhancing changes the piece on its actual wearer.
 const enhancePreview=item?R.enhancementPreview(item,state,owner??cardId):undefined;
 // The read-only comparison can show a future fit while the real actions remain route-locked.
 const compare=item?gearComparison(locked?{...state,run:null}:state,cardId,item.id):null,utility=item?R.comparisonV4(state,cardId,item.id):null;
 const current=R.depthStats(state,cardId),canAfford=!!preview&&state.account.currencies.fish>=preview.cost.fish&&state.account.currencies.threads>=preview.cost.threads;
 const maxed=!!item&&item.enhancement>=12;
 const missing=preview?(['fish','threads'] as const).flatMap(id=>{
  const amount=preview.cost[id]-state.account.currencies[id];
  return amount>0?[`${amount} more ${id==='threads'&&amount===1?'thread':id}`]:[];
 }):[];
 const select=(id:string)=>{m.itemId=id;setPage('compare');m.notify(false);};
 if(workshop)return <section className="a6-inventory-workshop" aria-label="Gear workshop"><header><button ref={backButton} onClick={()=>setWorkshop(false)}>Back to gear</button><p>Craft, reforge and manage your full collection.</p></header><div><Suspense fallback={<p>Opening the workshop…</p>}><Workshop m={m}/></Suspense></div></section>;
 return <section className="a6-inventory" aria-label="Gear workbench">
  <header className="a6-inventory-tools"><h2>Your gear shelf <span data-gear-count={state.gear.length}>{state.gear.length} / {R.GEAR_CAP_V4}</span></h2><label>Equip for <select aria-label="Equip for" value={cardId} onChange={e=>{m.cardId=e.target.value;m.notify(false);}}>{state.account.cards.map(c=><option value={c.cardId} key={c.id}>{R.CAT_BY_ID[c.cardId]!.name}</option>)}</select></label><button ref={workshopButton} onClick={()=>setWorkshop(true)}>Open workshop</button></header>
  <QuickUpgradeA6 m={m}/>
  <div className="a6-inventory-desk">
   <section className="a6-inventory-shelf" aria-label="Gear shelf"><nav aria-label="Gear slots">{(['all',...EQUIPMENT_SLOTS] as const).map(value=><button key={value} aria-pressed={slot===value} onClick={()=>{setSlot(value);setPage('compare');}}>{slotNames[value]}</button>)}</nav>
    <div className="a6-inventory-grid">{gear.map(g=>{const s=R.GEAR_BY_ID[g.templateId]!,owner=ownerOf(g.id);return <button key={g.id} data-gear-id={g.id} data-rarity={s.rarity} style={rarityStyle(s.rarity)} aria-pressed={item?.id===g.id} aria-label={s.name+' +'+g.enhancement+(owner?' · Worn by '+R.CAT_BY_ID[owner]!.name:' · Available')} onClick={()=>select(g.id)}><span className="a6-inventory-rank">{s.rarity}<b>+{g.enhancement}</b></span><GearArtA6 slot={s.slot} setId={s.setId}/><b>{shortName(s.name)}</b><small>{owner?'Worn by '+R.CAT_BY_ID[owner]!.name:'Available'}</small></button>;})}
     {!gear.length&&<div className="a6-empty-state"><img {...artPropsA6('panko')} alt=""/><h2>{state.gear.length?'This shelf is waiting':'A shelf for your treasures'}</h2><p>{state.gear.length?'No '+slotNames[slot as keyof typeof slotNames].toLowerCase()+' yet. Try another shelf.':'Find your first gear on Night Patrol.'}</p><button onClick={()=>state.gear.length?setSlot('all'):m.go('hub')}>{state.gear.length?'Show all gear':'Back to the cafe'}</button></div>}
    </div>
   </section>
   {item&&spec&&preview&&enhancePreview?<aside className="a6-inventory-detail" aria-label="Selected gear" data-selected-gear={item.id}>
    <header className="a6-inventory-hero" data-rarity={spec.rarity} style={rarityStyle(spec.rarity)}><GearArtA6 slot={spec.slot} setId={spec.setId}/><div><small>{spec.rarity} · {spec.slot} · +{item.enhancement}</small><h2>{shortName(spec.name)}</h2><p><b>{statName(spec.main)} {preview.before}</b> on {cat.name}</p><span>{owner?'Worn by '+R.CAT_BY_ID[owner]!.name:'Ready to equip'}</span></div><img {...artPropsA6(cardId)} alt=""/></header>
    <nav className="a6-inventory-pages" aria-label="Gear details"><button aria-pressed={page==='compare'} onClick={()=>setPage('compare')}>Compare on {cat.name}</button><button aria-pressed={page==='effects'} onClick={()=>setPage('effects')}>Set & affixes</button></nav>
    <div className="a6-inventory-reading" key={item.id+':'+cardId+':'+page}>{page==='compare'?<>
     <div className="a6-inventory-power"><span>{equipped?'Currently equipped':cat.name+'’s Power'}</span><b>{utility?.before.total.toLocaleString('en-US')}{!equipped&&<> → {utility?.after.total.toLocaleString('en-US')}</>}</b></div>
     <dl className="a6-inventory-stats">{(['hp','attack','defense'] as const).map(key=>{const after=compare?.stats?.[key]??current[key],delta=after-current[key];return <div key={key}><dt>{statName(key)}</dt><dd>{current[key]}{!equipped&&<span data-change={Math.sign(delta)}> → {after}</span>}</dd></div>;})}</dl>
     <p className="a6-inventory-note">{locked?'Finish this route to change gear.':utility?.transfer?'Transfers from '+R.CAT_BY_ID[utility.transfer]!.name+'; they lose this piece.':equipped?'This piece is already part of '+cat.name+'’s build.':'Equip replaces the current '+spec.slot+'; the old piece stays in your bag.'}</p>
     {!locked&&compare?.error&&<p role="status">{compare.error}</p>}
    </>:<>{setInfo&&<section className="a6-inventory-set" aria-label="Gear set"><h3>{setInfo.name}</h3><p>{R.equipmentEffects(state,cardId).counts[setInfo.id]??0}/4 pieces worn by {cat.name}</p><p><b>2 pieces</b> · {setInfo.two}</p><p><b>4 pieces</b> · {setInfo.four}</p></section>}{spec.unique&&<p><b>Unique effect</b> · {R.gearStoryV4(spec.id)}</p>}{item.affixes.length?<section aria-label="Item affixes">{item.affixes.map(id=>{const a=R.AFFIX_BY_ID[id]!;return <p key={id}><b>{a.name} · {statValue(a.stat,R.gearAffixRoll(item,id))}</b><br/>{R.AFFIX_TEXT_V4[a.stat]??a.description}</p>;})}</section>:<p>No affixes on this piece.</p>}<UtilityComparison state={state} cardId={cardId} instanceId={item.id}/></>}
    </div>
    <footer className="a6-inventory-actions"><div><small>{locked?'Crew set for this route':equipped?'Already on '+cat.name:owner?'Move from '+R.CAT_BY_ID[owner]!.name+' to '+cat.name:'Equip for '+cat.name+' · Free'}</small><button className={!locked&&!equipped&&!compare?.error?'cr-primary':undefined} disabled={locked||equipped||!!compare?.error} onClick={()=>{const result=R.equipGear(m.state,cardId,item.id);if(result.ok)result.state.tutorial=Math.max(4,result.state.tutorial);m.apply(result,spec.name+' equipped.');}}>{equipped?'Equipped':'Equip'}</button></div><div><div id={enhanceDescription} className="a6-inventory-enhance" aria-label="Enhancement quote">
     <small>{owner?'Worn by '+R.CAT_BY_ID[owner]!.name:'For '+cat.name+' · Equip to use'}{!maxed&&enhancePreview.before===enhancePreview.after&&<> · No main-stat gain at +{item.enhancement+1}.</>}</small>
     <div className="a6-inventory-cost">{maxed?<span>Maximum enhancement</span>:<><span>{statName(spec.main)} {enhancePreview.before} → {enhancePreview.after}</span><CostView cost={enhancePreview.cost}/></>}</div>
     {locked?<small>Finish this route to enhance gear.</small>:!maxed&&missing.length>0&&<small className="a6-inventory-missing">Need {missing.join(' · ')}. Patrol gives fish and threads.</small>}
    </div><button aria-describedby={enhanceDescription} disabled={locked||maxed||!canAfford} onClick={()=>m.apply(R.enhanceGear(m.state,item.id),spec.name+' enhanced to +'+(item.enhancement+1)+'.')}>{maxed?'Max +12':!canAfford?'Need materials':'Enhance +'+(item.enhancement+1)}</button></div></footer>
   </aside>:<aside className="a6-inventory-welcome"><img {...artPropsA6(cardId)} alt=""/><h2>A little care before the next patrol</h2><p>Choose a piece to compare it on {cat.name}.</p></aside>}
  </div>
 </section>;
}
