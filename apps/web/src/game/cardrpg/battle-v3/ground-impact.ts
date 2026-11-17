import type {EffectFrame,EffectPlan} from '../../squad/turn3d/effects';
import {isSupportCast} from './presentation';

export const GROUND_DUST_MS=360,GROUND_BURST_CAP=12,GROUND_PUFFS=6;
export type GroundPoint={x:number;y:number;scale:number;halfWidth?:number};
export type GroundBurst=GroundPoint&{id:string;age:number;spread:number};
export type DustPuff={x:number;y:number;rx:number;ry:number;alpha:number};

/** One short, grounded burst per damaged recipient, on the rules contact clock. */
export class GroundImpacts {
 readonly bursts:GroundBurst[]=[];
 private plan:EffectPlan|null=null;private last=-1;private emitted=false;
 sample(frame:EffectFrame|null|undefined,reduced:boolean,points:ReadonlyMap<string,GroundPoint>){
  if(!frame){this.clear();return this.bursts;}
  if(frame.plan!==this.plan||frame.elapsed<this.last){this.clear();this.plan=frame.plan;}
  this.last=frame.elapsed;
  const age=frame.elapsed-frame.plan.beats[2]!.start;
  if(reduced||isSupportCast(frame.plan)){this.bursts.length=0;this.emitted=true;return this.bursts;}
  if(age<0)return this.bursts;
  if(age>=GROUND_DUST_MS){this.bursts.length=0;this.emitted=true;return this.bursts;}
  if(!this.emitted){
   this.emitted=true;
   for(const event of frame.plan.events){
    if(event.type!=='damage'||event.amount<=0)continue;
    for(const id of event.targetIds){
     if(this.bursts.length>=GROUND_BURST_CAP||this.bursts.some(b=>b.id===id))continue;
     const point=points.get(id);if(!point)continue;
     const scale=Math.max(.55,Math.min(1.5,point.scale));
     this.bursts.push({id,x:point.x,y:point.y,scale,spread:Math.max(0,Math.min(100,point.halfWidth??0))/scale,age});
    }
   }
  }
  for(const burst of this.bursts)burst.age=age;
  return this.bursts;
 }
 clear(){this.bursts.length=0;this.plan=null;this.last=-1;this.emitted=false;}
}

/** Reuses one output object; three puffs per side curl outward and settle low. */
export function sampleDustPuff(age:number,index:number,out:DustPuff):DustPuff {
 const p=Math.max(0,Math.min(1,age/GROUND_DUST_MS)),side=index%2?-1:1,lobe=Math.floor(index/2);
 const spread=1-Math.pow(1-p,3),curl=Math.sin(p*Math.PI);
 out.x=side*(5+lobe*4+spread*(12+lobe*4));out.y=-curl*(4+lobe*3);
 out.rx=(3+lobe*.5+spread*4)*(1-p*.45);out.ry=out.rx*.55;
 out.alpha=age<0||age>=GROUND_DUST_MS?0:.58*Math.pow(1-p,1.4);
 return out;
}
