// Geometry compression preserves authored nodes; no renderer dependency is installed here.
import { readdir,readFile,writeFile,mkdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { withTimingLock } from './lock.mjs';
const source=process.argv[2]||'assets/cardrpg2/models';
const target=process.argv[3]||'assets/cardrpg-look/fallback-models';
const cli='/Users/bao/tools/cardrpg-look/npm/node_modules/.bin/gltf-transform';
await mkdir(target,{recursive:true});const rows=[];
for(const name of (await readdir(source)).filter(n=>n.endsWith('.glb') && (!process.env.LOOK_PACK_OWNERS || process.env.LOOK_PACK_OWNERS.split(',').includes(n.replace(/\.glb$/, ''))))){
 const args=['optimize',`${source}/${name}`,`${target}/${name}`,'--compress','meshopt','--flatten','false','--join','false','--instance','false','--palette','false','--simplify','false','--prune','false','--texture-compress','webp','--texture-size','1024'];
 await withTimingLock(`LOOK meshopt ${name}`,()=>new Promise((resolve,reject)=>{const child=spawn(cli,args,{stdio:'inherit'});child.on('error',reject);child.on('close',code=>code===0?resolve():reject(Error(`${name}: ${code}`)))}));
 const before=await readFile(`${source}/${name}`),after=await readFile(`${target}/${name}`);
 rows.push({name,parameters:args.slice(3),before:before.length,after:after.length,gzipBefore:gzipSync(before).length,gzipAfter:gzipSync(after).length,sha256:createHash('sha256').update(after).digest('hex')});
 await writeFile(`${target}/packing.json`,JSON.stringify({tool:'glTF-Transform4.5.1',rows},null,2)+'\n');
}
