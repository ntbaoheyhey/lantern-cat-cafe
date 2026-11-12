import {GearArtA6} from './KeepsakeArtA6';
import {SuppliesC2} from './SuppliesC2';
import {HelpC2} from './TextDietC2';
import {BagA6} from './BagA6';
import {CatDetailsA6} from './CatDetailsA6';
import {CatPreviewA6} from './CatPreviewA6';
import {DailyA6} from './DailyA6';
import { TeamA6 } from './FormationA6';
import { PowerA6, QuickUpgradeA6 } from './PowerA6';
import { BondSummaryA6 } from './BondsA6';
import {lazy, Suspense, useState,useSyncExternalStore} from 'react';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import {CARD_BY_ID, QUESTS} from '@taskbar-hero/game-rules/cardrpg';
import type {DepthModel} from '../depth/model';
import {skillIcon} from '../depth/assets';
import {artPropsA6 as portraitProps} from './art-a6';
import {CompanionCard} from '../depth/CompanionCard';
import {CompanionGrowthV4} from '../depth/CompanionGrowthV4';
import {CatKitV5, KeywordGuideV5, ComboHintsV5} from '../depth/SkillsV5';
import {bestRoleTeam, teamPower, gearComparison} from '../depth/meta-presentation';
import {ShiftLoadouts, UtilityComparison} from '../depth/EquipmentV4';
import {CostView, ItemIcon, rarityStyle} from '../shared';
const FullInventory=lazy(()=>import('../depth/Equipment').then(m=>({default:m.Inventory})));
const FullCollection=lazy(()=>import('../depth/TeamCollection').then(m=>({default:m.Collection})));
const FullBoard=lazy(()=>import('../depth/CafeV4').then(m=>({default:m.CafeBoardV4})));

export function CatsSheet({m}:{m:DepthModel}) {
 useSyncExternalStore(m.subscribe,m.snapshot);
 const [filter,setFilter]=useState('owned'),[advanced,setAdvanced]=useState(false);
 const [preview,setPreview]=useState<{catId:string;skillId?:string}|null>(null);
 const cat=R.CAT_BY_ID[m.cardId]??R.CATS[0]!,owned=m.state.account.cards.find(c=>c.cardId===cat.id),locked=!!m.state.run&&!m.state.run.complete;
 const cats=R.CATS.filter(c=>filter==='all'||m.state.account.cards.some(o=>o.cardId===c.id));
 return <><div className="uv-section-tools"><span data-cat-count={m.state.account.cards.length}>{m.state.account.cards.length} / {R.CATS.length}{!m.state.formationC2&&' cats'}</span><button aria-pressed={filter==='owned'} onClick={()=>setFilter('owned')} aria-label="Show my cats">{m.state.formationC2?'Owned':'Show my cats'}</button><button aria-pressed={filter==='all'} onClick={()=>setFilter('all')} aria-label="Discover all">{m.state.formationC2?'All':'Discover all'}</button></div>
  {R.gameplayA6(m.state)&&<QuickUpgradeA6 m={m}/>}<div className={`uv-card-workspace ${R.gameplayA6(m.state)?'a6-cats-workspace':''}`}><div className="uv-cat-grid">{cats.map(c=><CompanionCard key={c.id} id={c.id} m={m} selected={cat.id===c.id} onSelect={()=>{m.cardId=c.id;setAdvanced(false);m.notify(false);}}/>)}</div>
   {R.gameplayA6(m.state)?<CatDetailsA6 key={cat.id} m={m} catId={cat.id} onPreview={skillId=>setPreview({catId:cat.id,skillId})}/>:<aside className="uv-detail" aria-label="Cat details"><img className="uv-feature-portrait" {...portraitProps(cat.id)} alt=""/><small>{CARD_BY_ID[cat.id]!.rarity} · {cat.role}</small><h2>{cat.name}</h2>
    {owned&&R.gameplayA6(m.state)&&<PowerA6 value={R.powerV4(m.state,cat.id).total} reducedMotion={m.state.settings.reducedMotion}/>}<p>{owned?`Level ${owned.level} · ${owned.stars} stars`:'A new friend to meet'}</p>{R.skillsV5(m.state)&&<CatKitV5 catId={cat.id}/>}
    {owned?<div className="cr-actions"><CompanionGrowthV4 m={m} catId={cat.id} kind="level"/><CompanionGrowthV4 m={m} catId={cat.id} kind="ascend"/><button disabled={locked||(m.state.awakened[cat.id]??0)>=3} onClick={()=>m.apply(R.awakenCat(m.state,cat.id),'Awakening raised HP and attack by 3%.')}>Awaken</button></div>:<button className="cr-primary" onClick={()=>m.go('gacha')}>Recruit</button>}
    <details><summary>Read skills</summary><p>{cat.passive.name} · {R.gameplayV4(m.state)?R.passiveDescriptionV4(cat.id):cat.passive.description}</p>{cat.skills.map(s=><div className="dp-skill-summary" key={s.id}><img src={skillIcon(s.id)} alt=""/><span><b>{s.name}</b><small>{R.skillsV5(m.state)?R.kitSkillV5(s).description:s.description}</small></span></div>)}<KeywordGuideV5/></details>
    {R.gameplayA6(m.state)&&<BondSummaryA6 m={m} catId={cat.id}/>}
    <button onClick={()=>setAdvanced(!advanced)} aria-expanded={advanced}>Inspect gear & previews</button>
   </aside>}
  </div>{preview&&<CatPreviewA6 m={m} catId={preview.catId} initialSkillId={preview.skillId} onClose={()=>setPreview(null)}/>}
  {advanced&&<div className="uv-advanced"><Suspense fallback={<p>Opening…</p>}><FullCollection m={m}/></Suspense></div>}
 </>;
}

