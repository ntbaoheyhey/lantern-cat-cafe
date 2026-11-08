import {spawn} from 'node:child_process';
import {open} from 'node:fs/promises';
import {setTimeout as delay} from 'node:timers/promises';
const root='/tmp/cardrpg-a5-band-anchored-03',out='reports/cardrpg-big/a5/b3/band-anchored-03';
let code,slice=1;
do{const fd=await open(`${out}/slice-${slice++}.log`,'wx');try{code=await new Promise((done,reject)=>{const p=spawn(process.execPath,['tools/cardrpg-big/with-timing-lock.mjs','A5 anchored early-band TRAIN',process.execPath,root+'/cohort.mjs'],{env:{...process.env,BIG_RULES_ROOT:root+'/source',A5_DAY7_OUT:out},stdio:['ignore',fd.fd,fd.fd]});p.on('error',reject);p.on('close',done);});}finally{await fd.close();}console.log(JSON.stringify({slice:slice-1,code}));if(code===75)await delay(7000);}while(code===75);
process.exitCode=code??1;
