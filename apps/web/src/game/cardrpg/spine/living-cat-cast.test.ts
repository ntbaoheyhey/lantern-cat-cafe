import {expect,it} from 'vitest';
import * as T from 'three';
import {animationCues,SpineEventCursor} from './events';
import {applyLivingCatCast,livingCatCastOffset,sampleLivingCatCast,LIVING_CAT_SKILL_EVENTS,LIVING_CAT_SKILL_SECONDS} from './living-cat-cast';
const pose=()=>({lean:0,lift:0,tilt:0,follow:0});
it.each(['mochi','clover'])('keeps %s cast mesh, sockets and endpoints deterministic and feet planted',unit=>{
 const geometry=new T.PlaneGeometry(560,544,24,24).translate(0,256,0);
 const base=new Float32Array(geometry.attributes.position!.array),out=new Float32Array(base.length),p=pose();
 try{
  for(const clip of ['skill','ult'])for(const t of [0,.14,.25,.55,.84,1]){
   sampleLivingCatCast(unit,clip,t,false,p);applyLivingCatCast(base,out,512,p);const expected=new Float32Array(out);
   applyLivingCatCast(base,out,512,sampleLivingCatCast(unit,clip,.37,false,pose()));applyLivingCatCast(base,out,512,p);
   expect(out).toEqual(expected);expect(base).toEqual(geometry.attributes.position!.array);
   for(const x of [-120,0,120])expect(livingCatCastOffset(x,0,512,p,{x:1,y:1})).toEqual({x:0,y:0});
   if(t===0||t===1)expect(out).toEqual(base);
   const i=400*3,offset=livingCatCastOffset(base[i]!,base[i+1]!,512,p,{x:0,y:0});
   expect(out[i]).toBeCloseTo(base[i]!+offset.x,4);expect(out[i+1]).toBeCloseTo(base[i+1]!+offset.y,4);
  }
  applyLivingCatCast(base,out,512,sampleLivingCatCast(unit,'skill',.4,true,p));expect(out).toEqual(base);
  applyLivingCatCast(base,out,512,sampleLivingCatCast(unit,'idle',.4,false,p));expect(out).toEqual(base);
 }finally{geometry.dispose();}
});
it('keeps both 24x24 meshes unfolded through the complete cast and recovery',()=>{
 const geometry=new T.PlaneGeometry(560,544,24,24).translate(0,256,0),base=new Float32Array(geometry.attributes.position!.array),out=new Float32Array(base.length),indices=geometry.index!.array,p=pose();
 const area=(a:Float32Array,i:number)=>{const x=indices[i]!*3,y=indices[i+1]!*3,z=indices[i+2]!*3;return(a[y]!-a[x]!)*(a[z+1]!-a[x+1]!)-(a[y+1]!-a[x+1]!)*(a[z]!-a[x]!);};
 try{let minimum=Infinity;for(const unit of ['mochi','clover'])for(const clip of ['skill','ult'])for(let f=0;f<=100;f++){
  applyLivingCatCast(base,out,512,sampleLivingCatCast(unit,clip,f/100,false,p));for(let i=0;i<indices.length;i+=3)minimum=Math.min(minimum,area(out,i)/area(base,i));
 }expect(minimum).toBeGreaterThan(.85);}finally{geometry.dispose();}
});
it('emits the one-second contract cast and hit once even when frames skip',()=>{
 const cues=animationCues('skill',LIVING_CAT_SKILL_SECONDS,[...LIVING_CAT_SKILL_EVENTS]),cursor=new SpineEventCursor(),got:string[]=[];
 for(const time of [0,.24,.26,.6,1])cursor.advance(cues,time,cue=>got.push(cue.name));
 expect(cues.filter(c=>c.name==='cast'||c.name==='hit').map(c=>[c.name,c.time])).toEqual([['cast',.25],['hit',.55]]);
 expect(got.filter(n=>n==='cast'||n==='hit')).toEqual(['cast','hit']);
});
