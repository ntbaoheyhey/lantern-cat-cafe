// Bounded serial native tools, no model requests or worker pool.
import {spawn} from 'node:child_process';
import {open,readFile,writeFile,mkdir} from 'node:fs/promises';
import {setTimeout as delay} from 'node:timers/promises';
import assert from 'node:assert/strict';
const planPath=process.argv[2];assert(planPath);const plan=JSON.parse(await readFile(planPath,'utf8'));
for(const job of plan.jobs){
 await mkdir(job.out,{recursive:true});let slice=1;
 while(true){
  const exists=await readFile(job.out+'/results.json','utf8').catch(e=>{if(e.code==='ENOENT')return null;throw e;});if(exists){console.log(JSON.stringify({job:job.label,complete:true}));break;}
  let fd;while(!fd){try{fd=await open(`${job.out}/slice-${slice}.log`,'wx');}catch(e){if(e.code!=='EEXIST')throw e;slice++;}}
  const began=new Date().toISOString(),code=await new Promise((done,reject)=>{const child=spawn(process.execPath,['tools/cardrpg-big/with-timing-lock.mjs',job.label,process.execPath,job.script],{env:{...process.env,...job.env},stdio:['ignore',fd.fd,fd.fd]});child.on('error',reject);child.on('close',done);});await fd.close();
  await writeFile(`${job.out}/slice-${slice}.json`,JSON.stringify({began,ended:new Date().toISOString(),code},null,2));console.log(JSON.stringify({job:job.label,slice,code}));assert([0,75].includes(code));
  if(code===0)assert(await readFile(job.out+'/results.json').catch(e=>{if(e.code==='ENOENT')return null;throw e;}),'Successful slice must produce results; a cancelled waiting wrapper must not silently requeue');
  await delay(7000);slice++;
 }
}
