export interface Rect {x:number;y:number;width:number;height:number}
export interface LabelInput {id:string;x:number;y:number;head:Rect;height:number}
export const intersects=(a:Rect,b:Rect,pad=3)=>a.x<b.x+b.width+pad&&a.x+a.width+pad>b.x&&a.y<b.y+b.height+pad&&a.y+a.height+pad>b.y;
/** Search reserved lanes first; reject every model head and all previously placed cards. */
export function layoutLabels(input:LabelInput[],width:number,height:number,labelWidth=114){
 const placed:Rect[]=[],result=new Map<string,Rect>(),heads=input.map(p=>p.head);
 for(const p of [...input].sort((a,b)=>a.y-b.y||a.x-b.x||a.id.localeCompare(b.id))){
  const candidates:Rect[]=[];
  const xs=[p.x-labelWidth/2,...Array.from({length:Math.ceil(width/labelWidth)},(_,i)=>6+i*(labelWidth+6))];
  const ys=[p.y-p.height-10,6,height-p.height-6,60,height-p.height-60,114,168];
  for(const y of ys)for(const x of xs){const q={x:Math.max(5,Math.min(width-labelWidth-5,x)),y:Math.max(5,Math.min(height-p.height-5,y)),width:labelWidth,height:p.height};if(!placed.some(r=>intersects(q,r))&&!heads.some(r=>intersects(q,r,5)))candidates.push(q)}
  if(!candidates.length)for(let y=5;y<=height-p.height-5;y+=12)for(let x=5;x<=width-labelWidth-5;x+=18){const q={x,y,width:labelWidth,height:p.height};if(!placed.some(r=>intersects(q,r))&&!heads.some(r=>intersects(q,r,5)))candidates.push(q)}
  candidates.sort((a,b)=>Math.abs(a.x+labelWidth/2-p.x)+Math.abs(a.y+p.height-p.y)*1.7-(Math.abs(b.x+labelWidth/2-p.x)+Math.abs(b.y+p.height-p.y)*1.7));
  const q=candidates[0];if(q){placed.push(q);result.set(p.id,q)}
 }
 return result;
}
