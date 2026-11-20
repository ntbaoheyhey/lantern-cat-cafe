/** Private placement candidates. No production code imports this experiment. */
export function placeLabels(labels, width, height, obstacles, faces, variant) {
 const inset=4,gap=4,placed=[],result=[];
 const overlaps=(a,b)=>a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;
 const clamp=(value,lo,hi)=>Math.max(lo,Math.min(hi,value));
 for(const label of [...labels].sort((a,b)=>a.id.localeCompare(b.id))){
  const original=label.rect,w=original.width,h=original.height;
  const fit=(x,y)=>({x:clamp(x,inset,width-w-inset),y:clamp(y,inset,height-h-inset),width:w,height:h});
  const nearest=fit(original.x,original.y);
  if(variant==='viewport'){result.push({id:label.id,rect:nearest,feasible:w<=width-2*inset&&h<=height-2*inset});continue;}
  const blocked=[...obstacles,...faces,...placed];
  const xs=[nearest.x],ys=[nearest.y];
  for(const box of blocked){xs.push(box.x-w-gap,box.x+box.width+gap);ys.push(box.y-h-gap,box.y+box.height+gap);}
  xs.push(inset,width-w-inset);ys.push(inset,height-h-inset);
  const candidates=[];
  for(const x of new Set(xs))for(const y of new Set(ys)){
   const box=fit(x,y);if(box.width>width-2*inset||box.height>height-2*inset||blocked.some(b=>overlaps(box,b)))continue;
   candidates.push({box,cost:(box.x-original.x)**2+(box.y-original.y)**2});
  }
  candidates.sort((a,b)=>a.cost-b.cost||a.box.y-b.box.y||a.box.x-b.box.x);
  const chosen=candidates[0]?.box??nearest;placed.push(chosen);
  result.push({id:label.id,rect:chosen,feasible:!!candidates.length});
 }
 return result;
}
