import sharp from 'sharp';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'../..');
const ids=['mochi','soot','clover','panko','mallow','sorrel','biscuit','inkcap','cinnamon','brioche','velvet','marigold','yarn-giant'];
const palette=['#bd9859','#725a9d','#689970','#a08867','#c77757','#719578','#ad8951','#796b96','#b26f51','#b67a8f','#6f8eae','#b2a054','#97496e'];
// Eyes measured in the 640px runtime capture. Crop puts that line at 40%.
const eyes={mochi:[328,305,232],soot:[334,299,216],clover:[322,292,176],panko:[329,309,216],mallow:[322,294,184],sorrel:[330,299,191],biscuit:[329,310,202],inkcap:[326,315,198],cinnamon:[330,311,192],brioche:[330,307,208],velvet:[318,294,192],marigold:[325,304,204],'yarn-giant':[273,312,210]};
const tiles=[];
for(const [i,id] of ids.entries()){
 const dir=resolve(root,'art/units',id),file=resolve(dir,'portrait.json');
 let crop;
 try{crop=JSON.parse(await readFile(file,'utf8'))}catch{
  const [eyeX,eyeY,headWidth]=eyes[id],size=Math.round(headWidth/.65);
  crop={version:1,source:`apps/web/public/units/${id}/runtime.webp`,eyeLine:.4,headWidth:.65,
   region:{left:Math.round(eyeX-size/2),top:Math.round(eyeY-size*.4),width:size,height:size},color:palette[i]};
  await mkdir(dir,{recursive:true});await writeFile(file,JSON.stringify(crop,null,2)+'\n');
 }
 const bust=await sharp(resolve(root,crop.source)).extract(crop.region).resize(256,256).png().toBuffer();
 const svg=Buffer.from(`<svg width="256" height="256"><defs><radialGradient id="g" cx="45%" cy="25%" r="85%"><stop stop-color="${crop.color}"/><stop offset="1" stop-color="#211b30"/></radialGradient></defs><rect width="256" height="256" rx="16" fill="url(#g)"/><circle cx="130" cy="98" r="101" fill="none" stroke="#ffe6af" stroke-opacity=".18" stroke-width="2"/></svg>`);
 const path=resolve(root,'apps/web/public/units',id,'portrait.webp');
 await sharp(svg).composite([{input:bust}]).webp({quality:92}).toFile(path);
 tiles.push({input:await sharp(path).resize(192,192).toBuffer(),left:(i%6)*192,top:Math.floor(i/6)*192});
}
await sharp({create:{width:1152,height:576,channels:3,background:'#1e1826'}}).composite(tiles).png().toFile(resolve(root,'reports/v3-battle/A2/portraits.png'));
console.log('PASS 13 portraits, 256px masters, crop metadata saved');
