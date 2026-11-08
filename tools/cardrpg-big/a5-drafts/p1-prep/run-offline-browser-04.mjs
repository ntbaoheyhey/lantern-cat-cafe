import {spawn} from 'node:child_process';
import {mkdir,open,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {setTimeout as delay} from 'node:timers/promises';
const base='reports/cardrpg-big/a5/p1/pilot-04',harness='tools/cardrpg-big/a5-drafts/p1-prep/offline-browser-04.mjs';
const registration=JSON.parse(await readFile(base+'/REGISTERED-BROWSER.json','utf8'));
assert.equal(createHash('sha256').update(await readFile(harness)).digest('hex'),registration.harnessSha256);
for(let run=1;run<=3;run++){
 await delay(120000);const out=base+'/packed-cpu4-run'+run;await mkdir(out,{recursive:true});const log=await open(out+'/attempt-1.log','wx');
 const code=await new Promise((done,reject)=>{const child=spawn(process.execPath,['tools/cardrpg-big/with-timing-lock.mjs','A5 dictionary04 CPU4 run'+run,process.execPath,harness],{env:{...process.env,A5_TRANSPORT_VARIANT:'packed',A5_TRANSPORT_RUN:String(run)},stdio:['ignore',log.fd,log.fd]});child.on('error',reject);child.on('close',done);});await log.close();console.log(JSON.stringify({run,code}));if(code!==0){process.exitCode=code;break;}
}
