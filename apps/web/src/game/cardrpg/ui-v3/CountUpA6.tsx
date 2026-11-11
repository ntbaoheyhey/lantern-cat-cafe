import {useEffect,useRef,useState} from 'react';

/** Presentation only: the authoritative amount always comes from the model. */
export function CountUpA6({value,from,reducedMotion=false}:{value:number;from?:number;reducedMotion?:boolean}) {
 const previous=useRef(from??value),[shown,setShown]=useState(from??value);
 useEffect(()=>{
  const start=previous.current;previous.current=value;
  if(reducedMotion||globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches){setShown(value);return;}
  let frame=0,at=0;
  const paint=(now:number)=>{at||=now;const t=Math.min(1,(now-at)/480);setShown(Math.round(start+(value-start)*(1-(1-t)**3)));if(t<1)frame=requestAnimationFrame(paint);};
  frame=requestAnimationFrame(paint);return()=>cancelAnimationFrame(frame);
 },[value,reducedMotion]);
 return <span className="a6-count" aria-label={String(value)}>{shown.toLocaleString('en-US')}</span>;
}
export const currencyIconA6=(id:string)=>({fish:'◈',stamps:'✉',threads:'⌁',shards:'✦',points:'✧'}[id]??'◆');
