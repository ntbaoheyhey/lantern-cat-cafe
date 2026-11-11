// Pack reviewed original light components into one shared texture/pool.
import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const sharp=createRequire('/Users/bao/tools/cardrpg-look/npm/package.json')('sharp');
const ids=['mochi','soot','clover','panko','mallow','cinnamon','velvet','biscuit','brioche','marigold','sorrel','inkcap'];
const hash=b=>createHash('sha256').update(b).digest('hex');
const components=[],sources=[],review=[];
for(const [unit,id] of ids.entries()){
 const file=`assets/cardrpg-look/v3-vfx/${id}-light.webp`,bytes=await readFile(file);
 const meta=await sharp(bytes).metadata();if(meta.width!==1024||meta.height!==1024||!meta.hasAlpha)throw Error('Expected reviewed1024RGBA '+id);
 sources.push({id,file,sha256:hash(bytes),tiles:[0,1,2,3].map(i=>unit*4+i)});
 for(let i=0;i<4;i++){
  const input=await sharp(bytes).extract({left:i%2*512,top:Math.floor(i/2)*512,width:512,height:512}).png().toBuffer();
  const tile=unit*4+i;components.push({input,left:tile%8*512,top:Math.floor(tile/8)*512});
 }
 const input=await sharp(bytes).resize(300,300).png().toBuffer();review.push({input,left:unit%4*300,top:Math.floor(unit/4)*330});
 const label=Buffer.from(`<svg width="300" height="30"><text x="10" y="21" font-family="sans-serif" font-size="18" fill="#fff0d2">${id}</text></svg>`);
 review.push({input:label,left:unit%4*300,top:Math.floor(unit/4)*330+300});
}
const output='assets/cardrpg-look/v3-vfx/roster-light.webp';
await sharp({create:{width:4096,height:3072,channels:4,background:'#00000000'}}).composite(components).webp({quality:94,alphaQuality:100,effort:6}).toFile(output);
const dir='reports/cardrpg-look/art-rebuild/r4/sources';await mkdir(dir,{recursive:true});
await sharp({create:{width:1200,height:990,channels:4,background:'#17262b'}}).composite(review).webp({quality:91}).toFile(dir+'/roster-sheet.webp');
const bytes=await readFile(output);
await writeFile(dir+'/roster-packing.json',JSON.stringify({output,bytes:bytes.length,sha256:hash(bytes),grid:[8,6],componentSize:512,sources,temporalFrames:false,method:'Preserve48reviewed512px tiles with24px gutters; one4096x3072texture, WebP94alpha100; no generated frame sequence claimed.'},null,2)+'\n');
console.log(JSON.stringify({output,bytes:bytes.length,units:ids.length,components:components.length}));
