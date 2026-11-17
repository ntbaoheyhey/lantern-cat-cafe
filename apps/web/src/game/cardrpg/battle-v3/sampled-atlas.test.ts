import {expect,it,vi} from 'vitest';
import type {SceneView} from '../../squad/turn3d/scene';
import type {PackedPaint} from '../vfx-layered/atlas';
import {FieldVfx} from './field-vfx';
import {paintImpactStrokes} from './impact-strokes';
import {paintImpactWake} from './impact-wake';

vi.mock('./sequence',()=>({sequenceAt:()=>({plate:false}),SIGNATURES:new Map()}));
vi.mock('./presentation',()=>({presentationTier:()=> 'basic'}));
const paint:PackedPaint={image:{} as HTMLImageElement,x:128,y:256,width:1024,height:512,sourceUrl:'test.webp'};
function canvas(){
 const draws:number[][]=[];
 const c=new Proxy({drawImage:(_image:unknown,...args:number[])=>draws.push(args),createRadialGradient:()=>({addColorStop:()=>{}})},
  {get:(target,key)=>Reflect.get(target,key)??(()=>{})}) as unknown as CanvasRenderingContext2D;
 return {c,draws};
}
const renderers={
 field:(c:CanvasRenderingContext2D,p:PackedPaint)=>{
  const field=new FieldVfx(()=>({x:200,y:300}),()=>p);
  const view={actors:[{id:'source',cardRpg:{cardId:'needle-moth'}}],reducedMotion:false,quality:'high',
   frame:{elapsed:500,plan:{skillId:'test:basic',actorId:'source',targetIds:['target'],beats:[{start:0},{start:0},{start:300}],
    events:[{type:'damage',targetIds:['target']}],duration:1000,accent:'#ffaa00',color:'#fff0aa',shape:'slash'}}} as unknown as SceneView;
  field.render(c,view,1280,720,500);
 },
 strokes:(c:CanvasRenderingContext2D,p:PackedPaint)=>paintImpactStrokes(c,p,200,200,300,80,1,1,'basic',12,false,false),
 wake:(c:CanvasRenderingContext2D,p:PackedPaint)=>paintImpactWake(c,p,200,200,300,80,1,1,false)
};
for(const [name,render] of Object.entries(renderers))it(`${name} samples scaled atlas pixels while preserving destination placement`,()=>{
 const full=canvas(),sampled=canvas();render(full.c,paint);render(sampled.c,{...paint,sourceScaleX:.5,sourceScaleY:.25});
 expect(full.draws.length).toBeGreaterThanOrEqual(name==='field'?5:1);
 expect(sampled.draws).toHaveLength(full.draws.length);
 for(let i=0;i<full.draws.length;i++){
  const original=full.draws[i]!,actual=sampled.draws[i]!;
  expect(actual.slice(0,4)).toEqual([original[0]!*.5,original[1]!*.25,original[2]!*.5,original[3]!*.25]);
  expect(actual.slice(4)).toEqual(original.slice(4));
 }
});
