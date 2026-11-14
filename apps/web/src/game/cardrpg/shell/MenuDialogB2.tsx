import {useEffect,useId,useRef,type ReactNode} from 'react';
import {createPortal} from 'react-dom';
import {GameIcon} from '../../../ui/GameIcon';
import {useMenuClose} from './motion-b2';
import './motion-b2.css';

/** Native modal focus and Escape handling shared by the owned menu workspaces. */
export function MenuDialogB2({title,onClose,children,className=''}:{title:string;onClose:()=>void;children:ReactNode;className?:string}) {
 const dialog=useRef<HTMLDialogElement>(null),titleId=useId(),close=useMenuClose(dialog,onClose);
 useEffect(()=>{const el=dialog.current!,previous=document.activeElement as HTMLElement|null;el.showModal();el.querySelector<HTMLButtonElement>('button')?.focus();return()=>{el.close();if(previous?.isConnected)previous.focus({preventScroll:true});};},[]);
 return createPortal(<dialog ref={dialog} className={`b2-dialog ${className}`} aria-labelledby={titleId} onCancel={e=>{e.preventDefault();close();}} onKeyDown={e=>{e.stopPropagation();if(e.key==='Escape'){e.preventDefault();close();}}}>
  <header><h2 id={titleId}>{title}</h2><button aria-label="Close dialog" onClick={close}><GameIcon name="close" size={24}/></button></header>
  <div className="b2-dialog-body">{children}</div>
 </dialog>,document.body);
}
