import {intersects,type Rect} from '../../squad/turn3d/label-layout';
export const NUMBER_LIFETIME_MS=640;
export interface NumberFootprint {halfWidth:number;top:number;bottom:number;rise:number}
export function sweptNumberBox(x:number,y:number,p:NumberFootprint):Rect{return{x:x-p.halfWidth,y:y-p.top-p.rise,width:p.halfWidth*2,height:p.top+p.bottom+p.rise};}
/** Protect the complete rise/pop/tag footprint. Keep the label near its target. */
export function placeNumber(body:Rect,p:NumberFootprint,width:number,height:number,faces:readonly Rect[],occupied:readonly Rect[],scale=1,previous?:{x:number;y:number}){
 const cx=body.x+body.width/2,foot=body.y+body.height,idealY=foot-18*scale;
 const ceiling=46,floor=height-Math.min(96,height*.12)-8;
 let best:{x:number;y:number;box:Rect;cost:number}|undefined;
 const consider=(x:number,y:number)=>{
  const box=sweptNumberBox(x,y,p);
  if(box.x<8||box.x+box.width>width-8||box.y<ceiling||box.y+box.height>floor)return;
  if(faces.some(f=>intersects(box,f,6)))return;
  const collisions=occupied.reduce((n,r)=>n+(intersects(box,r,4)?1:0),0);
  const dx=x-cx,dy=y-idealY,cost=dx*dx+dy*dy+collisions*width*width+(previous?(x-previous.x)**2+(y-previous.y)**2:0);
  if(!best||cost<best.cost)best={x,y,box,cost};
 };
 if(previous)consider(previous.x,previous.y);
 for(const y of [idealY,foot-45*scale,foot+16*scale,foot-body.height*.36])
  for(const dx of [0,-.35,.35,-.65,.65,-.9,.9])consider(cx+dx*body.width,y);
 if(!best||best.cost>=width*width){
  const radius=Math.max(body.width,120*scale);
  for(let y=Math.max(ceiling+p.top+p.rise,foot-body.height*.7);y<=floor-p.bottom;y+=12*scale)
   for(let x=Math.max(8+p.halfWidth,cx-radius);x<=Math.min(width-8-p.halfWidth,cx+radius);x+=16*scale)consider(x,y);
 }
 return best;
}
