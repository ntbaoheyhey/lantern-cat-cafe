// REFERENCE: pilot-01/REGISTERED-STARTUP.json. Original fixed observations; never reroll.
import {readFile,writeFile,mkdir,open,access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
import assert from 'node:assert/strict';
const base='reports/cardrpg-big/a5/p1/pilot-01',prep='/tmp/cardrpg-a5-p1-prep';
const reg=JSON.parse(await readFile(base+'/REGISTERED-STARTUP.json','utf8'));
const sha=b=>createHash('sha256').update(b).digest('hex');
assert.equal(sha(await readFile(prep+'/startup-pilot.mjs')),reg.harnessSha256);
assert.equal(sha(await readFile(prep+'/pixel-packing.mjs')),reg.candidateTransformSha256);
const builds={};for(const name of ['main','packed']){
 const dir=prep+(name==='main'?'/main-dist':'/dist');
 builds[name]={dir,receipt:JSON.parse(await readFile(dir+'/build-receipt.json','utf8'))};
 assert.equal(builds[name].receipt.head,name==='main'?reg.baseline:reg.candidateRuntime);
 await writeFile(base+'/'+name+'-build.json',JSON.stringify(builds[name].receipt,null,2));
}
for(const [width,cpu]of reg.configs)for(let observation=1;observation<=reg.observations;observation++)for(const name of reg.order[observation-1]){
 const out=`${base}/${name}-${width}-cpu${cpu}-run${observation}`;
 try{await access(out+'/checks.json');assert(!JSON.parse(await readFile(out+'/checks.json','utf8')).incomplete);continue;}catch(e){if(e.code!=='ENOENT')throw e;}
 await delay(7000);await mkdir(out,{recursive:true});const log=await open(out+'/attempt-1.log','wx');
 let code;try{code=await new Promise((done,reject)=>{
 const child=spawn(process.execPath,['tools/cardrpg-big/with-timing-lock.mjs',`A5 startup ${name} ${width} CPU${cpu} observation${observation}`,process.execPath,prep+'/startup-pilot.mjs'],{env:{...process.env,BIG_FLAG_OFF_DIST:builds[name].dir,BIG_FLAG_OFF_OUT:out,BIG_STARTUP_WIDTH:String(width),BIG_STARTUP_CPU:String(cpu)},stdio:['ignore',log.fd,log.fd]});child.on('error',reject);child.on('close',done);
 });}finally{await log.close();}
 console.log(JSON.stringify({name,width,cpu,observation,code}));assert.equal(code,0,'Preserve failed observation before any correction');
}
console.log('Registered startup observations complete; no automatic production adoption.');
