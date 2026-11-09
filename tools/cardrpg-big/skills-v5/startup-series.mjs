// Execute each registered observation exactly once, with bounded shared-lock handoffs.
import {readFile,writeFile,mkdir,open} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
import assert from 'node:assert/strict';
const root='reports/cardrpg-big/skills-v5/s8/startup',reg=JSON.parse(await readFile(root+'/REGISTERED-METHOD.json','utf8')),sha=b=>createHash('sha256').update(b).digest('hex');
assert.equal(sha(await readFile(reg.script)),reg.scriptSha256);
const runs=[];
for(const [width,cpu]of reg.configs)for(let i=1;i<=reg.observations;i++)for(const build of reg.order[i-1]){
 const out=`${root}/${build}-${width}-cpu${cpu}-run${i}`;
 let prior=await readFile(out+'/checks.json','utf8').catch(e=>{if(e.code==='ENOENT')return null;throw e;});
 if(prior){assert(!JSON.parse(prior).incomplete);runs.push({out,reused:true});continue;}
 await mkdir(out,{recursive:true});const fd=await open(out+'/attempt-1.log','wx');
 const code=await new Promise((done,reject)=>{const child=spawn(process.execPath,['tools/cardrpg-big/with-timing-lock.mjs',`V5A S8 ${build} ${width} CPU${cpu} run${i}`,process.execPath,reg.script],{env:{...process.env,BIG_FLAG_OFF_DIST:reg[build].directory,BIG_FLAG_OFF_OUT:out,BIG_STARTUP_WIDTH:String(width),BIG_STARTUP_CPU:String(cpu)},stdio:['ignore',fd.fd,fd.fd]});child.on('error',reject);child.on('close',done);});
 await fd.close();runs.push({out,code});await writeFile(root+'/runs.json',JSON.stringify(runs,null,2));assert.equal(code,0,'Retain failed observation; no automatic reroll');await delay(7000);
}
const median=a=>[...a].sort((x,y)=>x-y)[Math.floor(a.length/2)],configs=[];
for(const [width,cpu]of reg.configs){const builds={};for(const build of ['baseline','candidate']){
 const rows=[];for(let i=1;i<=reg.observations;i++){const path=`${root}/${build}-${width}-cpu${cpu}-run${i}/checks.json`,r=JSON.parse(await readFile(path,'utf8'));assert.equal(r.harnessSha256,reg.scriptSha256);assert.equal(r.buildHead,reg[build].head);rows.push({path,taskMs:r.cold.taskSeconds*1000,scriptMs:r.cold.scriptSeconds*1000,layoutMs:r.cold.layoutSeconds*1000,frameMaxMs:Math.max(...r.cold.frames),bytes:r.chunks.reduce((n,c)=>n+c.bytes,0)});}
 assert.equal(new Set(rows.map(r=>r.bytes)).size,1);builds[build]={rows,bytes:rows[0].bytes,taskMedian:median(rows.map(r=>r.taskMs)),taskMax:Math.max(...rows.map(r=>r.taskMs))};}
 configs.push({width,cpu,builds,bytesDelta:builds.candidate.bytes-builds.baseline.bytes,bytesPass:builds.candidate.bytes-builds.baseline.bytes<=150000,medianPass:builds.candidate.taskMedian<=builds.baseline.taskMedian,maxPass:builds.candidate.taskMax<=builds.baseline.taskMax});}
await writeFile(root+'/summary.json',JSON.stringify({reg,configs,limitations:'Three observations/config, no statistical equivalence or causal claim. Every registered outlier retained.'},null,2));console.log(JSON.stringify(configs.map(({builds,...r})=>r)));
