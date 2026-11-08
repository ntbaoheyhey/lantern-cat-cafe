// REFERENCE: PROMPT-A5 phase gates. Six separate receipts, preserved attempts, shared lock for every gate.
import { spawn, execFileSync } from 'node:child_process';
import { mkdir, open, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import assert from 'node:assert/strict';
const phase=process.argv[2];assert.match(phase??'',/^[a-z0-9-]+$/);
const out=`reports/cardrpg-big/a5/${phase}/gates`;await mkdir(out,{recursive:true});
const steps=[['typecheck',['typecheck']],['lint',['lint']],['web-unit',['--filter','@taskbar-hero/web','test']],['rules',['--filter','@taskbar-hero/game-rules','test']],['e2e',['--filter','@taskbar-hero/web','test:e2e','--workers=4']],['build',['build']]];
const rows=JSON.parse(await readFile(`${out}/checks.json`,'utf8').catch(e=>{if(e.code==='ENOENT')return '[]';throw e;}));
const head=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
for(const [name,args]of steps){
 if(rows.some(r=>r.name===name&&r.code===0))continue;
 const attempt=rows.filter(r=>r.name===name).length+1;assert(attempt<=3,`Two correction rounds exhausted: ${name}`);
 const log=`${out}/${name}-attempt-${attempt}.log`,fd=await open(log,'wx'),started=new Date().toISOString();
 const code=await new Promise((done,reject)=>{
  const child=spawn(process.execPath,['tools/cardrpg-big/with-timing-lock.mjs',`A5 ${phase} ${name}`, 'nice','-n','10','pnpm',...args],{env:{...process.env,E2E_PORT_CLASSIC:'5910',E2E_PORT_V2:'5911',E2E_PORT_SERVER:'5912',E2E_PORT_API:'5913'},stdio:['ignore',fd.fd,fd.fd]});
  child.on('error',reject);child.on('close',done);
 });
 await fd.close();const body=await readFile(log,'utf8');
 const row={name,attempt,code,head,started,ended:new Date().toISOString(),log,sha256:createHash('sha256').update(body).digest('hex'),counts:body.split('\n').filter(line=>/Tests |Test Files |\d+ passed|\d+ failed|\d+ skipped|expected fail/.test(line)).map(line=>line.replace(/\x1b\[[0-9;]*m/g,''))};
 rows.push(row);await writeFile(`${out}/checks.json`,JSON.stringify(rows,null,2));console.log(JSON.stringify(row));
 if(code!==0){process.exitCode=code??1;break;}await delay(7000);
}
