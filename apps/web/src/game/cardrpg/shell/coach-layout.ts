export interface Box {x:number;y:number;width:number;height:number}
export const SPOTLIGHT_PADDING=8;
const clamp=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,n));
export function coachLayout(target:Box|undefined,viewport:{width:number;height:number},height=176){
 const width=Math.min(340,viewport.width-24),h=Math.min(height,viewport.height-24),margin=12,gap=22;
 const centre={x:(viewport.width-width)/2,y:(viewport.height-h)/2,width,height:h};
 if(!target)return {bubble:centre};
 const spotlight={x:target.x-8,y:target.y-8,width:target.width+16,height:target.height+16};
 const cx=target.x+target.width/2,cy=target.y+target.height/2;
 const candidates=[
  {x:clamp(cx-width/2,margin,viewport.width-width-margin),y:target.y+target.height+gap},
  {x:clamp(cx-width/2,margin,viewport.width-width-margin),y:target.y-h-gap},
  {x:target.x+target.width+gap,y:clamp(cy-h/2,margin,viewport.height-h-margin)},
  {x:target.x-width-gap,y:clamp(cy-h/2,margin,viewport.height-h-margin)},
 ];
 const position=candidates.find(p=>p.x>=margin&&p.y>=margin&&p.x+width<=viewport.width-margin&&p.y+h<=viewport.height-margin)??centre;
 const bubble={...position,width,height:h};
 const from={x:clamp(cx,bubble.x+16,bubble.x+width-16),y:clamp(cy,bubble.y+12,bubble.y+h-12)};
 const to={x:clamp(from.x,target.x,target.x+target.width),y:clamp(from.y,target.y,target.y+target.height)};
 return {spotlight,bubble,arrow:{from,to}};
}
