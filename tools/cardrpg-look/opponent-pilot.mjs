// Preserve the exact build pair before sampling selected opponent actions.
import {spawn} from 'node:child_process';
import {mkdir,readFile,writeFile,access} from 'node:fs/promises';
import {withTimingLock} from './lock.mjs';
const out=process.env.LOOK_OPPONENT_PILOT_OUT;
const owners=process.env.LOOK_OWNERS;
if(!out||!owners)throw Error('LOOK_OPPONENT_PILOT_OUT and LOOK_OWNERS required');
if(await access(`${out}/index.html`).then(()=>true,()=>false))throw Error('Preserve existing pilot');
await mkdir(out,{recursive:true});
const run=(script,env={})=>new Promise((resolve,reject)=>{
  const child=spawn(process.execPath,[script],{stdio:'inherit',env:{...process.env,...env}});
  child.once('error',reject);child.once('close',code=>code===0?resolve():reject(Error(`${script}: ${code}`)));
});
await withTimingLock('LOOK L5 opponent pilot build',async()=>{
  await run('tools/cardrpg-look/build.mjs');
  for(const file of ['index.html','build.json'])await writeFile(`${out}/${file}`,await readFile(`docs/cardrpg-look/${file}`),{flag:'wx'});
});
await run('tools/cardrpg-look/opponent-pose-capture.mjs',{LOOK_ARTIFACT:`${out}/index.html`,LOOK_OUT:`${out}/poses`,LOOK_OWNERS:owners});
if(process.env.LOOK_CAT_OWNERS)await run('tools/cardrpg-look/pose-capture.mjs',{
  LOOK_ARTIFACT:`${out}/index.html`,LOOK_OUT:`${out}/cat-poses`,LOOK_OWNERS:process.env.LOOK_CAT_OWNERS,
});
console.log(JSON.stringify({out,owners,status:'Pilot captured; visual review required, not phase acceptance'}));
