import {useState} from 'react';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import {ECONOMY_V3 as E} from '@taskbar-hero/game-rules/src/cardrpg/economy-v3';
import type {DepthModel} from '../depth/model';
import {GameIcon} from '../../../ui/GameIcon';
import {openChainRoom} from '../chain/ChainRoom';
import {playCue} from '../contracts/audio-cues';
export function BoundFusion({m}:{m:DepthModel}){
 const [selected,setSelected]=useState<string[]>([]),[reveal,setReveal]=useState('');
 const eligible=m.state.gear.filter(g=>['common','rare'].includes(R.GEAR_BY_ID[g.templateId]!.rarity)&&!Object.values(m.state.equipment).some(slots=>Object.values(slots).includes(g.id)));
 return <section className="b-bound-fusion"><p>4 Common <GameIcon name="arrow" size={18}/> Rare · 3 Rare <GameIcon name="arrow" size={18}/> Epic</p><small>Same set · {E.fusion.successBp/100}% success</small><div>{eligible.slice(0,24).map(g=><label key={g.id}><input type="checkbox" aria-label={g.id} checked={selected.includes(g.id)} onChange={e=>setSelected(ids=>e.target.checked?[...ids,g.id]:ids.filter(id=>id!==g.id))}/><GameIcon name={R.GEAR_BY_ID[g.templateId]!.slot}/><small>{R.GEAR_BY_ID[g.templateId]!.setId}</small></label>)}</div><button disabled={!selected.length} onClick={()=>{const r=R.fuseBoundV3(m.state,selected);m.apply(r,'Fusion complete.');if(r.ok){setSelected([]);setReveal(R.GEAR_BY_ID[r.state.gear.at(-1)!.templateId]!.rarity);playCue('ui.forge-success');}}}>Fuse</button><button onClick={()=>openChainRoom('Café')}>Legendary forge</button>{reveal&&<output className="b-fusion-reveal t-title" onAnimationEnd={()=>setReveal('')}>{reveal}</output>}</section>;
}
