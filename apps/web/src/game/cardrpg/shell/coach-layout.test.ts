import {expect,it} from 'vitest';
import {coachLayout} from './coach-layout';
it('keeps target padding and bubbles separate at desktop and phone edges',()=>{
 for(const [width,height] of [[1280,720],[1440,900],[390,844]] as const)for(const target of [{x:12,y:12,width:100,height:60},{x:12,y:height-120,width:100,height:80},{x:width-112,y:300,width:100,height:80}]){
  const {spotlight:s,bubble:b}=coachLayout(target,{width,height});expect(s).toEqual({x:target.x-8,y:target.y-8,width:target.width+16,height:target.height+16});
  expect(b.x>=0&&b.y>=0&&b.x+b.width<=width&&b.y+b.height<=height).toBe(true);
  expect(b.x+b.width<=target.x||b.x>=target.x+target.width||b.y+b.height<=target.y||b.y>=target.y+target.height).toBe(true);
 }
});
