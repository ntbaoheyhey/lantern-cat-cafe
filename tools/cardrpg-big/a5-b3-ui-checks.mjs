// REFERENCE: B3 targeted UI checks. Separate logs; no screenshot pack or acceptance sampling.
import {spawn} from 'node:child_process';
import {mkdir,open,writeFile,readFile} from 'node:fs/promises';
import {setTimeout as delay} from 'node:timers/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const out=process.env.A5_B3_UI_OUT||'reports/cardrpg-big/a5/b3/ui-checks';await mkdir(out,{recursive:true});
const steps=[['earned-selector',['tools/cardrpg-big/a5-b3-earned-selector.mjs'],{}],
 ['offline-build',['tools/cardrpg-big/build.mjs'],{BIG_OUTPUT_DIR:process.env.A5_B3_BUILD_OUT||'/tmp/cardrpg-a5-b3-adopted',BIG_GAMEPLAY_V4:'1'}],
 ...[1280,1440,1024].map(w=>['browser-'+w,['tools/cardrpg-big/a5-b3-browser.mjs',String(w)],{}])];
const rows=JSON.parse(await readFile(out+'/checks.json','utf8').catch(e=>{if(e.code==='ENOENT')return '[]';throw e;}));
for(const [name,args,env] of steps){
 if(name==='earned-selector'&&process.env.A5_B3_REUSE_EARNED==='1'){await readFile('reports/cardrpg-big/a5/b3/earned-selector/ready.save');continue;}
 if(rows.some(r=>r.name===name&&r.code===0))continue;
 const attempt=1+rows.filter(r=>r.name===name).length;assert(attempt<=3);
 const log=`${out}/${name}-attempt-${attempt}.log`,fd=await open(log,'wx');
 let code;try{code=await new Promise((done,reject)=>{
  const child=spawn(process.execPath,['tools/cardrpg-big/with-timing-lock.mjs','A5 B3 '+name,process.execPath,...args],{env:{...process.env,...env},stdio:['ignore',fd.fd,fd.fd]});
  child.on('error',reject);child.on('close',done);
 });}finally{await fd.close();}
 rows.push({name,attempt,code,log,sha256:createHash('sha256').update(await readFile(log)).digest('hex')});await writeFile(out+'/checks.json',JSON.stringify(rows,null,2));
 console.log(JSON.stringify(rows.at(-1)));if(code!==0){process.exitCode=code;break;}await delay(7000);
}
