/** Re-encode existing craft images at their authored dimensions; retain every original fallback. */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import sharp from 'sharp';

const root=resolve(import.meta.dirname,'../..');
const sources={clover:['healing-sprig','healing-canopy'],mochi:['shield-cut','shield-crest'],
 panko:['crust-cut','oven-bastion'],'teacup-healer':['tea-blossom','tea-canopy'],
 'needle-moth':['sewing-needle'],'binding-thread':['knotted-thread'],'yarn-giant':['braid-wave']};
const out=resolve(root,'apps/web/public/vfx-delivery/craft');await mkdir(out,{recursive:true});
const entries={};
for(const [owner,names] of Object.entries(sources))for(const name of names){
 const request=`/vfx/${owner}/${name}.webp`,bytes=await readFile(resolve(root,'apps/web/public'+request));
 const {width,height}=await sharp(bytes).metadata();
 const encoded=await sharp(bytes).avif({quality:78,effort:4}).toBuffer();
 if(encoded.length>=bytes.length*.8)continue;
 const sourceSha256=createHash('sha256').update(bytes).digest('hex'),file=`${owner}-${name}-${sourceSha256.slice(0,10)}.avif`;
 await writeFile(resolve(out,file),encoded);
 entries[request]={url:'/vfx-delivery/craft/'+file,width,height,sourceSha256,sourceBytes:bytes.length,bytes:encoded.length};
}
await writeFile(resolve(root,'apps/web/src/game/cardrpg/spine/craft-manifest-loader.json'),JSON.stringify(entries,null,2)+'\n');
console.log(JSON.stringify({images:Object.keys(entries).length,sourceBytes:Object.values(entries).reduce((n,x)=>n+x.sourceBytes,0),deliveredBytes:Object.values(entries).reduce((n,x)=>n+x.bytes,0)}));
