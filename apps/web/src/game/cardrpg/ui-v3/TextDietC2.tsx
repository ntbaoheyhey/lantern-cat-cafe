import {GameIcon} from '../../../ui/GameIcon';
import {createContext,useContext,useEffect,useRef,useState,type ReactNode} from 'react';
import {createPortal} from 'react-dom';
import '../shell/screen-skin.css';
import {useMenuClose} from '../shell/motion-b2';
import '../shell/motion-b2.css';

export const TextDietContext=createContext(false);
export const useTextDiet=()=>useContext(TextDietContext);

/** Keep explanations one keyboard-accessible action away from the visual surface. */
export function HelpC2({children,label='Help',symbol='?',title}:{children:ReactNode;label?:string;symbol?:ReactNode;title?:string}) {
 const compact=useTextDiet(),[open,setOpen]=useState(false),dialog=useRef<HTMLDialogElement>(null),trigger=useRef<HTMLButtonElement>(null);
 useEffect(()=>{if(open){dialog.current?.showModal();dialog.current?.querySelector<HTMLButtonElement>('button')?.focus();}},[open]);
 const close=useMenuClose(dialog,()=>{dialog.current?.close();setOpen(false);trigger.current?.focus();});
 if(!compact)return <>{children}</>;
 return <><button ref={trigger} type="button" className="c2-help-trigger" aria-label={label} aria-haspopup="dialog" onClick={()=>setOpen(true)}>{symbol==='?'?<GameIcon name="guide" size={24}/>:symbol}</button>{open&&createPortal(<dialog ref={dialog} className="c2-help b2-help" data-c2-help aria-label={label} onCancel={e=>{e.preventDefault();close();}} onKeyDown={e=>{
  e.stopPropagation();
  if(e.key==='Escape'){e.preventDefault();close();}
  if(e.key==='Tab'){
   const nodes=Array.from(e.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),summary,[tabindex="0"]')).filter(n=>n.checkVisibility());
   const first=nodes[0],last=nodes.at(-1);
   if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}
   else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}
  }
 }}><header><h2>{title??label}</h2><button onClick={close} aria-label="Close help"><GameIcon name="close" size={20}/></button></header><div className="c2-help-body">{children}</div></dialog>,document.body)}</>;
}

export function CopyC2({short,children}:{short:ReactNode;children:ReactNode}){return <>{useTextDiet()?short:children}</>;}
