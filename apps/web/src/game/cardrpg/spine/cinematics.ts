import { intersects, type Rect } from '../../squad/turn3d/label-layout';
import { PAINT } from './style';

const smooth = (value:number) => {const t=Math.max(0,Math.min(1,value));return t*t*(3-2*t);};
/** Fit the occupied horizontal span, preserving unit scale and the requested zoom ceiling. */
export function fitStageCamera(width:number,left:number,right:number,requested:number,margin:number,out:{zoom:number;x:number}) {
 out.zoom=requested;out.x=0;
 if(!Number.isFinite(left+right)||right<=left)return out;
 const span=right-left+margin*2;
 out.zoom=Math.min(requested,Math.max(1,width/span));
 const half=width/(2*out.zoom),min=right+margin-half,max=left-margin+half;
 // A stage too narrow even at x1 retains its center; normal supported sizes fit.
 // At the fitted zoom min and max coincide; floating-point rounding can invert
 // them by a fraction of a unit. Check the unzoomed span, not those two limits.
 if(span<=width)out.x=Math.max(min,Math.min(max,0));
 return out;
}
/** Event times use the presentation clock, so pause and x1/x2/x3 remain coherent. */
export function ultimateFocus(time:number,start:number,end:number,active:boolean) {
 if(start<0)return 0;
 return smooth((time-start)/PAINT.zoomInSeconds)*(active?1:1-smooth((time-end)/PAINT.zoomOutSeconds));
}

/** Reserve the upper wall, above the actors and below the fixed enemy rage row. */
export function cinematicBox(width:number,height:number,protectedRects:readonly Rect[],compact=false):Rect|null {
 const sizes:readonly [number,number][]=compact?[[380,68]]:[[510,Math.min(134,height*.25)],[380,88]];
 for(const [desiredWidth,h] of sizes){
 const w=Math.min(desiredWidth,width*.43);
 if(w<260||h<88&&!compact)continue;
 for(const y of [62,88,112])for(const x of [24,width*.22,width-w-24]){
  const box={x,y,width:w,height:h};
  if(y+h>height-20||x+w>width-12)continue;
  if(!protectedRects.some(rect=>intersects(box,rect,12)))return box;
 }
 }
 return null;
}
