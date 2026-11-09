import {useEffect,useRef,useState,type CSSProperties} from 'react';
/** Currency deltas come from committed model state; this component never awards anything. */
export function RewardFly({values}:{values:Record<string,number>}){
 const previous=useRef({...values}),origin=useRef({x:0,y:0});
 const [flecks,setFlecks]=useState<{id:string;amount:number;x:number;y:number;dx:number;dy:number}[]>([]);
 const key=JSON.stringify(values);
 useEffect(()=>{const remember=(e:PointerEvent)=>{origin.current={x:e.clientX,y:e.clientY}};window.addEventListener('pointerdown',remember);return()=>window.removeEventListener('pointerdown',remember)},[]);
 useEffect(()=>{
  const changed=Object.entries(values).flatMap(([id,value])=>{const amount=value-(previous.current[id]??value),target=document.querySelector<HTMLElement>(`[data-currency="${id}"]`);if(amount<=0||!target)return [];
   const r=target.getBoundingClientRect(),x=origin.current.x||innerWidth*.6,y=origin.current.y||innerHeight*.7;
   return [{id,amount,x,y,dx:r.x+r.width/2-x,dy:r.y+r.height/2-y}];});
  previous.current={...values};if(!changed.length)return;setFlecks(changed);const timer=setTimeout(()=>setFlecks([]),1100);return()=>clearTimeout(timer);
 // A primitive signature catches mutations on the existing state object as well as replacements.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[key]);
 return <div className="uv-reward-fly" aria-hidden="true">{flecks.map(f=><span key={`${key}-${f.id}`} style={{left:f.x,top:f.y,'--fly-x':`${f.dx}px`,'--fly-y':`${f.dy}px`} as CSSProperties}>+{f.amount} {f.id}</span>)}</div>
}
