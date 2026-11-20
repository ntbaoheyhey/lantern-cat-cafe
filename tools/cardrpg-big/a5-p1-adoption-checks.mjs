import {spawn} from 'node:child_process';
import {mkdir,open,readFile,writeFile,access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {setTimeout as delay} from 'node:timers/promises';
const out='reports/cardrpg-big/a5/p1/adoption',harness='tools/cardrpg-big/a5-startup-check.mjs';
const reg=JSON.parse(await readFile(out+'/REGISTERED-STARTUP.json','utf8'));
assert.equal(createHash('sha256').update(await readFile(harness)).digest('hex'),reg.harnessSha256);
const dirs={main:'/tmp/cardrpg-a5-p1-prep/main-dist',candidate:'/tmp/cardrpg-a5-p1-adopted-default'};
async function run(label,args,env,log){
 await delay(7000);const fd=await open(log,'wx');
 try {const code=await new Promise((done,reject)=>{const child=spawn(process.execPath,['tools/cardrpg-big/with-timing-lock.mjs',label,process.execPath,...args],{env:{...process.env,...env},stdio:['ignore',fd.fd,fd.fd]});child.on('error',reject);child.on('close',done);});console.log(JSON.stringify({label,code}));assert.equal(code,0,'Retain failure before any correction');}finally{await fd.close();}
}
await run('A5 P1 adopted default build',[harness,'--prepare'],{BIG_FLAG_OFF_DIST:dirs.candidate,BIG_FLAG_OFF_OUT:out+'/default-build'},out+'/default-build-attempt-1.log');
for(const name of ['main','candidate']){
 const bytes=await readFile(dirs[name]+'/build-receipt.json'),build=JSON.parse(bytes);
 assert.equal(build.head.slice(0,9),(name==='main'?reg.baseline:reg.candidate).slice(0,9));
 await writeFile(out+'/'+name+'-build.json',bytes);
}
for(const [width,cpu] of reg.configs)for(let i=0;i<reg.observations;i++)for(const name of reg.order[i]){
 const target=`${out}/startup/${name}-${width}-cpu${cpu}-run${i+1}`;await mkdir(target,{recursive:true});
 await run(`A5 P1 adopted ${name} ${width} CPU${cpu} run${i+1}`,[harness],{BIG_FLAG_OFF_DIST:dirs[name],BIG_FLAG_OFF_OUT:target,BIG_STARTUP_WIDTH:String(width),BIG_STARTUP_CPU:String(cpu)},target+'/attempt-1.log');
}
for(const width of [1440,1024]){
 await run('A5 P1 lazy screen flow '+width,['tools/cardrpg-big/a5-c1-browser.mjs',String(width)],{A5_C1_ARTIFACT:'/tmp/cardrpg-a5-p1-adopted/index.html',A5_C1_OUTPUT:out+'/flows'},out+`/flow-${width}-attempt-1.log`);
}
console.log('Fixed adopted-source observations complete; numerical misses must remain visible.');
