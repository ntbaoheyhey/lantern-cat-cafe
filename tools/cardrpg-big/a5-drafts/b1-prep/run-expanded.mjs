import {spawn} from 'node:child_process';
import {mkdir,open,readdir,access} from 'node:fs/promises';
import {setTimeout as delay} from 'node:timers/promises';
const base='reports/cardrpg-big/a5/b1/expanded-01';
for(const scope of ['tiers','equipped','sets','teams'])for(const variant of ['aware-latched','aware-distributed']){
 const out=`${base}/${variant}/${scope}`;await mkdir(out,{recursive:true});
 try{await access(out+'/results.json');continue;}catch(e){if(e.code!=='ENOENT')throw e;}
 let attempt=1+Math.max(0,...(await readdir(out)).map(n=>Number(n.match(/^slice-(\d+)\.log$/)?.[1]??0))),code;
 do {
  await delay(120000);
  const log=await open(out+`/slice-${attempt++}.log`,'wx');
  try{code=await new Promise((done,reject)=>{const child=spawn(process.execPath,['tools/cardrpg-big/with-timing-lock.mjs',`A5 expanded TRAIN ${variant} ${scope}`,process.execPath,'/tmp/cardrpg-a5-b1-prep/expanded-01/matrix.mjs'],{env:{...process.env,A5_VARIANT:variant,BIG_BALANCE_OUT:out,BIG_BALANCE_SCOPE:scope,BIG_BALANCE_SAMPLE:'pilot',BIG_BALANCE_COUNT:'50'},stdio:['ignore',log.fd,log.fd]});child.on('error',reject);child.on('close',done);});}finally{await log.close();}
  console.log(JSON.stringify({variant,scope,code}));
 }while(code===75);
 if(code!==0){process.exitCode=code;break;}
}
