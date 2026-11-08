// REFERENCE: Equipment41. Build adopted source; byte equality can reuse prototype UI receipts.
import assert from 'node:assert/strict';
import { mkdir, open, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
const root='reports/cardrpg-big/a5/e1-equipment-forecast',out=root+'/adopted-builds';
const sha=b=>createHash('sha256').update(b).digest('hex');
const adoption=JSON.parse(await readFile(root+'/adoption.json'));
for(const[p,h]of Object.entries(adoption.paths))assert.equal(sha(await readFile(p)),h,p);
const prototype=JSON.parse(await readFile(root+'/prototype-audit.json'));
await mkdir(out,{recursive:true});
const rows=JSON.parse(await readFile(out+'/checks.json','utf8').catch(e=>{if(e.code==='ENOENT')return '[]';throw e;}));
for(const mode of ['on','off']){
 if(rows.some(r=>r.mode===mode&&r.code===0))continue;
 const attempt=1+rows.filter(r=>r.mode===mode).length;assert(attempt<=3);
 const log=`${out}/${mode}-attempt-${attempt}.log`,fd=await open(log,'wx');
 const output=`/tmp/cardrpg-a5-equipment-adopted-${mode}`,started=new Date().toISOString();
 let code;
 try{code=await new Promise((done,reject)=>{
  const p=spawn(process.execPath,['tools/cardrpg-big/with-timing-lock.mjs',`A5 adopted Equipment41 ${mode}`,process.execPath,'tools/cardrpg-big/build.mjs'],{
   env:{...process.env,BIG_GAMEPLAY_V4:mode==='on'?'1':'0',BIG_OUTPUT_DIR:output,BIG_PYTHON:'/tmp/cardrpg-a5-tools/bin/python'},stdio:['ignore',fd.fd,fd.fd]});
  p.on('error',reject);p.on('close',done);
 });}finally{await fd.close();}
 const row={mode,attempt,code,started,ended:new Date().toISOString(),log,sha256:sha(await readFile(log)),output};
 rows.push(row);await writeFile(out+'/checks.json',JSON.stringify(rows,null,2)+'\n');
 assert.equal(code,0,'Adopted build failed; original log retained.');
 const bytes=await readFile(output+'/index.html');
 assert.equal(sha(bytes),prototype.artifacts.find(a=>a.mode===mode).sha256,'Runtime differs from tested prototype: fresh UI checks required.');
 console.log(JSON.stringify({...row,prototypeByteExact:true}));await delay(7000);
}
