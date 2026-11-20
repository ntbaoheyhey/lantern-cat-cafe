import {useEffect,useRef,useState,type PointerEvent} from 'react';
/** Native mouse drag plus pointer capture for touch/pen. Tap placement remains unchanged. */
export function useFormationDrag(locked:boolean,place:(id:string,slot:number)=>void){
 const [dragging,setDragging]=useState<string|null>(null),[preview,setPreview]=useState<number|null>(null);
 const [point,setPoint]=useState<{x:number;y:number;width:number;height:number}|null>(null);
 const pointer=useRef<{id:string;x:number;y:number;moved:boolean}|null>(null),suppressClick=useRef(false);
 const slotAt=(x:number,y:number)=>{const e=document.elementsFromPoint(x,y).map(e=>e.closest<HTMLElement>('[data-slot-index]')).find(Boolean);return e?Number(e.dataset.slotIndex):null;};
 const clear=()=>{pointer.current=null;setDragging(null);setPreview(null);setPoint(null);};
 useEffect(()=>{if(locked)clear();},[locked]);
 return {dragging,preview,point,clear,setPreview,start:(id:string)=>{if(!locked)setDragging(id);},
  consumeClick:()=>{const suppressed=suppressClick.current;suppressClick.current=false;return suppressed;},
  down:(e:PointerEvent<HTMLButtonElement>,id:string)=>{if(locked||e.pointerType==='mouse')return;pointer.current={id,x:e.clientX,y:e.clientY,moved:false};suppressClick.current=false;e.currentTarget.setPointerCapture(e.pointerId);},
  move:(e:PointerEvent<HTMLButtonElement>)=>{const p=pointer.current;if(!p||locked)return;if(!p.moved&&Math.hypot(e.clientX-p.x,e.clientY-p.y)<8)return;p.moved=true;setDragging(p.id);setPreview(slotAt(e.clientX,e.clientY));const rect=e.currentTarget.closest('.c2-formation-picture')!.getBoundingClientRect(),seat=e.currentTarget.getBoundingClientRect();setPoint({x:e.clientX-rect.left,y:e.clientY-rect.top,width:seat.width,height:seat.height});},
  up:(e:PointerEvent<HTMLButtonElement>)=>{const p=pointer.current;if(p?.moved&&!locked){const slot=slotAt(e.clientX,e.clientY);if(slot!==null)place(p.id,slot);suppressClick.current=true;}if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);clear();},
 };
}
