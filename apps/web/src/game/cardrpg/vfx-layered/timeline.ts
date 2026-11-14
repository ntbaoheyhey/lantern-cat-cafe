export interface PaintKey { t:number; x:number; y:number; sx:number; sy:number; rotate:number; alpha:number }
export interface PaintLayer { name:string; region:[number,number,number,number]; anchor:'caster'|'target'|'flight'; socket:'feet'|'vfxOrigin'|'mainHand'; blend:'normal'|'screen'|'add'; start:number; end:number; size:number; ease:'linear'|'out'|'inOut'; keys:PaintKey[]; flash?:boolean; flipbook?:{fps:number;regions:[number,number,number,number][]} }
export interface PaintTimeline { version:1; id:string; name:string; owner:string; duration:number; impact:number; friendly:boolean; phases:{name:string;start:number;end:number}[]; layers:PaintLayer[]; sequence?:import('../battle-v3/sequence').SkillSequence }

const ease=(t:number,kind:PaintLayer['ease'])=>kind==='out'?1-(1-t)**3:kind==='inOut'?t*t*(3-2*t):t;
/** Absolute sampling makes replay, speed changes, pausing and backwards scrubbing deterministic. */
export function samplePaint(layer:PaintLayer,time:number):PaintKey|null {
 if(time<layer.start||time>=layer.end||!layer.keys.length)return null;
 const first=layer.keys[0]!,last=layer.keys.at(-1)!;
 if(time<=first.t)return first;if(time>=last.t)return last;
 const right=layer.keys.findIndex(key=>key.t>time),a=layer.keys[right-1]!,b=layer.keys[right]!;
 const t=ease((time-a.t)/Math.max(1,b.t-a.t),layer.ease);
 return {t:time,x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,sx:a.sx+(b.sx-a.sx)*t,sy:a.sy+(b.sy-a.sy)*t,rotate:a.rotate+(b.rotate-a.rotate)*t,alpha:a.alpha+(b.alpha-a.alpha)*t};
}
/** Preserve rules contact exactly, independently of authored clip length. Calm mode shortens the tail. */
export function paintTime(timeline:PaintTimeline,elapsed:number,planDuration:number,planImpact:number,reduced=false,castStart=0):number {
 // Fixed ultimates reserve the first 600 ms for the in-field focus. Retiming
 // the cast interval (rather than just hiding it) preserves its wind-up.
 if(elapsed<castStart)return -1;
 elapsed-=castStart;planDuration-=castStart;planImpact-=castStart;
 const before=elapsed<=planImpact;
 // A longer rules recovery must not stretch a 1.2s painting beyond its budget.
 const tail=Math.min(planDuration-planImpact,timeline.duration-timeline.impact);
 let time=before?elapsed/Math.max(1,planImpact)*timeline.impact:timeline.impact+(elapsed-planImpact)/Math.max(1,tail)*(timeline.duration-timeline.impact);
 if(reduced&&time>timeline.impact)time=timeline.impact+(time-timeline.impact)*2;
 return Math.max(0,time);
}
export function validatePaint(t:PaintTimeline){
 if(t.version!==1||t.duration<=0||t.impact<=0||t.impact>=t.duration||t.layers.length<6||t.layers.length>10)throw Error(`Invalid paint timeline ${t.id}`);
 for(const layer of t.layers){if(layer.start<0||layer.end>t.duration||layer.end<=layer.start||layer.keys.some((k,i)=>!Object.values(k).every(Number.isFinite)||k.t<layer.start||k.t>layer.end||i>0&&k.t<=layer.keys[i-1]!.t||k.alpha<0||k.alpha>1))throw Error(`Invalid paint layer ${t.id}/${layer.name}`);}
 return t;
}
