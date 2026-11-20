/** Original data-only importer. No Esoteric runtime code is used or distributed. */
export function importSkeleton(source,atlas,scale=1){
 if(!source?.bones?.length||!source?.skins?.length)throw Error('Missing skeleton bones or skin');
 if(source.skeleton?.spine?.split('.').slice(0,2).join('.')!=='4.2')throw Error('Only Spine 4.2 JSON intake is supported; export JSON, not binary');
 const pages=[],regions={};let page,region;
 for(const raw of atlas.split(/\r?\n/)){
  const line=raw.trim();if(!line){page=undefined;region=undefined;continue;}
  if(!line.includes(':')){if(!page){page={name:line,width:0,height:0,pma:false};pages.push(page);region=undefined;}else{region={page:pages.length-1,x:0,y:0,width:0,height:0};regions[line]=region;}continue;}
  const [key,...rest]=line.split(':'),value=rest.join(':').trim(),v=value.split(',').map(Number);
  if(!region){if(key==='size'){page.width=v[0];page.height=v[1];}if(key==='pma')page.pma=value==='true';}
  else{if(key==='bounds')[region.x,region.y,region.width,region.height]=v;if(key==='xy')[region.x,region.y]=v;if(key==='size')[region.width,region.height]=v;if(key==='rotate'&&value!=='false'&&value!=='0')throw Error('Rotated atlas regions must be exported unrotated');}
 }
 const nodes=source.bones.map(b=>({name:b.name,parent:source.bones.findIndex(p=>p.name===b.parent),x:(b.x??0)*scale,y:(b.y??0)*scale,rotation:b.rotation??0,sx:b.scaleX??1,sy:b.scaleY??1}));
 const parts=[];
 for(const slot of source.slots){
  const attachments=source.skins[0].attachments[slot.name]??{};
  for(const [name,a] of Object.entries(attachments)){
   const r=regions[a.path??name];if(!r)throw Error(`Missing region ${name}`);
   const bone=nodes.findIndex(b=>b.name===slot.bone),vertices=[];let uv,triangles;
   if(a.type==='mesh'){
    uv=a.uvs;triangles=a.triangles;
    if(a.vertices.length===uv.length)for(let i=0;i<uv.length;i+=2)vertices.push([{bone,x:a.vertices[i]*scale,y:a.vertices[i+1]*scale,weight:1}]);
    else for(let i=0;i<a.vertices.length;){const count=a.vertices[i++],weights=[];for(let j=0;j<count;j++){weights.push({bone:a.vertices[i++],x:a.vertices[i++]*scale,y:a.vertices[i++]*scale,weight:a.vertices[i++]});}vertices.push(weights);}
   }else if(!a.type||a.type==='region'){
    uv=[0,1,1,1,1,0,0,0];triangles=[0,1,2,0,2,3];const angle=(a.rotation??0)*Math.PI/180,c=Math.cos(angle),s=Math.sin(angle);
    for(const [dx,dy] of [[-1,-1],[1,-1],[1,1],[-1,1]]){const x=dx*(a.width??r.width)*(a.scaleX??1)/2,y=dy*(a.height??r.height)*(a.scaleY??1)/2;vertices.push([{bone,x:((a.x??0)+x*c-y*s)*scale,y:((a.y??0)+x*s+y*c)*scale,weight:1}]);}
   }else throw Error(`Unsupported attachment ${a.type}`);
   const p=pages[r.page];parts.push({name,slot:slot.name,visible:slot.attachment===name,page:r.page,vertices,uv:uv.map((v,i)=>i%2?1-(r.y+v*r.height)/p.height:(r.x+v*r.width)/p.width),triangles});
  }
 }
 const clips={};for(const [name,a] of Object.entries(source.animations)){
  let duration=0;const walk=x=>{if(x&&typeof x==='object'){if(typeof x.time==='number')duration=Math.max(duration,x.time);Object.values(x).forEach(walk);}};walk(a);
  const tracks=Object.entries(a.bones??{}).flatMap(([bone,ts])=>Object.entries(ts).map(([property,keys])=>({node:nodes.findIndex(b=>b.name===bone),property,keys:keys.map(k=>({...k,...(property==='translate'?{x:(k.x??0)*scale,y:(k.y??0)*scale}:{})}))})));
  const visibility=Object.entries(a.slots??{}).flatMap(([slot,ts])=>ts.attachment?[{slot,keys:ts.attachment}]:[]);
  clips[name]={duration,tracks,visibility,events:(a.events??[]).map(e=>({name:e.name,time:e.time??0}))};
 }
 const b=source.skeleton;return {format:'taskbar-cutout-v1',nodes,parts,pages,clips,bounds:{x:(b.x??0)*scale,y:(b.y??0)*scale,width:b.width*scale,height:b.height*scale}};
}
