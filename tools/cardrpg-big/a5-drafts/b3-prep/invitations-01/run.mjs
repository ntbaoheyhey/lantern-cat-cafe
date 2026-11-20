import {spawn} from 'node:child_process';
import {readFile,mkdir,copyFile,open,readdir} from 'node:fs/promises';
import {setTimeout as delay} from 'node:timers/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const base='/tmp/cardrpg-a5-b3-prep/invitations-01',out='reports/cardrpg-big/a5/b3/invitations-01';
for(;;){const c=JSON.parse(await readFile('reports/cardrpg-big/a5/c1-reviewed/gates/checks.json','utf8'));if(c.length===6&&c.every(x=>x.code===0))break;try{process.kill(68925,0);}catch{throw Error('C1 original gates ended without six PASS; inspect original logs before starting this deferred sample');}await delay(10000);}
await mkdir(out,{recursive:true});await copyFile(base+'/REGISTERED-METHOD.json',out+'/REGISTERED-METHOD.json');
const m=JSON.parse(await readFile(base+'/REGISTERED-METHOD.json','utf8'));assert.equal(createHash('sha256').update(await readFile(base+'/runner.mjs')).digest('hex'),m.runnerSha256);
let n=1+Math.max(0,...(await readdir(out)).map(x=>Number(x.match(/^slice-(\d+)\.log$/)?.[1]??0))),code;
do{await delay(120000);const log=await open(out+`/slice-${n++}.log`,'wx');try{code=await new Promise((resolve,reject)=>{const p=spawn(process.execPath,['tools/cardrpg-big/with-timing-lock.mjs','A5 B3 registered invitation candidate',process.execPath,base+'/runner.mjs'],{stdio:['ignore',log.fd,log.fd]});p.on('error',reject);p.on('close',resolve);});}finally{await log.close();}console.log(JSON.stringify({slice:n-1,code}));}while(code===75);
process.exitCode=code;