export function TeamSheet({m}:{m:DepthModel}) {
 const state=m.state,locked=!!state.run&&!state.run.complete;
 const [seat,setSeat]=useState(0);
 if(R.gameplayA6(state))return <TeamA6 m={m}/>;
 const selected=state.team[seat]??state.team[0]!;
 const update=(team=state.team,rows=state.rows)=>m.apply(R.configureTeam(state,team,rows,state.skills),'Your crew is ready.');
 return <><div className="uv-section-tools"><b>{R.gameplayA6(state)?<PowerA6 value={teamPower(state)} label="Team Power" reducedMotion={state.settings.reducedMotion}/>:<>Team power {teamPower(state)}</>}</b><button disabled={locked} onClick={()=>{const team=bestRoleTeam(state);update(team,{...state.rows,...Object.fromEntries(team.map(id=>[id,R.CAT_BY_ID[id]!.row]))});}}>Use recommended crew</button><small>{locked?'Crew set for this route':'Choose a seat, then a cat'}</small></div>
 {R.gameplayA6(state)&&<QuickUpgradeA6 m={m}/>}<div className="uv-card-workspace"><section><div className="uv-team-seats" aria-label="Crew seats">{state.team.map((id,i)=><div key={i}><CompanionCard id={id} m={m} selected={i===seat} onSelect={()=>setSeat(i)}/><div className="uv-row-buttons">{(['front','rear'] as const).map(row=><button key={row} disabled={locked} aria-pressed={state.rows[id]===row} onClick={()=>update(state.team,{...state.rows,[id]:row})}>{row==='front'?'Place front':'Place back'}</button>)}</div></div>)}</div>
 <h2>Choose a companion</h2><div className="uv-roster" aria-label={`Replace ${R.CAT_BY_ID[selected]!.name}`}>{state.account.cards.map(c=><button key={c.id} disabled={locked||state.team.includes(c.cardId)} onClick={()=>update(state.team.map((id,i)=>i===seat?c.cardId:id),{...state.rows,[c.cardId]:state.rows[selected]!})}><img {...portraitProps(c.cardId)} alt=""/><b>{R.CAT_BY_ID[c.cardId]!.name}</b><small>Lv. {c.level}</small></button>)}</div></section>
 <aside className="uv-detail"><h2>Better together</h2>{R.gameplayA6(state)&&<BondSummaryA6 m={m}/>}<ComboHintsV5 cats={state.team}/>{R.crewThresholds(state.team).filter(c=>c.marks>0).map(c=><div key={c.id}><h3>{c.name}</h3><p>{c.marks}/4 marks · {c.description}</p></div>)}<details><summary>Save or load shifts</summary><ShiftLoadouts m={m}/></details></aside></div></>;
}

