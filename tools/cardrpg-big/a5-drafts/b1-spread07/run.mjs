import {spawn} from 'node:child_process';import {mkdir,open,readFile} from 'node:fs/promises';import {setTimeout as delay} from 'node:timers/promises';
const root='/tmp/cardrpg-a5-encounter-spread-07',base='reports/cardrpg-big/a5/b1/encounter-spread-07';
for(const variant of ['spread30','spread50']){
 const out=base+'/'+variant+'/equipped';await mkdir(out,{recursive:true});let code,slice=1;
 do{const fd=await open(`${out}/slice-${slice++}.log`,'wx');try{code=await new Promise((done,reject)=>{const p=spawn(process.execPath,['tools/cardrpg-big/with-timing-lock.mjs','A5 encounter pressure TRAIN '+variant,process.execPath,root+'/'+variant+'/matrix.mjs'],{env:{...process.env,BIG_RULES_ROOT:root+'/'+variant+'/source',BIG_BALANCE_SCOPE:'equipped',BIG_BALANCE_OUT:out,BIG_BALANCE_SAMPLE:'pilot',BIG_BALANCE_COUNT:'50'},stdio:['ignore',fd.fd,fd.fd]});p.on('error',reject);p.on('close',done);});}finally{await fd.close();}console.log(JSON.stringify({variant,slice:slice-1,code}));await delay(7000);}while(code===75);
 if(code!==0){process.exitCode=code;break;}
}
