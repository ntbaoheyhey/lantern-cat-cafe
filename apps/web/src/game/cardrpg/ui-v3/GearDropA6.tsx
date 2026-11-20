import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import {GameIcon} from '../../../ui/GameIcon';
import {rarityStyle} from '../shared';
import {GearArtA6} from './KeepsakeArtA6';
import type {GearDropView} from './selectors';
import {DropOddsC2} from './OddsC2';
import {artPropsA6} from './art-a6';
import './gear-drop-a6.css';

const RARITY_LABEL:Record<string,string>={common:'Common',rare:'Rare',epic:'Epic',legendary:'Legendary'};

/** A dropped piece on the victory receipt: name (which carries its rarity), rarity-coloured frame, and the
 * Team Power it would add on the cat pictured. Detail lives in the accessible label to keep the C2 word budget. */
export function GearDropA6({gear}:{gear:GearDropView}) {
 const wearer=gear.wearer?R.CAT_BY_ID[gear.wearer]?.name:null;
 return <article className="a6-gear-drop" data-rarity={gear.rarity} style={rarityStyle(gear.rarity)} title={`${RARITY_LABEL[gear.rarity]} ${gear.slot}`} aria-label={`New gear: ${gear.name}, ${RARITY_LABEL[gear.rarity]} ${gear.slot}${gear.powerGain>0&&wearer?`, plus ${gear.powerGain} Power on ${wearer}`:''}`}>
  <div className="a6-gear-drop-art"><GearArtA6 slot={gear.slot} setId={gear.setId}/></div>
  <div className="a6-gear-drop-text" aria-hidden="true">
   <strong>{gear.name}</strong>
   {gear.powerGain>0&&gear.wearer&&<span><GameIcon name="power" size={16}/> +{gear.powerGain.toLocaleString('en-US')}<img className="a6-gear-drop-cat" {...artPropsA6(gear.wearer,'face')} alt=""/></span>}
  </div>
 </article>;
}

/** The published odds for the roll this encounter just made, behind the same odds button the Bag uses. */
export function DropChanceA6({state,kind}:{state:R.DepthAccount;kind:'battle'|'elite'|'boss'}) {
 return <div className="a6-drop-chance"><DropOddsC2 state={state} kind={kind}/></div>;
}
