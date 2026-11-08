import {spawn} from 'node:child_process';
import {readFile,open,mkdir,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {setTimeout as delay} from 'node:timers/promises';
import assert from 'node:assert/strict';
const root='reports/cardrpg-big/a5/b1/spread50-followup-09',reg=JSON.parse(await readFile(root+'/REGISTERED-METHOD.json'));
assert.equal(createHash('sha256').update(await readFile(root+'/matrix.mjs')).digest('hex'),reg.matrixSha256);
for(const [p,h] of Object.entries(reg.source))assert.equal(createHash('sha256').update(await readFile(reg.sourceRoot+'/'+p)).digest('hex'),h,p);
for(const scope of reg.scopes){
 const out=root+'/'+scope;await mkdir(out,{recursive:true});
 let code,slice=1+Math.max(0,...(await readdir(out)).map(f=>Number(f.match(/^slice-(\d+)\.log$/)?.[1]??0)));
 do{
  const fd=await open(`${out}/slice-${slice++}.log`,'wx');
  try{code=await new Promise((done,reject)=>{const p=spawn(process.execPath,['tools/cardrpg-big/with-timing-lock.mjs','A5 spread50 wider TRAIN '+scope,process.execPath,root+'/matrix.mjs'],{env:{...process.env,BIG_RULES_ROOT:reg.sourceRoot,BIG_BALANCE_OUT:out,BIG_BALANCE_SCOPE:scope,BIG_BALANCE_SAMPLE:'pilot',BIG_BALANCE_COUNT:'50'},stdio:['ignore',fd.fd,fd.fd]});p.on('error',reject);p.on('close',done);});}finally{await fd.close();}
  console.log(JSON.stringify({scope,slice:slice-1,code}));await delay(7000);
 }while(code===75);
 if(code!==0){process.exitCode=code??1;break;}
}
if(!process.exitCode){const p=spawn(process.execPath,['tools/cardrpg-big/a5-train-summary.mjs',root],{stdio:'inherit'});process.exitCode=await new Promise(done=>p.on('close',done));}
