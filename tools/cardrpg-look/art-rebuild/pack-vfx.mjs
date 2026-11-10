// Deterministic crop/edge cleanup and packing of our generated RGBA master.
import {createRequire} from 'node:module';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const sharp=createRequire('/Users/bao/tools/cardrpg-look/npm/package.json')('sharp');
const source='assets/source/look-v3/vfx/mochi-light-master.png';
const output='assets/cardrpg-look/v3-vfx/mochi-light.webp';
const {width,height}=await sharp(source).metadata();
if(width!==height||width%2)throw Error('Expected square even RGBA atlas');
const tiles=[];
for(let i=0;i<4;i++){
 const {data,info}=await sharp(source).extract({left:i%2*width/2,top:Math.floor(i/2)*height/2,width:width/2,height:height/2}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++){
  const edge=Math.min(x,y,info.width-1-x,info.height-1-y)/24;
  const t=Math.max(0,Math.min(1,edge));
  const a=(y*info.width+x)*4+3;
  data[a]=Math.round(data[a]*t*t*(3-2*t));
 }
 const input=await sharp(data,{raw:info}).resize(464,464).png().toBuffer();
 tiles.push({input,left:i%2*512+24,top:Math.floor(i/2)*512+24});
}
await mkdir('assets/cardrpg-look/v3-vfx',{recursive:true});
await sharp({create:{width:1024,height:1024,channels:4,background:'#00000000'}}).composite(tiles).webp({quality:94,alphaQuality:100,effort:6}).toFile(output);
const hash=b=>createHash('sha256').update(b).digest('hex');
const bytes=await readFile(output);
await mkdir('reports/cardrpg-look/art-rebuild/r1/vfx-pilot',{recursive:true});
await writeFile('reports/cardrpg-look/art-rebuild/r1/vfx-pilot/packing.json',JSON.stringify({source,sourceSha256:hash(await readFile(source)),sourceSize:[width,height],output,sha256:hash(bytes),bytes:bytes.length,method:'RGBA crop 2x2; 24px smooth alpha edge cleanup; 464px cells inside512px gutters; WebP94 alpha100. No generated temporal frames claimed.'},null,2)+'\n');
console.log(JSON.stringify({output,bytes:bytes.length}));
