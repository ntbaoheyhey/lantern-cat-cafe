import { CombatClassBadge } from './CombatClassBadge';
import {GameIcon} from '../../../ui/GameIcon';
import {useEffect,useRef,type ReactNode} from 'react';
import {artPropsA6} from './art-a6';
import {CAT_BY_ID} from '@taskbar-hero/game-rules/src/cardrpg/depth/index';

/** A bounded workspace for existing formation commands, with native modal focus. */
export function FormationToolA6({title,catId,onClose,children}:{title:string;catId:string;onClose:()=>void;children:ReactNode}) {
 const dialog=useRef<HTMLDialogElement>(null);
 useEffect(()=>{
  const element=dialog.current!,previous=document.activeElement as HTMLElement|null;
  element.showModal();element.querySelector('button')?.focus();
  return()=>{element.close();if(previous?.isConnected)previous.focus({preventScroll:true});};
 },[]);
 return <dialog ref={dialog} className="a6-formation-tool" aria-labelledby="a6-formation-tool-title"
  onCancel={event=>{event.preventDefault();onClose();}}
  onKeyDown={event=>{
   if(event.key==='Escape'){event.preventDefault();event.stopPropagation();onClose();}
   if(event.key==='Tab'){
    event.stopPropagation();
    const controls=Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled),select:not(:disabled),input:not(:disabled),[tabindex="0"]')).filter(node=>node.getClientRects().length);
    const first=controls[0],last=controls.at(-1);
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
   }
  }}>
  <header><img {...artPropsA6(catId)} alt=""/><div><small>THE CREW TABLE</small><h2 id="a6-formation-tool-title">{title}</h2></div><button onClick={onClose}>Back to formation <span aria-hidden="true"><GameIcon name="close" size={20}/></span></button></header>
  <div className="a6-formation-tool-body">{children}</div>
 </dialog>;
}

export function FormationTrioA6({ids,rows}:{ids:string[];rows:Record<string,string>}) {
 return <span className="a6-formation-trio">{ids.map(id=><span key={id}><img {...artPropsA6(id)} alt=""/><b>{CAT_BY_ID[id]!.name}</b><CombatClassBadge combatClass={CAT_BY_ID[id]!.combatClass}/><small>{rows[id]==='front'?'Front':'Back'}</small></span>)}</span>;
}
