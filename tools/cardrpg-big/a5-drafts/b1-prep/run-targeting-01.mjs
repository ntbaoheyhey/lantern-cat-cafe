import {spawn} from 'node:child_process';
import {mkdir,open,readdir} from 'node:fs/promises';
import {setTimeout as delay} from 'node:timers/promises';
const directory='reports/cardrpg-big/a5/b1/targeting-01';await mkdir(directory,{recursive:true});
let code,index=1+Math.max(0,...(await readdir(directory)).map(name=>Number(name.match(/^attempt-(\d+)\.log$/)?.[1]??0)));
do{
 await delay(120000);
 const log=await open(directory+'/attempt-'+index+++'.log','wx');
 try{code=await new Promise((done,reject)=>{
  const child=spawn(process.execPath,['tools/cardrpg-big/with-timing-lock.mjs','A5 B1 registered targeting01 TRAIN',process.execPath,'tools/cardrpg-big/a5-drafts/b1-prep/targeting-01.mjs'],{stdio:['ignore',log.fd,log.fd]});
  child.on('error',reject);child.on('close',done);
 });}finally{await log.close();}
}while(code===75);
console.log(JSON.stringify({code}));process.exitCode=code??1;
