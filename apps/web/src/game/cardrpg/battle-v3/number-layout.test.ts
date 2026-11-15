import {expect,it} from 'vitest';
import {placeNumber,sweptNumberBox,NUMBER_LIFETIME_MS} from './number-layout';
import {intersects,type Rect} from '../../squad/turn3d/label-layout';
import comparison from '../../../../../../tools/v3craft-lab/q2/results.json';

it('reserves the whole critical-label trajectory against all measured fixture faces',()=>{
 for(const c of comparison.cases.filter(c=>c.method==='wide')){
  const [w,h]=c.viewport as [number,number],scale=h/720,occupied:Rect[]=[];
  const faces=c.actors.map(a=>({x:a.face[0]!,y:a.face[1]!,width:a.face[2]!,height:a.face[3]!}));
  for(const a of c.actors){
   const body={x:a.box[0]!,y:a.box[1]!,width:a.box[2]!,height:a.box[3]!};
   const footprint={halfWidth:67*scale,top:43*scale,bottom:26*scale,rise:24*scale};
   const p=placeNumber(body,footprint,w,h,faces,occupied,scale);
   expect(p,`${c.fixture} ${w} ${a.id}`).toBeDefined();
   for(const f of faces)expect(intersects(p!.box,f,0)).toBe(false);
   expect(p!.box.y+p!.box.height).toBeLessThanOrEqual(h-Math.min(96,h*.12));
   occupied.push(p!.box);
  }
 }
});
it('protects the top of the rise instead of only the spawn rectangle',()=>{
 const p={halfWidth:40,top:30,bottom:20,rise:24},face={x:70,y:110,width:60,height:30};
 expect(intersects({x:60,y:140,width:80,height:50},face,0)).toBe(false);
 expect(intersects(sweptNumberBox(100,170,p),face,0)).toBe(true);
 const placed=placeNumber({x:50,y:110,width:100,height:110},p,1280,720,[face],[]);
 expect(placed).toBeDefined();expect(intersects(placed!.box,face,0)).toBe(false);
 expect(NUMBER_LIFETIME_MS).toBeLessThanOrEqual(700);
});
