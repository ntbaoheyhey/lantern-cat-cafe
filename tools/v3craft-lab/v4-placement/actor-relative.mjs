/** Private actor-relative label lanes. No runtime imports. */
export function placeActorLabels(labels,width,height,obstacles,faces,mode='actor',previous=[]) {
 const inset=4,gap=6,placed=[],result=[];
 const overlap=(a,b)=>a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
 for(const label of [...labels].sort((a,b)=>a.id.localeCompare(b.id))){
  const w=label.rect.width,h=label.rect.height,face=faces.find(f=>f.id===label.id);
  const blocked=[...obstacles,...faces,...placed];
  const fit=(x,y)=>({x:clamp(x,inset,width-w-inset),y:clamp(y,inset,height-h-inset),width:w,height:h});
  const valid=b=>w<=width-inset*2&&h<=height-inset*2&&!blocked.some(x=>overlap(b,x));
  const preferred=face?fit(label.side==='enemy'?face.x-w-gap:face.x+face.width+gap,face.y+(face.height-h)/2):fit(label.rect.x,label.rect.y);
  const old=previous.find(p=>p.id===label.id),reference=face??label.rect;
  const retained=old?fit(reference.x+old.relativeX,reference.y+old.relativeY):null;
  let chosen=mode==='sticky'&&retained&&valid(retained)?retained:null;
  const xs=[preferred.x],ys=[preferred.y];
  if(face){xs.push(face.x-w-gap,face.x+face.width+gap);ys.push(face.y-h-gap,face.y+face.height+gap);}
  if(retained){xs.push(retained.x);ys.push(retained.y);}
  for(const b of blocked){xs.push(b.x-w-gap,b.x+b.width+gap);ys.push(b.y-h-gap,b.y+b.height+gap);}
  xs.push(inset,width-w-inset);ys.push(inset,height-h-inset);
  if(!chosen){
   const target=mode==='sticky'&&retained?retained:preferred,candidates=[];
   for(const x of new Set(xs))for(const y of new Set(ys)){
    const box=fit(x,y);if(!valid(box))continue;
    candidates.push({box,cost:(box.x-target.x)**2+(box.y-target.y)**2});
   }
   candidates.sort((a,b)=>a.cost-b.cost||a.box.y-b.box.y||a.box.x-b.box.x);
   chosen=candidates[0]?.box??null;
  }
  const box=chosen??preferred;placed.push(box);
  result.push({id:label.id,rect:box,feasible:!!chosen,relativeX:box.x-reference.x,relativeY:box.y-reference.y});
 }
 return result;
}
