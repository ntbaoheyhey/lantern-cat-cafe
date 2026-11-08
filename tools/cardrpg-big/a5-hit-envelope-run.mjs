import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, open, readdir } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
const out='reports/cardrpg-big/a5/b1/hit-envelope-25';await mkdir(`${out}/logs`,{recursive:true});
let code,slice=1+Math.max(0,...(await readdir(`${out}/logs`)).map(p=>Number(p.match(/^slice-(\d+)\.log$/)?.[1]??0)));
do{
 const fd=await open(`${out}/logs/slice-${slice++}.log`,'wx');
 try{code=await new Promise((done,reject)=>{
  const p=spawn(process.execPath,['tools/cardrpg-big/with-timing-lock.mjs','A5 boss hit envelope25 TRAIN',process.execPath,'tools/cardrpg-big/a5-hit-envelope.mjs'],{stdio:['ignore',fd.fd,fd.fd]});
  p.on('error',reject);p.on('close',done);
 });}finally{await fd.close();}
 console.log(JSON.stringify({slice:slice-1,code}));await delay(7000);
}while(code===75);
assert.equal(code,0);
