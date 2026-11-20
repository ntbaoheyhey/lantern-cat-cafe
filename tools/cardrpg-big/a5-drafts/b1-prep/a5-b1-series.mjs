// REFERENCE: A5 B1 train-only diagnostics. No model calls; short shared-lock windows, retained receipts.
import {spawn} from 'node:child_process';
import {mkdir,open} from 'node:fs/promises';
import {setTimeout as delay} from 'node:timers/promises';
const dir='reports/cardrpg-big/a5/b1';await mkdir(dir,{recursive:true});
let index=1;
async function run(label,command,args){
 const log=await open(`${dir}/${label}-${String(index++).padStart(3,'0')}.log`,'a');
 try{return await new Promise((resolve,reject)=>{
  const child=spawn(process.execPath,['tools/cardrpg-big/with-timing-lock.mjs',`A5 B1 ${label}`,command,...args],{stdio:['ignore',log.fd,log.fd]});
  child.on('error',reject);child.on('close',resolve);
 });}finally{await log.close();}
}
let code;
do{code=await run('ablation',process.execPath,['tools/cardrpg-big/a5-b1-ablation.mjs']);if(code===75)await delay(7000);}while(code===75);
if(code===0){await delay(7000);code=await run('trace',process.execPath,['tools/cardrpg-big/a5-b1-replays.mjs']);}
if(code===0){code=await run('report','python3',['tools/cardrpg-big/a5-b1-report.py']);}
process.exitCode=code??1;
