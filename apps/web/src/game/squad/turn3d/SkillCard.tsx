import type {TurnSkill} from '@taskbar-hero/game-rules/src/squad/turn/types';
import {describeTurnSkill} from '@taskbar-hero/game-rules/src/squad/turn/config';
import {EFFECT_DIRECTION} from './effect-direction';
export type CardRarity='common'|'rare'|'epic'|'legendary';
export const CARD_FRAME:Record<CardRarity,string>={common:'#b9b3a9',rare:'#8cc7f0',epic:'#cf9fed',legendary:'#f1c873'};
export function SkillCard({skill,role,rarity='common',index,selected,disabled,cooldown,reason,onSelect}:{skill:TurnSkill;role:string;rarity?:CardRarity;index:number;selected:boolean;disabled:boolean;cooldown:number;reason?:string;onSelect:()=>void}){
 const direction=EFFECT_DIRECTION[skill.id],portrait=window.__TURN3D_PORTRAITS__?.[role]??`${import.meta.env.BASE_URL}art/turn3d/portraits/${role}.png`;
 return <button className="t3-skill-card" data-rarity={rarity} aria-pressed={selected} disabled={disabled} title={`${describeTurnSkill(skill)} ${reason??''}`} onClick={onSelect} style={{'--frame':CARD_FRAME[rarity]} as React.CSSProperties}>
  <span className={`t3-skill-art ${direction?.element??'arcane'}`} aria-hidden="true"><img src={portrait} alt=""/><span>{direction?.trace==='lob'?'◉':direction?.trace==='helix'?'⌘':direction?.trace==='pillar'?'⬡':direction?.trace==='fall'?'✦':'╱'}</span></span>
  <span className="t3-card-copy"><b><kbd>{index+1}</kbd> {skill.name}</b><small>{cooldown?`${cooldown} rounds`:skill.chargeCost?`${skill.chargeCost} charge`:'Ready · free'}</small><em>{rarity} · {skill.target.replace(/([A-Z])/g,' $1').toLowerCase()}</em></span>
 </button>;
}
