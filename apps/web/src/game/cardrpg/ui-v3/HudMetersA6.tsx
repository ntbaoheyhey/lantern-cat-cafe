import { useEffect, useState } from 'react';

/** The amber trail keeps recent damage readable; healing catches up immediately. */
export function HealthMeterA6({hp,maxHp,name,reduced=false}:{hp:number;maxHp:number;name:string;reduced?:boolean}) {
 const value=Math.max(0,Math.min(100,100*hp/Math.max(1,maxHp)));
 const [trail,setTrail]=useState(value);
 const immediate=reduced||value>=trail;
 useEffect(()=>{
  if(immediate){setTrail(value);return;}
  const timer=setTimeout(()=>setTrail(value),280);
  return()=>clearTimeout(timer);
 },[value,immediate]);
 return <div className="a6-health" role="progressbar" aria-label={`${name} health`} aria-valuemin={0} aria-valuemax={maxHp} aria-valuenow={hp}>
  <i className="a6-health-trail" style={{width:`${immediate?value:trail}%`}}/><i className="a6-health-fill" style={{width:`${value}%`}}/>
 </div>;
}

export function RageMeterA6({value,label,ready=false}:{value:number;label:string;ready?:boolean}) {
 return <div className="a6-rage" data-ready={ready} role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(Math.max(0,Math.min(100,value)))}><i style={{width:`${Math.max(0,Math.min(100,value))}%`}}/></div>;
}
