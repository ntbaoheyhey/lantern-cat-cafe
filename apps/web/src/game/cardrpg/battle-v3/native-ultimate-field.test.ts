import {expect,it,vi} from 'vitest';
import type {SceneView} from '../../squad/turn3d/scene';
import {FieldVfx} from './field-vfx';

vi.mock('./sequence',()=>({sequenceAt:(plan:{ultimate:boolean})=>({plate:false,seq:{impact:plan.ultimate?1100:350,vfx:[]}}),SIGNATURES:new Map()}));

function fixture(owner:string,ultimate=true){
 const calls:unknown[][]=[];
 const c=new Proxy({drawImage:(...args:unknown[])=>calls.push(args),createRadialGradient:()=>({addColorStop:()=>{}})},
  {get:(target,key)=>Reflect.get(target,key)??(()=>{})}) as unknown as CanvasRenderingContext2D;
 const paint={image:{} as HTMLImageElement,x:0,y:0,width:1024,height:512,sourceUrl:'native.webp'};
 const field=new FieldVfx((id,part)=>({x:id==='caster'?200:700,y:part==='feet'?500:350}),()=>paint);
 const plan={ultimate,skillId:owner+(ultimate?'-4':'-1'),actorId:'caster',targetIds:['target'],
  beats:[{start:0},{start:0},{start:ultimate?1100:350}],events:[{type:'damage',actorId:'caster',targetIds:['target']}],
  duration:ultimate?2200:800,accent:'#ffaa00',color:'#fff0aa',shape:'slash'};
 const initial=JSON.stringify(plan);
 const view={actors:[{id:'caster',cardRpg:{cardId:owner}}],reducedMotion:false,quality:'high',frame:{elapsed:0,plan}} as unknown as SceneView;
 const render=(ms:number)=>{calls.length=0;view.frame!.elapsed=ms;field.render(c,view,1280,720,ms/1000);return [...calls];};
 return {field,plan,initial,render};
}
for(const owner of ['mallow','sorrel','biscuit','cinnamon','brioche'])it(`${owner} keeps contact paint and clears its broad field before recovery`,()=>{
 const f=fixture(owner);
 expect(f.render(1280).length).toBeGreaterThan(0);
 expect(f.field.audit.layers).toContain('painted-core');
 f.render(1760);
 expect(f.field.audit.layers).not.toContain('painted-core');
 expect(f.field.audit.layers).not.toContain('painted-sweep');
 expect(JSON.stringify(f.plan)).toBe(f.initial);
});
it('retains the existing late field of an unrelated ultimate',()=>{
 const f=fixture('mochi');f.render(1280);f.render(1760);
 expect(f.field.audit.layers).toContain('painted-core');
 expect(JSON.stringify(f.plan)).toBe(f.initial);
});
it('retains ordinary contact paint for the same cat',()=>{
 const f=fixture('mallow',false);
 expect(f.render(470).length).toBeGreaterThan(0);
 expect(f.field.audit.layers).toContain('painted-core');
 expect(JSON.stringify(f.plan)).toBe(f.initial);
});
