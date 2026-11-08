import {spawn} from 'node:child_process';
import {readFile,open,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {setTimeout as delay} from 'node:timers/promises';
import assert from 'node:assert/strict';
const out='reports/cardrpg-big/a5/b2/utility-suppression-15/carriers',reg=JSON.parse(await readFile(out+'/REGISTERED-METHOD.json'));

let code,slice=1+Math.max(0,...(await readdir(out)).map(f=>Number(f.match(/^slice-(\d+)\.log$/)?.[1]??0)));
do{const fd=await open(`${out}/slice-${slice++}.log`,'wx');try{code=await new Promise((done,reject)=>{const p=spawn(process.execPath,['tools/cardrpg-big/with-timing-lock.mjs','A5 Hush utility suppression carrier TRAIN',process.execPath,'tools/cardrpg-big/a5-set-carriers.mjs'],{env:{...process.env,A5_CARRIERS_OUT:out,BIG_RULES_ROOT:reg.sourceRoot},stdio:['ignore',fd.fd,fd.fd]});p.on('error',reject);p.on('close',done);});}finally{await fd.close();}console.log(JSON.stringify({slice:slice-1,code}));if(code===75)await delay(7000);}while(code===75);process.exitCode=code??1;
