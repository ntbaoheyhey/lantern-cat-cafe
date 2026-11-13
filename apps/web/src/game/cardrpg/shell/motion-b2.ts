import {useEffect,useRef,type RefObject} from 'react';
import {playCue} from '../contracts/audio-cues';

export const PANEL_MS=180;
export const reducedMotionB2=()=>!!globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches||!!document.querySelector('.uv-app.dp-reduced-motion');

/** Keep the modal and focus trap alive through its exit; unmount cancels pending work. */
export function useMenuClose<T extends HTMLElement>(surface:RefObject<T|null>,finish:()=>void){
 const pending=useRef<Animation|null>(null),latest=useRef(finish);latest.current=finish;
 useEffect(()=>()=>{pending.current?.cancel();pending.current=null;},[]);
 return ()=>{
  if(pending.current)return;
  playCue('ui.close');
  const el=surface.current;
  if(!el?.animate||reducedMotionB2()){latest.current();return;}
  const animation=el.animate([{opacity:1,transform:'scale(1)'},{opacity:0,transform:'scale(.97)'}],{duration:PANEL_MS,easing:'cubic-bezier(.4,0,1,1)',fill:'forwards'});
  pending.current=animation;
  void animation.finished.then(()=>{if(pending.current!==animation)return;pending.current=null;latest.current();},()=>{if(pending.current===animation)pending.current=null;});
 };
}

export function openPanelB2(surface:HTMLElement|null){
 playCue('ui.open');
 if(!surface?.animate||reducedMotionB2())return;
 return surface.animate([{opacity:0,transform:'scale(.97)'},{opacity:1,transform:'scale(1)'}],{duration:PANEL_MS,easing:'cubic-bezier(.16,1,.3,1)'});
}

// All simultaneous count-ups share the twenty-tick/second budget.
let lastCountTick=-Infinity;
export function countTickB2(progress:number,now:number){
 if(now-lastCountTick<50)return;
 lastCountTick=now;playCue('count.tick',{pitch:.9+Math.max(0,Math.min(1,progress))*.5,volume:.45});
}
