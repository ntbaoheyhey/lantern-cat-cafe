import {CountUpA6,currencyIconA6} from './CountUpA6';
import {useEffect,useRef,useState,type CSSProperties} from 'react';
import {playCue} from '../contracts/audio-cues';
import {reducedMotionB2} from '../shell/motion-b2';
/** Currency deltas come from committed model state; this component never awards anything. */
export function RewardFly({values,reducedMotion=false}:{values:Record<string,number>;reducedMotion?:boolean}){
 const previous=useRef({...values}),origin=useRef({x:0,y:0});
 const [flecks,setFlecks]=useState<{id:string;amount:number;x:number;y:number;dx:number;dy:number}[]>([]);
 const key=JSON.stringify(values);
 useEffect(()=>{const remember=(e:PointerEvent)=>{origin.current={x:e.clientX,y:e.clientY}};window.addEventListener('pointerdown',remember);return()=>window.removeEventListener('pointerdown',remember)},[]);
 useEffect(()=>{
  const changed=Object.entries(values).flatMap(([id,value])=>{const amount=value-(previous.current[id]??value),target=document.querySelector<HTMLElement>(`[data-currency="${id}"]`);if(amount<=0||!target)return [];
   const r=target.getBoundingClientRect(),x=origin.current.x||innerWidth*.6,y=origin.current.y||innerHeight*.7;
   return [{id,amount,x,y,dx:r.x+r.width/2-x,dy:r.y+r.height/2-y}];});
  previous.current={...values};setFlecks(changed);if(!changed.length)return;
  const reduced=reducedMotion||reducedMotionB2();
  if(!reduced)playCue('ui.reward-fly');
  const land=()=>{for(const f of changed){const currency=({stamps:'bell',threads:'thread'} as Record<string,string>)[f.id]??f.id;playCue(`currency.${currency}.gain`);}};
  const landing=setTimeout(land,reduced?0:900),timer=setTimeout(()=>setFlecks([]),1100);
  return()=>{clearTimeout(landing);clearTimeout(timer);};
 // A primitive signature catches mutations on the existing state object as well as replacements.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[key,reducedMotion]);
 return <div className="uv-reward-fly" data-reduced={reducedMotion} aria-hidden="true">{flecks.map((f,index)=><span key={`${key}-${f.id}`} style={{left:f.x,top:f.y+index*36,'--fly-x':`${f.dx}px`,'--fly-y':`${f.dy-index*36}px`} as CSSProperties}>{currencyIconA6(f.id)} +<CountUpA6 value={f.amount} from={0} reducedMotion={reducedMotion}/></span>)}</div>
}
