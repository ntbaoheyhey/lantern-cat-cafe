// Run the predeclared S8 observations once; no model calls, retuning or sample resets.
import {readFile,writeFile,open,mkdir} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
import assert from 'node:assert/strict';
const root='reports/cardrpg-big/skills-v5',out=root+'/s8';
const json=async p=>JSON.parse(await readFile(p,'utf8'));
const optional=async p=>readFile(p,'utf8').then(JSON.parse).catch(e=>{if(e.code==='ENOENT')return null;throw e;});
assert.equal((await json(root+'/s5/selected/receipt-audit.json')).status,'PASS');
assert(await readFile(root+'/S5-REPORT.md'));
const home=await json(out+'/home/REGISTERED-METHOD.json');
await json(out+'/startup/REGISTERED-METHOD.json');
const performance=await json(out+'/performance/REGISTERED-METHOD.json');
await json(out+'/day7/REGISTERED-METHOD.json');
const runs=await optional(out+'/series.json')??[];
async function run(id,args,env={}){
  await mkdir(out+'/logs',{recursive:true});
  const attempt=runs.filter(r=>r.id===id).length+1,log=`${out}/logs/${id}-${attempt}.log`;
  const fd=await open(log,'wx'),started=new Date().toISOString();
  let code;
  try{code=await new Promise((done,reject)=>{const c=spawn(process.execPath,args,{env:{...process.env,...env},stdio:['ignore',fd.fd,fd.fd]});c.on('error',reject);c.on('close',done);});}
  finally{await fd.close();}
  runs.push({id,attempt,started,ended:new Date().toISOString(),code,log});
  await writeFile(out+'/series.json',JSON.stringify(runs,null,2)+'\n');
  console.log(JSON.stringify(runs.at(-1)));assert.equal(code,0,'Retain the failed run; inspect before any further action');
}
const priorHome=await optional(out+'/home/session/timeline.json');
if(!priorHome){await run('home',['tools/cardrpg-big/skills-v5/home-session.mjs'],{BIG_RULES_ROOT:home.sourceRoot});}
else assert(priorHome.complete,'An incomplete Home session must not be replaced by another fresh save');
if(!await optional(out+'/home/metrics.json'))await run('home-report',['tools/cardrpg-big/skills-v5/home-report.mjs']);
if(!await optional(out+'/startup/summary.json'))await run('startup',['tools/cardrpg-big/skills-v5/startup-series.mjs']);
for(const c of performance.cases){
  const prior=await optional(`${out}/performance/${c.id}/checks.json`);
  if(prior){assert(prior.complete,'Do not reroll an incomplete observation');continue;}
  await run('performance-'+c.id,['tools/cardrpg-big/with-timing-lock.mjs','V5A S8 '+c.id,process.execPath,performance.script,c.id]);
  await delay(7000);
}
const priorDay7=await optional(out+'/day7/checks.json');
if(priorDay7)assert(priorDay7.complete,'Do not reroll an incomplete earned account observation');
else await run('day7',['tools/cardrpg-big/with-timing-lock.mjs','V5A S8 fixed earned day7 route',process.execPath,'tools/cardrpg-big/skills-v5/day7-browser.mjs']);
await run('source-gates',['tools/cardrpg-big/skills-v5/validate.mjs','s8']);
await run('compatibility',['tools/cardrpg-big/skills-v5/reuse-compat.mjs','s5-selected','s8']);
await run('closure',['tools/cardrpg-big/skills-v5/close.mjs','s8']);
await run('report',['tools/cardrpg-big/skills-v5/s8-report.mjs']);
console.log(JSON.stringify({phase:'s8',complete:true,acceptanceSampled:false}));
