// One combined acceptance run, alternating both configurations per scope. Native tools only.
import {readFile,writeFile,mkdir,open} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
import assert from 'node:assert/strict';
const root='reports/cardrpg-big/skills-v5',out=root+'/s6',json=async p=>JSON.parse(await readFile(p,'utf8'));
const reg=await json(root+'/REGISTERED-METHOD.json'),sha=b=>createHash('sha256').update(b).digest('hex');
assert.equal(reg.block,'20001–20500');
assert.equal(sha(await readFile(root+'/PRE-S6-REVISIT.md')),reg.repairReviewSha256,'Pre-S6 repair review changed after registration');
for(const [p,h]of Object.entries({...reg.source,...reg.tools}))assert.equal(sha(await readFile(p)),h,p);
const run=async(args,env,log)=>{const fd=await open(log,'wx');try{return await new Promise((done,reject)=>{const c=spawn(process.execPath,args,{env:{...process.env,...env},stdio:['ignore',fd.fd,fd.fd]});c.on('error',reject);c.on('close',done);});}finally{await fd.close();}};
for(const scope of reg.scopes)for(const mode of ['on','off']){
 const dir=`${out}/${mode}/${scope}`;await mkdir(dir,{recursive:true});
 if(!await readFile(dir+'/REGISTERED-METHOD.json').catch(e=>{if(e.code==='ENOENT')return null;throw e;})){
  const args=['economy','day7','editions'].includes(scope)?['tools/cardrpg-big/skills-v5/register-progression.mjs',dir,scope,mode,'20000',...(scope==='day7'?[`${out}/${mode}/economy/day7`]:[])]:['tools/cardrpg-big/skills-v5/register.mjs',dir,scope,'500',mode,'20000',reg.chosenCrew.join(',')];
  assert.equal(await run(args,{V5_DESIGN_METRICS:'1'},dir+'/registration.log'),0);
 }
 const child=await json(dir+'/REGISTERED-METHOD.json');assert.equal(child.sourceDigest,reg.sourceDigest);assert.equal(child.offset,20000);assert.equal(child.skillsV5,mode==='on');
 const script='tools/cardrpg-big/skills-v5/'+({metrics:'design-metrics-v3',pieces:'bare-matrix',economy:'economy',day7:'day7',editions:'editions'}[scope]??'matrix')+'.mjs';
 const key={metrics:'V5_METRICS_OUT',economy:'V5_PROGRESSION_OUT',day7:'V5_DAY7_OUT',editions:'V5_EDITIONS_OUT'}[scope]??'V5_MATRIX_OUT';
 const planPath=dir+'/plan.json';await writeFile(planPath,JSON.stringify({jobs:[{out:dir,label:`V5A S6 ${mode} ${scope} registered20001-20500`,script,env:{[key]:dir}}]},null,2));
 const prior=await readFile(dir+'/results.json').catch(e=>{if(e.code==='ENOENT')return null;throw e;});
 if(!prior){let attempt=1;while(await readFile(`${dir}/coordinator-${attempt}.log`).catch(e=>{if(e.code==='ENOENT')return null;throw e;}))attempt++;
  assert.equal(await run(['tools/cardrpg-big/skills-v5/series.mjs',planPath],{},`${dir}/coordinator-${attempt}.log`),0,'Keep failure; no automatic source change or sample reset');}
 assert(await readFile(dir+'/results.json'));console.log(JSON.stringify({mode,scope,complete:true}));await delay(7000);
}
console.log(JSON.stringify({complete:true,block:reg.block,modes:['on','off']}));
