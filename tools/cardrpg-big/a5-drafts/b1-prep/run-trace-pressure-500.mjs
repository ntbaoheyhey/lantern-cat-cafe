import {spawn} from 'node:child_process';
import {access,open} from 'node:fs/promises';
import {setTimeout as delay} from 'node:timers/promises';
for(;;){try{await access('reports/cardrpg-big/a5/b1/pressure-500/results.json');break;}catch(e){if(e.code!=='ENOENT')throw e;await delay(10000);}}
for(const id of ['crumb','bell']){
 await delay(120000);const log=await open('reports/cardrpg-big/a5/b1/pressure-500/traces/'+id+'-attempt-1.log','wx');
 const code=await new Promise((done,reject)=>{const p=spawn(process.execPath,['tools/cardrpg-big/with-timing-lock.mjs','A5 pressure500 component trace '+id,process.execPath,'tools/cardrpg-big/a5-drafts/b1-prep/trace-pressure-500.mjs',id],{stdio:['ignore',log.fd,log.fd]});p.on('error',reject);p.on('close',done);});await log.close();console.log(JSON.stringify({id,code}));if(code!==0){process.exitCode=code;break;}
}
