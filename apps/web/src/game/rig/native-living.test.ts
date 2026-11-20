import {describe,expect,it} from 'vitest';
import * as T from 'three';
import mallow from '../../../public/units/mallow/rig.json?raw';
import sorrel from '../../../public/units/sorrel/rig.json?raw';
import biscuit from '../../../public/units/biscuit/rig.json?raw';
import inkcap from '../../../public/units/inkcap/rig.json?raw';
import cinnamon from '../../../public/units/cinnamon/rig.json?raw';
import brioche from '../../../public/units/brioche/rig.json?raw';
import velvet from '../../../public/units/velvet/rig.json?raw';
import marigold from '../../../public/units/marigold/rig.json?raw';
import {CutoutMesh,type CutoutData} from './cutout';
import {nativeLivingBlink,nativeLivingProfiles,type NativeLivingCat} from './native-living';
const sources={mallow,sorrel,biscuit,inkcap,cinnamon,brioche,velvet,marigold};
const make=(cat:NativeLivingCat)=>{const data=JSON.parse(sources[cat]) as CutoutData,textures=data.pages.map(()=>new T.Texture());const mesh=new CutoutMesh(data,textures);return{mesh,data,dispose:()=>{mesh.dispose();textures.forEach(t=>t.dispose());}};};
const buffers=(m:CutoutMesh)=>m.children.filter((n):n is T.Mesh=>n instanceof T.Mesh).map(n=>n.geometry.attributes.position!.array);
const snapshot=(m:CutoutMesh)=>buffers(m).map(a=>Array.from(a));
const difference=(a:number[][],b:number[][])=>{const right=b.flat();return Math.max(...a.flat().map((v,i)=>Math.abs(v-right[i]!)));};
function footVertices(m:CutoutMesh){const arrays=buffers(m),out:number[]=[];for(let page=0;page<m.data.pages.length;page++){let offset=0;for(const p of m.data.parts.filter(p=>p.page===page)){if(p.name.startsWith('foot-'))out.push(...Array.from(arrays[page]!.slice(offset*3,(offset+p.vertices.length)*3)));offset+=p.vertices.length;}}return out;}

describe.each(Object.keys(sources) as NativeLivingCat[])('%s living motion',cat=>{
it('keeps original data immutable and enrolls only supported profiles',()=>{
 const f=make(cat),before=JSON.stringify(f.data);try{
  expect(f.mesh.enableLivingCat('unregistered-unit')).toBe(false);expect(f.mesh.livingCat).toBeUndefined();
  expect(f.mesh.enableLivingCat(cat)).toBe(true);
  for(const t of [0,.23,1.3,4.6,8.7]){f.mesh.proceduralTime=t;f.mesh.pose(t,'idle');}
  expect(JSON.stringify(f.data)).toBe(before);
 }finally{f.dispose();}
});
it('has exact feet and continuous idle/cast endpoints at arbitrary seeks in both motion modes',()=>{
 const f=make(cat);try{
  f.mesh.enableLivingCat(cat);const feet=footVertices(f.mesh);
  for(const reduced of [false,true])for(const clock of [0,.95,1.3,4.57,8.8,9.999]){
   f.mesh.livingReducedMotion=reduced;f.mesh.proceduralTime=clock;f.mesh.pose(0,'idle');const idle=snapshot(f.mesh);
   for(const at of [0,1]){f.mesh.pose(at,'skill');expect(snapshot(f.mesh)).toEqual(idle);expect(footVertices(f.mesh)).toEqual(feet);}
   f.mesh.proceduralTime=clock+10;f.mesh.pose(0,'idle');expect(difference(snapshot(f.mesh),idle)).toBeLessThan(.0001);
  }
 }finally{f.dispose();}
});
it('retains positive triangle orientation and all foot vertices through idle and cast extremes',()=>{
 const f=make(cat);try{
  f.mesh.pose(0,'');const base=snapshot(f.mesh);f.mesh.enableLivingCat(cat);let min=Infinity;
  const area=(a:ArrayLike<number>,offset:number,ids:number[])=>{const [x,y,z]=ids.map(i=>(offset+i)*3);return(a[y!]!-a[x!]!)*(a[z!+1]!-a[x!+1]!)-(a[y!+1]!-a[x!+1]!)*(a[z!]!-a[x!]!);};
  const feet=footVertices(f.mesh);
  for(const clip of ['idle','skill'])for(const clock of clip==='idle'?[0]:[0,2.5,5,7.5])for(let n=0;n<=120;n++){
   f.mesh.proceduralTime=clip==='idle'?n/12:clock;f.mesh.pose(clip==='skill'?n/120:0,clip);const current=buffers(f.mesh);expect(footVertices(f.mesh)).toEqual(feet);
   for(let page=0;page<f.data.pages.length;page++){let offset=0;for(const part of f.data.parts.filter(p=>p.page===page)){
    if(part.visible&&!/^(eye|mouth)/.test(part.name))for(let j=0;j<part.triangles.length;j+=3){const ids=part.triangles.slice(j,j+3),a=area(base[page]!,offset,ids);if(Math.abs(a)>.001)min=Math.min(min,area(current[page]!,offset,ids)/a);}
    offset+=part.vertices.length;
   }}
  }
  expect(min).toBeGreaterThan(.5);
 }finally{f.dispose();}
});
it('keeps reduced motion quiet and samples a full second instead of the legacy skill duration',()=>{
 const f=make(cat);try{
  f.mesh.enableLivingCat(cat);f.mesh.livingReducedMotion=true;const head=[];
  for(let n=0;n<=300;n++){f.mesh.proceduralTime=n/30;f.mesh.pose(0,'idle');const b=f.mesh.skeleton.findBone('head')!;head.push([b.worldX,b.worldY]);}
  expect(Math.max(...head.map(p=>p[0]!))-Math.min(...head.map(p=>p[0]!))).toBe(0);
  expect(Math.max(...head.map(p=>p[1]!))-Math.min(...head.map(p=>p[1]!))).toBeLessThan(512*.005);
  f.mesh.livingReducedMotion=false;f.mesh.proceduralTime=2.3;f.mesh.state.setAnimation(0,'skill',false);f.mesh.update(.9);const sampled=snapshot(f.mesh);
  f.mesh.pose(.9,'skill');expect(snapshot(f.mesh)).toEqual(sampled);
 }finally{f.dispose();}
});
it('has smooth long blinks with no closure at the cycle seam',()=>{
 const blink=(t:number)=>nativeLivingBlink(t,false,cat),shift=nativeLivingProfiles[cat].blink;
 expect(blink(0)).toBe(0);expect(blink(10)).toBe(0);expect(blink(1.3+shift)).toBe(1);
 for(const t of [1,1.18,1.58,1.9]){const e=.0001;expect(Math.abs((blink(t+shift+e)-2*blink(t+shift)+blink(t+shift-e))/e)).toBeLessThan(.01);}
});
});
