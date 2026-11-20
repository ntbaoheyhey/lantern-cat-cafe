// REFERENCE: A5 OFF gate; same 165 cells, source-bound resume, bounded shared-lock slices.
import {spawn,execFileSync} from 'node:child_process';
import {mkdir,open,readFile,writeFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {setTimeout as delay} from 'node:timers/promises';
import assert from 'node:assert/strict';
const out='reports/cardrpg-big/a5/b3/closure/off';await mkdir(out,{recursive:true});
const paths=execFileSync('git',['ls-files','-co','--exclude-standard','packages/game-rules/src/cardrpg','packages/game-rules/src/rng.ts'],{encoding:'utf8'}).trim().split('\n');
const hashes=Object.fromEntries(await Promise.all([...new Set(paths)].filter(p=>p.endsWith('.ts')&&!p.endsWith('.test.ts')).sort().map(async p=>[p,createHash('sha256').update(await readFile(p)).digest('hex')])));
const prior=await readFile(out+'/source.json','utf8').catch(e=>{if(e.code==='ENOENT')return null;throw e;});
if(prior)assert.deepEqual(JSON.parse(prior),hashes);else await writeFile(out+'/source.json',JSON.stringify(hashes,null,2));
let slice=1+Math.max(0,...(await readdir(out)).map(f=>Number(f.match(/^slice-(\d+)\.log$/)?.[1]??0))),code;
do{
 for(const [p,h] of Object.entries(hashes))assert.equal(createHash('sha256').update(await readFile(p)).digest('hex'),h,p);
 const fd=await open(`${out}/slice-${slice++}.log`,'wx');
 try{code=await new Promise((done,reject)=>{
  const child=spawn(process.execPath,['tools/cardrpg-big/with-timing-lock.mjs','A5 B3 OFF digest',process.execPath,'tools/cardrpg-big/a4-baseline.mjs','--check'],{env:{...process.env,BIG_OFF_OUT:out},stdio:['ignore',fd.fd,fd.fd]});
  child.on('error',reject);child.on('close',done);
 });}finally{await fd.close();}
 console.log(JSON.stringify({slice:slice-1,code}));if(code===75)await delay(7000);
}while(code===75);
assert.equal(code,0);
