// S6 closure and delivery preparation after both registered modes finish. No retuning.
import {readFile,writeFile,copyFile,mkdir,open} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
import assert from 'node:assert/strict';
const root='reports/cardrpg-big/skills-v5',out=root+'/s6';
const json=async p=>JSON.parse(await readFile(p,'utf8'));
const optional=async p=>readFile(p,'utf8').then(JSON.parse).catch(e=>{if(e.code==='ENOENT')return null;throw e;});
const sha=b=>createHash('sha256').update(b).digest('hex');
const method=await json(root+'/REGISTERED-METHOD.json');assert.equal(method.offset,20000);
for(const mode of ['on','off'])for(const scope of method.scopes)assert(await readFile(`${out}/${mode}/${scope}/results.json`));
await mkdir(out+'/logs',{recursive:true});
const runs=await optional(out+'/delivery-series.json')??[];
async function run(id,args,env={}){
 const attempt=runs.filter(r=>r.id===id).length+1,log=`${out}/logs/${id}-${attempt}.log`,fd=await open(log,'wx'),started=new Date().toISOString();
 let code;
 try{code=await new Promise((done,reject)=>{const c=spawn(process.execPath,args,{env:{...process.env,...env},stdio:['ignore',fd.fd,fd.fd]});c.on('close',done);c.on('error',reject);});}
 finally{await fd.close();}
 const row={id,attempt,started,ended:new Date().toISOString(),code,log};runs.push(row);
 await writeFile(out+'/delivery-series.json',JSON.stringify(runs,null,2)+'\n');console.log(JSON.stringify(row));
 assert.equal(code,0,'Keep original failures. Inspect before correcting or resuming.');
}
for(const mode of ['on','off'])if(!await optional(`${out}/${mode}/receipt-audit.json`))await run('numeric-'+mode,['tools/cardrpg-big/skills-v5/finish-numeric.mjs',out+'/'+mode]);
await run('source-gates',['tools/cardrpg-big/skills-v5/validate.mjs','s6']);
await run('compatibility',['tools/cardrpg-big/skills-v5/reuse-compat.mjs','s8','s6']);
await run('closure',['tools/cardrpg-big/skills-v5/close.mjs','s6']);
await run('self-score',['tools/cardrpg-big/skills-v5/self-score.mjs','s6']);
await run('record-misses',['tools/cardrpg-big/skills-v5/record-gate-misses.mjs','s6']);
if(!await optional(out+'/delivery.json')){
 const main='docs/cardrpg3/index.html',mainSha=sha(await readFile(main)),directory='/tmp/cardrpg-v5a-s6-artifact';
 await run('offline-build',['tools/cardrpg-big/with-timing-lock.mjs','V5A S6 separate offline delivery',process.execPath,'tools/cardrpg-big/build.mjs'],{BIG_GAMEPLAY_V4:'1',BIG_SKILLS_V5:'1',BIG_LOOK_V2:'1',BIG_PYTHON:'/tmp/cardrpg-a5-tools/bin/python',BIG_OUTPUT_DIR:directory});
 const build=await json(directory+'/build.json'),s8=await json(root+'/s8/home/REGISTERED-METHOD.json');
 assert.equal(build.sha256,s8.artifactSha256,'Delivery bytes must match the elapsed/performance observations; inspect any difference.');
 await copyFile(directory+'/index.html','docs/cardrpg3/skills-v5.html');
 await copyFile(directory+'/build.json',out+'/build.json');
 assert.equal(sha(await readFile(main)),mainSha,'Main A4 artifact changed');
 await writeFile(out+'/delivery.json',JSON.stringify({head:build.head,bytes:build.bytes,sha256:build.sha256,sourceHashes:build.sourceHashes,buildManifest:out+'/build.json',buildManifestSha256:sha(await readFile(out+'/build.json')),mainArtifactSha256:mainSha,elapsedObservationArtifactSha256:s8.artifactSha256,method:'Rebuilt from the current S6 tip; exact byte parity with the S8 observed artifact. Only the separate Skills V5 HTML is copied.'},null,2)+'\n');
 await delay(7000);
}
if(!await optional(out+'/z/REGISTERED-METHOD.json'))await run('register-z',['tools/cardrpg-big/skills-v5/register-z.mjs']);
const z=await json(out+'/z/REGISTERED-METHOD.json');
for(const c of z.cases){
 const prior=await optional(`${out}/z/${c.width}-look-${c.look}/checks.json`);
 if(prior){assert(prior.complete,'An incomplete capture group must be inspected, never rerolled.');continue;}
 await run(`z-${c.width}-${c.look}`,['tools/cardrpg-big/with-timing-lock.mjs',`V5A S6 delivery screens ${c.width} look ${c.look}`,process.execPath,z.script,String(c.width),c.look]);
 await delay(7000);
}
await run('summarize-z',['tools/cardrpg-big/skills-v5/summarize-z.mjs']);
console.log(JSON.stringify({prepared:true,next:'Review the retained first30-minute Home captures after the S8/S6 phase break; write FRESH-EYES.md, then generate report/guide and check the guide.'}));
