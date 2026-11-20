import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import {RARITY_ORDER} from '@taskbar-hero/game-rules/cardrpg';
import {GameIcon} from '../../../ui/GameIcon';
import {rarityStyle} from '../shared';
import {GearArtA6} from './KeepsakeArtA6';
import type {GearDropView} from './selectors';
import './gear-drop-a6.css';

const RARITY_LABEL:Record<string,string>={common:'Common',rare:'Rare',epic:'Epic',legendary:'Legendary'};
const pct=(bp:number)=>`${Number((bp/100).toFixed(2))}%`;

/** A dropped piece on the victory receipt: what it is, how rare, and what it would add. */
export function GearDropA6({gear}:{gear:GearDropView}) {
 const wearer=gear.wearer?R.CAT_BY_ID[gear.wearer]?.name:null;
 return <article className="a6-gear-drop" data-rarity={gear.rarity} style={rarityStyle(gear.rarity)} aria-label={`New gear: ${gear.name}, ${RARITY_LABEL[gear.rarity]} ${gear.slot}${gear.powerGain>0?`, plus ${gear.powerGain} Power on ${wearer}`:''}`}>
  <div className="a6-gear-drop-art"><GearArtA6 slot={gear.slot} setId={gear.setId}/></div>
  <div className="a6-gear-drop-text">
   <small><span className="a6-gear-drop-rarity">{RARITY_LABEL[gear.rarity]}</span> · {gear.slot}</small>
   <strong>{gear.name}</strong>
   <span>{gear.powerGain>0&&wearer?<><GameIcon name="power" size={16}/> +{gear.powerGain.toLocaleString('en-US')} Power on {wearer}</>:'Added to your Bag'}</span>
  </div>
 </article>;
}

/** The published rarity split for the roll this encounter just made (same table as the Bag's odds). */
export function DropChanceA6({state,kind}:{state:R.DepthAccount;kind:'battle'|'elite'|'boss'}) {
 const q=R.gearDropPreview(state,kind,state.run?.chapter??1);
 if(!q.remaining)return <p className="a6-drop-chance">No gear rolls left today ({q.cap}/{q.cap} used). Fish, threads and bells still drop.</p>;
 const label={battle:'Street battle',elite:'Elite',boss:'Guardian'}[kind];
 return <p className="a6-drop-chance" aria-label={`${label} gear odds`}><b>{label} drop · {pct(q.chanceBp)}</b>{RARITY_ORDER.filter(r=>q.base[r]>0).map(r=><span key={r} data-rarity={r} style={rarityStyle(r)}>{RARITY_LABEL[r]} {pct(q.base[r])}</span>)}<small>Gear roll {q.cap-q.remaining+1} of {q.cap} today</small></p>;
}
