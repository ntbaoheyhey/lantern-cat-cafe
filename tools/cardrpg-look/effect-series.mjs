// Explicit six-action windows on one immutable artifact; no exhaustive matrix.
import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { withTimingLock } from './lock.mjs';
const out=process.env.LOOK_EFFECT_OUT;
const ids=process.env.LOOK_EFFECT_IDS?.split(',');
if(!out||!ids?.length)throw Error('Explicit output directory and IDs are required');
const run=(command,args,env={})=>new Promise((resolve,reject)=>{
 const child=spawn(command,args,{stdio:'inherit',env:{...process.env,...env}});
 child.once('error',reject);child.once('close',code=>code===0?resolve():reject(Error(`${command}: ${code}`)));
});
const captures=[];
await mkdir(out,{recursive:true});
for(let offset=0;offset<ids.length;offset+=6){
 const batch=`${out}/batch-${offset/6+1}`;
 await withTimingLock(`LOOK L4 effect review ${offset+1}-${Math.min(offset+6,ids.length)}`,
  ()=>run(process.execPath,['tools/cardrpg-look/capture-effects.mjs'],{
   BIG_EFFECT_OUT:batch,LOOK_EFFECT_IDS:ids.slice(offset,offset+6).join(','),LOOK_SKIP_REPORT:'1',
  }));
 captures.push(JSON.parse(await readFile(`${batch}/captures.json`,'utf8')));
}
if(new Set(captures.map(r=>r.sha256)).size!==1)throw Error('Artifact changed within review round');
const receipt={...captures[0],rows:captures.flatMap(r=>r.rows),errors:captures.flatMap(r=>r.errors)};
await writeFile(`${out}/captures.json`,JSON.stringify(receipt,null,2)+'\n');
await mkdir(`${out}/frames`,{recursive:true});await mkdir(`${out}/sheets`,{recursive:true});
await run('/Users/bao/tools/cardrpg-look/venv/bin/python',['tools/cardrpg-big/effect-report.py',out]);
