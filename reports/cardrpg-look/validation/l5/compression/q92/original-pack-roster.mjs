// Explicit quality study; leaves existing model deliveries untouched.
import {spawn} from 'node:child_process';
import {mkdir,readFile,writeFile,access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import {withTimingLock} from './lock.mjs';
const [source,target,qualityText='92']=process.argv.slice(2);
const quality=Number(qualityText),owners=(process.env.LOOK_OWNERS||'panko,mallow,cinnamon').split(',');
if(!source||!target||!Number.isInteger(quality)||quality<80||quality>100)throw Error('source target quality80–100 required');
const cli='/Users/bao/tools/cardrpg-look/npm/node_modules/.bin/gltf-transform';
const hash=b=>createHash('sha256').update(b).digest('hex');
const run=args=>new Promise((resolve,reject)=>{const p=spawn(cli,args,{stdio:'inherit'});p.once('error',reject);p.once('close',c=>c===0?resolve():reject(Error(`gltf-transform ${c}`)))});
await mkdir(target,{recursive:true});
const receipt={quality,dimensions:'Retain 1024px source textures',method:'Re-encode texture payloads with WebP; preserve meshopt geometry and named nodes',rows:[],status:'Visual comparison required'};
for(const owner of owners){
 if(!/^[a-z-]+$/.test(owner))throw Error('Invalid owner');
 const input=`${source}/${owner}.glb`,output=`${target}/${owner}.glb`,before=await readFile(input);
 if(await access(output).then(()=>true,()=>false))throw Error(`Preserve existing output ${output}`);
 const args=['webp',input,output,'--quality',String(quality),'--effort','100','--lossless','false','--near-lossless','false'];
 await withTimingLock(`LOOK L5 ${owner} texture quality ${quality}`,()=>run(args));
 if(hash(await readFile(input))!==hash(before))throw Error('Input changed while packing');
 const after=await readFile(output);
 receipt.rows.push({owner,input,output,parameters:args,before:before.length,after:after.length,gzipBefore:gzipSync(before).length,gzipAfter:gzipSync(after).length,sourceSha256:hash(before),sha256:hash(after)});
 await writeFile(`${target}/packing.json`,JSON.stringify(receipt,null,2)+'\n');
}
console.log(JSON.stringify(receipt));
