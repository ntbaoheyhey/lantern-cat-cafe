export interface Rect {x:number;y:number;width:number;height:number}
export interface LabelInput {id:string;x:number;y:number;head:Rect;height:number}
export const intersects=(a:Rect,b:Rect,pad=3)=>a.x<b.x+b.width+pad&&a.x+a.width+pad>b.x&&a.y<b.y+b.height+pad&&a.y+a.height+pad>b.y;
const nearbyY = [0,-12,-24,-40,-60,12,24,40,60];
const nearbyX = [0,-12,12,-24,24,-40,40,-60,60,-90,90,-120,120];
/** Choose the nearest legal screen-space box; avoid all silhouettes and other labels. */
export function layoutLabels(input:LabelInput[],width:number,height:number,labelWidth=114,obstacles:Rect[]=[]){
 const placed:Rect[]=[],result=new Map<string,Rect>(),heads=[...input.map(p=>p.head),...obstacles];
 for(const p of [...input].sort((a,b)=>a.y-b.y||a.x-b.x||a.id.localeCompare(b.id))){
  let bestX=0,bestY=0,bestCost=Infinity;
  // A crowded fallback can visit thousands of candidates. Keep those scalar;
  // allocate only the winning rectangle, never a rectangle per candidate.
  const consider=(x:number,y:number)=>{
   x=Math.max(5,Math.min(width-labelWidth-5,x));y=Math.max(5,Math.min(height-p.height-5,y));
   for(const r of placed)if(x<r.x+r.width+3&&x+labelWidth+3>r.x&&y<r.y+r.height+3&&y+p.height+3>r.y)return;
   for(const r of heads)if(x<r.x+r.width+5&&x+labelWidth+5>r.x&&y<r.y+r.height+5&&y+p.height+5>r.y)return;
   // Strongly prefer above and local. Distant fallback is a last resort, never a hidden card.
   const dx=x+labelWidth/2-p.x,dy=y+p.height-p.y;
   const cost=dx*dx+dy*dy*1.8+(y>p.y?2500:0);
   if(cost<bestCost){bestX=x;bestY=y;bestCost=cost}
  };
  for(const dy of nearbyY)for(const dx of nearbyX)consider(p.x-labelWidth/2+dx,p.y-p.height-8+dy);
  if(bestCost===Infinity)for(let y=5;y<=height-p.height-5;y+=12)for(let x=5;x<=width-labelWidth-5;x+=18)consider(x,y);
  if(bestCost<Infinity){const best={x:bestX,y:bestY,width:labelWidth,height:p.height};placed.push(best);result.set(p.id,best)}
 }
 return result;
}
