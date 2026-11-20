import type {CSSProperties,ReactNode} from 'react';
import './icons.css';
export const ITEM_ICONS=['fish','thread','bell','spool','yarn','boss-seal','star-thread','weapon','outfit','charm','relic','materials','key','potion','shard','deed'] as const;
export type ItemIconName=typeof ITEM_ICONS[number];
// Original U2 paintings. Utility marks retain the existing, licensed SVG set.
const PAINTED:Record<string,string>=Object.fromEntries(['fish','thread','bell','spool','yarn','star-thread','boss-seal','deed','gear','shard','potion','supply','team','cats','bag','forge','invite','market','season','wallet','economy','guide','settings','chapter','quest','event','mint','withdraw','seal','fuse','list','buy','history','sound'].map(id=>[id,id]));
Object.assign(PAINTED,{invitations:'invite',events:'event',materials:'thread'});
export function StarIcons({count}:{count:number}){return <span className="game-stars" aria-label={`${count} stars`}>{Array.from({length:Math.min(5,Math.max(0,count))},(_,i)=><GameIcon key={i} name="season" size={14}/>)}</span>;}
export function GameIcon({name,size=32,className=''}:{name:string;size?:number;className?:string}){const item=(ITEM_ICONS as readonly string[]).includes(name);return <img className={`game-icon ${className}`} src={PAINTED[name]?`/art/v3-shell/b2/icon-${PAINTED[name]}.webp`:`/icons/${name}${item?`-${size>64?128:64}.webp`:'.svg'}`} width={size} height={size} alt="" aria-hidden="true" draggable={false}/>;}
export function ItemTile({name,rarity='common',count,tag,children}:{name:string;rarity?:string;count?:number;tag?:'new'|'shard'|'sealed';children?:ReactNode}){return <span className="item-tile" data-rarity={rarity} style={{'--rarity-frame':`url(/icons/frame-${rarity}.svg)`} as CSSProperties}><GameIcon name={name} size={64}/>{count!==undefined&&<b className="t-number">{count}</b>}{tag&&<small>{tag==='sealed'&&<GameIcon name="wallet" size={14}/>} {tag}</small>}{children}</span>;}
