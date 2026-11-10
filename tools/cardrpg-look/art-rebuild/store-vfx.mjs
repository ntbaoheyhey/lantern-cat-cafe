// Register and pack an inspected original built-in generation. No model calls.
import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir,copyFile,access} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {homedir} from 'node:os';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const [id,input,review]=process.argv.slice(2);
if(!id||!input||!review||!/^[a-z][a-z0-9-]*$/.test(id))throw Error('store-vfx.mjs UNIT INPUT.png REVIEW');
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../../..');
if(await access(root+'/STOP-B').then(()=>true,()=>false))throw Error('STOP-B requested');
const sharp=createRequire('/Users/bao/tools/cardrpg-look/npm/package.json')('sharp');
const hash=b=>createHash('sha256').update(b).digest('hex');
const bytes=await readFile(input),sourceSha256=hash(bytes);
const prompt=await readFile(`${root}/tools/cardrpg-look/art-rebuild/prompts/${id}-vfx.txt`,'utf8');
const archive=resolve(homedir(),'art/look-v3/vfx');await mkdir(archive,{recursive:true});
const master=`${archive}/${id}-light-master.png`;
if(await access(master).then(()=>true,()=>false)){
 if(hash(await readFile(master))!==sourceSha256)throw Error('Preserve existing master');
}else await copyFile(input,master);
const {width,height,hasAlpha}=await sharp(bytes).metadata();
if(!hasAlpha||width!==height||width%2)throw Error('Expected square even RGBA source');
const tiles=[],components=[];
for(let i=0;i<4;i++){
 const {data,info}=await sharp(bytes).extract({left:i%2*width/2,top:Math.floor(i/2)*height/2,width:width/2,height:height/2}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 let visible=0,transparent=0;
 for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++){
  const at=(y*info.width+x)*4+3,alpha=data[at];
  if(alpha>8)visible++;else transparent++;
  const t=Math.max(0,Math.min(1,Math.min(x,y,info.width-1-x,info.height-1-y)/24));
  data[at]=alpha<6?0:Math.round(alpha*t*t*(3-2*t));
 }
 if(visible<100||transparent<100)throw Error('Component lacks content/transparency');
 const image=await sharp(data,{raw:info}).resize(464,464).png().toBuffer();
 tiles.push({input:image,left:i%2*512+24,top:Math.floor(i/2)*512+24});
 components.push({tile:i,visiblePixels:visible,transparentPixels:transparent});
}
const output=`${root}/assets/cardrpg-look/v3-vfx/${id}-light.webp`;
if(await access(output).then(()=>true,()=>false))throw Error('Preserve existing packed asset');
await mkdir(dirname(output),{recursive:true});
await sharp({create:{width:1024,height:1024,channels:4,background:'#00000000'}}).composite(tiles).webp({quality:94,alphaQuality:100,effort:6}).toFile(output);
const packed=await readFile(output),record={id,createdAt:new Date().toISOString(),tool:'built-in image_gen',model:'not exposed',seed:'not exposed',parameters:{transparent_background:true,references:[]},prompt,master,sourceSha256,sourceSize:[width,height],output:output.slice(root.length+1),sha256:hash(packed),bytes:packed.length,components,postprocess:'Original alpha retained; alpha<6 removed;24px smooth edge taper;464px components with24px gutters;1024RGBA WebP94 alpha100',review,runtimeAccepted:false,temporalFrames:false};
const report=`${root}/reports/cardrpg-look/art-rebuild/r4/sources`;await mkdir(report,{recursive:true});
await writeFile(`${report}/${id}.json`,JSON.stringify(record,null,2)+'\n');
const provenance=`${root}/assets/provenance/look.md`;
await writeFile(provenance,await readFile(provenance,'utf8')+`\n## ${id} original VFX components — ${record.createdAt}\nBuilt-in image_gen; model/seed not exposed; transparent background; no references. Master ${master}; source SHA256 ${sourceSha256}. ${record.postprocess}. Output ${record.output}, SHA256 ${record.sha256}. Four independently animated components, not a generated video/flipbook. Review: ${review}. Runtime pending.\n\`\`\`text\n${prompt.trim()}\n\`\`\`\n`);
console.log(JSON.stringify({id,output:record.output,bytes:packed.length,sha256:record.sha256}));
