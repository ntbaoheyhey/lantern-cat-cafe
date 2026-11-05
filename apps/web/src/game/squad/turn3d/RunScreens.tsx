import {useEffect,useRef,useState} from 'react';
import {SceneCanvas} from './SceneCanvas';
import type {TurnScene,SceneView} from './scene';
import type {TurnActor,Hero} from '@taskbar-hero/game-rules/src/squad/turn/types';
import {GEAR_SLOTS,ITEM_BY_ID,SET_NAMES,SET_TEXT,describeItem,formatStat,type GearSlot,type SquadItem,type GearSet} from '@taskbar-hero/game-rules/src/squad/gear/catalog';
import {gearBonuses,applyEquipment} from '@taskbar-hero/game-rules/src/squad/gear/equipment';
import {canEquip,runSummary} from '@taskbar-hero/game-rules/src/squad/gear/run';
import {TURN_SKILLS} from '@taskbar-hero/game-rules/src/squad/turn/config';
import type {TurnController} from './controller';
export const RARITY_COLOR={Common:'#c7c2bf',Uncommon:'#a5c992',Rare:'#8fbce0',Epic:'#c6a3ee',Legendary:'#f3cc7b'};
export const SLOT_ICON:Record<GearSlot,string>={weapon:'⚒',outfit:'♜',charm:'❖',relic:'✧'};
export const SLOT_NAME:Record<GearSlot,string>={weapon:'Weapon',outfit:'Outfit',charm:'Charm',relic:'Relic'};
export function GearIcons({actor}:{actor:TurnActor}){return <span className="t3-gear-icons" aria-label={`${actor.name} equipment`}>{GEAR_SLOTS.map(slot=>{const i=ITEM_BY_ID[actor.equipment[slot]??''];return <span key={slot} title={i?`${i.name}: ${describeItem(i)}`:`Empty ${SLOT_NAME[slot]}`} style={{color:i?RARITY_COLOR[i.rarity]:'#66616f'}}>{SLOT_ICON[slot]}</span>})}</span>}
export function MiniPreview({actor,calm=false}:{actor:TurnActor;calm?:boolean}){
 const scene=useRef<TurnScene|null>(null),[error,setError]=useState('');
 const view=():SceneView=>({actors:[actor],currentId:null,frame:null,targetIds:[],legalIds:[],reducedMotion:calm,paused:calm,boss:false,model:{role:actor.role,clip:'idle',angle:.25},camera:'close',quality:'low'});
 const ref=useRef(view);ref.current=view;useEffect(()=>{scene.current?.invalidate()});
 return <div className="t3-mini-preview" aria-label={`${actor.name} live equipment preview`}>{error?<span>{actor.name}<GearIcons actor={actor}/></span>:<SceneCanvas view={()=>ref.current()} onTarget={()=>{}} onAnchors={()=>{}} onFailure={setError} onReady={s=>{scene.current=s}}/>}</div>;
}
function ItemText({item}:{item:SquadItem}){return <><span className="t3-rarity" style={{color:RARITY_COLOR[item.rarity]}}>{item.rarity} · {SLOT_NAME[item.slot]}{item.set?` · ${SET_NAMES[item.set]}`:''}</span><h3>{item.name}</h3><p>{describeItem(item)}</p><em>{item.flavor}</em></>}
export function LoadoutScreen({c,calm}:{c:TurnController;calm:boolean}){
 const b=c.battle,rest=b.run.stage==='rest';
 const [pick,setPick]=useState<{hero:Hero;slot:GearSlot}|null>(null),[candidate,setCandidate]=useState('');
 const cats=b.actors.filter(a=>a.side==='party'),cat=cats.find(a=>a.id===pick?.hero);
 const item=ITEM_BY_ID[candidate],preview=cat?structuredClone(cat):undefined;
 if(preview&&pick){if(item)preview.equipment[pick.slot]=item.id;else delete preview.equipment[pick.slot];applyEquipment(preview,b.preset)}
 useEffect(()=>{if(!pick)return;const previous=document.activeElement as HTMLElement|null;
  const trap=(e:KeyboardEvent)=>{if(e.key!=='Tab')return;const dialog=document.querySelector('.t3-picker');const buttons=Array.from(dialog?.querySelectorAll<HTMLElement>('button:not(:disabled),select,input')??[]);const first=buttons[0],last=buttons.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}};
  window.addEventListener('keydown',trap);return()=>{window.removeEventListener('keydown',trap);previous?.focus()};
 },[pick?.hero,pick?.slot]);
 const choices=pick?b.run.inventory.map(id=>ITEM_BY_ID[id]!).filter(i=>i.slot===pick.slot&&i.fit.includes(pick.hero)):[];
 const open=(a:TurnActor,slot:GearSlot)=>{setPick({hero:a.role as Hero,slot});setCandidate(a.equipment[slot]??'')};
 return <section className="t3-loadout" aria-label={rest?'Cafe rest':'Squad loadout'}>
  <div className="t3-loadout-heading"><div><span className="sq-eyebrow">{rest?`Wave ${b.wave+1} clear / Cafe rest`:'Before the first round'}</span><h2>{rest?'A warm cup. A new plan.':'What will you bring tonight?'}</h2><p>{rest?'Try your new find and keep a supply for the next dangerous intent.':'Pick your equipment. Each cat acts once per round. Gear changes skills, defenses and order.'}</p></div><div><button onClick={()=>c.equipBest()}>Auto-equip best</button><button onClick={()=>c.resetGear()}>Reset gear</button></div></div>
  <div className="t3-loadout-cats">{cats.map(a=>{const sets=gearBonuses(a.equipment).sets;return <article key={a.id} className={`t3-loadout-cat ${a.hp<=0?'is-defeated':''}`}>
   <header><h3>{a.name}</h3><small>{a.role} · Initiative {a.initiative}</small></header><MiniPreview actor={a} calm={calm}/>
   <div className="t3-stat-line"><span>{a.hp}/{a.maxHp} HP</span><span>{a.attack} ATK</span><span>{a.defense} DEF</span><span>{Math.round(a.crit*100)}% crit</span></div>
   <div className="t3-slots">{GEAR_SLOTS.map(slot=>{const i=ITEM_BY_ID[a.equipment[slot]??''];return <button key={slot} aria-label={`${a.name} ${SLOT_NAME[slot]}`} disabled={a.hp<=0} onClick={()=>open(a,slot)} style={{borderLeftColor:i?RARITY_COLOR[i.rarity]:'#5d5262'}}><span>{SLOT_ICON[slot]}</span><span><small>{SLOT_NAME[slot]}</small><b>{i?.name??'Empty slot'}</b></span><span>›</span></button>})}</div>
   <div className="t3-sets">{Object.entries(sets).map(([set,n])=><p key={set} className={n>=2?'active':''} title={SET_TEXT[set as GearSet].join(' ')}>{SET_NAMES[set as GearSet]} {n}/3 <span>{n>=3?SET_TEXT[set as GearSet][1]:n>=2?SET_TEXT[set as GearSet][0]:'One more piece activates a bonus.'}</span></p>)}{!Object.keys(sets).length&&<p>Pair two items from a set to unlock a bonus.</p>}</div>
  </article>})}</div>
  <div className="t3-rest-supplies"><b>Shared supplies</b>{Object.entries(b.run.consumables).map(([id,n])=><span key={id} title={TURN_SKILLS[id]!.description}>{TURN_SKILLS[id]!.name}<b>×{n}</b></span>)}<small>Each use costs the acting cat’s action.</small></div>
  <footer><span>Seed {b.seed} · three waves, then the Yarn Giant · unsaved sandbox</span><button className="sq-start" onClick={()=>rest?c.continue():c.begin()}>{rest?(b.run.nextWave===3?'Face the Yarn Giant':'Continue patrol'):'Begin patrol'} →</button></footer>
  {pick&&cat&&preview&&<div className="t3-picker-backdrop" onKeyDown={e=>{if(e.key==='Escape')setPick(null)}}><section className="t3-picker" role="dialog" aria-modal="true" aria-label={`${cat.name} ${SLOT_NAME[pick.slot]} picker`}>
   <header><div><span className="sq-eyebrow">{cat.name} / {SLOT_NAME[pick.slot]}</span><h2>A different kind of courage.</h2></div><button autoFocus aria-label="Close item picker" onClick={()=>setPick(null)}>✕</button></header>
   <div className="t3-picker-grid"><div className="t3-item-list" role="group" aria-label="Owned compatible items"><button className={!candidate?'selected':''} onClick={()=>setCandidate('')}>Unequip · empty slot</button>{choices.map(i=>{const used=b.actors.find(a=>a.id!==cat.id&&Object.values(a.equipment).includes(i.id));return <button key={i.id} className={candidate===i.id?'selected':''} onClick={()=>setCandidate(i.id)} style={{borderLeftColor:RARITY_COLOR[i.rarity]}}><b>{i.name}</b><small>{i.rarity} · {formatStat(i.main)}{used?` · used by ${used.name}`:''}</small></button>})}</div>
    <div className="t3-item-detail"><MiniPreview actor={preview} calm={calm}/>{item?<ItemText item={item}/>:<h3>Travel light</h3>}
     <div className="t3-comparison">{(['attack','defense','maxHp','initiative','crit'] as const).map(key=>{const d=preview[key]-cat[key];return <span key={key} className={d>0?'up':d<0?'down':''}>{key==='maxHp'?'HP':key}: {key==='crit'?`${Math.round(preview[key]*100)}%`:preview[key]} {d?`${d>0?'↑':'↓'} ${key==='crit'?`${Math.round(Math.abs(d)*100)}%`:Math.abs(d)}`:'—'}</span>})}</div>
     <button className="sq-start" disabled={!canEquip(b,pick.hero,pick.slot,candidate||null)} onClick={()=>{if(c.equip(pick.hero,pick.slot,candidate||null))setPick(null)}}>{candidate?'Equip item':'Unequip'}</button>
    </div></div>
  </section></div>}
 </section>;
}
export function LootScreen({c,calm}:{c:TurnController;calm:boolean}){return <section className="t3-loot" aria-label="Wave loot"><span className="sq-eyebrow">Wave {c.battle.wave+1} complete · choose one</span><h2>Something worth carrying home.</h2><p>Your seed fixes these three finds. Keep one, then take a cafe rest.</p><div className="t3-loot-grid">{c.battle.run.loot.map(id=>{const i=ITEM_BY_ID[id]!,a=structuredClone(c.battle.actors.find(a=>i.fit.includes(a.role as Hero))!);a.equipment[i.slot]=id;return <article key={id}><MiniPreview actor={a} calm={calm}/><ItemText item={i}/><button className="sq-start" onClick={()=>c.loot(id)}>Keep {i.name}</button></article>})}</div><small>Local items only. Nothing leaves this run.</small></section>}
export function Supplies({c}:{c:TurnController}){return <div className="t3-supplies" aria-label="Limited consumables">{Object.entries(c.battle.run.consumables).map(([id,n])=>{const sk=TURN_SKILLS[id]!,legal=c.actions.find(a=>a.skill.id===id);return <button key={id} disabled={!c.canChoose||!legal?.legal} aria-pressed={c.selectedSkill===id} title={`${sk.description} Uses the acting cat’s turn. ${legal?.reason??''}`} onClick={()=>c.select(id)}><span>{sk.name}</span><b>×{n}</b></button>})}</div>}
export function RunSummary({c}:{c:TurnController}){const r=runSummary(c.battle);return <div className="t3-summary"><p>MVP · <b>{r.mvp}</b> / {r.rounds} rounds / {r.actions} actions / {r.itemsFound.length} items found</p><table><thead><tr><th>Cat</th><th>Dealt</th><th>Taken</th><th>Healed</th><th>Shielded</th></tr></thead><tbody>{r.cats.map(a=><tr key={a.id}><th>{a.name}</th><td>{a.damage}</td><td>{a.taken}</td><td>{a.healing}</td><td>{a.shielding}</td></tr>)}</tbody></table><p>{r.itemsFound.map(id=>ITEM_BY_ID[id]!.name).join(' · ')||'No items found'}</p></div>}
