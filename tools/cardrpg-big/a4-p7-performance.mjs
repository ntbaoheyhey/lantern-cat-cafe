// REFERENCE: GAMEPLAY-V4 P7. Serial cold measurements with shared-machine handoffs.
import {spawn} from 'node:child_process';
import {mkdir,readFile,writeFile,open,rename} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {setTimeout as delay} from 'node:timers/promises';
import assert from 'node:assert/strict';
// Short browser windows yield at least 6.5s; CPU-heavy source gates retain 120s.
const handoffMs=Number(process.env.BIG_P7_HANDOFF_MS||30000);
assert(Number.isFinite(handoffMs)&&handoffMs>=6500);
const out='reports/cardrpg-big/a4/p7/performance',node=process.execPath;
await mkdir(out,{recursive:true});
const steps=[['candidate-build',['tools/cardrpg-big/a4-p7-startup.mjs','--prepare'],{BIG_FLAG_OFF_DIST:'/tmp/cardrpg-a4-p7-dist'}]];
for(const [name,directory] of [['main','/tmp/cardrpg-a4-main-dist'],['candidate','/tmp/cardrpg-a4-p7-dist']])for(const [width,cpu] of [[1280,1],[1280,4],[1440,1]]){
 const label=`${name}-${width}-cpu${cpu}`;
 steps.push([label,['tools/cardrpg-big/a4-p7-startup.mjs'],{BIG_FLAG_OFF_DIST:directory,BIG_FLAG_OFF_OUT:`${out}/${label}`,BIG_STARTUP_WIDTH:String(width),BIG_STARTUP_CPU:String(cpu)}]);
}
for(const [width,height,dpr,cpu] of [[1280,720,1,1],[1280,720,2,1],[1440,900,1,1],[1440,900,2,1],[1280,720,1,4],[1280,720,2,4],[2560,1440,1,1]]){
 const label=`offline-${width}-dpr${dpr}-cpu${cpu}`;
 steps.push([label,['tools/cardrpg-big/a4-p7-cold.mjs'],{BIG_OUT:`${out}/${label}`,BIG_SCENARIOS:JSON.stringify([[width,height,dpr,cpu]]),BIG_CAPTURE:'0',BIG_NO_TRACE:label==='offline-1280-dpr1-cpu1'?'':'1'}]);
}
const rows=JSON.parse(await readFile(`${out}/series.json`,'utf8').catch(()=>'[]'));
const sha=async()=>createHash('sha256').update(await readFile('docs/cardrpg3/index.html')).digest('hex');
const expected=await sha();
for(const[name,args,env]of steps){
 if(rows.some(r=>r.name===name&&r.code===0))continue;
 const previous=rows.filter(r=>r.name===name).length;
 assert(previous<3,`Two correction rounds exhausted: ${name}`);
 if(previous&&name!=='candidate-build'){await mkdir(`${out}/retained`,{recursive:true});try{await rename(`${out}/${name}`,`${out}/retained/${name}-attempt${previous}`);}catch(e){if(e.code!=='ENOENT')throw e;}}
 const log=`${out}/${name}-attempt${rows.filter(r=>r.name===name).length+1}.log`,fd=await open(log,'wx'),start=new Date().toISOString();
 const code=await new Promise((done,reject)=>{const child=spawn(node,['tools/cardrpg-big/with-timing-lock.mjs',`A4 P7 ${name}`,node,...args],{env:{...process.env,...env},stdio:['ignore',fd.fd,fd.fd]});child.on('error',reject);child.on('close',done);});
 await fd.close();if(await sha()!==expected)throw Error('Offline artifact changed during P7 measurements');
 rows.push({name,start,end:new Date().toISOString(),code,log});await writeFile(`${out}/series.json`,JSON.stringify(rows,null,2));
 console.log(rows.at(-1));if(name==='candidate-build'&&code!==0)break;await delay(handoffMs);
}
process.exitCode=steps.every(([name])=>rows.some(r=>r.name===name&&r.code===0))?0:1;
