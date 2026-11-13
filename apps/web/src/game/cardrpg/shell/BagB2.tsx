import {useEffect,useRef,useState,useSyncExternalStore} from 'react';
import {playCue} from '../contracts/audio-cues';
import {reducedMotionB2} from './motion-b2';
import {EQUIPMENT_SLOTS} from '@taskbar-hero/game-rules/cardrpg';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import type {DepthModel} from '../depth/model';
import {GameIcon} from '../../../ui/GameIcon';
import {artPropsA6} from '../ui-v3/art-a6';
import {GearArtA6} from '../ui-v3/KeepsakeArtA6';
import {HelpC2} from '../ui-v3/TextDietC2';
import {DropOddsC2} from '../ui-v3/OddsC2';
import {CostView,statName,statValue} from '../shared';
import {gearComparison} from '../depth/meta-presentation';
import {MenuDialogB2} from './MenuDialogB2';
import {BoundFusion} from './BoundFusion';
import {GuideMascot,PaintedTile} from './PaintedKit';

const slots={all:'All',weapon:'Weapons',outfit:'Outfits',charm:'Charms',relic:'Relic gear'};
const shortName=(name:string)=>name.replace(/^(Common|Rare|Epic|Legendary) /,'');
export function BagB2({m}:{m:DepthModel}) {
 useSyncExternalStore(m.subscribe,m.snapshot);
 const [slot,setSlot]=useState(m.inventorySlot),[forge,setForge]=useState(false),[detailTab,setDetailTab]=useState<'set'|'affixes'>('set');
 const [feedback,setFeedback]=useState<{id:number;result:'success'|'fail'}>();
 const feedbackTimers=useRef<ReturnType<typeof setTimeout>[]>([]);
 const lastComment=useRef(-Infinity);
 const comment=(event:'select'|'victory')=>{
  if(Date.now()-lastComment.current<22000)return;lastComment.current=Date.now();
  if(cardId==='mochi')playCue(event==='select'?'voice.mochi.gear':'voice.mochi.forge',{priority:25});
  else playCue(`voice.${cardId}.${event}`,{priority:25});
 };
 useEffect(()=>()=>feedbackTimers.current.forEach(clearTimeout),[]);
 const enhance=()=>{
  if(!item)return;
  feedbackTimers.current.forEach(clearTimeout);
  const before=item.enhancement,result=R.enhanceGear(m.state,item.id);
  m.apply(result,'Forge complete.');
  if(!result.ok){playCue('ui.fail');return;}
  const success=(result.state.gear.find(g=>g.id===item.id)?.enhancement??before)>before;
  setFeedback({id:performance.now(),result:success?'success':'fail'});playCue('ui.forge.hammer');
  const delay=reducedMotionB2()?0:260;
  feedbackTimers.current=[setTimeout(()=>{playCue(success?'ui.forge.success':'ui.forge.fail');if(success)comment('victory');},delay),setTimeout(()=>setFeedback(undefined),950)];
 };
 const s=m.state,locked=!!s.run&&!s.run.complete,cardId=s.account.cards.some(c=>c.cardId===m.cardId)?m.cardId:s.team[0]!,cat=R.CAT_BY_ID[cardId]!;
 const gear=s.gear.filter(g=>slot==='all'||R.GEAR_BY_ID[g.templateId]!.slot===slot),item=gear.find(g=>g.id===m.itemId)??gear[0],spec=item?R.GEAR_BY_ID[item.templateId]:undefined;
 const ownerOf=(id:string)=>Object.entries(s.equipment).find(([,gear])=>Object.values(gear).includes(id))?.[0],owner=item?ownerOf(item.id):undefined,equipped=owner===cardId;
 const quote=item?R.enhancementPreview(item,s,owner??cardId):null,comparison=item?R.comparisonV4(s,cardId,item.id):null,stats=item?gearComparison(locked?{...s,run:null}:s,cardId,item.id):null;
 const current=R.depthStats(s,cardId),crewDelta=Math.round((comparison?.teamAfter??0)-(comparison?.teamBefore??0));
 const maxed=!!item&&item.enhancement>=(s.economyV3?10:12),affordable=quote&&s.account.currencies.fish>=quote.cost.fish&&s.account.currencies.threads>=quote.cost.threads;
 const set=R.SETS.find(t=>t.id===spec?.setId),setText=set?R.setTextV4(set,true,s.formationC2):null;
 return <section className="b2-bag" aria-label="Gear workbench">
  <header className="b2-tools"><b className="b2-number"><GameIcon name="bag"/>{s.gear.length}/{R.GEAR_CAP_V4}</b><select aria-label="Equip for" value={cardId} onChange={e=>{m.cardId=e.target.value;m.notify(false);}}>{s.account.cards.map(c=><option key={c.id} value={c.cardId}>{R.CAT_BY_ID[c.cardId]!.name}</option>)}</select><DropOddsC2 state={s}/><HelpC2 label="Gear workshop" title="Fusion" symbol={<GameIcon name="forge"/>}><BoundFusion m={m}/></HelpC2></header>
  <div className="b2-bag-desk"><section className="b2-bag-shelf" aria-label="Gear shelf"><nav>{(['all',...EQUIPMENT_SLOTS] as const).map(id=><button key={id} aria-label={slots[id]} aria-pressed={slot===id} onClick={()=>setSlot(id)}><GameIcon name={id==='all'?'bag':id} size={30}/></button>)}</nav>
   <div className="b2-bag-grid">{gear.map(g=>{const t=R.GEAR_BY_ID[g.templateId]!;return <PaintedTile key={g.id} rarity={t.rarity} tag={ownerOf(g.id)?'equipped':undefined} label={`${t.name} +${g.enhancement}${ownerOf(g.id)?' · Worn by '+R.CAT_BY_ID[ownerOf(g.id)!]!.name:''}`} selected={g.id===item?.id} onClick={()=>{m.itemId=g.id;m.notify(false);comment('select');}}><GearArtA6 slot={t.slot} setId={t.setId}/><b className="b2-tile-count">+{g.enhancement}</b></PaintedTile>;})}</div>
   {!gear.length&&<div className="b2-empty"><GuideMascot pose="comfort"/><button onClick={()=>setSlot('all')}><GameIcon name="bag"/>All gear</button></div>}
  </section>
  {item&&spec&&quote&&comparison&&stats?<aside className="b2-gear-detail" aria-label="Selected gear" data-selected-gear={item.id}>
   <header><div className="b2-gear-hero" data-rarity={spec.rarity}><GearArtA6 slot={spec.slot} setId={spec.setId}/><b>+{item.enhancement}</b></div><div><h2>{shortName(spec.name)}</h2><p>{owner&&owner!==cardId?<>{R.CAT_BY_ID[owner]!.name}<GameIcon name="arrow" size={20}/></>:null}{cat.name}</p></div><img {...artPropsA6(cardId)} alt=""/></header>
   <div className="b2-gear-power" aria-label="Power comparison"><GameIcon name="power"/>{Math.round(comparison.before.total).toLocaleString('en-US')}<GameIcon name="arrow" size={22}/><strong>{Math.round(comparison.after.total).toLocaleString('en-US')}</strong></div>
   <dl className="b2-gear-stats">{(['hp','attack','defense'] as const).map(key=><div key={key}><dt aria-label={statName(key)}><GameIcon name={key==='hp'?'heart':key==='attack'?'fight':'shield'}/></dt><dd>{current[key]}<span data-change={Math.sign((stats.stats?.[key]??current[key])-current[key])}>{(stats.stats?.[key]??current[key])-current[key]>=0?'+':''}{(stats.stats?.[key]??current[key])-current[key]}</span></dd></div>)}</dl>
   <div className="b2-gear-extra"><HelpC2 label="Set & affixes" title="Item detail"><div className="b2-item-detail"><div className="b2-item-banner"><GearArtA6 slot={spec.slot} setId={spec.setId}/><h3>{shortName(spec.name)}</h3></div><nav className="b2-mode-tabs"><button aria-pressed={detailTab==='set'} onClick={()=>setDetailTab('set')}><GameIcon name="bonds"/>Set</button><button aria-pressed={detailTab==='affixes'} onClick={()=>setDetailTab('affixes')}><GameIcon name="shard"/>Affixes</button></nav>{detailTab==='set'?<div className="b2-set-bonuses">{setText&&<><p><b>2</b>{setText.two}</p><p><b>4</b>{setText.four}</p></>}</div>:<dl className="b2-affixes">{item.affixes.map(id=><div key={id}><dt>{R.AFFIX_BY_ID[id]!.name}</dt><dd>{statValue(R.AFFIX_BY_ID[id]!.stat,R.gearAffixRoll(item,id,s))}</dd></div>)}</dl>}</div></HelpC2><span aria-label="Crew Power change"><GameIcon name="team" size={26}/><b data-change={Math.sign(crewDelta)}>{crewDelta>=0?'+':''}{crewDelta}</b></span><span aria-label={`${comparison.lost.length+comparison.transferLost.length} bonuses lost, ${comparison.gained.length} gained`}><GameIcon name="bonds" size={26}/><b data-change={-1}>−{comparison.lost.length+comparison.transferLost.length}</b><b data-change={1}>+{comparison.gained.length}</b></span></div>
   <footer className="b2-dialog-actions"><button className="cr-primary" disabled={locked||equipped||!!stats.error} onClick={()=>{const result=R.equipGear(m.state,cardId,item.id);if(result.ok)result.state.tutorial=Math.max(4,result.state.tutorial);m.apply(result,'Equipped.');}}><GameIcon name="check"/>{equipped?'Equipped':'Equip'}</button><button aria-label={`Enhance +${item.enhancement+1}`} onClick={()=>setForge(true)}><GameIcon name="forge"/>Enhance</button></footer>
  </aside>:<aside className="b2-empty"><GuideMascot pose="point"/></aside>}
  </div>
  {forge&&item&&spec&&quote&&<MenuDialogB2 title="Enhance" onClose={()=>setForge(false)} className="b2-forge-dialog"><div className="b2-forge-scene">{feedback&&<div key={feedback.id} className="b2-forge-impact" data-result={feedback.result} aria-hidden="true"><GameIcon name="forge" className="b2-forge-hammer" size={84}/></div>}<GuideMascot pose="shop"/><div className="b2-forge-item"><GearArtA6 slot={spec.slot} setId={spec.setId}/><h3>{shortName(spec.name)}</h3><p className="b2-number">+{item.enhancement}<GameIcon name="arrow"/>+{Math.min(s.economyV3?10:12,item.enhancement+1)}</p></div></div><div className="b2-enhance-quote" aria-label="Enhancement quote"><p><GameIcon name={spec.main==='attack'?'fight':spec.main==='defense'?'shield':'heart'}/>{quote.before}<GameIcon name="arrow" size={22}/><strong>{quote.after}</strong></p><p aria-label="Enhancement odds">{'chanceBp' in quote?Number(quote.chanceBp)/100:100}%<span>Blessing +{'blessingBp' in quote?Number(quote.blessingBp)/100:0}%</span></p><CostView cost={quote.cost}/></div><footer className="b2-dialog-actions"><button className="cr-primary" disabled={locked||maxed||!affordable} aria-label={maxed?'Maximum enhancement':!affordable?'Need materials':`Confirm enhance +${item.enhancement+1}`} onClick={enhance}><GameIcon name="forge"/>{maxed?'Max':locked?'Patrol active':!affordable?'Need materials':'Enhance'}</button></footer></MenuDialogB2>}
 </section>;
}
