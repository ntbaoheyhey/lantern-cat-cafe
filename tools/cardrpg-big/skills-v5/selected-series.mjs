// Full TRAIN confirmation after candidate selection; never observes held-out seeds.
import {readFile,writeFile,mkdir,open} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
const root='reports/cardrpg-big/skills-v5/s5/selected';
const exists=async p=>readFile(p).catch(e=>{if(e.code==='ENOENT')return null;throw e;});
const run=async(args,env,log)=>{const fd=await open(log,'wx');try{return await new Promise((done,reject)=>{const c=spawn(process.execPath,args,{env:{...process.env,...env},stdio:['ignore',fd.fd,fd.fd]});c.on('error',reject);c.on('close',done);});}finally{await fd.close();}};
assert(await exists('reports/cardrpg-big/skills-v5/s5/SELECTION.md'),'Record the candidate decision before confirmation');
for(const scope of ['metrics','equipped','teams','sets','tiers','elites','pieces','economy','day7','editions']){
 const dir=root+'/'+scope;await mkdir(dir,{recursive:true});
 if(!await exists(dir+'/REGISTERED-METHOD.json')){
  const args=['economy','day7','editions'].includes(scope)?['tools/cardrpg-big/skills-v5/register-progression.mjs',dir,scope,'on','0',...(scope==='day7'?[root+'/economy/day7']:[])]:['tools/cardrpg-big/skills-v5/register.mjs',dir,scope,'500','on','0'];
  assert.equal(await run(args,{V5_DESIGN_METRICS:'1'},dir+'/registration.log'),0);
 }
 if(await exists(dir+'/results.json'))continue;
 const script='tools/cardrpg-big/skills-v5/'+({metrics:'design-metrics-v3',pieces:'bare-matrix',economy:'economy',day7:'day7',editions:'editions'}[scope]??'matrix')+'.mjs';
 const key={metrics:'V5_METRICS_OUT',economy:'V5_PROGRESSION_OUT',day7:'V5_DAY7_OUT',editions:'V5_EDITIONS_OUT'}[scope]??'V5_MATRIX_OUT';
 const planPath=dir+'/plan.json';await writeFile(planPath,JSON.stringify({jobs:[{out:dir,label:'V5A S5 selected TRAIN '+scope,script,env:{[key]:dir}}]},null,2));
 let attempt=1;while(await exists(`${dir}/coordinator-${attempt}.log`))attempt++;
 assert.equal(await run(['tools/cardrpg-big/skills-v5/series.mjs',planPath],{},`${dir}/coordinator-${attempt}.log`),0,'Retain failure; no automatic reset or change');
 assert(await exists(dir+'/results.json'));console.log(JSON.stringify({scope,complete:true}));
}
