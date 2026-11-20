import {useState} from 'react';
import type {EconomyCommand,EconomyState} from '@taskbar-hero/chain/src/economy-v3';
import {economySinkQuote,latestDecor,displaySlots,type EconomySinkId} from '@taskbar-hero/game-rules/src/cardrpg/economy-sinks-v3';
import {qualityBucket} from '@taskbar-hero/game-rules/src/cardrpg/economy-v3';
import {GEAR_BY_ID} from '@taskbar-hero/game-rules/src/cardrpg/depth/equipment';
import {GameIcon} from '../../../ui/GameIcon';
import {PaintedTabs,PaintedAction,PaintedIcon,PaintedTile,PaintedButton,GuideMascot,type KitIcon} from '../shell/PaintedKit';
import {MenuDialogB2} from '../shell/MenuDialogB2';

const tabs:[EconomySinkId,string,KitIcon][]=[['polish','Polish','forge'],['decor','Decor','season'],['display','Showcase','deed']];
export function CafeShowcase({state}:{state:EconomyState}) {
 return <div className="b2-cafe-showcase" aria-label={`${displaySlots(state.styles)} showcase slots`}>
  {Array.from({length:displaySlots(state.styles)},(_,i)=>{const g=state.gear[i],t=g&&GEAR_BY_ID[g.template];return <span key={i} title={t?`${t.name} · ${qualityBucket(g!.quality).name}`:'Display slot'}>{t?<GameIcon name={t.slot} size={42}/>:<PaintedIcon name="gear" size={32}/>}</span>;})}
 </div>;
}
export function EconomySinksB2({state,busy,onClose,onReserve}:{state:EconomyState;busy:boolean;onClose:()=>void;onReserve:(command:EconomyCommand)=>void}) {
 const [sink,setSink]=useState<EconomySinkId>('polish'),[instance,setInstance]=useState(state.gear.find(g=>qualityBucket(g.quality).name!=='Perfect')?.id??'');
 let quote,reason='';try{quote=economySinkQuote(sink,state,instance);}catch(error){reason=error instanceof Error?error.message:'Unavailable';}
 return <MenuDialogB2 title="Café studio" onClose={onClose} className="b2-studio">
  <PaintedTabs label="Guaranteed recipes">{tabs.map(([id,label,icon])=><PaintedAction key={id} icon={icon} active={sink===id} onClick={()=>setSink(id)}>{label}</PaintedAction>)}</PaintedTabs>
  <div className="b2-studio-preview" data-sink-id={sink} data-cafe-decor={sink==='decor'?latestDecor([`decor:${Math.max(1,Number(quote?.style?.split(':')[1])||1)}`]):undefined}>
   {sink==='polish'?<div className="b2-studio-gear">{state.gear.filter(g=>qualityBucket(g.quality).name!=='Perfect').map(g=><PaintedTile key={g.id} label={`Polish ${GEAR_BY_ID[g.template]?.name??'gear'}`} selected={instance===g.id} rarity="epic" onClick={()=>setInstance(g.id)}><GameIcon name={GEAR_BY_ID[g.template]?.slot??'gear'} size={60}/><span>{qualityBucket(g.quality).name}</span></PaintedTile>)}</div>:sink==='decor'?<GuideMascot pose="welcome"/>:<CafeShowcase state={{...state,styles:quote?.style?[...state.styles,quote.style]:state.styles}}/>}
  </div>
  {quote?<><p className="b2-studio-benefit">{quote.benefit}</p><div className="b2-chain-cost" aria-label="Recipe cost and odds"><span><PaintedIcon name="star-thread" size={32}/>{quote.starThread}</span><span><PaintedIcon name="yarn" size={32}/>{quote.yarn}</span><span>Success {quote.successBp/100}%</span></div><div className="b2-dialog-actions"><PaintedButton icon="forge" disabled={busy||state.stars<quote.starThread} onClick={()=>onReserve({action:'sink',sink,...(sink==='polish'?{instance}:{})})}>{state.stars<quote.starThread?'Need Thread':'Review burn'}</PaintedButton></div></>:<p>{reason}</p>}
 </MenuDialogB2>;
}
