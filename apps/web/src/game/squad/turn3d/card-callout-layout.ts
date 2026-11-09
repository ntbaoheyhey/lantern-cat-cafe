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
