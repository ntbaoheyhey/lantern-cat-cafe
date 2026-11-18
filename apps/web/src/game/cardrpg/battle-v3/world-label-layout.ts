export interface LabelRect {x:number;y:number;width:number;height:number}
export interface WorldLabel {id:string;side:'party'|'enemy';rect:LabelRect;anchorPlacement?:{rect:LabelRect;avoid:LabelRect}}
export interface LabelFace extends LabelRect {id:string}
export interface PlacedWorldLabel {id:string;rect:LabelRect;feasible:boolean}

/** Keep labels beside their owner; a narrowing gap above a face must not change lanes. */
export function layoutWorldLabels(labels:readonly WorldLabel[],width:number,height:number,obstacles:readonly LabelRect[],faces:readonly LabelFace[]):PlacedWorldLabel[]{
 const inset=4,gap=6,placed:LabelRect[]=[],result:PlacedWorldLabel[]=[];
 const overlap=(a:LabelRect,b:LabelRect)=>a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;
 const clamp=(x:number,a:number,b:number)=>Math.max(a,Math.min(b,x));
 for(const label of [...labels].sort((a,b)=>a.id.localeCompare(b.id))){
  const w=label.rect.width,h=label.rect.height,face=faces.find(f=>f.id===label.id),blocked=[...obstacles,...faces,...placed];
  const fit=(x:number,y:number):LabelRect=>({x:clamp(x,inset,width-w-inset),y:clamp(y,inset,height-h-inset),width:w,height:h});
  const valid=(box:LabelRect)=>w<=width-inset*2&&h<=height-inset*2&&!blocked.some(b=>overlap(box,b));
  const preferred=face?fit(label.side==='enemy'?face.x-w-gap:face.x+face.width+gap,face.y+(face.height-h)/2):fit(label.rect.x,label.rect.y);
  let chosen:LabelRect|undefined=valid(preferred)?preferred:undefined;
  if(!chosen){
   const xs=[preferred.x,inset,width-w-inset],ys=[preferred.y,inset,height-h-inset];
   if(face){xs.push(face.x-w-gap,face.x+face.width+gap);ys.push(face.y-h-gap,face.y+face.height+gap);}
   for(const b of blocked){xs.push(b.x-w-gap,b.x+b.width+gap);ys.push(b.y-h-gap,b.y+b.height+gap);}
   const candidates:{box:LabelRect;cost:number}[]=[];
   for(const x of new Set(xs))for(const y of new Set(ys)){
    const box=fit(x,y);if(valid(box))candidates.push({box,cost:(box.x-preferred.x)**2+(box.y-preferred.y)**2});
   }
   candidates.sort((a,b)=>a.cost-b.cost||a.box.y-b.box.y||a.box.x-b.box.x);chosen=candidates[0]?.box;
  }
  // Keep information present even when an unusually crowded viewport has no free rectangle.
  const box=chosen??preferred;placed.push(box);result.push({id:label.id,rect:box,feasible:!!chosen});
 }
 // Relocate explicitly authored labels after ordinary lanes are fixed. The
 // other actors retain their exact original placement, even in a crowded row.
 for(const label of [...labels].filter(l=>l.anchorPlacement).sort((a,b)=>a.id.localeCompare(b.id))){
  const target=label.anchorPlacement!,fixed=result.filter(r=>r.id!==label.id).map(r=>r.rect);
  const [replacement]=layoutWorldLabels([{id:label.id,side:label.side,rect:target.rect}],width,height,[...obstacles,...faces,...fixed,target.avoid],[]);
  result[result.findIndex(r=>r.id===label.id)]=replacement!;
 }
 return result;
}
