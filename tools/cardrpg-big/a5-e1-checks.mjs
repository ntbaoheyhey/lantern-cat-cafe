// REFERENCE: PROMPT-A5 E1. Bounded leases and retained attempts, targeted checks only.
import {spawn} from 'node:child_process';
import {mkdir,readFile,writeFile,open} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {setTimeout as delay} from 'node:timers/promises';
import assert from 'node:assert/strict';
const out=process.env.A5_E1_CHECKS_OUT||'reports/cardrpg-big/a5/e1/checks';await mkdir(out,{recursive:true});
const steps=[['rules',['tools/cardrpg-big/a5-e1-rules.mjs'],{}],['offline-build',['tools/cardrpg-big/build.mjs'],{BIG_OUTPUT_DIR:'/tmp/cardrpg-a5-e1-artifact',BIG_GAMEPLAY_V4:'1',BIG_PYTHON:'/tmp/cardrpg-a5-tools/bin/python'}],...[1280,1440,1024].map(w=>['browser-'+w,['tools/cardrpg-big/a5-e1-browser.mjs',String(w)],{}])];
const rows=JSON.parse(await readFile(out+'/checks.json','utf8').catch(e=>{if(e.code==='ENOENT')return '[]';throw e;}));
for(const [name,args,env] of steps){
 if(rows.some(r=>r.name===name&&r.code===0))continue;
 const attempt=1+rows.filter(r=>r.name===name).length;assert(attempt<=3);
 const log=`${out}/${name}-attempt-${attempt}.log`,fd=await open(log,'wx');let code;
 try{code=await new Promise((done,reject)=>{const child=spawn(process.execPath,['tools/cardrpg-big/with-timing-lock.mjs','A5 E1 '+name,process.execPath,...args],{env:{...process.env,...env},stdio:['ignore',fd.fd,fd.fd]});child.on('error',reject);child.on('close',done);});}finally{await fd.close();}
 const row={name,attempt,code,log,sha256:createHash('sha256').update(await readFile(log)).digest('hex')};rows.push(row);await writeFile(out+'/checks.json',JSON.stringify(rows,null,2));console.log(JSON.stringify(row));
 if(code!==0){process.exitCode=code;break;}await delay(7000);
}
