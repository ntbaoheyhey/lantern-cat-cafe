import type { Rect } from './label-layout';
const rows=[0,-17,-34,-51,-68,-85,-102];
const columns=[0,-18,18,-36,36,-54,54,-72,72,-90,90];
/** Stay attached to this target's projected head; never search the stage edge. */
export function targetCallout(x:number,y:number,width:number,height:number,wordWidth:number,obstacles:readonly Rect[]):Rect|undefined {
  let bestX=0,bestY=0,cost=Infinity;
  for(const dy of rows)for(const dx of columns){
    const left=Math.max(6,Math.min(width-wordWidth-6,x-wordWidth/2+dx));
    const top=Math.max(6,Math.min(height-36,y-40+dy));
    let blocked=false;
    for(const other of obstacles)if(left<other.x+other.width+4&&left+wordWidth+4>other.x&&top<other.y+other.height+4&&top+34>other.y){blocked=true;break;}
    if(blocked)continue;
    const distance=(left+wordWidth/2-x)**2+(top+30-y+8)**2*1.4;
    if(distance<cost){bestX=left;bestY=top;cost=distance;}
  }
  return cost<Infinity?{x:bestX,y:bestY,width:wordWidth,height:30}:undefined;
}

/** A single reservation for a reaction and its result numbers. The caller adds
 * the returned box to the shared obstacles before placing the next target. */
export function targetTextLane(x:number,y:number,width:number,height:number,
  wordWidth:number,numberWidth:number,numberHeight:number,obstacles:readonly Rect[]):Rect|undefined {
  const w=Math.max(wordWidth,numberWidth), h=(wordWidth?34:0)+numberHeight;
  let best:Rect|undefined, cost=Infinity;
  for(let row=0;row<=9;row++)for(const dx of [...columns,-108,108,-126,126,-144,144,-162,162,-180,180]){
    const left=Math.max(6,Math.min(width-w-6,x-w/2+dx));
    const top=Math.max(6,Math.min(height-h-6,y-h-10-row*17));
    if(obstacles.some(r=>left<r.x+r.width+4&&left+w+4>r.x&&top<r.y+r.height+4&&top+h+4>r.y))continue;
    const distance=(left+w/2-x)**2+(top+h-y+10)**2*1.4;
    if(distance<cost){best={x:left,y:top,width:w,height:h};cost=distance;}
  }
  return best;
}
