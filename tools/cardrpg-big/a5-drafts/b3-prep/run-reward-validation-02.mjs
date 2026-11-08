import {spawn} from 'node:child_process';
import {readFile,open,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {setTimeout as delay} from 'node:timers/promises';
const out='reports/cardrpg-big/a5/b3/reward-validation-02',runner='tools/cardrpg-big/a5-drafts/b3-prep/reward-validation-02.mjs';
const reg=JSON.parse(await readFile(out+'/REGISTERED-METHOD.json','utf8'));
assert.equal(createHash('sha256').update(await readFile(runner)).digest('hex'),reg.runnerSha256);
let attempt=1+Math.max(0,...(await readdir(out)).map(f=>Number(f.match(/^slice-(\d+)\.log$/)?.[1]??0))),code;
do{
 await delay(7000);const fd=await open(`${out}/slice-${attempt++}.log`,'wx');
 try{code=await new Promise((done,reject)=>{const p=spawn(process.execPath,['tools/cardrpg-big/with-timing-lock.mjs','A5 corrected rewards original90-account parity',process.execPath,runner],{stdio:['ignore',fd.fd,fd.fd]});p.on('error',reject);p.on('close',done);});}finally{await fd.close();}
 console.log(JSON.stringify({attempt:attempt-1,code}));
}while(code===75);
process.exitCode=code;
