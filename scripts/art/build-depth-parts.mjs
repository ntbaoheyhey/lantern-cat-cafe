/** Compile separately painted faces and props into one ordered native atlas. */
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import sharp from 'sharp';
const worldPoints=nodes=>nodes.reduce((all,n)=>{const p=all[n.parent]??{x:0,y:0};all.push({x:p.x+n.x,y:p.y+n.y});return all;},[]);
export async function applyDepthParts(data,dir,out){
 let manifest;const folder=resolve(dir,'depth-parts');
 try{manifest=JSON.parse(await readFile(resolve(folder,'manifest.json'),'utf8'));}catch(e){if(e.code==='ENOENT')return data;throw e;}
 const original=data.parts.map(p=>structuredClone(p)),world=worldPoints(data.nodes),parts=new Map(original.map(p=>[p.name,p]));
 const images=[];
 for(const spec of manifest.images){const file=resolve(folder,spec.file),meta=await sharp(file).metadata();images.push({...spec,file,width:meta.width,height:meta.height});}
 const base=new Map(images.filter(i=>i.name===i.sourcePart).map(i=>[i.name,i]));
 const box=p=>{const xy=p.vertices.map(v=>v.reduce((q,w)=>({x:q.x+(w.x+world[w.bone].x)*w.weight,y:q.y+(w.y+world[w.bone].y)*w.weight}),{x:0,y:0}));return{x:Math.min(...xy.map(p=>p.x)),y:Math.min(...xy.map(p=>p.y)),right:Math.max(...xy.map(p=>p.x)),top:Math.max(...xy.map(p=>p.y))};};
 const boxes=new Map(original.map(p=>[p.name,box(p)]));
 // Packing changes UVs only. All attachments stay on one page so draw order
 // remains the authored body/prop/paw/head/face order.
 const edge=2048,padding=3;let x=padding,y=padding,row=0;
 for(const item of [...images].sort((a,b)=>b.height-a.height)){
  if(x+item.width+padding>edge){x=padding;y+=row+padding;row=0;}
  item.left=x;item.top=y;x+=item.width+padding;row=Math.max(row,item.height);
 }
 const height=2**Math.ceil(Math.log2(y+row+padding));if(height>4096)throw Error('Depth atlas exceeds 2048x4096 '+manifest.id);
 await sharp({create:{width:edge,height,channels:4,background:'#00000000'}}).composite(images.map(i=>({input:i.file,left:i.left,top:i.top}))).png({compressionLevel:9}).toFile(resolve(out,'rig-depth.png'));
 const imageByName=new Map(images.map(i=>[i.name,i])),compiled=[];
 for(const item of images.filter(i=>i.grip)){
  const b=boxes.get(item.sourcePart),grip={x:b.x+(b.right-b.x)*item.grip[0],y:b.top-(b.top-b.y)*item.grip[1]},parent=data.nodes.findIndex(n=>n.name===item.hand);
  let index=data.nodes.findIndex(n=>n.name===item.bone);if(index<0){index=data.nodes.length;data.nodes.push({});}
  data.nodes[index]={name:item.bone,parent,x:grip.x-world[parent].x,y:grip.y-world[parent].y,rotation:0,sx:1,sy:1};world[index]=grip;
  for(const [name,clip] of Object.entries(data.clips))if(/^(attack|cast|skill|ultimate|ult|enrage)$/.test(name)){
   const d=clip.duration,peak=name==='attack'?.26:Math.min(d*.5,.55),sign=item.hand.endsWith('l')?1:-1,amp=item.name==='off_weapon'?9:24;
   clip.tracks=clip.tracks.filter(t=>t.node!==index);clip.tracks.push({node:index,property:'rotate',keys:[{time:0,value:0},{time:Math.max(.03,peak-.13),value:-amp*.65*sign},{time:peak,value:amp*sign},{time:Math.min(d-.02,peak+.12),value:amp*.45*sign},{time:d,value:0}]});
  }
 }
 function compile(item){
  const sourceName=parts.has(item.sourcePart)?item.sourcePart:imageByName.get(item.sourcePart)?.sourcePart;
  const source=parts.get(sourceName),b=boxes.get(sourceName),im=imageByName.get(item.sourcePart);
  if(!source||!im)throw Error('Missing source '+item.sourcePart);
  let part;
  if(item.name===item.sourcePart){
   part=structuredClone(source);const us=source.uv.filter((_,i)=>i%2===0),vs=source.uv.filter((_,i)=>i%2===1),umin=Math.min(...us),umax=Math.max(...us),vmin=Math.min(...vs),vmax=Math.max(...vs);
   part.uv=source.uv.map((v,i)=>i%2===0?(item.left+(v-umin)/(umax-umin)*item.width)/edge:1-(item.top+(1-(v-vmin)/(vmax-vmin))*item.height)/height);
  }else{
   const r=item.rect??[0,0,im.width,im.height],left=b.x+r[0]/im.width*(b.right-b.x),right=left+r[2]/im.width*(b.right-b.x),top=b.top-r[1]/im.height*(b.top-b.y),bottom=top-r[3]/im.height*(b.top-b.y),bone=data.nodes.findIndex(n=>n.name===(item.bone??'head')),origin=world[bone];
   part={name:item.name,slot:item.slot??item.name,visible:item.visible??true,vertices:[[left,bottom],[right,bottom],[right,top],[left,top]].map(([x,y])=>[{bone,x:x-origin.x,y:y-origin.y,weight:1}]),uv:[item.left/edge,1-(item.top+item.height)/height,(item.left+item.width)/edge,1-(item.top+item.height)/height,(item.left+item.width)/edge,1-item.top/height,item.left/edge,1-item.top/height],triangles:[0,1,2,0,2,3]};
  }
  part.page=0;return part;
 }
 const emit=item=>{for(const i of images.filter(i=>i.behind===item.name))emit(i);compiled.push(compile(item));for(const i of images.filter(i=>i.sourcePart===item.name&&i.name!==item.name&&!i.behind))emit(i);};
 for(const p of original)emit(imageByName.get(p.name));
 data.parts=compiled;data.pages=[{name:'rig-depth.png',width:edge,height,pma:false}];data.face={seed:manifest.faceSeed};delete data.blink;
 const bindings=data.contract?.parts??{};
 for(const i of images)bindings[i.name]={source:i.name,embedded:false,file:'depth-parts/'+i.file,bone:i.bone??i.name};
 data.contract={...data.contract,version:2,parts:bindings,embeddedFacialSlots:false,weaponRequired:manifest.weaponRequired,paintMethod:manifest.method};
 await writeFile(resolve(dir,'parts.json'),JSON.stringify(bindings,null,2)+'\n');
 await writeFile(resolve(out,'parts.json'),JSON.stringify({version:2,id:manifest.id,weaponRequired:manifest.weaponRequired,parts:bindings},null,2)+'\n');
 return data;
}
