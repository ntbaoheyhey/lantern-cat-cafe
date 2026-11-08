import {readFile,mkdir,copyFile,open} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
const out='reports/cardrpg-big/a5/b2/link-probe';await mkdir(out,{recursive:true});
await copyFile('/tmp/cardrpg-a5-b2-prep/REGISTERED-LINK-PROBE.json',out+'/REGISTERED-METHOD.json');
for(;;){const s=await readFile('/tmp/cardrpg-a5-yield-to-b.jsonl','utf8');if(s.includes('handoff-ended'))break;await delay(5000);}
await delay(120000);
const log=await open(out+'/attempt-1.log','wx');
try{process.exitCode=await new Promise((done,reject)=>{const p=spawn(process.execPath,['tools/cardrpg-big/with-timing-lock.mjs','A5 read-only link shield diagnosis',process.execPath,'/tmp/cardrpg-a5-b2-prep/link-probe.mjs'],{stdio:['ignore',log.fd,log.fd]});p.on('error',reject);p.on('close',done);});}
finally{await log.close();}
