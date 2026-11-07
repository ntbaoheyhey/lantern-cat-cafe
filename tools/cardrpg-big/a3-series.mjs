// REFERENCE: reports/cardrpg-big/memory/PROMPT-A3.md. Non-model short-window runner.
import { spawn } from 'node:child_process';
import { readFile, writeFile, mkdir, open } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
const phase=process.argv[2], out=process.env.A3_OUT_BASE||`reports/cardrpg-big/a3/${phase}`;
const sha=createHash('sha256').update(await readFile('docs/cardrpg3/index.html')).digest('hex');
await mkdir(out,{recursive:true});
const jobs=[];
if(phase==='task1') {
 for(const size of ['1280,720,1','1440,900,1','1024,600,1','1280,720,2','1440,900,2','1024,600,2']) jobs.push(['portraits-'+size.replaceAll(',','-'),'look-portrait-check.mjs',{LOOK_PORTRAIT_SHA:sha,LOOK_PORTRAIT_CONFIG:size,LOOK_PORTRAIT_OUT:`${out}/portraits-${size.replaceAll(',','-')}`}]);
 for(const [w,h] of [[1280,720],[1440,900],[1024,600]]) jobs.push(['meta-'+w,'meta-check.mjs',{BIG_META_CASES:JSON.stringify([[w,h]]),BIG_META_OUT:`${out}/meta-${w}`}]);
 jobs.push(['invitations','invitation-check.mjs',{BIG_INVITE_OUT:`${out}/invitations`}]);
 jobs.push(['reveal','reveal-check.mjs',{BIG_REVEAL_OUT:`${out}/reveal`,BIG_REVEAL_DIAGNOSTIC:'1'}]);
}
const receipt={sha256:sha,jobs:[]};
for(const [name,script,env] of jobs){
 if(process.env.A3_ONLY&&!process.env.A3_ONLY.split(',').includes(name))continue;
 const fd=await open(`${out}/${name}.log`,'w');
 const started=new Date().toISOString();
 const exit=await new Promise((done,reject)=>{const p=spawn(process.execPath,['tools/cardrpg-big/with-timing-lock.mjs',`A3 ${phase} ${name}`,process.execPath,`tools/cardrpg-big/${script}`],{env:{...process.env,...env},stdio:['ignore',fd.fd,fd.fd]});p.on('error',reject);p.on('close',done);});
 await fd.close();receipt.jobs.push({name,exit,started,ended:new Date().toISOString()});
 await writeFile(`${out}/functional.json`,JSON.stringify(receipt,null,2));console.log(JSON.stringify(receipt.jobs.at(-1)));
 await delay(6500);
}
process.exitCode=receipt.jobs.some(r=>r.exit!==0)?1:0;
