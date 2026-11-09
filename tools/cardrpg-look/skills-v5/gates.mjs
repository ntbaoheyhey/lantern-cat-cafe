import {spawn} from 'node:child_process';
import {mkdir,open,writeFile} from 'node:fs/promises';
import {setTimeout as delay} from 'node:timers/promises';
const out=process.env.V5_GATES_OUT||'reports/cardrpg-look/skills-v5/gates';await mkdir(out,{recursive:true});const rows=[];
for(const [name,args] of [['typecheck',['typecheck']],['lint',['lint']],['unit',['test']],['build',['build']],['e2e',['--filter','@taskbar-hero/web','test:e2e']]]){
 const log=await open(`${out}/${name}.log`,'w'),startedAt=new Date().toISOString();
 const code=await new Promise((res,rej)=>{
  const p=spawn(process.execPath,['tools/cardrpg-big/with-timing-lock.mjs',`V5LOOK V0.1 ${name}`,'pnpm',...args],{stdio:['ignore',log.fd,log.fd],env:{...process.env,E2E_PORT_CLASSIC:'5920',E2E_PORT_V2:'5921',E2E_PORT_SERVER:'5922',E2E_PORT_API:'5923'}});
  const timer=setTimeout(()=>p.kill('SIGTERM'),18*60*1000);p.on('error',rej);p.on('close',c=>{clearTimeout(timer);res(c)});
 });
 await log.close();rows.push({name,code,startedAt,endedAt:new Date().toISOString()});await writeFile(`${out}/checks.json`,JSON.stringify(rows,null,2));console.log(JSON.stringify(rows.at(-1)));
 await delay(6500);if(code!==0){process.exitCode=1;break;}
}
