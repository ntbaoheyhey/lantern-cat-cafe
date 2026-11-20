// REFERENCE: PROMPT-A4 G0. One process per lock window; no model calls.
import { spawn } from 'node:child_process';
import { mkdir, open, writeFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
const out='reports/cardrpg-big/a4/g0'; await mkdir(out,{recursive:true});
const jobs=[
 ['gear-train','tools/cardrpg-big/gear-sim.mjs',['a4-g0-train'],{}],
 ['gear-heldout','tools/cardrpg-big/gear-sim.mjs',['a4-g0-heldout'],{BIG_OFFSET:'10000'}],
 ['economy','tools/cardrpg-depth/economy.mjs',[],{BIG_ECONOMY_POLICY:'auto',BIG_ECONOMY_OUT:`${out}/economy.json`}],
 ['off-baseline','tools/cardrpg-big/a4-baseline.mjs',[],{}],
 ['first-hour','tools/cardrpg-big/auto-path-check.mjs',[],{BIG_PATH_OUT:`${out}/first-hour`,BIG_PATH_CASES:'[[1280,720]]'}],
 ['audit-browser','tools/cardrpg-big/a4-g0-browser.mjs',[],{}],
];
const receipts=[];
for(const [name,script,args,env] of jobs){
 const file=await open(`${out}/${name}.log`,'w');
 const started=new Date().toISOString();
 const code=await new Promise((done,reject)=>{
  const child=spawn(process.execPath,['tools/cardrpg-big/with-timing-lock.mjs',`A4 G0 ${name}`,'nice','-n','10',process.execPath,script,...args],{env:{...process.env,...env},stdio:['ignore',file.fd,file.fd]});
  const timer=setTimeout(()=>child.kill('SIGTERM'),19*60*1000);
  child.on('error',reject);child.on('close',code=>{clearTimeout(timer);done(code)});
 });
 await file.close();receipts.push({name,script,args,env,started,ended:new Date().toISOString(),code});
 await writeFile(`${out}/series.json`,JSON.stringify(receipts,null,2));console.log(JSON.stringify(receipts.at(-1)));
 await delay(6500);
}
process.exitCode=receipts.some(r=>r.code!==0)?1:0;
