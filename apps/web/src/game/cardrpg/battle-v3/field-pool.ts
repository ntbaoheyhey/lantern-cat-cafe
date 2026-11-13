export interface GroundMark {active:boolean;x:number;y:number;r:number;born:number;color:string;family:string;seed:number}

/** Residues are bounded and reused; long fights never grow this collection. */
export class GroundPool {
 readonly items:GroundMark[];
 private cursor=0;
 constructor(readonly capacity=24){this.items=Array.from({length:capacity},()=>({active:false,x:0,y:0,r:0,born:0,color:'',family:'',seed:0}));}
 clear(){for(const item of this.items)item.active=false;this.cursor=0;}
 emit(x:number,y:number,r:number,born:number,color:string,family:string,seed:number){
  const item=this.items[this.cursor]!;this.cursor=(this.cursor+1)%this.capacity;
  Object.assign(item,{active:true,x,y,r,born,color,family,seed});
 }
 expire(time:number){let count=0;for(const item of this.items){if(item.active&&time-item.born>=.85)item.active=false;if(item.active)count++;}return count;}
}

const random=(n:number)=>{const v=Math.sin(n*127.1+317.7)*43758.5453;return v-Math.floor(v);};
/** 72 immutable particle trajectories per element, reused by every target. */
export class ElementParticlePool {
 private cache=new Map<number,Float32Array>();
 get(seed:number){
  let points=this.cache.get(seed);if(points)return points;
  points=new Float32Array(72*5);
  for(let i=0;i<72;i++){const a=i*2.399963+seed,j=i*5;points[j]=a;points[j+1]=Math.cos(a);points[j+2]=Math.sin(a);points[j+3]=.25+random(i+seed)*.85;points[j+4]=random(i+13)*7;}
  this.cache.set(seed,points);return points;
 }
 get allocated(){return this.cache.size*72;}
}
