import {spawn} from 'node:child_process';
import {open,readFile,writeFile} from 'node:fs/promises';
import {withTimingLock} from '/Users/bao/taskbar-hero-cardrpg-look/tools/cardrpg-look/lock.mjs';
const path='reports/cardrpg-look/validation/l1-publish';
await withTimingLock('LOOK L1 E2E network recovery',async()=>{
 const logPath=path+'/e2e-resume3.log',log=await open(logPath,'w'),startedAt=new Date().toISOString();
 const code=await new Promise((ok,no)=>{const p=spawn('pnpm',['--filter','@taskbar-hero/web','test:e2e'],{stdio:['ignore',log.fd,log.fd],env:{...process.env,E2E_PORT_CLASSIC:'5920',E2E_PORT_V2:'5921',E2E_PORT_SERVER:'5922',E2E_PORT_API:'5923'}});p.on('close',ok);p.on('error',no)});
 await log.close();const rows=JSON.parse(await readFile(path+'/source-gates.json','utf8'));rows[4]={name:'e2e',code,startedAt,endedAt:new Date().toISOString(),log:logPath,priorAttempt:'reports/cardrpg-look/validation/attempts/l1-publish-network-failure-20261107/source-gates.json'};
 await writeFile(path+'/source-gates.json',JSON.stringify(rows,null,2)+'\n');console.log(JSON.stringify(rows[4]));process.exitCode=code;
});
