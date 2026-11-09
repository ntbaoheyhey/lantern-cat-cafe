// Explicit quality study; leaves existing model deliveries untouched.
import {spawn} from 'node:child_process';
import {mkdir,readFile,writeFile,access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import {withTimingLock} from './lock.mjs';
const [source,target,qualityText='92',sizeText='512',detailText=sizeText]=process.argv.slice(2);
const quality=Number(qualityText),size=Number(sizeText),detail=Number(detailText),owners=(process.env.LOOK_OWNERS||'panko,mallow,cinnamon').split(',');
if(!source||!target||!Number.isInteger(quality)||quality<80||quality>100||![512,1024].includes(size))throw Error('source target quality80–100 size512|1024 required');
if(![256,512,1024].includes(detail)||detail>size)throw Error('Detail resolution must be 256/512/1024 and no larger than color');
const cli='/Users/bao/tools/cardrpg-look/npm/node_modules/.bin/gltf-transform';
const hash=b=>createHash('sha256').update(b).digest('hex');
const run=args=>new Promise((resolve,reject)=>{const p=spawn(cli,args,{stdio:'inherit'});p.once('error',reject);p.once('close',c=>c===0?resolve():reject(Error(`gltf-transform ${c}`)))});
await mkdir(target,{recursive:true});
const script=await readFile(new URL(import.meta.url));
await writeFile(`${target}/packer-source.mjs`,script,{flag:'wx'});
const receipt={quality,size,detail,scriptSha256:hash(script),method:'From raw GLB: resize textures, optionally resize normal/metallic-roughness separately, encode WebP, then meshopt high. No geometry simplification. Preview GLB retains uncompressed geometry for studio comparison.',rows:[],status:'Visual comparison required'};
for(const owner of owners){
 if(!/^[a-z-]+$/.test(owner))throw Error('Invalid owner');
 const input=`${source}/${owner}.glb`,output=`${target}/${owner}.glb`,before=await readFile(input);
 if(await access(output).then(()=>true,()=>false))throw Error(`Preserve existing output ${output}`);
 const json=JSON.parse(before.subarray(20,20+before.readUInt32LE(12)).toString());
 if(json.extensionsUsed?.includes('EXT_meshopt_compression'))throw Error('Use raw source to avoid repeated geometry quantization');
 const resized=`${target}/${owner}-resized.glb`,preview=`${target}/${owner}-preview.glb`;
 const normal=`${target}/${owner}-normal-sized.glb`,material=`${target}/${owner}-material-sized.glb`;
 const args=[['resize',input,resized,'--width',String(size),'--height',String(size)],
 ...(detail<size?[
 ['resize',resized,normal,'--width',String(detail),'--height',String(detail),'--pattern','*normal'],
 ['resize',normal,material,'--width',String(detail),'--height',String(detail),'--pattern','*roughness'],
 ]:[]),
 ['webp',detail<size?material:resized,preview,'--quality',String(quality),'--effort','100','--lossless','false','--near-lossless','false'],
 ['meshopt',preview,output,'--level','high']];
 await withTimingLock(`LOOK L5 ${owner} ${size}px texture quality ${quality}`,async()=>{for(const command of args)await run(command)});
 if(hash(await readFile(input))!==hash(before))throw Error('Input changed while packing');
 const after=await readFile(output);
 receipt.rows.push({owner,input,output,preview,parameters:args,before:before.length,after:after.length,gzipBefore:gzipSync(before).length,gzipAfter:gzipSync(after).length,sourceSha256:hash(before),sha256:hash(after),previewSha256:hash(await readFile(preview))});
 await writeFile(`${target}/packing.json`,JSON.stringify(receipt,null,2)+'\n');
}
console.log(JSON.stringify(receipt));
