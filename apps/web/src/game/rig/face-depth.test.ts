import {expect,it} from 'vitest';
import {FaceDepth} from './face-depth';
import {eyeClosure} from './drawing-expression';
import {SecondaryMotion,fidgetStart} from './secondary-motion';
import mochi from '../../../public/units/mochi/poses/manifest.json';
import soot from '../../../public/units/soot/poses/manifest.json';
import clover from '../../../public/units/clover/poses/manifest.json';
import panko from '../../../public/units/panko/poses/manifest.json';

it.each([mochi,soot,clover,panko])('keeps $unit facial projection local and nonfolding at diagonal extremes',m=>{
 const face=m.poses.K0.face as [number,number,number,number],depth=new FaceDepth(),[fx,fy,w,h]=face;
 const project=(x:number,y:number)=>{const p=depth.offset(x,y,face,{x:0,y:0});return{x:x+p.x,y:y+p.y};};
 for(const turn of [-1,0,1])for(const nod of [-1,0,1]){
  depth.sample(turn,nod);
  for(const foot of m.poses.K0.feet)expect(depth.offset(foot[0]!,foot[1]!,face,{x:0,y:0})).toEqual({x:0,y:0});
  for(let row=0;row<=24;row++)for(let col=0;col<=24;col++){
   const x=fx-w*.2+col*w*1.4/24,y=fy-h*.3+row*h*1.6/24,p=project(x,y),px=project(x+.05,y),py=project(x,y+.05);
   expect(((px.x-p.x)*(py.y-p.y)-(py.x-p.x)*(px.y-p.y))/.0025).toBeGreaterThan(.7);
   expect(Math.hypot(p.x-x,p.y-y)).toBeLessThan(m.opaqueHeight*.031);
  }
 }
 depth.sample(0,0);expect(depth.offset(fx+w*.6,fy+h*.64,face,{x:12,y:12})).toEqual({x:0,y:0});
});

it('gives the two eyes different foreshortening and moves the muzzle relative to the outline',()=>{
 const face:[number,number,number,number]=[0,0,200,120],d=new FaceDepth();
 const x=(u:number,v:number)=>u*200+d.offset(u*200,v*120,face,{x:0,y:0}).x;
 const widths:number[][]=[];
 for(const yaw of [-1,1]){d.sample(yaw,.4);widths.push([x(.52,.44)-x(.28,.44),x(.845,.40)-x(.635,.40)]);
  const nose=x(.60,.64)-(x(0,.52)+x(1,.52))/2;expect((nose-20)*yaw).toBeGreaterThan(5);
 }
 expect(widths[0]![0]).toBeLessThan(widths[1]![0]!);expect(widths[0]![1]).toBeGreaterThan(widths[1]![1]!);
});

it.each(['mochi','soot','clover','panko'])('layers %s soft expressions with blinks and releases them during contact/reduced motion',owner=>{
 const m=new SecondaryMotion(owner),at=fidgetStart(m.seed,0)+.35;m.sample(at,'idle',0,false);
 expect(m.leftSoftness).toBeGreaterThan(0);expect(m.leftSoftness).toBeLessThanOrEqual(.18);
 expect(eyeClosure(0,m.leftSoftness)).toBeCloseTo(m.leftSoftness);expect(eyeClosure(1,m.leftSoftness)).toBe(1);
 const value=m.leftSoftness;m.sample(at+2,'idle',0,false);m.sample(at,'idle',0,false);expect(m.leftSoftness).toBe(value);
 m.sample(at,'attack',.35,false);expect(m.leftSoftness).toBe(0);
 m.sample(at,'idle',0,true);expect(m.leftSoftness).toBe(0);expect(m.turn).toBe(0);expect(m.nod).toBe(0);
});
