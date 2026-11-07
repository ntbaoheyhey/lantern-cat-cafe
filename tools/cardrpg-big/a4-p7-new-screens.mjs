// REFERENCE: GAMEPLAY-V4 P7. Additional new-screen coverage beyond the single 204-capture pack.
import {spawn} from 'node:child_process';
import {mkdir,readFile,writeFile,open} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {setTimeout as delay} from 'node:timers/promises';
import assert from 'node:assert/strict';
// Short browser windows yield at least 6.5s; CPU-heavy source gates retain 120s.
const handoffMs=Number(process.env.BIG_P7_HANDOFF_MS||30000);
assert(Number.isFinite(handoffMs)&&handoffMs>=6500);
const out='reports/cardrpg-big/a4/p7/new-screens';await mkdir(out,{recursive:true});
const hash=async()=>createHash('sha256').update(await readFile('docs/cardrpg3/index.html')).digest('hex'),sha256=await hash();
const progress=JSON.parse(await readFile(`${out}/series.json`,'utf8').catch(e=>{if(e.code==='ENOENT')return JSON.stringify({sha256,rows:[]});throw e;}));
assert.equal(progress.sha256,sha256);
for(const phase of [1,2,4,5])for(const width of [1280,1440,1024]){
 const name=`p${phase}-${width}`,attempts=progress.rows.filter(r=>r.name===name);
 if(attempts.some(r=>r.exit===0))continue;
 assert(attempts.length<3,`Two correction rounds exhausted: ${name}`);
 const attempt=attempts.length+1,directory=`${out}/${name}/attempt-${attempt}`,log=`${out}/${name}-attempt-${attempt}.log`,fd=await open(log,'wx'),started=new Date().toISOString();
 assert.equal(await hash(),sha256);
 const exit=await new Promise((done,reject)=>{const child=spawn(process.execPath,['tools/cardrpg-big/with-timing-lock.mjs',`A4 P7 new screens ${name}`,process.execPath,`tools/cardrpg-big/a4-p7-screen-p${phase}.mjs`,String(width)],{env:{...process.env,BIG_P7_SCREEN_OUT:directory},stdio:['ignore',fd.fd,fd.fd]});child.on('error',reject);child.on('close',done);});
 await fd.close();assert.equal(await hash(),sha256);
 progress.rows.push({name,phase,width,attempt,exit,log,directory,started,ended:new Date().toISOString()});await writeFile(`${out}/series.json`,JSON.stringify(progress,null,2));console.log(progress.rows.at(-1));
 await delay(handoffMs);
}
assert.equal(new Set(progress.rows.filter(r=>r.exit===0).map(r=>r.name)).size,12,'Some new-screen configurations remain incomplete');
