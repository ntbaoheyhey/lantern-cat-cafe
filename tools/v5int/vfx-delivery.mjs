/** Smaller encodings of existing atlases. Keep every authored clip and the original fallback. */
import {readFile,writeFile,mkdir,stat} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import sharp from 'sharp';

const root=resolve(import.meta.dirname,'../..');
const packed=JSON.parse(await readFile(resolve(root,'assets/cardrpg-look/vfx-packed/manifest.json'),'utf8'));
const accepted=JSON.parse(await readFile(resolve(root,'apps/web/src/game/cardrpg/vfx-layered/sampled-atlases.json'),'utf8'));
const prior=new Map(accepted.map(page=>[page.request,page]));
const directory=resolve(root,'apps/web/public/vfx-delivery/v5');await mkdir(directory,{recursive:true});
const entries=[];
for(const page of [...new Set(Object.values(packed.entries).map(entry=>entry.page))].sort()){
 // Previously approved sampled pages retain their pixels and delivery precedence.
 if(prior.has(page))continue;
 const source=resolve(root,'assets/cardrpg-look/vfx-packed',page),bytes=await readFile(source);
 const meta=await sharp(bytes).metadata(),width=Math.round(meta.width/2),height=Math.round(meta.height/2);
 const encoded=await sharp(bytes).resize(width,height).avif({quality:78,effort:4}).toBuffer();
 if(encoded.length>=bytes.length*.8)continue;
 const digest=createHash('sha256').update(bytes).digest('hex'),name=page.replace(/\.webp$/,'')+'-'+digest.slice(0,10)+'.avif';
 await writeFile(resolve(directory,name),encoded);
 entries.push({request:page,url:'/vfx-delivery/v5/'+name,width,height,sourceWidth:meta.width,sourceHeight:meta.height,sourceSha256:digest,sourceBytes:bytes.length,bytes:encoded.length});
}
await writeFile(resolve(root,'apps/web/src/game/cardrpg/vfx-layered/vfx-atlas-manifest-loader.json'),JSON.stringify(entries,null,2)+'\n');
console.log(JSON.stringify({pages:entries.length,sourceBytes:entries.reduce((n,x)=>n+x.sourceBytes,0),deliveredBytes:entries.reduce((n,x)=>n+x.bytes,0)}));
