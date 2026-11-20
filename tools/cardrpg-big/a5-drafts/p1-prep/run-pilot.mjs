import {spawn} from 'node:child_process';
import {readFile,open,access} from 'node:fs/promises';
import {setTimeout as delay} from 'node:timers/promises';
const dir='/tmp/cardrpg-a5-p1-prep';
for(;;){
 const rows=JSON.parse(await readFile('reports/cardrpg-big/a5/c1-reviewed/gates/checks.json','utf8'));
 if(rows.length===6&&rows.every(r=>r.code===0))break;
 process.kill(68925,0);await delay(10000);
}
await delay(120000);
const log=await open(dir+'/build-attempt-1.log','wx');
const code=await new Promise((done,reject)=>{
 const child=spawn(process.execPath,['tools/cardrpg-big/with-timing-lock.mjs','A5 P1 isolated lossless packing build',process.execPath,dir+'/startup-pilot.mjs','--prepare'],{env:{...process.env,A5_PACK_PIXELS:'1',BIG_FLAG_OFF_DIST:dir+'/dist',BIG_FLAG_OFF_OUT:dir+'/pilot',BIG_FLAG_OFF_HEAD:'c4a883e5ea9f3d7e8424d799b2dafc73cc51d8df'},stdio:['ignore',log.fd,log.fd]});
 child.on('error',reject);child.on('close',done);
});
await log.close();console.log(JSON.stringify({code}));process.exitCode=code;
