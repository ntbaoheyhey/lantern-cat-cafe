import type {CSSProperties,ReactNode} from 'react';
import './icons.css';
export const ITEM_ICONS=['fish','thread','bell','spool','yarn','boss-seal','star-thread','weapon','outfit','charm','relic','materials','key','potion','shard','deed'] as const;
export type ItemIconName=typeof ITEM_ICONS[number];
export function GameIcon({name,size=32,className=''}:{name:string;size?:number;className?:string}){const item=(ITEM_ICONS as readonly string[]).includes(name);return <img className={`game-icon ${className}`} src={`/icons/${name}${item?`-${size>64?128:64}.webp`:'.svg'}`} width={size} height={size} alt="" aria-hidden="true" draggable={false}/>;}
export function ItemTile({name,rarity='common',count,tag,children}:{name:string;rarity?:string;count?:number;tag?:'new'|'shard'|'sealed';children?:ReactNode}){return <span className="item-tile" data-rarity={rarity} style={{'--rarity-frame':`url(/icons/frame-${rarity}.svg)`} as CSSProperties}><GameIcon name={name} size={64}/>{count!==undefined&&<b className="t-number">{count}</b>}{tag&&<small>{tag==='sealed'&&<GameIcon name="wallet" size={14}/>} {tag}</small>}{children}</span>;}
