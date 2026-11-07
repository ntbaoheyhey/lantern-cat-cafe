// One immutable first-batch runtime pilot. Full phase gates run after L5 source.
import {spawn} from 'node:child_process';
import {mkdir,readFile,writeFile,access} from 'node:fs/promises';
import {withTimingLock} from './lock.mjs';
const out=process.env.LOOK_ROSTER_PILOT_OUT||'reports/cardrpg-look/validation/l5/batch1/pilot-1';
const owners=process.env.LOOK_OWNERS||'panko,mallow,cinnamon';
if(await access(`${out}/index.html`).then(()=>true,()=>false))throw Error('Preserve existing pilot; choose a new output directory');
await mkdir(out,{recursive:true});
const run=(script,env={})=>new Promise((resolve,reject)=>{
 const child=spawn(process.execPath,[script],{stdio:'inherit',env:{...process.env,...env}});
 child.once('error',reject);child.once('close',code=>code===0?resolve():reject(Error(`${script}: ${code}`)));
});
await withTimingLock('LOOK L5 roster pilot build',async()=>{
 await run('tools/cardrpg-look/build.mjs');
 // Freeze the pair before releasing the build lock to another pilot.
 await writeFile(`${out}/index.html`,await readFile('docs/cardrpg-look/index.html'));
 await writeFile(`${out}/build.json`,await readFile('docs/cardrpg-look/build.json'));
});
await run('tools/cardrpg-look/pose-capture.mjs',{LOOK_ARTIFACT:`${out}/index.html`,LOOK_OUT:`${out}/poses`,LOOK_OWNERS:owners});
await run('tools/cardrpg-look/capture.mjs',{LOOK_ARTIFACT:`${out}/index.html`,LOOK_OUT:`${out}/stills`,LOOK_OWNERS:owners,LOOK_KINDS:'unit',LOOK_SIZES:'[[1024,600],[1280,720],[1440,900]]',LOOK_TIME:'3.2'});
console.log(JSON.stringify({out,owners,status:'Captured; visual review required, not phase acceptance'}));
