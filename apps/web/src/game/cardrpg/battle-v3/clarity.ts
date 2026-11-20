import type {BodyStatus} from './status';
/** A shield application is a short cue. Stored shield HP never prolongs the bubble. */
export class ShieldPulses {
 private units=new Map<string,{value:number;status:boolean;at:number}>();
 sample(id:string,value:number,status:boolean,time:number,applied=false){
  let entry=this.units.get(id);
  if(!entry){entry={value:0,status:false,at:-Infinity};this.units.set(id,entry);}
  if((applied||value>entry.value||status&&!entry.status)&&time-entry.at>=.6)entry.at=time;
  entry.value=value;entry.status=status;
  const age=time-entry.at,visible=(value>0||status)&&age>=0&&age<.6;
  return {visible,age,alpha:visible?Math.min(1,age/.08,(.6-age)/.18):0};
 }
 retain(ids:Set<string>){for(const id of this.units.keys())if(!ids.has(id))this.units.delete(id);}
 clear(){this.units.clear();}
}
/** Persistent conditions use local glyphs; keep authored body paint intact. */
export function bodyTint(_kinds:readonly BodyStatus[],_time:number,_rear:boolean,_reduced=false):[number,number,number]{
 return [1,1,1];
}
