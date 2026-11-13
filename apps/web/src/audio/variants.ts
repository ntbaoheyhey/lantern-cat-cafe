/** Per cue/role round-robin. Advance only when playback is admitted, not while loading. */
export class VariantPools {
 private cursors=new Map<string,number>();
 private previous=new Map<string,unknown>();
 constructor(private random:()=>number=Math.random){}
 next<T>(key:string,pool:readonly T[],identity:(value:T)=>unknown=value=>value):T {
  if(!pool.length)throw new Error(`Empty audio pool: ${key}`);
  let index=(this.cursors.get(key)??Math.min(pool.length-1,Math.floor(this.random()*pool.length)))%pool.length;
  // A shared skill ID can resolve to different element pools. The identity, not
  // its index in yesterday's pool, determines whether a sample would repeat.
  for(let checked=0;checked<pool.length-1&&this.previous.get(key)===identity(pool[index]!);checked++)index=(index+1)%pool.length;
  this.cursors.set(key,(index+1)%pool.length);
  this.previous.set(key,identity(pool[index]!));
  return pool[index]!;
 }
 reset(){this.cursors.clear();this.previous.clear();}
}
export const SFX_LIMIT=14;
export const VOICE_LIMIT=1;
export const dbGain=(db:number)=>10**(db/20);
export const between=(range:readonly [number,number],random:()=>number)=>range[0]+random()*(range[1]-range[0]);
