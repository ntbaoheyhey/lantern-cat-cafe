// REFERENCE: reply-pressure39. Native bounded jobs; every completed sample is resumed, never rerolled.
import assert from 'node:assert/strict';
import {readFile,writeFile,open,mkdir,readdir} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {setTimeout as delay} from 'node:timers/promises';
const root='reports/cardrpg-big/a5/b1/reply-pressure-39',arms=JSON.parse(await readFile(root+'/arms.json'));
const sha=b=>createHash('sha256').update(b).digest('hex');
const completed=JSON.parse(await readFile(root+'/completed.json','utf8').catch(e=>{if(e.code==='ENOENT')return '[]';throw e;}));
for(const name of arms){
 const out=root+'/'+name,reg=JSON.parse(await readFile(out+'/REGISTERED-METHOD.json')),obs=JSON.parse(await readFile(out+'/OBSERVER.json'));
 const jobs=[['candidate',reg.sourceRoot,['tools/cardrpg-big/a5-reply-pressure-probe.mjs',name,'candidate'],{}],['observed',obs.sourceRoot,['tools/cardrpg-big/a5-reply-pressure-probe.mjs',name,'observed'],{}],['equipped',reg.sourceRoot,[out+'/matrix.mjs'],{BIG_BALANCE_SCOPE:'equipped',BIG_BALANCE_OUT:out+'/balance/equipped',BIG_BALANCE_SAMPLE:'pilot',BIG_BALANCE_COUNT:'50'}]];
 await mkdir(out+'/logs',{recursive:true});
 for(const [task,sourceRoot,args,env]of jobs){
  const id=name+'/'+task;if(completed.includes(id))continue;
  let code,slice=1+Math.max(0,...(await readdir(out+'/logs')).map(p=>Number(p.match(new RegExp('^'+task+'-(\\d+)\\.log$'))?.[1]??0)));
  do{
   const source=task==='observed'?obs:reg;for(const[p,h]of Object.entries(source.source))assert.equal(sha(await readFile(sourceRoot+'/'+p)),h,p);
   for(const[p,h]of Object.entries(reg.scripts))assert.equal(sha(await readFile(p)),h,p);
   const log=out+'/logs/'+task+'-'+slice+++'.log',fd=await open(log,'wx');
   try{code=await new Promise((done,reject)=>{const c=spawn(process.execPath,['tools/cardrpg-big/with-timing-lock.mjs','A5 reply pressure39 '+id,process.execPath,...args],{env:{...process.env,...env,BIG_RULES_ROOT:sourceRoot},stdio:['ignore',fd.fd,fd.fd]});c.on('error',reject);c.on('close',done);});}finally{await fd.close();}
   console.log(JSON.stringify({id,log,code}));
   if(code!==0&&code!==75)process.exit(code??1);
   await delay(7000);
  }while(code===75);
  completed.push(id);await writeFile(root+'/completed.json',JSON.stringify(completed)+'\n');
 }
}
