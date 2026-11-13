/** Copy decoded original pixels without Canvas premultiplication or resampling. */
import {readdir,readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {atlasSlots} from '../../apps/web/src/game/cardrpg/vfx-layered/atlas.ts';
const root=resolve(import.meta.dirname,'../..'),input=resolve(root,'assets/cardrpg-look/vfx-layered'),out=resolve(root,'assets/cardrpg-look/vfx-packed');
await mkdir(out,{recursive:true});
const groups=new Map(),hash=b=>createHash('sha256').update(b).digest('hex');
for(const name of (await readdir(input)).filter(n=>n.endsWith('.json')).sort()){
 const t=JSON.parse(await readFile(resolve(input,name))),group=groups.get(t.owner)??[];
 group.push({id:t.id,file:t.id.replaceAll(':','-')+'.webp'});groups.set(t.owner,group);
}
const entries={},pages=[],sources=[];
for(const [owner,group] of groups){
 const decoded=[];
 for(const e of group){const bytes=await readFile(resolve(input,e.file)),{data,info}=await sharp(bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true});decoded.push({data,info});sources.push({...e,sha256:hash(bytes)});}
 const {width,height}=decoded[0].info;
 for(const [page,layout] of atlasSlots(group.length,width,height).entries()){
  const pixels=Buffer.alloc(layout.width*layout.height*4),name=owner.replaceAll(':','-')+'-'+page+'.webp';
  for(const slot of layout.slots){const e=group[slot.index],d=decoded[slot.index];if(d.info.width!==width||d.info.height!==height)throw Error('Mixed source dimensions');
   for(let y=0;y<height;y++)d.data.copy(pixels,((slot.y+y)*layout.width+slot.x)*4,y*width*4,(y+1)*width*4);
   entries[e.id]={page:name,x:slot.x,y:slot.y,width,height};
  }
  const bytes=await sharp(pixels,{raw:{width:layout.width,height:layout.height,channels:4}}).webp({lossless:true,effort:6,alphaQuality:100}).toBuffer();
  await writeFile(resolve(out,name),bytes);pages.push({file:name,width:layout.width,height:layout.height,bytes:bytes.length,sha256:hash(bytes),decodedSha256:hash(pixels)});
 }
}
await writeFile(resolve(out,'manifest.json'),JSON.stringify({version:1,tool:'scripts/art/pack-vfx.mjs — raw decoded pixel copy, sharp lossless WebP',source:'approved original paintings; no reference art, model call, repaint or resampling',entries,pages,sources},null,2)+'\n');
console.log(`${sources.length} original sheets -> ${pages.length} lossless pages; ${(pages.reduce((s,p)=>s+p.bytes,0)/2**20).toFixed(2)}MiB`);
