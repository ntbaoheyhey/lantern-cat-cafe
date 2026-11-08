import {spawn} from 'node:child_process';
import {readFile,mkdir,open,access} from 'node:fs/promises';
import {setTimeout as delay} from 'node:timers/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const base='reports/cardrpg-big/a5/p1/pilot-03',harness='tools/cardrpg-big/a5-drafts/p1-prep/offline-browser-03.mjs';
const reg=JSON.parse(await readFile(`${base}/REGISTERED-BROWSER.json`,'utf8'));
const correction=JSON.parse(await readFile(`${base}/REGISTERED-BROWSER-CORRECTION1.json`,'utf8'));
assert.equal(createHash('sha256').update(await readFile(harness)).digest('hex'),correction.harnessSha256);
assert.equal(createHash('sha256').update(await readFile(correction.retainedObservation.path)).digest('hex'),correction.retainedObservation.sha256);
for(let run=1;run<=3;run++)for(const variant of reg.order[run-1]){
 if(variant==='original'&&run===1){console.log(JSON.stringify({variant,run,retained:true,reason:'Completed timing retained after no-error assertion correction'}));continue;}
 const out=`${base}/${variant}-cpu4-run${run}`;
 try{await access(out+'/checks.json');assert.equal(JSON.parse(await readFile(out+'/checks.json','utf8')).passed,true);continue;}catch(e){if(e.code!=='ENOENT')throw e;}
 await delay(7000);await mkdir(out,{recursive:true});const log=await open(out+'/attempt-1.log','wx');let code;
 try{code=await new Promise((done,reject)=>{
  const child=spawn(process.execPath,['tools/cardrpg-big/with-timing-lock.mjs',`A5 offline transport ${variant} CPU4 run${run}`,process.execPath,harness],{env:{...process.env,A5_TRANSPORT_VARIANT:variant,A5_TRANSPORT_RUN:String(run)},stdio:['ignore',log.fd,log.fd]});
  child.on('error',reject);child.on('close',done);
 });}finally{await log.close();}
 console.log(JSON.stringify({variant,run,code}));assert.equal(code,0,'Preserve failed observation before correction');
}
