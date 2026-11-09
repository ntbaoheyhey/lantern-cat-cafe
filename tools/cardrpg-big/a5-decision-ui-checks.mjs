// REFERENCE: PROMPT-A5 C1/E1. Integrated adopted source, bounded shared leases, original attempts retained.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {spawn} from 'node:child_process';
import {mkdir,open,readFile,writeFile} from 'node:fs/promises';
import {setTimeout as delay} from 'node:timers/promises';
const root='reports/cardrpg-big/a5/c1-decisions',out=root+'/ui-checks';
await mkdir(out,{recursive:true});
const rows=JSON.parse(await readFile(out+'/checks.json','utf8').catch(e=>{if(e.code==='ENOENT')return '[]';throw e;}));
const draft='tools/cardrpg-big/a5-drafts/decision-ui-57';
const steps=[['supplement',[draft+'/supplement.mjs'],{}],['next-run-advice',[draft+'/next-run-advice.mjs'],{}],
 ...['on','off'].map(mode=>['build-'+mode,['tools/cardrpg-big/build.mjs'],{BIG_GAMEPLAY_V4:mode==='on'?'1':'0',BIG_OUTPUT_DIR:root+'/artifact-'+mode,BIG_PYTHON:'/tmp/cardrpg-a5-tools/bin/python'}]),
 ...['route','home','result'].flatMap(flow=>['on','off'].flatMap(mode=>[1280,1440,1024].map(width=>[`${flow}-${mode}-${width}`,[draft+'/'+flow+'-browser.mjs',mode,String(width)],{
  A5_DECISIONS_ARTIFACT:root+'/artifact-'+mode+'/index.html',A5_DECISIONS_OUTPUT:root+'/'+flow,
  A5_DECISIONS_FIXTURES:root+'/result-fixtures.json',
 }]))),
];
for(const[name,args,env]of steps){
 if(rows.some(r=>r.name===name&&r.code===0))continue;
 const attempt=rows.filter(r=>r.name===name).length+1;assert(attempt<=3,name);
 if(env.A5_DECISIONS_OUTPUT)await mkdir(env.A5_DECISIONS_OUTPUT,{recursive:true});
 const log=`${out}/${name}-attempt-${attempt}.log`,fd=await open(log,'wx'),started=new Date().toISOString();let code;
 try {code=await new Promise((done,reject)=>{
  const p=spawn(process.execPath,['tools/cardrpg-big/with-timing-lock.mjs','A5 decisions '+name,process.execPath,...args],{env:{...process.env,...env,A5_ROUTE_ATTEMPT:String(attempt),A5_HOME_ATTEMPT:String(attempt),A5_RESULT_ATTEMPT:String(attempt)},stdio:['ignore',fd.fd,fd.fd]});p.on('error',reject);p.on('close',done);
 });}finally{await fd.close();}
 rows.push({name,attempt,code,started,ended:new Date().toISOString(),log,sha256:createHash('sha256').update(await readFile(log)).digest('hex')});
 await writeFile(out+'/checks.json',JSON.stringify(rows,null,2)+'\n');console.log(JSON.stringify(rows.at(-1)));
 if(code!==0){process.exitCode=code||1;break;}await delay(7000);
}
