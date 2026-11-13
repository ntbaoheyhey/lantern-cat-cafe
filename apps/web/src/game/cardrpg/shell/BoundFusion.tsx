import {useState,useSyncExternalStore} from 'react';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import {ECONOMY_V3 as E} from '@taskbar-hero/game-rules/src/cardrpg/economy-v3';
import type {DepthModel} from '../depth/model';
import {GameIcon} from '../../../ui/GameIcon';
import {openChainRoom} from '../chain/ChainRoom';
import {playCue} from '../contracts/audio-cues';
import {GearArtA6} from '../ui-v3/KeepsakeArtA6';
import {PaintedTile} from './PaintedKit';
export function BoundFusion({m,onCraft}:{m:DepthModel;onCraft?:()=>void}){
 useSyncExternalStore(m.subscribe,m.snapshot);
 const [chosen,setChosen]=useState<string[]>([]),[reveal,setReveal]=useState('');
 const eligible=m.state.gear.filter(g=>['common','rare'].includes(R.GEAR_BY_ID[g.templateId]!.rarity)&&!Object.values(m.state.equipment).some(slots=>Object.values(slots).includes(g.id)));
 const selected=chosen.filter(id=>eligible.some(g=>g.id===id)),first=eligible.find(g=>g.id===selected[0]),spec=first?R.GEAR_BY_ID[first.templateId]:null,target=spec?.rarity==='rare'?'epic':'rare',required=E.fusion[target].count;
 const preview=R.fuseBoundV3(m.state,selected),locked=!!m.state.run&&!m.state.run.complete;
 return <section className="b-bound-fusion b2-fusion"><div className="b2-fusion-recipe"><span><GameIcon name="gear" size={58}/>{required}</span><GameIcon name="arrow"/><span data-rarity={target}><GameIcon name="fuse" size={70}/>{target==='epic'?'Epic':'Rare'}</span><b>{E.fusion.successBp/100}%</b></div>
  <p>Same set · Unworn gear</p><div className="b2-fusion-grid">{eligible.map(g=>{const t=R.GEAR_BY_ID[g.templateId]!;return <PaintedTile key={g.id} rarity={t.rarity} label={`${t.name}, +${g.enhancement}`} selected={selected.includes(g.id)} disabled={locked||!!spec&&!selected.includes(g.id)&&(t.setId!==spec.setId||t.rarity!==spec.rarity||selected.length>=required)} onClick={()=>{playCue('ui.slot');setChosen(ids=>ids.includes(g.id)?ids.filter(id=>id!==g.id):[...ids,g.id]);}}><GearArtA6 slot={t.slot} setId={t.setId}/><b className="b2-tile-count">+{g.enhancement}</b></PaintedTile>;})}</div>
  <footer className="b2-dialog-actions"><button className="cr-primary" disabled={!preview.ok} onClick={()=>{const r=R.fuseBoundV3(m.state,selected);m.apply(r,'Fusion complete.');if(r.ok){setChosen([]);setReveal(R.GEAR_BY_ID[r.state.gear.at(-1)!.templateId]!.rarity);playCue('fusion.consume');playCue('fusion.reveal');playCue(`item.land.${R.GEAR_BY_ID[r.state.gear.at(-1)!.templateId]!.rarity}`);onCraft?.();}}}><GameIcon name="fuse"/>Fuse {selected.length}/{required}</button><button onClick={()=>openChainRoom('Café')}><GameIcon name="wallet"/>Legendary</button></footer>{reveal&&<output className="b-fusion-reveal t-title" onAnimationEnd={()=>setReveal('')}>{reveal}</output>}
 </section>;
}
