// Validate the changed runtime while the original-art renderer waits its turn.
// This pilot records whichever immutable atlas pack was used; no art acceptance.
import {spawn} from 'node:child_process';
import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {withTimingLock} from '../../../tools/cardrpg-look/lock.mjs';
const out='reports/cardrpg-look/rounds/effects/round-4-preflight';
await mkdir(out);
const run=(command,args,env={})=>new Promise((resolve,reject)=>{
 const child=spawn(command,args,{stdio:'inherit',env:{...process.env,...env}});
 child.once('error',reject);child.once('close',code=>code===0?resolve():reject(Error(`${command}: ${code}`)));
});
const node=process.execPath,hash=bytes=>createHash('sha256').update(bytes).digest('hex');
await withTimingLock('LOOK L4 changed-shader preflight build',async()=>{
 const packing=await readFile('assets/cardrpg-look/flipbooks/packing.json');
 await run(node,['tools/cardrpg-look/build.mjs']);
 if(hash(packing)!==hash(await readFile('assets/cardrpg-look/flipbooks/packing.json')))throw Error('Atlas pack changed during pilot build');
 await writeFile(`${out}/packing.json`,packing);
 await copyFile('docs/cardrpg-look/index.html','/tmp/cardrpg-look-l4-preflight.html');
 await copyFile('docs/cardrpg-look/build.json',`${out}/build.json`);
});
await run(node,['tools/cardrpg-look/l4-check.mjs'],{BIG_ARTIFACT:'/tmp/cardrpg-look-l4-preflight.html',LOOK_OUT:`${out}/gpu`});
await run(node,['tools/cardrpg-look/l4-loading-check.mjs'],{BIG_ARTIFACT:'/tmp/cardrpg-look-l4-preflight.html',LOOK_OUT:`${out}/cancellation`});
await writeFile(`${out}/checks-complete.json`,JSON.stringify({at:new Date().toISOString(),notPhaseAcceptance:true,artReviewed:false},null,2)+'\n');
