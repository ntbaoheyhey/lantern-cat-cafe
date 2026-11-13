import type {ButtonHTMLAttributes, CSSProperties, HTMLAttributes, ReactNode} from 'react';
import './painted-kit.css';

export type KitIcon = 'fish'|'thread'|'bell'|'spool'|'yarn'|'star-thread'|'boss-seal'|'deed'|'gear'|'shard'|'potion'|'supply'|'team'|'cats'|'bag'|'forge'|'invite'|'market'|'season'|'wallet'|'economy'|'guide'|'settings'|'chapter'|'quest'|'event'|'mint'|'withdraw'|'seal'|'fuse'|'list'|'buy'|'history'|'sound';
export type KitFamily = 'shop'|'workshop'|'pantry'|'garden'|'parchment';
export type KitRarity = 'common'|'uncommon'|'rare'|'epic'|'legendary'|'mythic';
export type GuidePose = 'welcome'|'point'|'explain'|'celebrate'|'comfort'|'shop';
export const kitUrl = (id:string) => `/art/v3-shell/b2/${id}.webp`;

/** Artwork is decorative; the owning control supplies its accessible name. */
export function PaintedIcon({name,size=48,className=''}:{name:KitIcon;size?:number;className?:string}) {
 return <img className={`b2-icon ${className}`} src={kitUrl(`icon-${name}`)} width={size} height={size} alt="" aria-hidden="true" draggable={false}/>;
}

export function PaintedButton({icon,tone='primary',children,className='',...props}:ButtonHTMLAttributes<HTMLButtonElement>&{icon?:KitIcon;tone?:'primary'|'secondary';children:ReactNode}) {
 return <button type="button" {...props} className={`b2-button ${className}`} data-tone={tone}>{icon&&<PaintedIcon name={icon} size={32}/>}<span>{children}</span></button>;
}

export function PaintedAction({icon,children,active,notified,className='',...props}:ButtonHTMLAttributes<HTMLButtonElement>&{icon:KitIcon;children:ReactNode;active?:boolean;notified?:boolean}) {
 return <button type="button" {...props} className={`b2-action ${className}`} aria-pressed={active}>
  <PaintedIcon name={icon} size={48}/><span>{children}</span>{notified&&<i className="b2-red-dot" aria-label="New reward"/>}
 </button>;
}

export function PaintedPanel({family,children,className='',style,...props}:HTMLAttributes<HTMLElement>&{family?:KitFamily;children:ReactNode}) {
 return <section {...props} className={`b2-panel ${className}`} style={{...style,...(family?{'--b2-scene':`url(${kitUrl(`backdrop-${family}`)})`}:{})} as CSSProperties}>{children}</section>;
}

export function PaintedTabs({label,children,className='',...props}:HTMLAttributes<HTMLElement>&{label:string;children:ReactNode}) {
 return <nav {...props} aria-label={label} className={`b2-tabs ${className}`}>{children}</nav>;
}

export function RibbonTitle({children,size='medium'}:{children:ReactNode;size?:'small'|'medium'|'large'}) {
 return <h2 className="b2-ribbon" data-size={size} style={{'--b2-ribbon':`url(${kitUrl(`ribbon-${size}`)})`} as CSSProperties}>{children}</h2>;
}

export function PaintedTile({icon,rarity='common',count,tag,label,selected,children,className='',...props}:ButtonHTMLAttributes<HTMLButtonElement>&{icon?:KitIcon;rarity?:KitRarity;count?:number;tag?:'new'|'shard'|'sealed'|'need'|'equipped';label:string;selected?:boolean;children?:ReactNode}) {
 return <button type="button" {...props} className={`b2-tile ${className}`} data-rarity={rarity} aria-label={label} aria-pressed={selected} style={{...props.style,'--b2-tile-frame':`url(${kitUrl(`tile-${rarity}`)})`} as CSSProperties}>
  {icon&&<PaintedIcon name={icon} size={64}/>} {children}
  {count!==undefined&&<b className="b2-tile-count t-number">{count}</b>}
  {tag&&<img className="b2-corner-tag" src={kitUrl(`tag-${tag}`)} alt={tag} width={32} height={32}/>}
 </button>;
}

export function GuideMascot({pose='welcome',children}:{pose?:GuidePose;children?:ReactNode}) {
 return <aside className="b2-guide" aria-label={children?'Cafe guide':undefined}><img src={kitUrl(`guide-${pose}`)} width={256} height={320} alt="" aria-hidden="true"/>{children&&<p>{children}</p>}</aside>;
}
