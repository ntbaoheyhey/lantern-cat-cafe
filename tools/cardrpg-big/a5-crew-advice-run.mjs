// REFERENCE: crew-advice28. Original90 earned inputs; no new combat sampling.
import {spawn} from 'node:child_process';
import {open,readFile} from 'node:fs/promises';
import {setTimeout as delay} from 'node:timers/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const root='reports/cardrpg-big/a5/e1/crew-advice-28',reg=JSON.parse(await readFile(root+'/REGISTERED-METHOD.json'));
const sha=x=>createHash('sha256').update(x).digest('hex');
let code,slice=1;
do{
 for(const [p,h]of Object.entries(reg.source))assert.equal(sha(await readFile(reg.sourceRoot+'/'+p)),h,p);
 for(const [p,h]of Object.entries({...reg.scripts,...reg.savedInputs}))assert.equal(sha(await readFile(p)),h,p);
 const fd=await open(root+`/cohort-${slice++}.log`,'wx');
 try{code=await new Promise((done,reject)=>{const c=spawn(process.execPath,['tools/cardrpg-big/with-timing-lock.mjs','A5 owned cat advice28 saved-day7',process.execPath,root+'/cohort.mjs'],{env:{...process.env,BIG_RULES_ROOT:reg.sourceRoot,A5_DAY7_OUT:root+'/day7-checks'},stdio:['ignore',fd.fd,fd.fd]});c.once('error',reject);c.once('close',done);});}finally{await fd.close();}
 console.log(JSON.stringify({slice:slice-1,code}));await delay(7000);
}while(code===75);
assert.equal(code,0);
