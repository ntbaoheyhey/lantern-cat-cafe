import {STATUS_BODY,STATUS_PATH,type BodyStatus} from './status';

/** A condition changes the small local badge, never the unit's authored paint. */
export const STATUS_CUE_SECONDS=.6;
export const CONDITION_PATH={
 drowsy:'M15 2A8 8 0 1 0 18 15A8 8 0 0 1 15 2Z',
 tangle:'M8 2L2 8L8 14M12 6L18 12L12 18M11 2L8 8L12 12L9 18',
} as const;
export function conditionGlyph(id:string):{kind:BodyStatus;path:string}{
 const kind=STATUS_BODY[id]??'debuff';
 return{kind,path:id==='drowsy'?CONDITION_PATH.drowsy:id==='tangle'||id==='brittle'?CONDITION_PATH.tangle:STATUS_PATH[kind]};
}
export interface StatusCue {status:string;age:number;alpha:number;progress:number}
type Condition=string|{id:string;stacks:number};
type Entry={stacks:number;at:number;last:number};
/** Refreshes at contact or on a real stack gain, without extending an active pulse. */
export class StatusCues{
 private units=new Map<string,Map<string,Entry>>();
 private output:StatusCue[]=[];
 sample(id:string,statuses:readonly Condition[],time:number,applied:readonly string[]=[]):readonly StatusCue[]{
  let states=this.units.get(id);if(!states){states=new Map();this.units.set(id,states);}
  const current=new Map(statuses.map(s=>typeof s==='string'?[s,1] as const:[s.id,s.stacks] as const));
  for(const status of states.keys())if(!current.has(status))states.delete(status);
  this.output.length=0;
  for(const [status,stacks]of current){
   if((STATUS_BODY[status]??'debuff')==='shield'||stacks<=0)continue;
   let e=states.get(status);
   if(!e||time<e.last){e={stacks,at:time,last:time};states.set(status,e);}
   else if((stacks>e.stacks||applied.includes(status))&&time-e.at>=STATUS_CUE_SECONDS)e.at=time;
   e.stacks=stacks;e.last=time;const age=time-e.at;
   if(age>=0&&age<STATUS_CUE_SECONDS&&this.output.length<2)this.output.push({status,age,alpha:Math.max(0,Math.min(1,age/.06,(STATUS_CUE_SECONDS-age)/.2))*.9,progress:age/STATUS_CUE_SECONDS});
  }
  return this.output;
 }
 retain(ids:ReadonlySet<string>){for(const id of this.units.keys())if(!ids.has(id))this.units.delete(id);}
 clear(){this.units.clear();this.output.length=0;}
}
