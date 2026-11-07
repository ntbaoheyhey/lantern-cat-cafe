// Source gates are serialized to keep CPU-sensitive captures under the shared lock.
import { spawn } from 'node:child_process';
import { mkdir, writeFile, open } from 'node:fs/promises';
import { withTimingLock } from './lock.mjs';
const phase=process.argv[2]||'l0';
const root=`reports/cardrpg-look/validation/${phase}`;
await mkdir(root,{recursive:true});
const rows=[];
for(const [name,args] of [['typecheck',['typecheck']],['lint',['lint']],['unit',['test']],['build',['build']],['e2e',['--filter','@taskbar-hero/web','test:e2e']]]){
 await withTimingLock(`LOOK ${phase} ${name}`,async()=>{
 const log=await open(`${root}/${name}-resume.log`,'w');const startedAt=new Date().toISOString();
 const code=await new Promise((resolve,reject)=>{const child=spawn('pnpm',args,{stdio:['ignore',log.fd,log.fd],env:{...process.env,E2E_PORT_CLASSIC:'5920',E2E_PORT_V2:'5921',E2E_PORT_SERVER:'5922',E2E_PORT_API:'5923'}});child.on('error',reject);child.on('close',resolve)});
 await log.close(); rows.push({name,code,startedAt,endedAt:new Date().toISOString(),log:`${root}/${name}-resume.log`});
 await writeFile(`${root}/source-gates.json`,JSON.stringify(rows,null,2)+'\n');console.log(JSON.stringify(rows.at(-1)));
 });
}
process.exitCode=rows.some(x=>x.code!==0)?1:0;
