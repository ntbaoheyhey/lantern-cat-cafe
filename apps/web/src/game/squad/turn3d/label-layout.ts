export interface Rect {x:number;y:number;width:number;height:number}
export interface LabelInput {id:string;x:number;y:number;head:Rect;height:number}
export const intersects=(a:Rect,b:Rect,pad=3)=>a.x<b.x+b.width+pad&&a.x+a.width+pad>b.x&&a.y<b.y+b.height+pad&&a.y+a.height+pad>b.y;
/** Choose the nearest legal screen-space box; avoid all silhouettes and other labels. */
export function layoutLabels(input:LabelInput[],width:number,height:number,labelWidth=114){
 const placed:Rect[]=[],result=new Map<string,Rect>(),heads=input.map(p=>p.head);
 for(const p of [...input].sort((a,b)=>a.y-b.y||a.x-b.x||a.id.localeCompare(b.id))){
  let best:Rect|undefined,bestCost=Infinity;
  const consider=(x:number,y:number)=>{
   const q={x:Math.max(5,Math.min(width-labelWidth-5,x)),y:Math.max(5,Math.min(height-p.height-5,y)),width:labelWidth,height:p.height};
   if(placed.some(r=>intersects(q,r))||heads.some(r=>intersects(q,r,5)))return;
   // Strongly prefer above and local. Distant fallback is a last resort, never a hidden card.
   const dx=q.x+labelWidth/2-p.x,dy=q.y+p.height-p.y;
   const cost=dx*dx+dy*dy*1.8+(q.y>p.y?2500:0);
   if(cost<bestCost){best=q;bestCost=cost}
  };
  for(const dy of [0,-12,-24,-40,-60,12,24,40,60])for(const dx of [0,-12,12,-24,24,-40,40,-60,60,-90,90,-120,120])consider(p.x-labelWidth/2+dx,p.y-p.height-8+dy);
  if(!best)for(let y=5;y<=height-p.height-5;y+=12)for(let x=5;x<=width-labelWidth-5;x+=18)consider(x,y);
  if(best){placed.push(best);result.set(p.id,best)}
 }
 return result;
}
