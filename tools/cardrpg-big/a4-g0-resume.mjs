// REFERENCE: PROMPT-A4 G0. Resume checkpointed sims; release shared timing lock between shards.
import {spawn} from 'node:child_process';
import {open,writeFile} from 'node:fs/promises';
import {setTimeout as delay} from 'node:timers/promises';
const out='reports/cardrpg-big/a4/g0', receipts=[];
const jobs=[
 ['day7','a4-baseline',['--day7'],{}],
 ['first-hour','auto-path-check',[],{BIG_PATH_OUT:`${out}/first-hour`,BIG_PATH_CASES:'[[1280,720]]'}],
 ['gear-train','a4-gear-sim',['a4-g0-train'],{}],
 ['gear-heldout','a4-gear-sim',['a4-g0-heldout'],{BIG_OFFSET:'10000'}],
 ['off-baseline','a4-baseline',[],{}],
 ['economy','a4-economy',[],{BIG_ECONOMY_POLICY:'auto',BIG_ECONOMY_OUT:`${out}/economy.json`}],
];
for(const [name,script,args,env]of jobs){
 let code,shard=0;
 do{
  const file=await open(`${out}/${name}-shard${++shard}.log`,'a'),start=new Date().toISOString();
  code=await new Promise((done,reject)=>{
   const child=spawn(process.execPath,['tools/cardrpg-big/with-timing-lock.mjs',`A4 G0 ${name} shard${shard}`,'nice','-n','10',process.execPath,`tools/cardrpg-big/${script}.mjs`,...args],{env:{...process.env,...env},stdio:['ignore',file.fd,file.fd]});
   child.on('error',reject);child.on('close',done);
  });
  await file.close();receipts.push({name,shard,start,end:new Date().toISOString(),code});
  await writeFile(`${out}/resume-series.json`,JSON.stringify(receipts,null,2));console.log(JSON.stringify(receipts.at(-1)));
  await delay(6500);
 }while(code===75);
}
