// REFERENCE: A5 Route53 isolated prototype. Original drafts and failed attempts retained.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {spawn} from 'node:child_process';
import {mkdir,open,readFile,writeFile} from 'node:fs/promises';
import {setTimeout as delay} from 'node:timers/promises';
const out='reports/cardrpg-big/a5/c1-route-order/prototype-checks';
await mkdir(out,{recursive:true});
const rows=JSON.parse(await readFile(out+'/checks.json','utf8').catch(e=>{if(e.code==='ENOENT')return '[]';throw e;}));
const draft='tools/cardrpg-big/a5-drafts/route-order-53';
const steps=[
 ['fixtures',[draft+'/fixtures.mjs'],{}],
 ['before',[draft+'/browser.mjs','on','1280','before'],{}],
 ...['on','off'].map(mode=>['build-'+mode,[draft+'/build-sandbox.mjs',mode],{}]),
 ...['on','off'].flatMap(mode=>[1280,1440,1024].map(width=>[mode+'-'+width,[draft+'/browser.mjs',mode,String(width)],{}])),
];
for(const[name,args,env]of steps){
 if(rows.some(r=>r.name===name&&r.code===0))continue;
 const attempt=rows.filter(r=>r.name===name).length+1;assert(attempt<=3,'Two correction rounds exhausted: '+name);
 const log=`${out}/${name}-attempt-${attempt}.log`,fd=await open(log,'wx'),started=new Date().toISOString();let code;
 try{code=await new Promise((done,reject)=>{
  const p=spawn(process.execPath,['tools/cardrpg-big/with-timing-lock.mjs',`A5 Route order53 ${name}`,process.execPath,...args],{
   env:{...process.env,...env,A5_ROUTE_ATTEMPT:String(attempt)},stdio:['ignore',fd.fd,fd.fd]});p.on('error',reject);p.on('close',done);
 });}finally{await fd.close();}
 rows.push({name,attempt,code,started,ended:new Date().toISOString(),log,sha256:createHash('sha256').update(await readFile(log)).digest('hex')});
 await writeFile(out+'/checks.json',JSON.stringify(rows,null,2)+'\n');console.log(JSON.stringify(rows.at(-1)));
 if(code!==0){process.exitCode=code||1;break;}await delay(7000);
}
