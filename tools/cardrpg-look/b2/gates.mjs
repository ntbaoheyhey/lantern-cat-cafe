import {spawn} from 'node:child_process';
import {mkdir,readFile,writeFile,open} from 'node:fs/promises';
import {withTimingLock} from '../lock.mjs';
const phase=process.argv[2]||'v0', out=`reports/cardrpg-look/validation/b2-${phase}${process.env.B2_GATE_RUN ? `-${process.env.B2_GATE_RUN}` : ""}`;
await mkdir(out,{recursive:true});
const rows=JSON.parse(await readFile(`${out}/source-gates.json`,'utf8').catch(()=>'[]'));
for(const [name,args] of [['typecheck',['typecheck']],['lint',['lint']],['unit',['test']],['build',['build']],...(['v0','v6'].includes(phase)?[['e2e',['--filter','@taskbar-hero/web','test:e2e']]]:[])]){
 if(rows.findLast(r=>r.name===name)?.code===0)continue;
 await withTimingLock(`B2 ${phase} ${name}`,async()=>{
  const log=await open(`${out}/${name}-resume.log`,'a'),startedAt=new Date().toISOString();
  const code=await new Promise((resolve,reject)=>{const child=spawn('pnpm',args,{stdio:['ignore',log.fd,log.fd],env:{...process.env,E2E_PORT_CLASSIC:'5920',E2E_PORT_V2:'5921',E2E_PORT_SERVER:'5922',E2E_PORT_API:'5923'}});child.on('error',reject);child.on('close',resolve)});
  await log.close();rows.push({name,code,startedAt,endedAt:new Date().toISOString(),log:`${out}/${name}-resume.log`});
  await writeFile(`${out}/source-gates.json`,JSON.stringify(rows,null,2));console.log(JSON.stringify(rows.at(-1)));
 });
 if(rows.at(-1).code!==0)break;
}
process.exitCode=[...new Set(rows.map(r=>r.name))].some(name=>rows.findLast(r=>r.name===name).code!==0)?1:0;
