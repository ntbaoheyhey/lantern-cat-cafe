import {useLayoutEffect,type RefObject} from 'react';

/** Keep the background inert until the panel actually leaves, including its exit animation. */
export function useNativeModal(panel:RefObject<HTMLDialogElement|null>,active:boolean){
 useLayoutEffect(()=>{
  const el=panel.current;
  if(!active||!el)return;
  const previous=document.activeElement instanceof HTMLElement?document.activeElement:null;
  el.showModal();el.focus();
  return()=>{el.close();if(previous?.isConnected)previous.focus({preventScroll:true});};
 },[panel,active]);
}