export function BagSheet({m,materials=false}:{m:DepthModel;materials?:boolean}) {
 const [advanced,setAdvanced]=useState(false),state=m.state,locked=!!state.run&&!state.run.complete;
 const cardId=state.account.cards.some(c=>c.cardId===m.cardId)?m.cardId:state.team[0]!;
 const item=state.gear.find(i=>i.id===m.itemId)??state.gear[0],spec=item?R.GEAR_BY_ID[item.templateId]:undefined;
 const comparison=item?gearComparison(state,cardId,item.id):null,preview=item?R.enhancementPreview(item,state,cardId):undefined;
 if(materials)return state.formationC2?<SuppliesC2 m={m}/>:<Suspense fallback={<p>Opening…</p>}><FullInventory m={m} initialCategory="Materials"/></Suspense>;
 if(R.gameplayA6(state))return <BagA6 m={m}/>;
 return <><div className={`uv-section-tools ${R.gameplayA6(state)?'a6-bag-tools':''}`}><span data-gear-count={state.gear.length}>{state.gear.length} pieces</span><label>Equip for <select aria-label="Equip for" value={cardId} onChange={e=>{m.cardId=e.target.value;m.notify(false);}}>{state.account.cards.map(c=><option value={c.cardId} key={c.id}>{R.CAT_BY_ID[c.cardId]!.name}</option>)}</select></label><button onClick={()=>setAdvanced(!advanced)} aria-expanded={advanced}>Open workshop</button></div>
 {R.gameplayA6(state)&&<QuickUpgradeA6 m={m}/>}<div className={`uv-card-workspace ${R.gameplayA6(state)?'a6-bag-workspace':''}`}><div className="uv-gear-grid">{state.gear.map(g=>{const s=R.GEAR_BY_ID[g.templateId]!;return <button key={g.id} data-rarity={s.rarity} style={rarityStyle(s.rarity)} aria-pressed={item?.id===g.id} onClick={()=>{m.itemId=g.id;m.notify(false);}}>{R.gameplayA6(state)?<GearArtA6 slot={s.slot} setId={s.setId}/>:<ItemIcon slot={s.slot}/>}<b>{s.name}</b><small>{s.rarity} · +{g.enhancement}</small></button>})}{!state.gear.length&&<div className="uv-detail uv-gear-empty"><img className="uv-feature-portrait" {...portraitProps('panko')} alt=""/><h2>A shelf for your treasures</h2><p>Find your first gear on Night Patrol.</p><button className="cr-primary" onClick={()=>m.go('hub')}>Back to the cafe</button></div>}</div>
 {item&&spec&&<aside className="uv-detail a6-gear-detail">{R.gameplayA6(state)?<div className="a6-gear-showcase"><GearArtA6 slot={spec.slot} setId={spec.setId}/><img className="a6-gear-companion" {...portraitProps(cardId)} alt=""/></div>:<><img className="uv-feature-portrait" {...portraitProps(cardId)} alt=""/><ItemIcon slot={spec.slot}/></>}<small>{spec.rarity} · {spec.slot}</small><h2>{spec.name}</h2><p>{R.gameplayV4(state)?R.gearStoryV4(spec.id,state.formationC2):spec.story}</p><p>For {R.CAT_BY_ID[cardId]!.name}</p>{comparison?.error&&<p>{comparison.error}</p>}
 <button className="cr-primary" disabled={locked||!!comparison?.error} onClick={()=>{const result=R.equipGear(state,cardId,item.id);if(result.ok)result.state.tutorial=Math.max(4,result.state.tutorial);m.apply(result,`${spec.name} equipped.`);}}>Equip</button>
 {preview&&<details><summary>Enhance or compare</summary><p>{spec.main} {preview.before} → {preview.after}</p><CostView cost={preview.cost}/><button disabled={locked||item.enhancement>=12} onClick={()=>m.apply(R.enhanceGear(state,item.id),`${spec.name} enhanced.`)}>Enhance</button><UtilityComparison state={state} cardId={cardId} instanceId={item.id}/></details>}
 </aside>}</div>{advanced&&<div className="uv-advanced"><Suspense fallback={<p>Opening…</p>}><FullInventory m={m}/></Suspense></div>}</>;
}

export function EventsSheet({m}:{m:DepthModel}) {
 const [more,setMore]=useState(false),active=!!m.state.run&&!m.state.run.complete;
 if(R.gameplayA6(m.state))return <><DailyA6 m={m}/>{m.state.formationC2?<HelpC2 label="More cafe rewards"><Suspense fallback={null}><FullBoard m={m}/></Suspense></HelpC2>:<details><summary>More cafe rewards</summary><Suspense fallback={<p>Opening…</p>}><FullBoard m={m}/></Suspense></details>}</>;
 return <>{R.MILESTONES_V4.some(x=>!R.milestonePreviewV4(m.state,x.id).reason)&&<button onClick={()=>m.go('journal')}>Collect journal rewards</button>}<div className="uv-task-grid">{QUESTS.map(q=>{const p=R.boardPreviewV4(m.state,q.id);return <article className="uv-detail" key={q.id}><small>{q.cadence}</small><h2>{q.name}</h2><p>{q.description}</p><progress aria-label={`${q.name} progress`} value={p.progress.progress} max={q.target}/><p>{p.progress.progress}/{q.target}</p><CostView cost={p.reward}/><button disabled={active||!!p.reason} onClick={()=>m.command({type:'claimQuest',questId:q.id})}>{p.progress.claimed?'Collected':'Collect reward'}</button></article>})}</div><button onClick={()=>setMore(!more)} aria-expanded={more}>Read cafe news</button>{more&&<Suspense fallback={<p>Opening…</p>}><FullBoard m={m}/></Suspense>}</>;
}
